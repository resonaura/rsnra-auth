module.exports = {
  apps: [
    {
      name: 'rsnra-auth-api',
      script: 'npm',
      args: 'start',
      cwd: './apps/api',
      instances: 1,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 2000,
      shell: true,
    },
    {
      name: 'rsnra-auth',
      script: 'npm',
      args: 'start',
      cwd: './apps/web',
      instances: 1,
      autorestart: true,
      restart_delay: 2000,
      shell: true,
    },
  ],
};
