FROM node:18

# Install chromaprint for acoustic fingerprinting
RUN apt-get update && \
    apt-get install -y chromaprint-tools && \
    rm -rf /var/lib/apt/lists/*

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
