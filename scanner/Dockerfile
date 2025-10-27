FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    nmap \
    tcpdump \
    net-tools \
    iputils-ping \
    iputils-tracepath \
    traceroute \
    mtr-tiny \
    iproute2 \
    curl \
    wget \
    netcat-traditional \
    iperf3 \
    freeradius-utils \
    dnsutils \
    telnet \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python packages
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy scanner scripts
COPY . .

# Create log directory
RUN mkdir -p /var/log/scanner

# Keep container running
CMD ["python", "scanner.py"]