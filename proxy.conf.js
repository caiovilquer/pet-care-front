const fs = require('fs');
const path = require('path');

function loadLocalEnv() {
  const envPath = path.resolve(__dirname, '.env');
  if (!fs.existsSync(envPath)) return {};

  const envVars = {};
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (!key || valueParts.length === 0) return;
    const value = valueParts.join('=').trim();
    if (!key.startsWith('#') && value) {
      envVars[key.trim()] = value;
    }
  });
  return envVars;
}

const localEnv = loadLocalEnv();
const backendUrl = process.env.API_BACKEND_URL || localEnv.API_BACKEND_URL;
const target = backendUrl
  ? backendUrl.replace(/\/api\/v1\/?$/, '')
  : 'https://localhost:8443';

const PROXY_CONFIG = [
  {
    context: ['/api'],
    target,
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
