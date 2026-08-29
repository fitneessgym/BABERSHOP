module.exports = {
  apps: [
    {
      name: 'salon',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3000',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      env: { NODE_ENV: 'production', PORT: 3000 },
      max_memory_restart: '700M',
      error_file: 'logs/error.log',
      out_file: 'logs/out.log',
      watch: false,
    },
  ],
};
