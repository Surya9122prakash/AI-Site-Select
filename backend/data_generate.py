import pandas as pd
import numpy as np
import geopandas as gpd
import requests
import uuid
from shapely.geometry import Point
from scipy.special import expit


N_TOTAL = 10000
np.random.seed(42)

def fetch_dynamic_india_gis():
    print("Fetching dynamic GIS boundaries from geoBoundaries API...")
    api_url = "https://www.geoboundaries.org/api/current/gbOpen/IND/ADM2/"
    
    try:
        r = requests.get(api_url, timeout=20)
        r.raise_for_status()
        download_url = r.json()['gjDownloadURL']
        gdf = gpd.read_file(download_url)
        gdf = gdf.rename(columns={'shapeGroup': 'State_Key', 'shapeName': 'District_Name'})
        return gdf[['State_Key', 'District_Name', 'geometry']]
    except Exception as e:
        print(f"Failed to fetch dynamic GIS data: {e}")
        return None

def generate_spatial_points(polygon, count):
    points = []
    min_x, min_y, max_x, max_y = polygon.bounds
    attempts = 0
    while len(points) < count and attempts < count * 50:
        p = Point(np.random.uniform(min_x, max_x), np.random.uniform(min_y, max_y))
        if polygon.contains(p):
            points.append(p)
        attempts += 1
    while len(points) < count:
        points.append(polygon.centroid)
    return points

def generate_production_data():
    gdf = fetch_dynamic_india_gis()
    if gdf is None or gdf.empty:
        print("Error: Could not retrieve GIS data.")
        return None

    print(f"GIS Data Loaded. Found {len(gdf)} Districts.")

    gdf['alloc'] = 5
    for state_id in gdf['State_Key'].unique():
        mask = gdf['State_Key'] == state_id
        current_state_total = gdf.loc[mask, 'alloc'].sum()
        if current_state_total < 200:
            extra_needed = 200 - current_state_total
            districts_in_state = gdf[mask].index
            gdf.loc[mask, 'alloc'] += (extra_needed // len(districts_in_state))
            gdf.loc[districts_in_state[0], 'alloc'] += (extra_needed % len(districts_in_state))

    diff = N_TOTAL - gdf['alloc'].sum()
    if diff > 0:
        random_indices = np.random.choice(gdf.index, size=diff)
        for idx in random_indices:
            gdf.at[idx, 'alloc'] += 1

    final_data = []
    print(f"Generating {N_TOTAL} records...")

    for _, row in gdf.iterrows():
        count = int(row['alloc'])
        if count == 0: continue
        
        points = generate_spatial_points(row['geometry'], count)
        
        for p in points:
            road_dist = np.clip(np.random.gamma(2, 2), 0.1, 50)
            elevation = np.clip(np.random.normal(500, 300), 0, 5000)
            slope = np.clip(np.abs(np.random.normal(0, 5)), 0, 45)
            pop_density = np.clip(np.random.lognormal(6.5, 1.1), 100, 60000)
            
            land_use = np.random.choice(['Industrial', 'Commercial', 'Residential', 'Agricultural'])
            land_value = (pop_density * 0.4) + (25000 / (road_dist + 1))
            score = (expit(6 - road_dist) * 40) + (1 - (elevation / 5000)) * 30 + np.random.uniform(0, 30)

            final_data.append({
                'UUID': str(uuid.uuid4())[:8].upper(),
                'Site_Code': f"IN-{row['District_Name'][:3].upper()}-{str(uuid.uuid4())[:4].upper()}",
                'State_Key': row['State_Key'],
                'District': row['District_Name'],
                'Latitude': p.y,
                'Longitude': p.x,
                'Land_Use': land_use,
                'Elevation_m': round(float(elevation), 2),
                'Slope_deg': round(float(slope), 2),       
                'Dist_to_Road_km': round(float(road_dist), 2),
                'Pop_Density_sqkm': int(pop_density),
                'Land_Value_USD_sqm': round(float(land_value), 2),
                'Suitability_Score': round(float(score), 2)
            })

    return pd.DataFrame(final_data)

df_final = generate_production_data()
if df_final is not None:
    df_final.to_csv("india_dynamic_gis_production.csv", index=False)
    print(f"\nSUCCESS: Generated {len(df_final)} records.")
    print(f"File saved to 'india_dynamic_gis_production.csv'")