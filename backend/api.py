from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
from typing import List
from datetime import datetime, timedelta
from passlib.context import CryptContext
from jose import jwt, JWTError
import joblib
import pandas as pd
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from typing import Optional
import os
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 60))
MONGO_URL = os.getenv("MONGO_URL")
DB_NAME = os.getenv("DB_NAME")
ALLOW_ORIGINS = os.getenv("ALLOW_ORIGINS", "http://localhost:5173").split(",")

app = FastAPI(title="AI Site Selection API (Minimal)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOW_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]
users_collection = db["users"]
jobs_collection = db["jobs"]


try:
    model = joblib.load("site_selector_model.joblib")
    df_registry = pd.read_pickle("site_registry.pkl")
    print("Model & registry loaded")
except Exception as e:
    print("Load error:", e)
    model = None
    df_registry = pd.DataFrame()


class UserRegister(BaseModel):
    username: str
    password: str
    email: Optional[str] = None
    role: str = "Planner" 

class UserLogin(BaseModel):
    username: str
    password: str

class ProjectRequirements(BaseModel):
    title: str
    budget_limit_usd_sqm: float
    max_road_dist_km: float
    max_slope_deg: float
    environmental_risk_tolerance: float
    preferred_land_use: List[str]

class JobHistory(BaseModel):
    id: str
    title: str
    timestamp: datetime
    requirements: dict
    result_count: int

def create_access_token(data: dict):
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    data.update({"exp": expire})
    return jwt.encode(data, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("username")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid token payload")
    except JWTError:
        raise HTTPException(status_code=401, detail="Could not validate credentials")
    
    user = await users_collection.find_one({"username": username})
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    
    return user

@app.post("/register")
async def register(user: UserRegister):
    print("DEBUG: Register request body:", user.dict())
    existing_user = await users_collection.find_one({"username": user.username})
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    hashed_password = pwd_context.hash(user.password)
    new_user = {
        "username": user.username,
        "hashed_password": hashed_password,

        "email": user.email,
        "role": user.role,
        "created_at": datetime.utcnow()
    }
    await users_collection.insert_one(new_user)
    return {"message": "User registered successfully"}

@app.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = await users_collection.find_one({"username": form_data.username})
    print("DEBUG: Login user fetched from DB:", user)
    if not user or not pwd_context.verify(form_data.password, user["hashed_password"]):
        raise HTTPException(status_code=400, detail="Invalid credentials")

    token = create_access_token({
        "username": user["username"],
        "role": user.get("role", "User"),
        "email": user.get("email")
    })

    return {
        "access_token": token,
        "token_type": "bearer"
    }

@app.get("/profile")
async def get_profile(current_user: dict = Depends(get_current_user)): 
    return {
        "username": current_user["username"],
        "email": current_user.get("email"),
        "role": current_user.get("role"),
        "created_at": current_user.get("created_at")
    }
def process_recommendations(req: ProjectRequirements):
    if df_registry.empty or model is None:
        raise HTTPException(status_code=500, detail="Model or data not loaded")

    mask = (
        (df_registry["Land_Value_USD_sqm"] <= req.budget_limit_usd_sqm) &
        (df_registry["Dist_to_Road_km"] <= req.max_road_dist_km) &
        (df_registry["Land_Use"].isin(req.preferred_land_use))
    )

    if "Slope_deg" in df_registry.columns:
        mask &= df_registry["Slope_deg"] <= req.max_slope_deg

    candidates = df_registry[mask].copy()

    if candidates.empty:
        raise HTTPException(status_code=404, detail="No suitable sites found")

    drop_cols = [
        "UUID", "Site_Code", "State_Key", "District",
        "Suitability_Score", "Latitude", "Longitude"
    ]
    X = candidates.drop(columns=[c for c in drop_cols if c in candidates.columns])
    try:
        candidates["AI_Predicted_Score"] = model.predict(X)
    except Exception as e:
        print("Inference error:", e)
        candidates["AI_Predicted_Score"] = candidates.get("Suitability_Score", 0)

    result = (
        candidates
        .sort_values("AI_Predicted_Score", ascending=False)
        .head(20)
    )

    if "Site_Code" not in result.columns:
        result["Site_Code"] = [f"SITE-{i}" for i in range(len(result))]

    return result

@app.post("/recommend-sites")
async def recommend_sites(
    req: ProjectRequirements,
    current_user: dict = Depends(get_current_user)
):
    result = process_recommendations(req)
    recommendations = result.to_dict(orient="records")

    job_doc = {
        "user_id": current_user["_id"],
        "username": current_user["username"],
        "title": req.title,
        "timestamp": datetime.utcnow(),
        "requirements": req.dict(),
        "result_count": len(recommendations),
        "top_score": float(result.iloc[0]["AI_Predicted_Score"]) if not result.empty else 0.0
    }
    await jobs_collection.insert_one(job_doc)

    return {
        "timestamp": datetime.utcnow().isoformat(),
        "user": current_user["username"],
        "recommendations": recommendations
    }

@app.get("/history", response_model=List[JobHistory])
async def get_history(current_user: dict = Depends(get_current_user)):
    cursor = jobs_collection.find({"user_id": current_user["_id"]}).sort("timestamp", -1)
    history = []
    async for job in cursor:
        history.append({
            "id": str(job["_id"]),
            "title": job.get("title", "Untitled"),
            "timestamp": job["timestamp"],
            "requirements": job["requirements"],
            "result_count": job["result_count"]
        })
    return history

@app.get("/history/{job_id}")
async def get_job_details(job_id: str, current_user: dict = Depends(get_current_user)):
    try:

        job = await jobs_collection.find_one({
            "_id": ObjectId(job_id),
            "user_id": current_user["_id"]
        })
        print("Requested job_id:", job_id)
        print("Logged-in user_id:", current_user["_id"])
        print("Job owner:", job.get("user_id") if job else None)
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        
        req = ProjectRequirements(**job["requirements"])
        result = process_recommendations(req)
        recommendations = result.to_dict(orient="records")
        
        return {
            "timestamp": job["timestamp"].isoformat(),
            "user": job["username"],
            "recommendations": recommendations
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)
