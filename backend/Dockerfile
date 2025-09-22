# Base image with Python 3.11
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Copy backend files into container
COPY . /app

# Upgrade pip and install dependencies
RUN python3 -m pip install --upgrade pip
RUN python3 -m pip install -r requirements.txt
RUN python3 -m pip install "uvicorn[standard]" gunicorn

# Expose port 8080
EXPOSE 8080

# Start FastAPI with Gunicorn + UvicornWorker
CMD ["gunicorn", "-w", "4", "-k", "uvicorn.workers.UvicornWorker", "sentiment:app", "--bind", "0.0.0.0:8080"]
