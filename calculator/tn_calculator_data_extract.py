"""
Extract land use and treatment method data from the database for the TN Calculator.
This script connects to the database, retrieves the necessary data, and saves it in JSON format
for use by the TN Calculator web interface.
"""

import mysql.connector
import json
from datetime import datetime
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def connect_to_database():
    try:
        return mysql.connector.connect(
            host=os.getenv('DB_HOST'),
            user=os.getenv('DB_USER'),
            password=os.getenv('DB_PASSWORD'),
            database=os.getenv('DB_NAME')
        )
    except mysql.connector.Error as err:
        print(f"Error connecting to database: {err}")
        return None

def get_land_use_data(cursor):
    try:
        query = """
        SELECT 
            lu.LandUseID,
            lu.LandUse,
            NULL AS base_load,  -- No such field, set to NULL
            NULL AS description -- No such field, set to NULL
        FROM landuse lu
        ORDER BY lu.LandUse
        """
        cursor.execute(query)
        return cursor.fetchall()
    except mysql.connector.Error as err:
        print(f"Error fetching land use data: {err}")
        return []


def get_treatment_method_data(cursor):
    try:
        # Query to get treatment method information
        query = """
        SELECT 
            tm.treatment_id,
            tm.treatment_name,
            tm.default_removal_rate,
            tm.description
        FROM treatment_method tm
        ORDER BY tm.treatment_name
        """
        cursor.execute(query)
        return cursor.fetchall()
    except mysql.connector.Error as err:
        print(f"Error fetching treatment method data: {err}")
        return []

def format_land_use_data(land_use_data):
    return [{
        'id': row[0],
        'name': row[1],
        'base_load': float(row[2]) if row[2] is not None else 0.0,
        'description': row[3] if row[3] is not None else ''
    } for row in land_use_data]

def format_treatment_method_data(treatment_data):
    return [{
        'id': row[0],
        'name': row[1],
        'removal_rate': float(row[2]) if row[2] is not None else 0.0,
        'description': row[3] if row[3] is not None else ''
    } for row in treatment_data]

def save_to_json(data, filename):
    with open(filename, 'w') as f:
        json.dump(data, f, indent=2)

def main():
    conn = connect_to_database()
    if not conn:
        return

    try:
        cursor = conn.cursor()
        
        # Get land use data
        land_use_data = get_land_use_data(cursor)
        formatted_land_use = format_land_use_data(land_use_data)
        
        # Get treatment method data
        treatment_data = get_treatment_method_data(cursor)
        formatted_treatment = format_treatment_method_data(treatment_data)
        
        # Save to JSON files
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        save_to_json(formatted_land_use, f'land_use_data_{timestamp}.json')
        save_to_json(formatted_treatment, f'treatment_method_data_{timestamp}.json')
        
        print("Data extracted successfully!")
        print(f"Land Use entries: {len(formatted_land_use)}")
        print(f"Treatment Method entries: {len(formatted_treatment)}")

    except mysql.connector.Error as err:
        print(f"Database error: {err}")
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

if __name__ == "__main__":
    main() 