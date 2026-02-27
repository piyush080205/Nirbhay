# Nirbhay – macOS Setup Guide (VS Code)

Complete step-by-step guide to run the Nirbhay women safety app on macOS using VS Code.

---

## 📋 Table of Contents

1. [Prerequisites Installation](#prerequisites-installation)
2. [VS Code Setup](#vs-code-setup)
3. [Download Project](#download-project)
4. [Backend Setup](#backend-setup)
5. [Frontend Setup](#frontend-setup)
6. [Running in VS Code](#running-in-vs-code)
7. [Connecting via Mobile](#connecting-via-mobile)
8. [Testing](#testing)
9. [Troubleshooting](#troubleshooting)

---

## 1️⃣ Prerequisites Installation

### Step 1.1: Install Homebrew (Package Manager)

Open **Terminal** (⌘ + Space, type "Terminal"):

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

Follow the instructions, then verify:
```bash
brew --version
```

---

### Step 1.2: Install Node.js (Required)

```bash
brew install node@18
```

Verify installation:
```bash
node --version
npm --version
```

Should show Node v18.x.x or higher.

---

### Step 1.3: Install Python (Required)

macOS comes with Python, but install the latest version:

```bash
brew install python@3.11
```

Verify:
```bash
python3 --version
pip3 --version
```

---

### Step 1.4: Install MongoDB (Required)

#### Option A: MongoDB Community (Local Install)

```bash
# Install MongoDB
brew tap mongodb/brew
brew install mongodb-community

# Start MongoDB service
brew services start mongodb-community
```

Verify it's running:
```bash
mongosh
# Should connect to mongodb://localhost:27017
# Type 'exit' to quit
```

#### Option B: MongoDB Atlas (Cloud - Easier)

1. Go to: https://www.mongodb.com/cloud/atlas/register
2. Create free account and cluster
3. Get connection string (you'll need this later)

---

### Step 1.5: Install Yarn (Required)

```bash
npm install -g yarn
```

Verify:
```bash
yarn --version
```

---

### Step 1.6: Install Git (Usually pre-installed)

Verify:
```bash
git --version
```

If not installed:
```bash
brew install git
```

---

### Step 1.7: Install Expo Go on iPhone (Required)

- Download **Expo Go** from App Store
- Search for "Expo Go" and install

---

## 2️⃣ VS Code Setup

### Step 2.1: Install VS Code

Download from: https://code.visualstudio.com/

Or via Homebrew:
```bash
brew install --cask visual-studio-code
```

---

### Step 2.2: Install Recommended Extensions

Open VS Code and install these extensions:

**Essential:**
1. **Python** (by Microsoft)
2. **Pylance** (by Microsoft)
3. **ESLint** (by Microsoft)
4. **Prettier** - Code formatter
5. **React Native Tools** (by Microsoft)

**Optional but Helpful:**
6. **MongoDB for VS Code**
7. **Thunder Client** (for API testing)
8. **GitLens**
9. **Path Intellisense**

**Install via VS Code:**
- Press `⌘ + Shift + X` to open Extensions
- Search for each extension
- Click "Install"

---

### Step 2.3: Configure VS Code Settings

Open Settings (`⌘ + ,`) and add:

```json
{
  "python.linting.enabled": true,
  "python.linting.pylintEnabled": true,
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "python.formatting.provider": "black",
  "[python]": {
    "editor.defaultFormatter": "ms-python.black-formatter"
  }
}
```

---

## 3️⃣ Download Project

### Step 3.1: Clone Repository

Open **Terminal** in VS Code (`⌃ + ~` or View → Terminal):

```bash
cd ~/Desktop
git clone https://github.com/Debjyoti04/Nirbhay1.2.git
cd Nirbhay1.2
```

---

### Step 3.2: Open in VS Code

```bash
code .
```

Or: File → Open Folder → Select `Nirbhay1.2` folder

---

## 4️⃣ Backend Setup

### Step 4.1: Open Backend Terminal

In VS Code:
1. Open integrated terminal: `⌃ + ~`
2. Navigate to backend:
   ```bash
   cd backend
   ```

---

### Step 4.2: Create Virtual Environment

```bash
python3 -m venv venv
```

---

### Step 4.3: Activate Virtual Environment

```bash
source venv/bin/activate
```

You should see `(venv)` in your terminal prompt.

**Note:** You need to activate this every time you open a new terminal!

---

### Step 4.4: Install Dependencies

```bash
pip install fastapi uvicorn motor pydantic python-dotenv httpx pymongo google-generativeai
```

Or install from requirements.txt:
```bash
pip install -r requirements.txt
```

---

### Step 4.5: Create `.env` File

In VS Code, create a file: `backend/.env`

**For Local MongoDB:**
```env
# MongoDB Connection (Local)
MONGO_URL=mongodb://localhost:27017
DB_NAME=nirbhay_db

# Unwired Labs API (Cellular Geolocation)
# Get free key: https://unwiredlabs.com/
UNWIRED_LABS_API_KEY=your_unwired_labs_key_here

# Fast2SMS API (SMS Alerts)
# Get key: https://www.fast2sms.com/
FAST2SMS_API_KEY=your_fast2sms_key_here

# Gemini API (Chat Analysis)
# Get key: https://aistudio.google.com/app/apikey
GEMINI_API_KEY=your_gemini_key_here
```

**For MongoDB Atlas (Cloud):**
```env
MONGO_URL=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
DB_NAME=nirbhay_db

UNWIRED_LABS_API_KEY=your_key_here
FAST2SMS_API_KEY=your_key_here
GEMINI_API_KEY=your_key_here
```

---

### Step 4.6: Test Backend

```bash
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

**Success!** You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8001
INFO:     Application startup complete.
```

Open browser: http://localhost:8001/docs

You should see the API documentation.

**Keep this terminal running!**

---

## 5️⃣ Frontend Setup

### Step 5.1: Open New Terminal

In VS Code:
- Click the `+` button in terminal panel
- Or press `⌃ + Shift + ~`

Navigate to frontend:
```bash
cd frontend
```

---

### Step 5.2: Install Dependencies

```bash
yarn install
```

This will take 2-3 minutes.

---

### Step 5.3: Find Your Local IP Address

**Method 1: Terminal**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

Look for output like:
```
inet 192.168.1.100 netmask 0xffffff00 broadcast 192.168.1.255
```

**Copy the IP:** `192.168.1.100`

**Method 2: System Preferences**
1. Click  → System Preferences → Network
2. Select Wi-Fi (connected)
3. Note the IP address

---

### Step 5.4: Create `.env` File

In VS Code, create: `frontend/.env`

```env
EXPO_PUBLIC_BACKEND_URL=http://192.168.1.100:8001/api
```

**Replace `192.168.1.100` with YOUR IP from Step 5.3!**

---

## 6️⃣ Running in VS Code

### Step 6.1: Split Terminal Setup

VS Code allows multiple terminals. Set up 3 terminals:

**Terminal 1: Backend**
```bash
cd backend
source venv/bin/activate
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

**Terminal 2: Frontend (Expo)**
```bash
cd frontend
npx expo start --tunnel
```

**Terminal 3: MongoDB (if using local)**
```bash
# Usually runs as service, but you can check:
mongosh
```

---

### Step 6.2: VS Code Terminal Layout

Recommended layout:
```
┌─────────────────────────────────────┐
│         VS Code Editor              │
│                                     │
├─────────────────────────────────────┤
│ Terminal 1: Backend  │ Terminal 2:  │
│ (uvicorn)            │ Frontend     │
│                      │ (expo)       │
└─────────────────────────────────────┘
```

To split terminals:
- Click split terminal button in terminal panel
- Or right-click terminal → Split Terminal

---

### Step 6.3: Using VS Code Tasks (Optional - Advanced)

Create `.vscode/tasks.json`:

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Start Backend",
      "type": "shell",
      "command": "cd backend && source venv/bin/activate && uvicorn server:app --host 0.0.0.0 --port 8001 --reload",
      "isBackground": true,
      "problemMatcher": []
    },
    {
      "label": "Start Frontend",
      "type": "shell",
      "command": "cd frontend && npx expo start --tunnel",
      "isBackground": true,
      "problemMatcher": []
    },
    {
      "label": "Start All Services",
      "dependsOn": ["Start Backend", "Start Frontend"]
    }
  ]
}
```

Run tasks: `⌘ + Shift + P` → "Tasks: Run Task"

---

## 7️⃣ Connecting via Mobile

### Step 7.1: Expo QR Code

After running `npx expo start --tunnel`, you'll see:

```
› Metro waiting on exp://xxx.xxx.xxx.xxx:19000
› Scan the QR code above with Expo Go (iOS)
```

---

### Step 7.2: Connect via iPhone

**Method 1: QR Code (Easiest)**
1. Open **Expo Go** app on iPhone
2. Tap **"Scan QR code"**
3. Scan the QR code from VS Code terminal
4. App will load!

**Method 2: Same Network**
- Ensure iPhone and Mac on same Wi-Fi
- Open Expo Go
- App should appear under "Recently in development"
- Tap to open

**Method 3: Tunnel (Best for Different Networks)**
- Use `--tunnel` flag: `npx expo start --tunnel`
- Scan QR code from Expo Go
- Works even on different networks

---

### Step 7.3: Grant Permissions

When app opens:
- ✅ **Location**: Select **"Allow Always"** (Important!)
- ✅ **Motion & Activity**: Allow

---

## 8️⃣ Testing the App

### Step 8.1: Start a Trip

1. Open app in Expo Go
2. Tap **"Start Trip"**
3. Enter guardian phone number
4. Tap **"Confirm"**

---

### Step 8.2: Test Panic Detection

1. **Shake your iPhone vigorously** for 5-10 seconds
2. Keep shaking until alert appears
3. Safety check modal will appear: **"Are you feeling okay?"**

---

### Step 8.3: Test Safety Check Scenarios

You have **20 seconds** to respond:

**Scenario 1: Safe**
- Tap **"Yes"**
- Enter code: `1234`
- ✅ Alert cancelled

**Scenario 2: Wrong Code**
- Tap **"Yes"**
- Enter wrong code (e.g., `0000`)
- ❌ SMS alert sent

**Scenario 3: Not Safe**
- Tap **"No"**
- ❌ SMS alert sent immediately

**Scenario 4: No Response**
- Don't tap anything
- Wait 20 seconds
- ❌ SMS alert sent automatically

---

### Step 8.4: Test Additional Features

**Safe Route Generator:**
1. Tap "Routes" tab
2. Enter origin location
3. Enter destination
4. View safety analysis

**Chat Safety Analyzer:**
1. Tap "Chat Safety" tab
2. Upload screenshot or take photo
3. Wait for AI analysis
4. View red flags and recommendations

---

### Step 8.5: End Trip

1. Tap **"End Trip"** button
2. Trip data saved to MongoDB

---

## 9️⃣ Troubleshooting

### ❌ Problem: "python3: command not found"

**Solution:**
```bash
# Check if Python is installed
which python3

# If not found, install via Homebrew
brew install python@3.11
```

---

### ❌ Problem: "MongoDB connection failed"

**Solution (Local MongoDB):**
```bash
# Check if MongoDB is running
brew services list

# Start MongoDB
brew services start mongodb-community

# Verify connection
mongosh
```

**Solution (Atlas):**
- Check internet connection
- Verify connection string in `.env`
- Whitelist IP in MongoDB Atlas

---

### ❌ Problem: "Cannot connect to backend from iPhone"

**Solution:**

1. **Check Network:**
   - iPhone and Mac on same Wi-Fi
   - Try using `--tunnel` flag

2. **Check Firewall:**
   - System Preferences → Security & Privacy → Firewall
   - Click "Firewall Options"
   - Ensure Python is allowed

3. **Verify IP Address:**
   ```bash
   ifconfig | grep "inet " | grep -v 127.0.0.1
   ```
   - Update `frontend/.env` with correct IP

4. **Use Tunnel Mode:**
   ```bash
   npx expo start --tunnel
   ```

---

### ❌ Problem: "QR code not scanning"

**Solution:**
1. Use tunnel mode: `npx expo start --tunnel`
2. Manually enter URL from terminal
3. Update Expo Go app to latest version
4. Restart Expo server (`r` in terminal)

---

### ❌ Problem: "Location not tracking on iPhone"

**Solution:**
1. Settings → Privacy → Location Services
2. Find Expo Go
3. Select **"Always"** (not "While Using")
4. Enable "Precise Location"
5. Disable Low Power Mode

---

### ❌ Problem: "SMS not sending"

**Solution:**
1. Check Fast2SMS API key in `backend/.env`
2. Fast2SMS requires Indian phone numbers
3. Check API balance/credits
4. View backend logs in VS Code terminal

---

### ❌ Problem: "Port already in use"

**Solution:**
```bash
# Find process using port 8001
lsof -ti:8001

# Kill the process
kill -9 $(lsof -ti:8001)

# Or use different port
uvicorn server:app --host 0.0.0.0 --port 8002 --reload
```

---

### ❌ Problem: "Module not found" errors

**Solution (Backend):**
```bash
cd backend
source venv/bin/activate
pip install -r requirements.txt
```

**Solution (Frontend):**
```bash
cd frontend
yarn install
```

---

## 📊 Checking Services

### Check Backend Status

Open browser: http://localhost:8001/api/health

Should show:
```json
{
  "status": "healthy",
  "services": {
    "database": "connected"
  }
}
```

---

### Check MongoDB Status

```bash
mongosh
```

Then:
```javascript
show dbs
use nirbhay_db
db.trips.find()
```

---

### Check Expo Status

In terminal where Expo is running, press:
- `m` - Open menu
- `r` - Reload app
- `c` - Clear cache
- `d` - Open developer tools

---

## 🔄 Daily Workflow

After initial setup, to run the app daily:

### 1. Open VS Code
```bash
cd ~/Desktop/Nirbhay1.2
code .
```

### 2. Start Backend (Terminal 1)
```bash
cd backend
source venv/bin/activate
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

### 3. Start Frontend (Terminal 2)
```bash
cd frontend
npx expo start --tunnel
```

### 4. On iPhone
- Open Expo Go
- Scan QR code or select from recent projects

---

## 🛠️ Useful VS Code Shortcuts

### General
- `⌘ + P` - Quick file open
- `⌘ + Shift + P` - Command palette
- `⌃ + ~` - Toggle terminal
- `⌘ + B` - Toggle sidebar
- `⌘ + Shift + E` - Explorer
- `⌘ + Shift + F` - Search

### Terminal
- `⌃ + Shift + ~` - New terminal
- `⌘ + \` - Split terminal
- `⌘ + K` - Clear terminal
- `⌃ + C` - Stop process

### Editing
- `⌘ + /` - Toggle comment
- `⌥ + Shift + F` - Format document
- `⌘ + D` - Select next occurrence
- `⌘ + Shift + L` - Select all occurrences

---

## 📝 VS Code Workspace Settings

Create `.vscode/settings.json`:

```json
{
  "python.defaultInterpreterPath": "${workspaceFolder}/backend/venv/bin/python",
  "python.terminal.activateEnvironment": true,
  "python.linting.enabled": true,
  "python.linting.pylintEnabled": true,
  "editor.formatOnSave": true,
  "files.exclude": {
    "**/__pycache__": true,
    "**/*.pyc": true,
    "**/node_modules": true,
    "**/.expo": true
  },
  "search.exclude": {
    "**/node_modules": true,
    "**/venv": true,
    "**/.expo": true
  }
}
```

---

## 🎯 Project Structure in VS Code

```
Nirbhay1.2/
├── .vscode/              # VS Code settings
│   ├── settings.json
│   └── tasks.json
├── backend/
│   ├── venv/             # Virtual environment
│   ├── server.py         # FastAPI main file
│   ├── .env              # Environment variables
│   └── requirements.txt
├── frontend/
│   ├── app/              # Expo Router pages
│   ├── components/       # React components
│   ├── .env              # Environment variables
│   └── package.json
└── README.md
```

---

## 🔗 Useful Commands

### Backend Commands
```bash
# Activate virtual environment
source venv/bin/activate

# Install package
pip install package-name

# Update requirements
pip freeze > requirements.txt

# Run server
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

### Frontend Commands
```bash
# Install package
yarn add package-name

# Start Expo
npx expo start

# Start with tunnel
npx expo start --tunnel

# Clear cache
npx expo start --clear

# Update Expo
npx expo upgrade
```

### MongoDB Commands
```bash
# Start MongoDB
brew services start mongodb-community

# Stop MongoDB
brew services stop mongodb-community

# Restart MongoDB
brew services restart mongodb-community

# Connect to MongoDB
mongosh
```

---

## 📱 Testing in VS Code

### Using Thunder Client Extension

1. Install Thunder Client extension
2. Create new request
3. Test endpoints:

**Health Check:**
```
GET http://localhost:8001/api/health
```

**Create Trip:**
```
POST http://localhost:8001/api/trips
Content-Type: application/json

{
  "user_id": "test_user",
  "guardian_phone": "+919876543210"
}
```

---

## 🐛 Debugging in VS Code

### Backend Debugging

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Python: FastAPI",
      "type": "python",
      "request": "launch",
      "module": "uvicorn",
      "args": [
        "server:app",
        "--reload",
        "--host",
        "0.0.0.0",
        "--port",
        "8001"
      ],
      "jinja": true,
      "cwd": "${workspaceFolder}/backend"
    }
  ]
}
```

Set breakpoints: Click left of line number
Start debugging: `F5`

---

## 🎉 Success Checklist

- ✅ Node.js installed and working
- ✅ Python 3 installed and working
- ✅ MongoDB running
- ✅ VS Code with extensions installed
- ✅ Backend virtual environment created
- ✅ Backend dependencies installed
- ✅ Backend `.env` file created
- ✅ Frontend dependencies installed
- ✅ Frontend `.env` file created
- ✅ Backend starting without errors
- ✅ Frontend starting without errors
- ✅ Expo Go app installed on iPhone
- ✅ Can scan QR code and load app
- ✅ Can start/end trips
- ✅ Panic detection working
- ✅ Safety check modal appearing

---

## 🚀 Next Steps

1. **Get API Keys:**
   - Unwired Labs: https://unwiredlabs.com/
   - Fast2SMS: https://www.fast2sms.com/
   - Gemini AI: https://aistudio.google.com/app/apikey

2. **Customize:**
   - Change safety code from `1234`
   - Adjust panic detection sensitivity
   - Modify alert messages

3. **Deploy:**
   - Host backend on Railway/Heroku
   - Build Expo app for production
   - Set up MongoDB Atlas

---

## 📞 Need Help?

### Check Logs in VS Code

**Backend logs:** Terminal 1 (uvicorn output)
**Frontend logs:** Terminal 2 (Expo output)
**Expo Go logs:** Shake iPhone → "Show Dev Menu" → "Debug Remote JS"

### Common Issues
- Always activate virtual environment for backend
- Ensure correct IP in frontend `.env`
- Use tunnel mode if on different networks
- Check firewall settings on Mac

---

**Nirbhay – Safety that doesn't wait for permission.** 🛡️

---

*Last Updated: February 2026*
*Tested on: macOS Sonoma 14.x, VS Code 1.85+*
