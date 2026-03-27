// PM2 Ecosystem Config — SetGo Production
// Usage:
//   pm2 start ecosystem.config.js          → start all
//   pm2 stop ecosystem.config.js           → stop all
//   pm2 restart ecosystem.config.js        → restart all
//   pm2 reload ecosystem.config.js         → zero-downtime reload
//   pm2 delete ecosystem.config.js         → remove from PM2
//   pm2 logs                               → live logs all services
//   pm2 save && pm2 startup                → auto-start on server reboot

module.exports = {
  apps: [
    // ─────────────────────────────────────────────
    //  Backend  (port 8080)
    // ─────────────────────────────────────────────
    {
      name: 'setgo-backend',
      script: 'index.js',
      cwd: './backend',

      instances: 1,           // increase to 'max' for cluster mode on multi-core
      exec_mode: 'fork',      // use 'cluster' if you set instances > 1

      // Restart policy
      watch: false,           // never watch files in production
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 3000,

      // Memory guard — restart if exceeds 512 MB
      max_memory_restart: '512M',

      // Environment
      env_production: {
        NODE_ENV: 'production',
        PORT: 8080,
      },

      // Logging
      out_file: './logs/pm2/backend-out.log',
      error_file: './logs/pm2/backend-error.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',

      // Graceful shutdown — wait for open connections to close
      kill_timeout: 5000,
      listen_timeout: 8000,
    },

    // ─────────────────────────────────────────────
    //  Payment Microservice  (port 5001)
    // ─────────────────────────────────────────────
    {
      name: 'setgo-payment',
      script: 'src/app.js',
      cwd: './payment-microservice',

      instances: 1,
      exec_mode: 'fork',

      watch: false,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 3000,

      max_memory_restart: '256M',

      env_production: {
        NODE_ENV: 'production',
        PORT: 5001,
      },

      out_file: './logs/pm2/payment-out.log',
      error_file: './logs/pm2/payment-error.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',

      kill_timeout: 5000,
      listen_timeout: 8000,
    },
  ],
};
