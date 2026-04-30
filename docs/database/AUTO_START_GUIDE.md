# Auto-Start Database Setup Guide

## What Changed

Your database containers now have **auto-restart enabled**. This means:
- ✅ If a container crashes, it automatically restarts
- ✅ Containers persist across Docker daemon restarts
- ✅ Quick startup with simple scripts

## How to Auto-Start

### **Option 1: Manual Startup (Fastest for now)**

Double-click one of these scripts in your project root:

- **Windows (CMD)**: `start-database.bat`
- **Windows (PowerShell)**: `start-database.ps1`
- **macOS/Linux**: `start-database.sh`

### **Option 2: Auto-Start on System Boot (Windows)**

#### Method A: Task Scheduler (Recommended)

1. Open **Task Scheduler** (press `Win + R`, type `taskschd.msc`)
2. Right-click **Task Scheduler Library** → **Create Basic Task**
3. Fill in details:
   - **Name**: Campus Connect Database
   - **Trigger**: At system startup
4. Click **Actions** tab → **New**
5. Set action:
   - **Program/script**: `powershell.exe`
   - **Add arguments**: 
     ```
     -ExecutionPolicy Bypass -File "D:\Campus_connect\Campus_Connect\start-database.ps1"
     ```
   - **Start in**: `D:\Campus_connect\Campus_Connect`
6. Click **OK** and finish

#### Method B: Startup Folder (Simpler)

1. Create a shortcut to `start-database.bat`
2. Press `Win + R` and type: `shell:startup`
3. Paste the shortcut in the startup folder
4. Restart your computer - services auto-start!

### **Option 3: Auto-Start with Docker Desktop**

1. Open **Docker Desktop Settings**
2. Go to **General**
3. Enable **Start Docker Desktop when you log in**
4. Your containers will start automatically after Docker starts

### **Option 4: Run on First Use (No Setup)**

The containers have `restart: always` enabled, so:
1. Run: `docker-compose up -d` once
2. Containers stay running even after closing terminal
3. They auto-restart if Docker restarts

## Verify It's Working

Check running containers:
```bash
docker-compose ps

# Or from anywhere:
docker ps
```

Should show:
```
NAME                    STATUS
campus_connect_db      Up X minutes
campus_connect_backend Up X minutes
```

## Quick Commands

```bash
# Start everything
docker-compose up -d

# View logs
docker-compose logs -f backend
docker-compose logs -f postgres

# Check status
docker-compose ps

# Stop everything (without deleting data)
docker-compose stop

# Restart everything
docker-compose restart

# Stop and remove containers (keeps database data)
docker-compose down

# Stop and DELETE everything (use carefully!)
docker-compose down -v
```

## Testing

Once running, test the API:

```bash
# Should return {"ok": true, ...}
curl http://localhost:4000/api/health
```

## Troubleshooting

**Containers not starting?**
```bash
docker-compose logs
```

**Need to see what's wrong?**
```bash
docker-compose up  # Run in foreground to see errors
```

**Docker not running?**
- Start Docker Desktop manually
- Or enable auto-start in Docker Desktop settings

**Port already in use?**
```bash
# Check what's using port 4000
netstat -ano | findstr :4000

# Kill it (careful!)
taskkill /PID <PID> /F

# Or change port in .env file
PORT=4001
```

## For Your Team

Share these setup options with your team:

1. **Easiest**: Double-click `start-database.bat`
2. **Most permanent**: Set up Task Scheduler (one-time setup per computer)
3. **Most automatic**: Enable Docker auto-start in Docker Desktop

Everyone with the `.env` file and Docker installed can now run the same database!