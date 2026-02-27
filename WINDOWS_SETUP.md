# Nirbhay – Windows Setup Guide (From Zero)

Complete step-by-step guide to run the Nirbhay women safety app on Windows.

---

## 📋 Table of Contents

1. [Prerequisites Installation](#prerequisites-installation)
2. [Download Project](#download-project)
3. [Backend Setup](#backend-setup)
4. [Frontend Setup](#frontend-setup)
5. [Running the App](#running-the-app)
6. [Connecting via Mobile](#connecting-via-mobile)
7. [Testing](#testing)
8. [Troubleshooting](#troubleshooting)

---

## 1️⃣ Prerequisites Installation

### Step 1.1: Install Node.js (Required)

1. Go to: https://nodejs.org/
2. Download **LTS version** (18.x or higher)
3. Run installer → Click **Next** → **Install**
4. Verify installation:
   ```cmd
   node --version
   npm --version
   ```
   Should show versions like `v18.x.x` and `8.x.x`

---

### Step 1.2: Install Python (Required)

1. Go to: https://www.python.org/downloads/
2. Download **Python 3.9+** (3.9, 3.10, or 3.11)
3. **Important**: Check ✅ **"Add Python to PATH"** during installation
4. Click **Install Now**
5. Verify installation:
   ```cmd
   python --version
   pip --version
   ```
   Should show `Python 3.9.x` or higher

---

### Step 1.3: Install MongoDB (Required)

#### Option A: MongoDB Community (Local Install)

1. Go to: https://www.mongodb.com/try/download/community
2. Download **Windows MSI**
3. Run installer:
   - Choose **Complete** installation
   - Check ✅ **"Install MongoDB as a Service"**
   - Check ✅ **"Install MongoDB Compass"** (GUI tool)
4. Verify MongoDB is running:
   ```cmd
   mongosh
   ```
   Should connect to `mongodb://localhost:27017`

#### Option B: MongoDB Atlas (Cloud - Easier)

1. Go to: https://www.mongodb.com/cloud/atlas/register
2. Create free account
3. Create a **FREE cluster**
4. Click **Connect** → **Connect your application**
5. Copy connection string (you'll need this later)

---

### Step 1.4: Install Yarn (Required)

```cmd
npm install -g yarn
```

Verify:
```cmd
yarn --version
```

---

### Step 1.5: Install Git (Required)

1. Go to: https://git-scm.com/download/win
2. Download and install
3. Use default settings
4. Verify:
   ```cmd
   git --version
   ```

---

### Step 1.6: Install Expo Go on Phone (Required)

- **Android**: Download from Google Play Store
- **iOS**: Download from App Store

Search for **"Expo Go"** and install.

---

## 2️⃣ Download Project

### Step 2.1: Clone Repository

Open **Command Prompt** or **PowerShell**:

```cmd
cd Desktop
git clone https://github.com/Debjyoti04/Nirbhay1.2.git
cd Nirbhay1.2
```

---

## 3️⃣ Backend Setup

### Step 3.1: Navigate to Backend

```cmd
cd backend
```

---

### Step 3.2: Create Virtual Environment

```cmd
python -m venv venv
```

---

### Step 3.3: Activate Virtual Environment

```cmd
venv\Scripts\activate
```

You should see `(venv)` in your command prompt.

---

### Step 3.4: Install Dependencies

```cmd
pip install fastapi uvicorn motor pydantic python-dotenv httpx pymongo
```

---

### Step 3.5: Create `.env` File

Create a file named `.env` in the `backend` folder:

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
```

**For MongoDB Atlas (Cloud):**
```env
# MongoDB Connection (Atlas)
MONGO_URL=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
DB_NAME=nirbhay_db

# Unwired Labs API
UNWIRED_LABS_API_KEY=your_unwired_labs_key_here

# Fast2SMS API
FAST2SMS_API_KEY=your_fast2sms_key_here
```

**Where to get API keys:**
- **Unwired Labs**: https://unwiredlabs.com/ (Free tier available)
- **Fast2SMS**: https://www.fast2sms.com/ (Indian SMS service)

---

### Step 3.6: Test Backend

```cmd
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

**Success!** You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8001
INFO:     Application startup complete.
```

Open browser: http://localhost:8001/docs

You should see the API documentation.

**Keep this terminal open!**

---

## 4️⃣ Frontend Setup

Open a **NEW Command Prompt** window.

### Step 4.1: Navigate to Frontend

```cmd
cd Desktop\Nirbhay1.2\frontend
```

---

### Step 4.2: Install Dependencies

```cmd
yarn install
```

This will take 2-3 minutes.

---

### Step 4.3: Find Your Local IP Address

In Command Prompt:
```cmd
ipconfig
```

Look for **"Wireless LAN adapter Wi-Fi"** or **"Ethernet adapter"**:
```
IPv4 Address. . . . . . . . . . . : 192.168.1.100
```

**Copy this IP address!** (Example: `192.168.1.100`)

---

### Step 4.4: Create `.env` File

Create a file named `.env` in the `frontend` folder:

```env
EXPO_PUBLIC_BACKEND_URL=http://192.168.1.100:8001/api
```

**Replace `192.168.1.100` with YOUR actual IP address from Step 4.3!**

---

## 5️⃣ Running the App

### Step 5.1: Start Backend

If you closed the backend terminal, open it again:

```cmd
cd Desktop\Nirbhay1.2\backend
venv\Scripts\activate
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

**Keep this terminal running!**

---

### Step 5.2: Start Frontend (Expo)

In the second terminal:

```cmd
cd Desktop\Nirbhay1.2\frontend
npx expo start --tunnel
```

**Important:** Use `--tunnel` flag for easier mobile connection!

You'll see:
```
› Metro waiting on exp://xxx.xxx.xxx.xxx:19000
› Scan the QR code above with Expo Go (Android) or Camera app (iOS)
```

**Keep this terminal running!**

---

## 6️⃣ Connecting via Mobile

### Method 1: QR Code (Easiest)

1. Open **Expo Go** app on your phone
2. Tap **"Scan QR code"**
3. Scan the QR code from your terminal
4. App will load!

---

### Method 2: Same Network

**Requirements:**
- Phone and laptop must be on **same Wi-Fi network**

1. Open **Expo Go** app
2. App should appear automatically under **"Recently in development"**
3. Tap to open

---

### Method 3: Manual URL Entry

1. Open **Expo Go** app
2. Tap **"Enter URL manually"**
3. Enter the URL from terminal (starts with `exp://`)
4. Tap **Connect**

---

## 7️⃣ Testing the App

### Step 7.1: Grant Permissions

When app opens, grant:
- ✅ **Location**: Select **"Allow Always"** (Important!)
- ✅ **Motion & Activity**: Allow

---

### Step 7.2: Start a Trip

1. Open the app
2. Tap **"Start Trip"** button
3. Enter guardian phone number (any valid number)
4. Tap **"Confirm"**

---

### Step 7.3: Test Panic Detection

1. **Shake your phone vigorously** for 5-10 seconds
2. Keep shaking until you see the alert
3. Safety check modal will appear: **"Are you feeling okay?"**

---

### Step 7.4: Test Safety Check Scenarios

You have **20 seconds** to respond:

**Scenario 1: Safe**
- Tap **"Yes"**
- Enter code: `1234`
- ✅ Alert cancelled

**Scenario 2: Wrong Code**
- Tap **"Yes"**
- Enter wrong code (e.g., `0000`)
- ❌ SMS alert sent to guardian

**Scenario 3: Not Safe**
- Tap **"No"**
- ❌ SMS alert sent immediately

**Scenario 4: No Response**
- Don't tap anything
- Wait 20 seconds
- ❌ SMS alert sent automatically

---

### Step 7.5: End Trip

1. Tap **"End Trip"** button
2. Trip data saved to MongoDB

---

## 8️⃣ Troubleshooting

### ❌ Problem: "Python not found"

**Solution:**
1. Reinstall Python
2. ✅ Check **"Add Python to PATH"**
3. Restart Command Prompt

---

### ❌ Problem: "MongoDB connection failed"

**Solution (Local MongoDB):**
1. Open **Services** (Win + R → `services.msc`)
2. Find **MongoDB Server**
3. Right-click → **Start**

**Solution (Atlas):**
1. Check internet connection
2. Verify connection string in `.env`
3. Whitelist your IP in MongoDB Atlas

---

### ❌ Problem: "Cannot connect to backend from phone"

**Solution:**
1. Ensure phone and laptop on **same Wi-Fi**
2. Check Windows Firewall:
   - Open **Windows Defender Firewall**
   - Click **"Allow an app through firewall"**
   - Find **Python** → Check both ✅ Private and ✅ Public
3. Verify correct IP in `frontend/.env`
4. Try using `--tunnel` flag: `npx expo start --tunnel`

---

### ❌ Problem: "QR code not scanning"

**Solution:**
1. Use `npx expo start --tunnel` instead of `npx expo start`
2. Or manually enter URL shown in terminal
3. Update Expo Go app to latest version

---

### ❌ Problem: "Location not tracking"

**Solution:**
1. Go to phone **Settings** → **Apps** → **Expo Go**
2. **Permissions** → **Location**
3. Select **"Allow all the time"** (not "While using")
4. Disable battery optimization for Expo Go

---

### ❌ Problem: "SMS not sending"

**Solution:**
1. Check if you have valid **Fast2SMS API key** in `backend/.env`
2. Fast2SMS requires Indian phone numbers
3. Check Fast2SMS balance/credits
4. View backend logs for error messages

---

### ❌ Problem: "Module not found" errors

**Solution (Backend):**
```cmd
cd backend
venv\Scripts\activate
pip install -r requirements.txt
```

**Solution (Frontend):**
```cmd
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
    "database": "connected",
    "unwired_labs": "configured"
  }
}
```

---

### Check MongoDB Status

```cmd
mongosh
```

Then:
```js
show dbs
use nirbhay_db
db.trips.find()
```

---

## 🔄 Daily Workflow

After initial setup, to run the app daily:

### Terminal 1 (Backend):
```cmd
cd Desktop\Nirbhay1.2\backend
venv\Scripts\activate
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

### Terminal 2 (Frontend):
```cmd
cd Desktop\Nirbhay1.2\frontend
npx expo start --tunnel
```

### Phone:
- Open Expo Go
- Scan QR code or select from recent projects

---

## 🛠️ Useful Commands

### Stop All Services:
- Press `Ctrl + C` in both terminals

### Clear MongoDB Data:
```cmd
mongosh
use nirbhay_db
db.trips.deleteMany({})
```

### Restart Backend:
```cmd
# Press Ctrl + C
# Then run again:
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

### Update Dependencies:
```cmd
# Backend
cd backend
venv\Scripts\activate
pip install --upgrade -r requirements.txt

# Frontend
cd frontend
yarn upgrade
```

---

## 📝 Important Notes

### Security
- Never commit `.env` files to Git
- Keep API keys private
- Use test data for development

### Performance
- **Disable battery optimization** for Expo Go
- Keep phone screen **unlocked** during testing
- Background tracking works best with screen locked after trip starts

### Development
- Backend auto-reloads on file changes (`--reload` flag)
- Frontend hot-reloads automatically
- Check terminal logs for errors

---

## 🎯 Project Structure

```
Nirbhay1.2/
├── backend/
│   ├── server.py          # FastAPI main file
│   ├── .env              # Environment variables (create this)
│   ├── requirements.txt  # Python dependencies
│   └── venv/             # Virtual environment (created)
│
├── frontend/
│   ├── app/              # Expo Router pages
│   ├── components/       # React components
│   ├── store/           # Zustand state management
│   ├── assets/          # Images, fonts
│   ├── .env            # Environment variables (create this)
│   ├── package.json    # Node dependencies
│   └── app.json        # Expo configuration
│
└── README.md           # This file
```

---

## 🔗 Useful Links

- **Expo Documentation**: https://docs.expo.dev/
- **FastAPI Documentation**: https://fastapi.tiangolo.com/
- **MongoDB Documentation**: https://www.mongodb.com/docs/
- **Unwired Labs**: https://unwiredlabs.com/
- **Fast2SMS**: https://www.fast2sms.com/

---

## 🆘 Need Help?

### Common Issues:
1. **Port already in use**: Change port number in commands
2. **Permission denied**: Run Command Prompt as Administrator
3. **Network issues**: Check firewall and antivirus settings

### Debug Steps:
1. Check backend logs in terminal
2. Check frontend logs in terminal
3. Check Expo Go error messages
4. View MongoDB logs in Services

---

## 🎉 Success Checklist

- ✅ Node.js installed and working
- ✅ Python installed and working
- ✅ MongoDB running
- ✅ Backend starting without errors
- ✅ Frontend starting without errors
- ✅ Expo Go app installed on phone
- ✅ Can scan QR code and load app
- ✅ Can start/end trips
- ✅ Panic detection working
- ✅ Safety check modal appearing

---

## 🚀 Next Steps

1. **Get API Keys**:
   - Sign up for Unwired Labs (free tier)
   - Sign up for Fast2SMS (if in India)

2. **Customize**:
   - Change safety code from `1234` to custom code
   - Adjust panic detection sensitivity
   - Modify alert message templates

3. **Deploy**:
   - Host backend on Heroku/Railway
   - Build Expo app for production
   - Set up proper MongoDB Atlas cluster

---

**Nirbhay – Safety that doesn't wait for permission.** 🛡️

---

*Last Updated: February 2026*
