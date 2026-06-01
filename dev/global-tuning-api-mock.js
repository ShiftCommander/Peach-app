#!/usr/bin/env node

const path = require('path');
const { createTuningApiServer } = require('../server/tuning-api');

const port = Number(process.env.PORT || 4274);
const dbPath = process.env.PEACH_TUNING_DB_PATH
  || path.resolve(__dirname, '..', '.tmp', 'global-tunings-dev.json');

const { server, store } = createTuningApiServer({
  dbPath,
  root: path.resolve(__dirname, '..'),
  aiMode: process.env.PEACH_AI_MODE || 'mock'
});

server.listen(port, () => {
  console.log(`Peach global tuning API running at http://localhost:${port}`);
  console.log(`Shared tuning database: ${store.path}`);
});
