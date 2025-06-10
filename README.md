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

1. Clone or fork this repository
2. Deploy in server of choice. Recommended Github pages for ease.

## Updating Smartsheet Integration

The application uses Smartsheet iframes for form submission and data viewing. If you need to update these iframes:

1. Open `index.html`
2. Locate the iframe elements (they are in the form sections)
3. Replace the `src` attribute with your new Smartsheet iframe URL
4. Make sure to update both the iframe and its fallback link

Example:

```html
<iframe
  width="600"
  height="1200"
  src="https://app.smartsheet.com/b/form/YOUR_NEW_FORM_ID"
  title="Smartsheet Form"
  loading="lazy"
>
  <p>
    Your browser does not support iframes. Please
    <a
      href="https://app.smartsheet.com/b/form/YOUR_NEW_FORM_ID"
      target="_blank"
      rel="noopener noreferrer"
      >open the form in a new window</a
    >.
  </p>
</iframe>
```

Note: Make sure to update both the iframe's `src` attribute and the fallback link's `href` attribute with the same URL.

## TN Calculator Data Management

The TN Calculator uses two JSON files for its calculations:

1. `calculator/tn_calculator_land_use.json`:

   - Contains land use types and their base TN loads
   - Used for NPS (Non-Point Source) calculations
   - Format:
     ```json
     [
       {
         "name": "Land Use Type",
         "base_load": 0.0
       }
     ]
     ```

2. `calculator/tn_calculator_treatment_methods.json`:
   - Contains treatment methods and their TN removal rates
   - Used for both NPS and PS (Point Source) calculations
   - Format:
     ```json
     [
       {
         "name": "Treatment Method",
         "removal_rate": 0.0
       }
     ]
     ```

### Updating Calculator Data

To update the calculator's data:

1. Edit the JSON files directly:

   - Open the appropriate JSON file
   - Add, modify, or remove entries
   - Save the file
   - Refresh the web page to see changes

2. Data validation:
   - Ensure all numeric values are valid numbers
   - Base loads and removal rates should be between 0 and 1
   - Names should be unique within each file
   - Maintain the JSON format structure

Note: The calculator uses these local JSON files directly - no server-side processing is required for updates.

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
- Validate all calculator inputs

## Maintenance

Regular updates may be needed for:

- Smartsheet URL updates
- Calculator logic modifications
- Content updates
- Security patches

## Support

For support, please contact your system administrator or the development team.

#
