#!/usr/bin/env node

/**
 * Vercel Build Script for Angular
 * Este script garante que o Vercel detecte corretamente o projeto como Angular
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Iniciando build do Angular para Vercel...');

// Verificar se é um projeto Angular
const angularJsonPath = path.resolve(process.cwd(), 'angular.json');
if (!fs.existsSync(angularJsonPath)) {
  console.error('❌ Erro: angular.json não encontrado. Este não é um projeto Angular.');
  process.exit(1);
}

console.log('✅ Projeto Angular detectado');

try {
  // Configurar variáveis de ambiente
  console.log('🔧 Configurando variáveis de ambiente...');
  execSync('node scripts/set-env.js', { stdio: 'inherit' });
  
  // Build do Angular
  console.log('🏗️ Executando build do Angular...');
  execSync('npx ng build --configuration=production', { stdio: 'inherit' });
  
  // Verificar se o build foi bem-sucedido
  const outputDir = path.resolve(process.cwd(), 'dist/pet-care-scheduler-front/browser');
  if (!fs.existsSync(outputDir)) {
    console.error('❌ Erro: Diretório de output não encontrado após o build');
    process.exit(1);
  }
  
  console.log('✅ Build do Angular concluído com sucesso!');
  console.log(`📁 Output: ${outputDir}`);
  
} catch (error) {
  console.error('❌ Erro durante o build:', error.message);
  process.exit(1);
}