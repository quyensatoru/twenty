// pm2 only runs the already-built server and worker. Build and upgrade the
// database once per deploy with `bash run.sh build`, then `pm2 reload`.
// cwd must be packages/twenty-server: .env and the dist/ entity globs are
// resolved relative to it.
const path = require('path');

const SERVER_DIRECTORY = path.join(__dirname, 'packages/twenty-server');

module.exports = {
  apps: [
    {
      name: 'twenty-server',
      cwd: SERVER_DIRECTORY,
      script: 'dist/main.js',
      env: { NODE_ENV: 'production' },
      autorestart: true,
      max_restarts: 10,
      restart_delay: 5000,
      kill_timeout: 15000,
      watch: false,
    },
    {
      name: 'twenty-worker',
      cwd: SERVER_DIRECTORY,
      script: 'dist/queue-worker/queue-worker.js',
      env: { NODE_ENV: 'production' },
      autorestart: true,
      max_restarts: 10,
      restart_delay: 5000,
      kill_timeout: 30000,
      watch: false,
    },
  ],
};
