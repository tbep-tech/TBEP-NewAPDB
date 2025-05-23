import requests
import json
from datetime import datetime
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

def fetch_smartsheet_data(sheet_id, api_key):
    headers = {
        'Authorization': f'Bearer {api_key}',
        'Content-Type': 'application/json'
    }
    
    url = f'https://api.smartsheet.com/2.0/sheets/{sheet_id}'
    response = requests.get(url, headers=headers)
    
    if response.status_code == 200:
        return response.json()
    else:
        print(f"Error fetching data: {response.status_code}")
        print(response.text)
        return None

def process_land_use_data(data):
    processed_data = []
    if not data or 'rows' not in data:
        return processed_data
    
    # Find column indices
    columns = data.get('columns', [])
    name_col_id = None
    tn_load_col_id = None
    
    for col in columns:
        if col['title'] == 'Land Use':
            name_col_id = col['id']
        elif col['title'] == 'Base Load (TN)':
            tn_load_col_id = col['id']
    
    if not (name_col_id and tn_load_col_id):
        return processed_data
    
    # Process rows
    for row in data['rows']:
        land_use_name = None
        base_load = None
        
        for cell in row['cells']:
            if cell['columnId'] == name_col_id:
                land_use_name = cell.get('value')
            elif cell['columnId'] == tn_load_col_id:
                base_load = cell.get('value')
        
        if land_use_name and base_load is not None:
            processed_data.append({
                'name': land_use_name,
                'base_load': float(base_load)
            })
    
    return processed_data

def process_treatment_method_data(data):
    processed_data = []
    if not data or 'rows' not in data:
        return processed_data
    
    # Find column indices
    columns = data.get('columns', [])
    name_col_id = None
    tn_removal_col_id = None
    
    for col in columns:
        if col['title'] == 'Treatment Method':
            name_col_id = col['id']
        elif col['title'] == 'Default Removal Rate (TN)':
            tn_removal_col_id = col['id']
    
    if not (name_col_id and tn_removal_col_id):
        return processed_data
    
    # Process rows
    for row in data['rows']:
        method_name = None
        removal_rate = None
        
        for cell in row['cells']:
            if cell['columnId'] == name_col_id:
                method_name = cell.get('value')
            elif cell['columnId'] == tn_removal_col_id:
                removal_rate = cell.get('value')
        
        if method_name and removal_rate is not None:
            processed_data.append({
                'name': method_name,
                'removal_rate': float(removal_rate)
            })
    
    return processed_data

def save_to_json(data, filename):
    with open(filename, 'w') as f:
        json.dump(data, f, indent=2)

def main():
    # Get API key from environment variable
    api_key = os.getenv('SMARTSHEET_API_KEY')
    if not api_key:
        print("Error: SMARTSHEET_API_KEY not found in environment variables")
        return
    
    # Fetch and process land use data
    land_use_data = fetch_smartsheet_data('3365837005082500', api_key)
    if land_use_data:
        processed_land_use = process_land_use_data(land_use_data)
        save_to_json(processed_land_use, 'tn_calculator_land_use.json')
        print(f"Land use data processed successfully! Found {len(processed_land_use)} entries.")
    
    # Fetch and process treatment method data
    treatment_data = fetch_smartsheet_data('7586918783995780', api_key)
    if treatment_data:
        processed_treatment = process_treatment_method_data(treatment_data)
        save_to_json(processed_treatment, 'tn_calculator_treatment_methods.json')
        print(f"Treatment method data processed successfully! Found {len(processed_treatment)} entries.")

if __name__ == "__main__":
    main() 