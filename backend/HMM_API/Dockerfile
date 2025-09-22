# Base image with Python 3.11
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Copy only the backend files needed for HMM API
COPY . /app

# Upgrade pip and install dependencies
RUN python3 -m pip install --upgrade pip

# Install required packages for HMM service
RUN python3 -m pip install -r requirements.txt
RUN python3 -m pip install "uvicorn[standard]" gunicorn

# Expose port 8081 (different from sentiment API)
EXPOSE 8081

# Start FastAPI with Gunicorn + UvicornWorker
CMD ["gunicorn", "-w", "4", "-k", "uvicorn.workers.UvicornWorker", "main:app", "--bind", "0.0.0.0:8081"]