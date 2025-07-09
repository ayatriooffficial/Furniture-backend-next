module.exports = {
  apps: [
    {
      script: 'server.js',          // Updated to use server.js
      watch: '.',                   // Watch the current directory for changes
      log_file: '/dev/null',        // No logs written to disk
      out_file: '/dev/null',
      error_file: '/dev/null',
      merge_logs: false,
      log_date_format: ''
    }
  ],

  deploy: {
    production: {
      user: 'SSH_USERNAME',
      host: 'SSH_HOSTMACHINE',
      ref: 'origin/master',
      repo: 'GIT_REPOSITORY',
      path: 'DESTINATION_PATH',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};
