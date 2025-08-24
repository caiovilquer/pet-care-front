#!/bin/bash

# Script para build de produção com variáveis de ambiente
echo "🔧 Configurando variáveis de ambiente..."
node scripts/set-env.js

echo "🏗️ Executando build de produção..."
npx ng build --configuration=production

echo "✅ Build concluído!"
