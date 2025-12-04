# Use official Node.js LTS image
FROM node:18-slim

# Install system dependencies for chromaprint (fpcalc) and ffmpeg
RUN apt-get update && \
    apt-get install -y \
    libchromaprint-tools \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Verify fpcalc installation
RUN which fpcalc && fpcalc -version

# Set Node.js memory limit for Render's 512MB free tier
ENV NODE_OPTIONS="--max-old-space-size=384"

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy application files
COPY . .

# Build TypeScript
RUN npm run build

# Expose port (Render will override this)
EXPOSE 3001

# Start the application
CMD ["npm", "start"]
