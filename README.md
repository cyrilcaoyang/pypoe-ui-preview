# PyPoe UI Preview - React Frontend

A modern React frontend for the PyPoe chat interface, providing a sleek user experience for interacting with AI bots through the PyPoe backend.

## 🚀 Running with PyPoe Backend

To run the complete PyPoe chat system, you need both the React frontend and PyPoe backend:

```bash
# Terminal 1: Start PyPoe Backend
cd ../PyPoe
conda activate pypoe-dev
pypoe web --host 0.0.0.0 --port 8000 --web-username YOUR_USERNAME --web-password YOUR_PASSWORD

# Terminal 2: Start React Frontend
cd pypoe-frontend
npm run dev
```

### **Verify Both Services**

```bash
# Test backend API (requires authentication)
curl -u YOUR_USERNAME:YOUR_PASSWORD http://localhost:8000/api/health

# Test frontend (should return HTML)
curl http://localhost:5173
```

### **Access URLs**

- **Frontend**: `http://localhost:5173` (or any network interface)
- **Backend API**: `http://localhost:8000` (with authentication)
- **Database**: Shared SQLite database in `PyPoe/users/history/`

## 🔧 Running as a Background Service (Daemon)

For production deployments or when you want the frontend to persist after SSH disconnection, you can run it as a background service.

### **Option 1: Simple Background with nohup (Easiest)**

```bash
# Start in background (survives SSH disconnection)
nohup npm run dev > ~/pypoe-frontend.log 2>&1 &

# The command breakdown:
# nohup = prevents termination when SSH session ends
# npm run dev = starts the frontend server
# > ~/pypoe-frontend.log = redirects output to log file
# 2>&1 = redirects errors to same log file
# & = runs in background

# Check if running
ps aux | grep "npm run dev"

# View logs
tail -f ~/pypoe-frontend.log

# Stop the process
kill $(ps aux | grep "npm run dev" | grep -v grep | awk '{print $2}')
```

### **Option 2: Using screen (Recommended for Development)**

```bash
# Install screen (if not available)
sudo apt install screen

# Create a new screen session
screen -S pypoe-frontend

# Inside the screen session, start the frontend
npm run dev

# Detach from screen (keeps running) - Press: Ctrl+A, then D

# To reconnect later
screen -r pypoe-frontend

# List all screen sessions
screen -ls
```

### **Option 3: Using tmux (Alternative to screen)**

```bash
# Install tmux
sudo apt install tmux

# Create new session and run frontend
tmux new-session -d -s pypoe-frontend "cd $(pwd) && npm run dev"

# Attach to session
tmux attach-session -t pypoe-frontend

# Detach: Ctrl+B, then D
```

### **Option 4: Systemd Service (Production Ready)**

Create a systemd service for automatic startup and management:

```bash
# Create service file
sudo tee /etc/systemd/system/pypoe-frontend.service > /dev/null <<EOF
[Unit]
Description=PyPoe Frontend Web Interface
After=network.target

[Service]
Type=simple
User=$(whoami)
WorkingDirectory=$(pwd)
Environment=NODE_ENV=production
ExecStart=$(which npm) run dev
Restart=always
RestartSec=10

# Logging
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=pypoe-frontend

[Install]
WantedBy=multi-user.target
EOF

# Enable and start the service
sudo systemctl daemon-reload
sudo systemctl enable pypoe-frontend
sudo systemctl start pypoe-frontend

# Check status
sudo systemctl status pypoe-frontend

# View logs
sudo journalctl -u pypoe-frontend -f

# Stop/start/restart
sudo systemctl stop pypoe-frontend
sudo systemctl start pypoe-frontend
sudo systemctl restart pypoe-frontend
```

### **Managing Background Processes**

```bash
# Save PID for easy management
nohup npm run dev > ~/pypoe-frontend.log 2>&1 & echo $! > ~/pypoe-frontend.pid

# Stop using saved PID
kill $(cat ~/pypoe-frontend.pid) && rm ~/pypoe-frontend.pid

# Or kill all node processes (be careful!)
pkill node
```

## How to work with this project

If you want to work locally using your own IDE, you can clone this repo and push changes.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
