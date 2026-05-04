/**
 * PM2 Ecosystem Configuration
 * 
 * Usage:
 *   npm install -g pm2
 *   pm2 start ecosystem.config.js          # start production
 *   pm2 reload ecosystem.config.js         # zero-downtime reload (after code changes)
 *   pm2 monit                              # live monitoring
 *   pm2 save && pm2 startup                # auto-start on reboot
 */

// Load .env so ecosystem config can reference process.env values
require('dotenv').config();

module.exports = {
  apps: [
    {
      name: 'friendzone-api',
      script: './server.js',

      // CLUSTER MODE: spawns one worker per CPU core
      instances: 'max',
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',

      // Pass ALL env vars from .env to PM2 workers
      // PM2 workers don't inherit shell env by default — must be explicit
      env: {
        NODE_ENV: 'development',
        PORT:            process.env.PORT            || 3000,
        MONGO_URI:       process.env.MONGO_URI,
        JWT_SECRET:      process.env.JWT_SECRET,
        REDIS_URL:       process.env.REDIS_URL,
        CLOUDINARY_URL:  process.env.CLOUDINARY_URL,
        EMAIL_USER:      process.env.EMAIL_USER,
        EMAIL_PASS:      process.env.EMAIL_PASS,
        GEMINI_API_KEY:  process.env.GEMINI_API_KEY,
        GROQ_API_KEY:    process.env.GROQ_API_KEY,
        CLIENT_URL:      process.env.CLIENT_URL,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT:            process.env.PORT            || 3000,
        MONGO_URI:       process.env.MONGO_URI,
        JWT_SECRET:      process.env.JWT_SECRET,
        REDIS_URL:       process.env.REDIS_URL,
        CLOUDINARY_URL:  process.env.CLOUDINARY_URL,
        EMAIL_USER:      process.env.EMAIL_USER,
        EMAIL_PASS:      process.env.EMAIL_PASS,
        GEMINI_API_KEY:  process.env.GEMINI_API_KEY,
        GROQ_API_KEY:    process.env.GROQ_API_KEY,
        CLIENT_URL:      process.env.CLIENT_URL,
      },

      // Logging
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: './logs/error.log',
      out_file:   './logs/output.log',
      merge_logs: true,

      // Graceful shutdown
      kill_timeout:    5000,
      listen_timeout:  3000,
    }
  ]
};
