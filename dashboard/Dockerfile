FROM node:20-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy package files first
COPY package*.json ./

# Install Node dependencies with verbose logging
RUN npm install --verbose

# Copy application code
COPY . .

# Expose ports
EXPOSE 5173 3000

# Development mode by default
CMD ["sh", "-c", "npm install && npm run dev -- --host 0.0.0.0"]