# Одно приложение: FastAPI раздаёт и API, и собранный интерфейс.
# Порт берётся из $PORT (Hugging Face Spaces — 7860, Render и др. задают свой).

FROM node:24-slim AS frontend
WORKDIR /src/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM python:3.13-slim
RUN apt-get update \
    && apt-get install -y --no-install-recommends libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Hugging Face запускает контейнер от пользователя с uid 1000 — данные должны быть ему доступны.
RUN useradd -m -u 1000 user
WORKDIR /app

COPY backend/pyproject.toml backend/
COPY backend/app backend/app
RUN pip install --no-cache-dir ./backend

COPY --from=frontend /src/frontend/dist frontend/dist
# Начальные данные (база и траектории без самих видео) — если положены в deploy/seed/.
COPY deploy/seed/ /app/data/
RUN rm -f /app/data/.gitkeep && chown -R user:user /app/data

USER user
# Онлайн-версия рассчитана на бесплатный сервер с 512 МБ: только просмотр готовых результатов,
# один поток декодера и не больше двух кадров одновременно.
ENV PENDULUM_DATA_DIR=/app/data \
    PENDULUM_FRONTEND_DIST=/app/frontend/dist \
    PENDULUM_TRACKING_WORKERS=1 \
    PENDULUM_DECODE_THREADS=1 \
    PENDULUM_FRAME_SLOTS=2 \
    PENDULUM_VIDEO_PROCESSING=0 \
    PORT=7860
EXPOSE 7860

WORKDIR /app/backend
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT} --proxy-headers --forwarded-allow-ips='*'"]
