import pandas as pd
import numpy as np
import joblib 
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline

def train_and_save_model(csv_path):
    df = pd.read_csv(csv_path)
    clean_df = df.dropna(subset=['Suitability_Score']).copy()
    print(f"Training on {len(clean_df)} records.")

    cols_to_drop = ['UUID', 'Site_Code', 'State_Key', 'District', 'Suitability_Score', 'Latitude', 'Longitude']
    existing_drop_cols = [c for c in cols_to_drop if c in clean_df.columns]
    
    X = clean_df.drop(columns=existing_drop_cols)
    y = clean_df['Suitability_Score']

    numeric_features = X.select_dtypes(include=['int64', 'float64']).columns.tolist()
    categorical_features = X.select_dtypes(include=['object', 'category']).columns.tolist()
    
    print(f"Features used for training:")
    print(f"Numeric: {numeric_features}")
    print(f"Categorical: {categorical_features}")

    numeric_transformer = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='median')), 
    ])

    categorical_transformer = Pipeline(steps=[
        ('onehot', OneHotEncoder(handle_unknown='ignore', sparse_output=False)) 
    ])

    preprocessor = ColumnTransformer(
        transformers=[
            ('num', numeric_transformer, numeric_features),
            ('cat', categorical_transformer, categorical_features)
        ])

    model_pipeline = Pipeline(steps=[
        ('preprocessor', preprocessor),
        ('regressor', RandomForestRegressor(n_estimators=100, random_state=42, n_jobs=-1))
    ])

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    print("\nFitting model... please wait...")
    model_pipeline.fit(X_train, y_train)
    
    score = model_pipeline.score(X_test, y_test)
    print(f"Model R² Accuracy Score: {score:.4f}")
    
    joblib.dump(model_pipeline, 'site_selector_model.joblib')
    
    clean_df.to_pickle('site_registry.pkl') 
    
    print("\nSUCCESS: Model saved as 'site_selector_model.joblib' and registry as 'site_registry.pkl'")

if __name__ == "__main__":
    train_and_save_model('india_dynamic_gis_production.csv')