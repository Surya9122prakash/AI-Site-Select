import requests
import time
import os
from dotenv import load_dotenv

load_dotenv()

BASE_URL = os.getenv("BASE_URL", "http://localhost:5002")

def test_api():
    # 1. Register
    username = f"user_{int(time.time())}"
    password = "password123"
    print(f"Registering user: {username}")
    res = requests.post(f"{BASE_URL}/register", json={
        "username": username,
        "password": password,
        "email": f"{username}@example.com",
        "role": "Government"
    })
    print("Register response:", res.json())
    if res.status_code != 200:
        print("Registration failed!")
        return

    # 2. Login
    print("Logging in...")
    res = requests.post(f"{BASE_URL}/login", data={
        "username": username,
        "password": password
    })
    print("Login response:", res.json())
    if res.status_code != 200:
        print("Login failed!")
        return
    
    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 3. Recommend Sites
    print("Requesting recommendations...")
    req_data = {
        "title": "Test Project Alpha",
        "budget_limit_usd_sqm": 5000,
        "max_road_dist_km": 50,
        "max_slope_deg": 30,
        "environmental_risk_tolerance": 1.0,
        "preferred_land_use": ["Industrial", "Commercial", "Residential", "Agricultural"]
    }
    res = requests.post(f"{BASE_URL}/recommend-sites", json=req_data, headers=headers)
    if res.status_code == 200:
        recs = res.json()["recommendations"]
        print("Recommendation success! Count:", len(recs))
        if len(recs) > 0:
            print("First recommendation keys:", recs[0].keys())
            print("First recommendation sample:", recs[0])
    else:
        print("Recommendation failed:", res.text)

    # 4. History
    print("Checking history...")
    res = requests.get(f"{BASE_URL}/history", headers=headers)
    if res.status_code == 200:
        history = res.json()
        print(f"History count: {len(history)}")
        if len(history) > 0:
            print("Latest job:", history[0])
            
            # 5. Get Job Details
            print(f"Fetching details for job {history[0]['id']}...")
            res = requests.get(f"{BASE_URL}/history/{history[0]['id']}", headers=headers)
            if res.status_code == 200:
                details = res.json()
                print("Job details fetched successfully!")
                print("Recommendations count:", len(details["recommendations"]))
            else:
                print("Failed to fetch job details:", res.text)
    else:
        print("History failed:", res.text)

    # 6. Get Profile
    print("Fetching profile...")
    res = requests.get(f"{BASE_URL}/profile", headers=headers)
    if res.status_code == 200:
        print("Profile fetched successfully:", res.json())
    else:
        print("Profile fetch failed:", res.text)

if __name__ == "__main__":
    test_api()
