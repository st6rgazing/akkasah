# 🏛️ Akkasah Archive - Setup Guide

This guide will help you set up the Akkasah Archive website on your system. Choose the method that works best for your operating system.

## 🚀 Quick Start (Recommended)

### For macOS/Linux:
```bash
./setup.sh
```

### For Windows:
```cmd
setup.bat
```

### For Windows PowerShell:
```powershell
.\setup.ps1
```

## 📋 Prerequisites

Before running the setup script, make sure you have:

- **Node.js 16+** - [Download here](https://nodejs.org/)
- **Python 3.8+** - [Download here](https://python.org/)
- **Git** (optional) - [Download here](https://git-scm.com/)

## 🔧 Manual Setup

If you prefer to set up manually or the automated script doesn't work:

### 1. Install Dependencies

**Frontend:**
```bash
cd frontend
npm install
```

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Setup Database

```bash
cd backend
source venv/bin/activate  # On Windows: venv\Scripts\activate
python seed_data.py
```

### 3. Start Development Servers

**Option 1: Both servers together**
```bash
npm run dev
```

**Option 2: Separately**
```bash
# Terminal 1 - Backend
cd backend
source venv/bin/activate  # On Windows: venv\Scripts\activate
python main.py

# Terminal 2 - Frontend
cd frontend
npm run dev
```

## 🌐 Access Your Website

Once everything is running:

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000
- **API Documentation:** http://localhost:8000/docs

## 📁 Project Structure

```
akkasah/
├── frontend/                 # React frontend
│   ├── src/
│   │   ├── components/      # UI components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   └── App.jsx         # Main app
│   └── package.json        # Frontend dependencies
├── backend/                # FastAPI backend
│   ├── models.py          # Database models
│   ├── schemas.py         # Data validation
│   ├── services.py        # Business logic
│   ├── main.py           # FastAPI app
│   ├── seed_data.py      # Database seeding
│   └── requirements.txt  # Python dependencies
├── setup.sh              # macOS/Linux setup script
├── setup.bat             # Windows setup script
├── setup.ps1             # PowerShell setup script
└── README.md             # Main documentation
```

## 🛠️ Troubleshooting

### Common Issues

**1. Node.js not found**
- Install Node.js from [nodejs.org](https://nodejs.org/)
- Make sure it's added to your PATH

**2. Python not found**
- Install Python from [python.org](https://python.org/)
- Make sure it's added to your PATH

**3. Port already in use**
- Kill processes using ports 3000 or 8000
- Or change ports in the configuration files

**4. Permission denied (macOS/Linux)**
```bash
chmod +x setup.sh
chmod +x quick-setup.sh
```

**5. PowerShell execution policy (Windows)**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Reset Everything

If you want to start fresh:

```bash
# Remove node_modules and reinstall
rm -rf frontend/node_modules
rm -rf node_modules
npm install

# Remove virtual environment and reinstall
rm -rf backend/venv
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Reset database
python seed_data.py
```

## 🔒 Production Setup

For production deployment:

1. **Change the secret key** in `backend/.env`:
   ```
   SECRET_KEY=your-super-secret-production-key-here
   ```

2. **Build the frontend**:
   ```bash
   cd frontend
   npm run build
   ```

3. **Deploy the backend**:
   ```bash
   cd backend
   source venv/bin/activate
   uvicorn main:app --host 0.0.0.0 --port 8000
   ```

## 📚 Additional Resources

- [React Documentation](https://react.dev/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [SQLite Documentation](https://sqlite.org/docs.html)

## 🆘 Getting Help

If you encounter issues:

1. Check the troubleshooting section above
2. Make sure all prerequisites are installed
3. Try running the setup script again
4. Check the console output for error messages
5. Open an issue in the repository

## 🎉 Success!

Once everything is set up, you should see:

- A beautiful photography archive website
- Sample collections with historical context
- Working search functionality
- Responsive design that works on all devices
- Fast API with full documentation

Enjoy exploring the Akkasah Archive! 🏛️📸
