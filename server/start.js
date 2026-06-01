#!/usr/bin/env node

const path = require('path');
const { createTuningApiServer } = require('./tuning-api');

const port = Number(process.env.PORT || 8080);
const root = path.resolve(__dirname, '..');
const dbPath = process.env.PEACH_TUNING_DB_PATH
  || path.resolve(root, '.tmp', 'global-tunings-production.json');

const { server, store } = createTuningApiServer({
  root,
  dbPath,
  aiMode: process.env.PEACH_AI_MODE,
  publicApiUrl: process.env.PEACH_PUBLIC_GLOBAL_TUNING_API_URL || '/api/tunings/search'
});

server.listen(port, () => {
  console.log(`Peach global tuning API listening on port ${port}`);
  console.log(`Shared tuning database: ${store.path}`);
});
