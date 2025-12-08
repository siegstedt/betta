# Use an official Node.js runtime as a parent image
FROM node:22-alpine

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock)
# A package.json file will need to be created in the frontend directory
COPY package*.json ./

# Install dependencies
RUN npm install

# Command to start the Next.js development server
CMD ["npm", "run", "dev"]
