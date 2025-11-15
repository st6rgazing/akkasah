# How to Re-import EAD Files

## Overview
After updating the image extraction logic in the EAD parser, you need to re-import the EAD XML files to populate the database with high-quality IIIF image URLs.

## Steps

### 1. Make sure the backend is set up
```bash
cd backend
source venv/bin/activate
pip install -r requirements.txt
```

### 2. Run the import script
```bash
cd backend
source venv/bin/activate
python import_archive_data.py
```

This will:
- Clear existing archive data (collections, series, files)
- Parse all EAD XML files in the `/Users/mariam/akkasah/ArchiveFiles` directory
- Extract high-quality IIIF image URLs using the updated parser
- Import everything into the database

### 3. Verify the import
The script will print progress messages showing:
- How many collections were imported
- How many series were imported
- How many files were imported

### 4. Check the frontend
After re-importing, refresh your browser and the images should now display with high quality since they're using the IIIF URLs stored in the database.

## Important Notes

- **Backup your database first** if you want to keep existing data
- The import script **clears all existing archive data** before importing
- Make sure your EAD XML files are in the correct directory: `/Users/mariam/akkasah/ArchiveFiles`
- The import process may take several minutes depending on how many EAD files you have

## Troubleshooting

If you encounter errors:
1. Make sure all dependencies are installed (`beautifulsoup4`, `lxml`, `requests`)
2. Check that the ArchiveFiles directory exists and contains EAD XML files
3. Make sure the database is accessible and writable





