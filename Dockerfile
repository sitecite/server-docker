# Use an official Node.js runtime as the base image
FROM node:20-slim

# Set the working directory inside the container
WORKDIR /usr/src/app

# Install system dependencies required to compile the 'canvas' package
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    libcairo2-dev \
    libjpeg-dev \
    libpango1.0-dev \
    libgif-dev \
    librsvg2-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy package.json and package-lock.json first
COPY package*.json ./

# Install dependencies
RUN npm ci --omit=dev

# Copy the rest of your application
COPY . .

# Make sure the script has execute permissions
RUN chmod +x /usr/src/app/entrypoint.sh

# Entrypoint combined with CMD
ENTRYPOINT ["/usr/src/app/entrypoint.sh"]
CMD [ "npm", "run", "start" ]
