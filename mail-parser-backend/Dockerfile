# Use Node.js LTS
FROM node:20-alpine

# Create app directory
WORKDIR /app

# Copy package files and install
COPY package*.json ./
RUN npm install --production

# Copy app source
COPY . .

# Expose backend port
EXPOSE 4000

# Run the server
CMD ["npm", "start"]
