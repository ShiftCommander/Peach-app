FROM node:20-alpine

WORKDIR /app

COPY . .

ENV NODE_ENV=production
ENV PORT=8080
ENV PEACH_TUNING_DB_PATH=/data/global-tunings.json

VOLUME ["/data"]

EXPOSE 8080

CMD ["node", "server/start.js"]
