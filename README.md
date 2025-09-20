# Akkasah Archive - Photography Heritage Website

A modern, responsive website inspired by the Akkasah Center for Photography at NYU Abu Dhabi. This project features a React frontend with a FastAPI backend, designed to showcase and search through photographic collections from the Middle East and North Africa.

## Features

### Frontend (React + Vite)
- **Modern UI Design**: Clean, responsive interface inspired by the original Akkasah website
- **Collection Browsing**: Browse through historical and contemporary photography collections
- **Advanced Search**: Full-text search with filters for period, type, and collection
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Interactive Components**: Smooth animations and hover effects

### Backend (FastAPI)
- **RESTful API**: Clean API design with proper error handling
- **SQLite Database**: Lightweight database with Full Text Search (FTS5)
- **Indexed Search**: Fast search across collections and metadata
- **Data Models**: Well-structured models for collections, images, and search logs
- **CORS Support**: Configured for frontend integration

## Tech Stack

### Frontend
- React 18
- Vite (build tool)
- React Router (routing)
- Tailwind CSS (styling)
- Lucide React (icons)
- Axios (HTTP client)

### Backend
- FastAPI (web framework)
- SQLAlchemy (ORM)
- SQLite (database)
- Pydantic (data validation)
- Uvicorn (ASGI server)

## Project Structure

```
akkasah/
├── frontend/                 # React frontend
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   └── App.jsx         # Main app component
│   ├── public/             # Static assets
│   └── package.json        # Frontend dependencies
├── backend/                # FastAPI backend
│   ├── models.py          # Database models
│   ├── schemas.py         # Pydantic schemas
│   ├── services.py        # Business logic
│   ├── database.py        # Database configuration
│   ├── main.py           # FastAPI application
│   ├── seed_data.py      # Database seeding script
│   └── requirements.txt  # Backend dependencies
├── package.json           # Root package.json for scripts
└── README.md             # This file
```

## Quick Start

### Prerequisites
- Node.js (v16 or higher)
- Python 3.8 or higher
- pip (Python package manager)

### Installation

1. **Clone and navigate to the project**
   ```bash
   cd akkasah
   ```

2. **Install all dependencies**
   ```bash
   npm run install:all
   ```

3. **Seed the database with sample data**
   ```bash
   cd backend
   python seed_data.py
   cd ..
   ```

4. **Start the development servers**
   ```bash
   npm run dev
   ```

This will start:
- Frontend on http://localhost:3000
- Backend API on http://localhost:8000

### Individual Commands

**Frontend only:**
```bash
cd frontend
npm install
npm run dev
```

**Backend only:**
```bash
cd backend
pip install -r requirements.txt
python main.py
```

## API Endpoints

### Collections
- `GET /api/collections` - Get all collections (with optional filtering)
- `GET /api/collections/{id}` - Get specific collection
- `POST /api/collections` - Create new collection
- `GET /api/collections/search?q={query}` - Search collections

### Search
- `POST /api/search` - Advanced search with filters
- `GET /api/search/suggestions?q={query}` - Get search suggestions

### Statistics
- `GET /api/stats` - Get archive statistics

## Database Schema

### Collections Table
- `id`: Primary key
- `title`: Collection title
- `description`: Detailed description
- `historical_context`: Historical background
- `image_count`: Number of images
- `period`: Time period (e.g., "1850-1900")
- `collection_type`: Type of collection
- `type`: Category (Historical, Contemporary, etc.)
- `is_public`: Visibility flag

### Images Table
- `id`: Primary key
- `collection_id`: Foreign key to collections
- `title`: Image title
- `description`: Image description
- `filename`: Original filename
- `file_path`: Storage path
- `width/height`: Image dimensions
- `date_taken`: When photo was taken
- `location`: Geographic location
- `photographer`: Photographer name
- `keywords`: Searchable keywords

## Search Features

The application includes several search capabilities:

1. **Full Text Search**: Uses SQLite FTS5 for fast text searching
2. **Filtered Search**: Filter by collection type, period, and category
3. **Search Suggestions**: Auto-complete suggestions based on existing data
4. **Search Analytics**: Logs search queries for analytics

## Customization

### Adding New Collections
1. Use the API endpoint `POST /api/collections`
2. Or add directly to the database using the seed script

### Styling
- Modify `frontend/tailwind.config.js` for theme customization
- Update `frontend/src/index.css` for global styles
- Component styles are in individual component files

### Database
- Modify `backend/models.py` for schema changes
- Update `backend/schemas.py` for API validation
- Run `python seed_data.py` to reset with new data

## Development

### Frontend Development
```bash
cd frontend
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Backend Development
```bash
cd backend
python main.py       # Start development server
python seed_data.py  # Reset database with sample data
```

## Production Deployment

### Frontend
```bash
cd frontend
npm run build
# Deploy the 'dist' folder to your hosting service
```

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Inspired by the [Akkasah Center for Photography](https://wp.nyu.edu/akkasah/) at NYU Abu Dhabi
- Built with modern web technologies and best practices
- Designed for accessibility and performance

## Support

For questions or support, please open an issue in the repository or contact the development team.
