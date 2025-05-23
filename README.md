# TBEP New Action Plan Database

A responsive web application for government services, featuring Smartsheet integration and a TN Calculator.

## Features

- Responsive design that works on all device sizes
- Smartsheet form integration
- Smartsheet table view integration
- TN Calculator with custom logic
- Professional government-style interface
- Clear instructions and user guidance

## Setup Instructions

1. Clone this repository
2. Install Python dependencies:

   ```bash
   pip install -r requirements.txt
   ```

3. Configure environment variables:

   - Create a `.env` file in the project root
   - Add your Smartsheet API key:
     ```
     SMARTSHEET_API_KEY=your_api_key_here
     ```

4. Configure Smartsheet URLs:

   - Open `script.js`
   - Replace `YOUR_SMARTSHEET_FORM_URL` with your actual Smartsheet form URL
   - Replace `YOUR_SMARTSHEET_TABLE_URL` with your actual Smartsheet table URL

5. Initial data setup:

   - Run the Smartsheet data extraction script:
     ```bash
     python calculator/smartsheet_extract.py
     ```
   - This will create two JSON files in the calculator directory:
     - `calculator/tn_calculator_land_use.json`: Land use data and base loads
     - `calculator/tn_calculator_treatment_methods.json`: Treatment methods and removal rates

6. Serve the files using a web server:
   - You can use any web server of your choice
   - For development, you can use Python's built-in server:
     ```bash
     python -m http.server 8000
     ```
   - Or use Node.js's `http-server`:
     ```bash
     npx http-server
     ```

## Data Source Transition

The application has transitioned from using a MySQL database to Smartsheet for data storage:

### Original Database Setup (Legacy)

- Previously used `calculator/tn_calculator_data_extract.py` to extract data from MySQL database
- Extracted land use and treatment method data with their respective coefficients
- Data was saved in timestamped JSON files

### Current Smartsheet Setup

- Uses `calculator/smartsheet_extract.py` to fetch data from Smartsheet
- Maintains the same data structure but with Smartsheet as the source
- Provides easier data management through Smartsheet's interface

## Smartsheet Data Integration

The application uses data from two Smartsheet sheets:

1. Land Use Data (Sheet ID: 3365837005082500)

   - Contains land use types and their base TN loads
   - Used for NPS (Non-Point Source) calculations

2. Treatment Method Data (Sheet ID: 7586918783995780)
   - Contains treatment methods and their TN removal rates
   - Used for both NPS and PS (Point Source) calculations

### Updating Smartsheet Data

When you make changes to the Smartsheet sheets, you need to update the local data:

1. Run the data extraction script:

   ```bash
   python calculator/smartsheet_extract.py
   ```

2. The script will:
   - Fetch the latest data from Smartsheet
   - Update the JSON files in the calculator directory
   - Print the number of entries processed

Note: The web interface uses the JSON files, not the live Smartsheet data. You must run the extraction script to see your Smartsheet changes reflected in the application.

## File Structure

```
.
├── index.html              # Main HTML file
├── styles.css             # CSS styles
├── script.js             # JavaScript functionality
├── requirements.txt      # Python dependencies
├── README.md            # Project documentation
└── calculator/          # TN Calculator related files
    ├── smartsheet_extract.py           # Current data extraction script
    ├── tn_calculator_data_extract.py   # Legacy database extraction script
    ├── tn_calculator_land_use.json
    └── tn_calculator_treatment_methods.json
```

## Customization

### Styling

- Colors can be modified in the `:root` section of `styles.css`
- Layout adjustments can be made in the media queries section

### Calculator Logic

- Modify the `performCalculation` method in `script.js` to implement your specific calculation requirements

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Security Considerations

- Ensure your Smartsheet URLs are properly secured
- Keep your `.env` file secure and never commit it to version control
- Consider implementing CORS policies if needed
- Validate all calculator inputs

## Maintenance

Regular updates may be needed for:

- Smartsheet data updates (run `calculator/smartsheet_extract.py`)
- Smartsheet URL updates
- Calculator logic modifications
- Content updates
- Security patches

## Support

For support, please contact your system administrator or the development team.

## Export Script Walkthrough

The `export_to_smartsheet_with_contacts.py` script exports project data with contact information to a CSV file. Here's a detailed breakdown of how it works:

### Database Structure and Joins

1. **Base Project Information (ProjectTreatments CTE)**

   - Starts with the `header` table as the main table
   - Joins with `npstreatment` and `pstreatment` to determine project types:
     - Hybrid: Has both NPS and PS treatments
     - Non-Point Source: Has only NPS treatments
     - Point Source: Has only PS treatments
     - Other: No treatments found
   - Identifies anomalies in project data:
     - Mismatches between project flags and treatments
     - Missing calculation data for treatments
     - Inconsistencies in project type indicators

2. **Main Query Joins**

   - `header` (h): Main project information
   - `leadentity` (le): Entity information
   - `baysegment` (bs): Bay segment associations
   - `segmentnames` (sn): Names of bay segments
   - `ProjectTreatments` (pt): Project type and anomaly information

3. **Contact Information Query**
   - Uses a CTE called `LastUserActivity` to:
     - Join `tracking`, `users`, and `usersinorganizations` tables
     - Find the most recently active user for each entity
     - Rank users by their last activity date
   - Joins with `header` and `leadentity` to associate contacts with projects

### Key Data Points Collected

1. **Project Information**

   - Project ID and name
   - Project description
   - Entity name
   - Location (latitude/longitude)
   - Bay segments
   - Project type flags
   - Project status
   - Timeline information (initiation, completion dates)
   - Project costs

2. **Contact Information**
   - First name
   - Last name
   - Email address
   - Last activity date

### Output

The script generates a CSV file named `DB_Projects_Complete_{timestamp}.csv` containing:

- All project information
- Associated contact information
- Properly formatted and cleaned data
- Statistics about the export (total projects, projects with contacts, unique entities)

### Usage

To run the script:

1. Ensure database credentials are properly configured
2. Run `python export_to_smartsheet_with_contacts.py`
3. Check the output file in the current directory

The script will print statistics about the export process, including:

- Number of records processed
- Number of projects with contact information
- Number of unique entities
