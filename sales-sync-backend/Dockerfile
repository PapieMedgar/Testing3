FROM python:3.9.18

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV FLASK_ENV=production
ENV PIP_DEFAULT_TIMEOUT=100
ENV DOCKER_CLIENT_TIMEOUT=120
ENV COMPOSE_HTTP_TIMEOUT=120

# Install system dependencies
RUN apt-get update && \
    apt-get install -y \
    default-libmysqlclient-dev \
    default-mysql-client \
    pkg-config \
    netcat-traditional \
    && rm -rf /var/lib/apt/lists/*

# Set work directory
WORKDIR /app

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --default-timeout=100 --retries 3 -r requirements.txt

# Copy project files
COPY . .

# Create uploads directory
RUN mkdir -p /app/uploads

# Expose the port the app runs on
EXPOSE 5000

# Default command - use Gunicorn for production
CMD ["gunicorn", "--config", "gunicorn.conf.py", "app:app"]