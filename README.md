# PyPoe UI Preview - React Frontend

A modern React frontend for the PyPoe chat interface, providing a sleek user experience for interacting with AI bots through the PyPoe backend.

## Project info

**URL**: https://lovable.dev/projects/4c541f70-fe1a-4969-8ec7-50f5e33cfa12

## 🌐 Network Access Configuration

The React frontend is configured to bind to all network interfaces (`0.0.0.0`) and automatically detect the PyPoe backend.

### **Running on All Interfaces (Recommended)**

```bash
# 1. Configure authentication (required for backend access)
echo "VITE_PYPOE_USERNAME=YOUR_USERNAME
VITE_PYPOE_PASSWORD=YOUR_PASSWORD" > .env.local

# 2. Start the React development server
npm run dev

# The frontend will be accessible from:
# - Localhost: http://localhost:5173
# - Tailscale: http://100.64.x.x:5173
# - Local Network: http://192.168.x.x:5173 or http://172.x.x.x:5173
```

> **⚠️ Security Note**: Replace `YOUR_USERNAME` and `YOUR_PASSWORD` with your actual PyPoe backend credentials.

### **Backend Auto-Detection**

The React frontend automatically detects the PyPoe backend URL based on the current host:

- **localhost/127.0.0.1** → connects to `http://localhost:8000`
- **100.64.x.x (Tailscale)** → connects to `http://100.64.254.6:8000`
- **192.168.x.x/172.x.x.x (LAN)** → connects to `http://[same-host]:8000`

### **Environment Configuration**

Create a `.env.local` file to configure the frontend:

```env
# Backend URL (optional - uses auto-detection if not set)
# VITE_PYPOE_BACKEND_URL=http://localhost:8000

# Authentication (required)
VITE_PYPOE_USERNAME=YOUR_USERNAME
VITE_PYPOE_PASSWORD=YOUR_PASSWORD
```

### **Testing Network Access**

```bash
# Test frontend access from different interfaces
curl http://localhost:5173          # Local access
curl http://100.64.x.x:5173         # Tailscale access
curl http://192.168.x.x:5173        # LAN access
```

## 🚀 Running with PyPoe Backend

To run the complete PyPoe chat system, you need both the React frontend and PyPoe backend:

```bash
# Terminal 1: Start PyPoe Backend
cd ../PyPoe
conda activate pypoe-dev
pypoe web --host 0.0.0.0 --port 8000 --web-username YOUR_USERNAME --web-password YOUR_PASSWORD

# Terminal 2: Start React Frontend
cd pypoe-ui-preview
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

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/4c541f70-fe1a-4969-8ec7-50f5e33cfa12) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

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

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/4c541f70-fe1a-4969-8ec7-50f5e33cfa12) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
