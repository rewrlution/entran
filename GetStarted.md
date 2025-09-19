# ENTRAN Startup Guide

## Overview

ENTRAN (English Transformation and Automation) converts English troubleshooting documentation into executable programs through a 4-stage compilation pipeline.

## System Requirements

### Prerequisites

- **Node.js**: Version 18.0 or higher
- **npm**: Version 8.0 or higher (comes with Node.js)
- **Operating System**: macOS, Linux, or Windows
- **Memory**: Minimum 4GB RAM recommended
- **Storage**: At least 1GB free space

### Optional Tools

- **Git**: For cloning the repository
- **curl**: For testing API endpoints
- **jq**: For formatting JSON responses

## Installation Steps

### 1. Clone Repository

```bash
git clone https://github.com/rewrlution/entran.git
cd entran
```

### 2. Install Backend Dependencies

```bash
npm install
```

### 3. Install Frontend Dependencies

```bash
cd frontend
npm install
cd ..
```

## Starting the Application

### Method 1: Manual Startup (Recommended for Development)

**Terminal 1 - Backend Server:**

```bash
# From project root directory
node src/server/app.js
```

- Backend will start on port 3001
- Look for message: "🚀 ENTRAN Server running on port 3001"

**Terminal 2 - Frontend Application:**

```bash
# Open new terminal and navigate to frontend
cd frontend
npm start
```

- Frontend will start on port 3000
- Browser should automatically open to http://localhost:3000

### Method 2: Background Processes

**Start Backend in Background:**

```bash
# From project root
nohup node src/server/app.js > backend.log 2>&1 &
echo $! > backend.pid
```

**Start Frontend in Background:**

```bash
cd frontend
nohup npm start > frontend.log 2>&1 &
echo $! > frontend.pid
```

**Stop Background Processes:**

```bash
# Stop backend
kill $(cat backend.pid)
rm backend.pid

# Stop frontend
kill $(cat frontend/frontend.pid)
rm frontend/frontend.pid
```

## Verification Steps

### 1. Check Backend Health

```bash
curl http://localhost:3001/api/lexer/parse
```

Expected: JSON response indicating request validation failed (this is normal without proper payload)

### 2. Check Frontend Access

Open browser to: http://localhost:3000

Expected: ENTRAN dashboard with navigation menu

### 3. Test Full Pipeline

Use the web interface:

1. Navigate to "Document Editor"
2. Click "Load Sample" to load example document
3. Click "Process Document" to run through all 4 stages
4. Verify results appear in the right panel

## Port Configuration

### Default Ports

- **Backend API**: 3001
- **Frontend App**: 3000

### Changing Ports

**Backend Port:**
Edit `src/server/app.js`:

```javascript
const PORT = process.env.PORT || 3001; // Change 3001 to desired port
```

**Frontend Port:**

```bash
# Temporary change
PORT=3002 npm start

# Permanent change - create .env file in frontend/
echo "PORT=3002" > frontend/.env
```

### Firewall Configuration

If using a firewall, ensure these ports are open:

```bash
# For ufw (Ubuntu/Debian)
sudo ufw allow 3000
sudo ufw allow 3001

# For firewalld (CentOS/RHEL)
sudo firewall-cmd --add-port=3000/tcp --permanent
sudo firewall-cmd --add-port=3001/tcp --permanent
sudo firewall-cmd --reload
```

## Common Startup Issues

### Issue 1: Port Already in Use

```
Error: listen EADDRINUSE: address already in use :::3001
```

**Solution:**

```bash
# Find process using the port
lsof -ti:3001

# Kill the process
kill $(lsof -ti:3001)

# Or use a different port
PORT=3002 node src/server/app.js
```

### Issue 2: npm Dependencies Missing

```
Error: Cannot find module 'express'
```

**Solution:**

```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# For frontend
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### Issue 3: Node.js Version Issues

```
Error: Unsupported Node.js version
```

**Solution:**

```bash
# Check Node.js version
node --version

# Install/update Node.js using nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18
```

### Issue 4: Frontend Build Warnings

```
WARNING in [eslint] ... no-unused-vars
```

**Solution:**
These are non-blocking warnings. The application will still work. To disable:

```bash
# Start with warnings disabled
DISABLE_ESLINT_PLUGIN=true npm start
```

## Development Mode

### Hot Reload Setup

For development with automatic restarts:

**Backend with nodemon:**

```bash
npm install -g nodemon
nodemon src/server/app.js
```

**Frontend** (already has hot reload):

```bash
cd frontend
npm start
```

### Debug Mode

Enable additional logging:

**Backend:**

```bash
DEBUG=entran:* node src/server/app.js
```

**Frontend:**
Open browser dev tools and check Console tab for React debug info.

## Production Deployment

### Environment Variables

Create `.env` file in project root:

```bash
NODE_ENV=production
PORT=3001
FRONTEND_URL=http://localhost:3000
```

### Build Frontend for Production

```bash
cd frontend
npm run build
```

### Start Production Server

```bash
NODE_ENV=production node src/server/app.js
```

## Health Monitoring

### Basic Health Check Script

Create `health-check.sh`:

```bash
#!/bin/bash
echo "Checking ENTRAN health..."

# Check backend
if curl -s http://localhost:3001/api/lexer/parse > /dev/null; then
    echo "✅ Backend: Running"
else
    echo "❌ Backend: Not responding"
fi

# Check frontend
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Frontend: Running"
else
    echo "❌ Frontend: Not responding"
fi
```

### Automated Startup Script

Create `start-entran.sh`:

```bash
#!/bin/bash
echo "Starting ENTRAN application..."

# Start backend
echo "Starting backend server..."
nohup node src/server/app.js > logs/backend.log 2>&1 &
echo $! > backend.pid

# Wait for backend to start
sleep 3

# Start frontend
echo "Starting frontend application..."
cd frontend
nohup npm start > ../logs/frontend.log 2>&1 &
echo $! > ../frontend.pid
cd ..

echo "ENTRAN started successfully!"
echo "Backend PID: $(cat backend.pid)"
echo "Frontend PID: $(cat frontend.pid)"
echo "Access the application at: http://localhost:3000"
```

Make it executable:

```bash
chmod +x start-entran.sh
mkdir -p logs
./start-entran.sh
```

## Next Steps

1. **Access the Application**: http://localhost:3000
2. **Try the Sample**: Use "Load Sample" in Document Editor
3. **Upload Your Own**: Create troubleshooting docs in markdown format
4. **Explore Stages**: Use Stage Viewer to understand the compilation pipeline
5. **Debug Programs**: Use Execution Monitor for step-by-step debugging

---

**ENTRAN is now ready to transform your English documentation into executable programs!** 🚀
