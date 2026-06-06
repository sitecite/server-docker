# Use an official Node.js runtime as the base image
FROM node:20-alpine

# Set the working directory inside the container
WORKDIR /usr/src/app

# Install system dependencies required to compile the 'canvas' package
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev \
    pixman-dev

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