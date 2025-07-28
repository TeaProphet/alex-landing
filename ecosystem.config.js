module.exports = {
  apps: [
    {
      name: 'alex-backend',
      script: './backend/dist/index.js',
      cwd: '/var/www/fitness-trainer',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 1337,
        HOST: '0.0.0.0'
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 1337,
        HOST: '0.0.0.0'
      },
      // Logging
      log_file: '/var/log/fitness-trainer/combined.log',
      out_file: '/var/log/fitness-trainer/out.log',
      error_file: '/var/log/fitness-trainer/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Process management
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      restart_delay: 4000,
      
      // Health monitoring
      min_uptime: '10s',
      max_restarts: 10,
      
      // Advanced options
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 8000,
      
      // Environment variables
      env_file: './backend/.env'
    }
  ],
  
  // Deployment configuration
  deploy: {
    production: {
      user: 'deploy',
      host: 'your-server-ip',
      ref: 'origin/main',
      repo: 'https://github.com/TeaProphet/alex-landing.git',
      path: '/var/www/fitness-trainer',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production && pm2 save'
    }
  }
};