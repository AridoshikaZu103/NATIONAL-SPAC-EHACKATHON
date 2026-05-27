FROM ubuntu:22.04

# Prevent interactive prompts during apt install
ENV DEBIAN_FRONTEND=noninteractive

# Install dependencies: Python 3.10 and Node.js
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    curl \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy the entire repository
COPY . /app/

# 1. Build the Frontend
WORKDIR /app/frontend
RUN npm install
RUN npm run build

# 2. Setup the Backend
WORKDIR /app/backend
RUN pip3 install --no-cache-dir -r requirements.txt
RUN pip3 install aiofiles  # required for StaticFiles if not in requirements.txt

# Environment variables for grading
ENV PORT=8000
ENV BACKEND_PORT=8000

# Expose port 8000
EXPOSE 8000

# Run the FastAPI server bound to 0.0.0.0
CMD ["python3", "main.py"]
