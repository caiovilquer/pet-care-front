const PROXY_CONFIG = [
  {
    context: ['/api'],
    target: 'https://localhost:8443',
    secure: false,
    changeOrigin: true,
    logLevel: 'warn',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    onError: function(err, req, res) {
      console.error('❌ Proxy error:', err.message);
    }
  }
];

module.exports = PROXY_CONFIG;
