/**
 * Configuração PM2 para produção
 * Instalar: npm install -g pm2
 * Executar: pm2 start ecosystem.config.js
 */

module.exports = {
  apps: [
    {
      name: 'valoris-backend',
      script: './server.js',
      instances: 2, // Número de instâncias (ou 'max' para usar todos os CPUs)
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'development',
        PORT: 5000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '1G',
      watch: false,
      ignore_watch: ['node_modules', 'logs'],
      // Configurações avançadas
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000
    }
  ]
};

