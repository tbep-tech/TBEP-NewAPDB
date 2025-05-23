import mysql.connector
import pandas as pd
from datetime import datetime
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Database connection configuration
db_config = {
    'host': os.getenv('DB_HOST'),
    'user': os.getenv('DB_USER'),
    'password': os.getenv('DB_PASSWORD'),
    'database': os.getenv('DB_NAME')
}

# Query to get primary contacts (most recently active user) for each project
contacts_query = """
WITH LastUserActivity AS (
    SELECT 
        t.ChangedBy,
        u.FirstName,
        u.LastName,
        u.EmailAddress,
        uio.LeadEntityID,
        t.ChangeDate as LastActivity,
        -- Rank users within each entity by their last activity
        ROW_NUMBER() OVER (PARTITION BY uio.LeadEntityID ORDER BY t.ChangeDate DESC) as rn
    FROM tracking t 
    JOIN users u ON t.ChangedBy = u.UserName 
    JOIN usersinorganizations uio ON u.UserID = uio.UserID
    WHERE t.IsActive = 1 
    AND u.IsActive = 1 
    AND t.ChangeDate = (
        SELECT MAX(ChangeDate) 
        FROM tracking 
        WHERE ChangedBy = t.ChangedBy
    )
)
SELECT 
    h.HeaderID as ProjectID,
    h.ProjectName,
    le.LeadEntity as EntityName,
    lua.FirstName as ContactFirstName,
    lua.LastName as ContactLastName,
    lua.EmailAddress as ContactEmail,
    lua.LastActivity
FROM header h
JOIN leadentity le ON h.LeadEntityID = le.LeadEntityID
LEFT JOIN LastUserActivity lua ON le.LeadEntityID = lua.LeadEntityID AND lua.rn = 1
WHERE h.IsActive = 1
ORDER BY h.HeaderID
"""

def export_contacts():
    try:
        # Connect to the database
        conn = mysql.connector.connect(**db_config)
        
        # Read the contacts data
        df_contacts = pd.read_sql(contacts_query, conn)
        print(f"Found {len(df_contacts)} projects")
        
        # Generate timestamp for filename
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        
        # Export contacts to CSV
        filename = 'projects_primary_contacts.csv'
        df_contacts.to_csv(filename, index=False, quoting=1)  # QUOTE_ALL
        print(f"Contacts exported to: {filename}")
        
        # Print statistics
        print(f"\nContact Statistics:")
        print(f"Total projects: {len(df_contacts)}")
        print(f"Projects with contacts: {len(df_contacts.dropna(subset=['ContactFirstName']))}")
        print(f"Unique entities: {df_contacts['EntityName'].nunique()}")
        
    except mysql.connector.Error as err:
        print(f"Database error: {err}")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        if 'conn' in locals() and conn.is_connected():
            conn.close()

if __name__ == "__main__":
    export_contacts() 