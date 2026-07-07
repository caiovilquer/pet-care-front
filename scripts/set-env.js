const fs = require('fs');
const path = require('path');

// Função para carregar variáveis do arquivo .env se existir
function loadLocalEnv() {
  const envPath = path.resolve(__dirname, '../.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envVars = {};
    
    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim();

        if (!key.startsWith('#') && value) {
          envVars[key.trim()] = value;
        }
      }
    });
    
    return envVars;
  }
  return {};
}

// Função para criar o arquivo env.js com as variáveis de ambiente
function createEnvFile() {
  const localEnv = loadLocalEnv();

  const backendUrl = process.env['API_BACKEND_URL'] || localEnv['API_BACKEND_URL'];
  const explicitApiUrl = process.env['API_URL'] || localEnv['API_URL'];

  const envConfig = {
    // Com proxy (dev: ng serve / prod: api/v1/[...path].js no Vercel), use caminho relativo.
    API_URL: explicitApiUrl || (backendUrl ? '/api/v1' : '/api/v1'),
    GOOGLE_MAPS_API_KEY: process.env['GOOGLE_MAPS_API_KEY'] || localEnv['GOOGLE_MAPS_API_KEY'] || ''
  };

  const envConfigFile = `(function (window) {
  window["ENV"] = window["ENV"] || {};
  window["ENV"]["API_URL"] = "${envConfig.API_URL}";
  window["ENV"]["GOOGLE_MAPS_API_KEY"] = "${envConfig.GOOGLE_MAPS_API_KEY}";
})(this);
`;

  const targetPath = path.resolve(__dirname, '../public/env.js');
  
  // Criar diretório public se não existir
  const publicDir = path.dirname(targetPath);
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  fs.writeFileSync(targetPath, envConfigFile);
  console.log(`Environment file generated at: ${targetPath}`);
  console.log('Environment variables:');
  console.log(`API_URL: ${envConfig.API_URL}`);
  if (backendUrl) {
    console.log(`API_BACKEND_URL: ${backendUrl}`);
  }
  console.log(`GOOGLE_MAPS_API_KEY: ${envConfig.GOOGLE_MAPS_API_KEY ? '***' + envConfig.GOOGLE_MAPS_API_KEY.slice(-4) : 'NOT_SET'}`);
}

createEnvFile();
