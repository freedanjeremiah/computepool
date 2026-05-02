FROM python:3.12-slim
WORKDIR /app
RUN apt-get update \
    && apt-get install -y --no-install-recommends gcc python3-dev \
    && rm -rf /var/lib/apt/lists/*
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY facilitator ./facilitator
EXPOSE 4021
ENV PYTHONUNBUFFERED=1
CMD ["uvicorn", "facilitator.app:app", "--host", "0.0.0.0", "--port", "4021"]
