# Dockerfile for Flask backend
FROM python:3.8-slim

# Set a directory for the app
WORKDIR /usr/src/app

# Copy the requirements.txt file into the container
COPY requirements.txt ./

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application
COPY . .

# Expose the port the app runs on
EXPOSE 5000

# Command to run the app
CMD ["python3", "./app.py"]
