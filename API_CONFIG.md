# Pet Care Scheduler - Frontend

## Configuração da API

### Alterar URL da API

Para alterar a URL da API backend, você pode modificar em:

1. **Arquivo de ambiente** (Recomendado):
   - `src/environments/environment.ts` (desenvolvimento)
   - `src/environments/environment.prod.ts` (produção)

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api/v1' // Altere aqui
};
```

2. **Arquivo de configuração**:
   - `src/app/core/config/api.config.ts`

```typescript
export const API_CONFIG = {
  baseUrl: 'http://localhost:8080', // Altere aqui
  version: 'v1',
  endpoints: {
    // endpoints...
  }
};
```

3. **Proxy de desenvolvimento** (opcional):
   - `proxy.conf.json` na raiz do projeto

Para usar o proxy, execute:
```bash
ng serve --proxy-config proxy.conf.json
```

### Problemas Comuns

1. **CORS**: Se você receber erros de CORS, certifique-se de que o backend está configurado para aceitar requisições do frontend.

2. **HTTPS**: Se o backend usar HTTPS com certificado auto-assinado, você pode precisar aceitar o certificado no navegador primeiro.

3. **Porta diferente**: Se o backend estiver rodando em uma porta diferente, atualize a configuração nos arquivos mencionados acima.

### Estrutura da API

A aplicação foi desenvolvida baseada na seguinte estrutura de API:

- **Base URL**: `https://localhost:8443/api/v1`
- **Autenticação**: JWT Bearer Token
- **Endpoints principais**:
  - `/auth/login` - Login
  - `/public/signup` - Cadastro
  - `/tutors/me` - Perfil do usuário
  - `/pets` - CRUD de pets
  - `/events` - CRUD de eventos

### Desenvolvimento

Para desenvolvimento local, certifique-se de que o backend está rodando antes de iniciar o frontend:

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm start

# Build para produção
npm run build
```

### Logs e Debug

Para debug da API, verifique:
1. Console do navegador (Network tab)
2. Console do terminal onde o Angular está rodando
3. Logs do backend

Os interceptors configurados irão automaticamente:
- Adicionar o token JWT nas requisições
- Tratar erros da API
- Exibir mensagens de erro amigáveis
