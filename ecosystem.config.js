/**
 * PM2 Ecosystem Configuration
 * 
 * Usage:
 *   npm install -g pm2
 *   pm2 start ecosystem.config.js          # start production
 *   pm2 start ecosystem.config.js --env dev # start dev mode
 *   pm2 monit                               # live monitoring
 *   pm2 save && pm2 startup                 # auto-start on reboot
 */

module.exports = {
  apps: [
    {
      name: 'friendzone-api',
      script: './server.js',

      // CLUSTER MODE: spawns one worker per CPU core
      // On a 4-core machine → 4 processes → ~4x throughput
      instances: 'max',       // or set a number like 4
      exec_mode: 'cluster',

      // Auto-restart if it crashes
      autorestart: true,
      watch: false,           // set true in dev, false in prod

      // Restart if memory exceeds 500MB
      max_memory_restart: '500M',

      // Environment variables
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },

      // Logging
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: './logs/error.log',
      out_file: './logs/output.log',
      merge_logs: true,

      // Graceful shutdown: wait for requests to finish before killing
      kill_timeout: 5000,
      listen_timeout: 3000,
    }
  ]
};
