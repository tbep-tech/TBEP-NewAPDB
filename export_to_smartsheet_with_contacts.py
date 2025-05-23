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

# Base query for project information (without entity_current_nt_allocation)
base_query = """
WITH ProjectTreatments AS (
    SELECT 
        h.HeaderID,
        MAX(CASE 
            WHEN nps.HeaderID IS NOT NULL AND ps.HeaderID IS NOT NULL THEN 'Hybrid'
            WHEN nps.HeaderID IS NOT NULL THEN 'Non-Point Source'
            WHEN ps.HeaderID IS NOT NULL THEN 'Point Source'
            ELSE 'Other'
        END) as project_type,
        MAX(CASE
            WHEN (h.NonPointProject = 1 AND nps.HeaderID IS NULL) THEN 'NPS flag set but no NPS treatment found'
            WHEN (h.PointProject = 1 AND ps.HeaderID IS NULL) THEN 'PS flag set but no PS treatment found'
            WHEN (h.NonPointProject = 0 AND nps.HeaderID IS NOT NULL) THEN 'NPS treatment found but flag not set'
            WHEN (h.PointProject = 0 AND ps.HeaderID IS NOT NULL) THEN 'PS treatment found but flag not set'
            WHEN (nps.HeaderID IS NOT NULL AND ps.HeaderID IS NOT NULL AND 
                  EXISTS (
                    SELECT 1 FROM npstreatment n 
                    WHERE n.HeaderID = h.HeaderID 
                    AND n.IsActive = 1 
                    AND (n.TreatmentArea IS NULL OR n.TreatmentArea = 0)
                  ) AND 
                  EXISTS (
                    SELECT 1 FROM pstreatment p 
                    WHERE p.HeaderID = h.HeaderID 
                    AND p.IsActive = 1 
                    AND (p.AverageDischarge IS NULL OR p.AverageDischarge = 0)
                  )) THEN 'Hybrid project missing both load calculation data'
            WHEN (nps.HeaderID IS NOT NULL AND 
                  EXISTS (
                    SELECT 1 FROM npstreatment n 
                    WHERE n.HeaderID = h.HeaderID 
                    AND n.IsActive = 1 
                    AND (n.TreatmentArea IS NULL OR n.TreatmentArea = 0)
                  )) THEN 'NPS treatment exists but missing calculation data'
            WHEN (ps.HeaderID IS NOT NULL AND 
                  EXISTS (
                    SELECT 1 FROM pstreatment p 
                    WHERE p.HeaderID = h.HeaderID 
                    AND p.IsActive = 1 
                    AND (p.AverageDischarge IS NULL OR p.AverageDischarge = 0)
                  )) THEN 'PS treatment exists but missing calculation data'
            ELSE NULL
        END) as anomalies
    FROM header h
    LEFT JOIN (SELECT DISTINCT HeaderID FROM npstreatment WHERE IsActive = 1) nps ON h.HeaderID = nps.HeaderID
    LEFT JOIN (SELECT DISTINCT HeaderID FROM pstreatment WHERE IsActive = 1) ps ON h.HeaderID = ps.HeaderID
    WHERE h.IsActive = 1
    GROUP BY h.HeaderID
)
SELECT DISTINCT
    h.HeaderID as projectid,
    h.ProjectName as project_name,
    COALESCE(h.ProjectDescriptionText, h.ProjectDescription) as project_description,
    le.LeadEntity as entity_name,
    h.ProjectLatitude as latitude,
    h.ProjectLongitude as longitude,
    GROUP_CONCAT(DISTINCT sn.SegmentName SEPARATOR ', ') as bay_segment,
    h.NonPointProject as header_nps_flag,
    h.PointProject as header_ps_flag,
    pt.project_type,
    pt.anomalies,
    CASE 
        WHEN h.ProjectCompleted = 1 THEN 'Completed'
        WHEN h.ProjectOngoing = 1 THEN 'Ongoing'
        WHEN h.ProjectPlanned = 1 THEN 'Planned'
        WHEN h.ProjectDiscontinued = 1 THEN 'Discontinued'
        WHEN h.ProjectNotInitiated = 1 THEN 'Not Initiated'
        ELSE 'Unknown'
    END as project_status,
    h.AnticipatedInitiation as initiation_year,
    h.AnticipatedCompletion as estimated_completion_year,
    h.DiscontinuedDate as discontinued_year,
    h.CompletionDate as completion_year,
    h.ActualProjectCost as project_costs
FROM header h
LEFT JOIN leadentity le ON h.LeadEntityID = le.LeadEntityID
LEFT JOIN baysegment bs ON h.HeaderID = bs.HeaderID
LEFT JOIN segmentnames sn ON bs.SegmentID = sn.SegmentID
JOIN ProjectTreatments pt ON h.HeaderID = pt.HeaderID
WHERE h.IsActive = 1 AND (bs.IsActive = 1 OR bs.IsActive IS NULL)
GROUP BY 
    h.HeaderID,
    h.ProjectName,
    h.ProjectDescriptionText,
    h.ProjectDescription,
    le.LeadEntity,
    h.ProjectLatitude,
    h.ProjectLongitude,
    h.NonPointProject,
    h.PointProject,
    pt.project_type,
    pt.anomalies,
    h.ProjectCompleted,
    h.ProjectOngoing,
    h.ProjectPlanned,
    h.ProjectDiscontinued,
    h.ProjectNotInitiated,
    h.AnticipatedInitiation,
    h.AnticipatedCompletion,
    h.DiscontinuedDate,
    h.CompletionDate,
    h.ActualProjectCost
"""

# Query to get primary contacts (most recently active user) for each project's entity
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
    h.HeaderID as projectid,
    lua.FirstName as contact_first_name,
    lua.LastName as contact_last_name,
    lua.EmailAddress as contact_email,
    lua.LastActivity as contact_last_activity
FROM header h
JOIN leadentity le ON h.LeadEntityID = le.LeadEntityID
LEFT JOIN LastUserActivity lua ON le.LeadEntityID = lua.LeadEntityID AND lua.rn = 1
WHERE h.IsActive = 1
"""

def export_data():
    try:
        # Connect to the database
        conn = mysql.connector.connect(**db_config)
        
        # Get the base data
        df_base = pd.read_sql(base_query, conn)
        print(f"Base query returned {len(df_base)} records")
        
        # Get the contacts data
        df_contacts = pd.read_sql(contacts_query, conn)
        print(f"\nFound contact information for {len(df_contacts)} projects")
        
        # Merge with contacts
        df_with_contacts = df_base.merge(df_contacts, on='projectid', how='left')
        
        # Generate timestamp
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        
        # Export the combined data
        output_filename = f'DB_Projects_Complete_{timestamp}.csv'
        df_with_contacts.to_csv(output_filename, index=False, quoting=1)  # QUOTE_ALL
        print(f"Complete project data exported to: {output_filename}")
        
        # Print statistics
        print(f"\nFinal Statistics:")
        print(f"Total projects: {len(df_with_contacts)}")
        print(f"Projects with contacts: {len(df_with_contacts.dropna(subset=['contact_first_name']))}")
        print(f"Unique entities: {df_with_contacts['entity_name'].nunique()}")
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        print(traceback.format_exc())
    finally:
        if 'conn' in locals() and conn.is_connected():
            conn.close()

if __name__ == "__main__":
    export_data() 