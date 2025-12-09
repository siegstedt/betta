# Use an official Python runtime as a parent image
FROM python:3.10-slim

# Set the working directory in the container
WORKDIR /app

# Copy the requirements file into the container at /app
# A requirements.txt file will need to be created in the backend directory
COPY ./requirements.txt /app/requirements.txt

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir --upgrade -r /app/requirements.txt

# Install wait-for-it for database readiness check
RUN apt-get update && apt-get install -y wait-for-it && rm -rf /var/lib/apt/lists/*

# Command to run the application using uvicorn for development (with auto-reload)
CMD wait-for-it db:5432 -- uvicorn main:app --host 0.0.0.0 --port 8000 --reload
