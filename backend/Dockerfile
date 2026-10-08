# Multi-Stage Hardened Dockerfile for Zero-Trust Enterprise Access Portal
# Security Practices:
# 1. Minimal base image (python:3.13-slim)
# 2. Non-root user execution (appuser:10001)
# 3. Controlled port exposure (EXPOSE 8001)
# 4. Removal of cache & unnecessary package managers
# 5. Strict health check probe

FROM python:3.13-slim AS base

# Set secure environment flags
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PORT=8001

WORKDIR /app

# Install security updates and build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Create dedicated non-root security service account
RUN groupadd -g 10001 appgroup && \
    useradd -u 10001 -g appgroup -s /sbin/nologin -M appuser

# Copy application source code with restricted permissions
COPY --chown=appuser:appgroup app /app/app

# Drop root privileges
USER 10001:10001

# Expose only the designated gateway ingress port
EXPOSE 8001

# Container healthcheck probe
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD curl -f http://127.0.0.1:8001/ || exit 1

ENTRYPOINT ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001"]
