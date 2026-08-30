# Production image: builds the React SPA, then serves API + SPA from FastAPI on one port.
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM python:3.12-slim
WORKDIR /app
COPY api-requirements.txt .
RUN pip install --no-cache-dir -r api-requirements.txt

COPY app/ app/
COPY config.py filters.py companies.json ./
COPY scrapers/ scrapers/
COPY --from=frontend-build /app/frontend/dist frontend/dist

# Runtime must be able to write data/app.db and data/uploads
RUN mkdir -p /app/data && chmod -R 777 /app/data
ENV DATABASE_URL=sqlite:////app/data/app.db

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
