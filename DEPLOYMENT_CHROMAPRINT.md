# Server Deployment - Chromaprint Installation

## Issue
The backend requires `fpcalc` (chromaprint) for acoustic fingerprinting of songs. Without it, the system falls back to file hashing, which is less accurate for duplicate detection.

## Installation Instructions

### Ubuntu/Debian Servers
```bash
sudo apt-get update
sudo apt-get install -y chromaprint-tools
```

### CentOS/RHEL/Fedora
```bash
sudo yum install -y chromaprint-tools
# or
sudo dnf install -y chromaprint-tools
```

### macOS (if deploying locally)
```bash
brew install chromaprint
```

### Docker Deployment
If using Docker, add this to your backend Dockerfile:

```dockerfile
FROM node:18-alpine

# Install chromaprint for acoustic fingerprinting
RUN apk add --no-cache chromaprint

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

EXPOSE 5000

CMD ["npm", "start"]
```

For Ubuntu-based Docker images:
```dockerfile
FROM node:18

# Install chromaprint
RUN apt-get update && \
    apt-get install -y chromaprint-tools && \
    rm -rf /var/lib/apt/lists/*

# ... rest of your Dockerfile
```

## Verification

After installation, verify fpcalc is working:
```bash
fpcalc -version
```

You should see output like:
```
fpcalc version 1.5.x
```

## Fallback Behavior

**Important:** The application will NOT crash if fpcalc is missing. Instead:
- ✅ It automatically falls back to SHA-256 file hashing
- ⚠️ Duplicate detection will be less accurate (only exact file matches)
- 📝 A warning will be logged: "Fingerprint generation falling back to file hash"

## Recommendations

1. **For production:** Install chromaprint for better accuracy
2. **For quick testing:** The file hash fallback works fine
3. **For containerized deployments:** Add chromaprint to your Docker image
4. **For cloud platforms (Heroku, Railway, etc.):** Use buildpacks or add installation script

## Testing on Server

To verify it's working after deployment:
1. Upload a song
2. Check backend logs
3. Look for: `Fingerprint generated using acoustic method` (success)
4. If you see: `Fingerprint generation falling back to file hash` (fpcalc not found)
