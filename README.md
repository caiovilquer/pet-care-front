# 🐾 Pet Care Scheduler - Frontend

> Sistema moderno de agendamento e gerenciamento de cuidados para pets, desenvolvido com Angular 20 e Material Design.

![Angular](https://img.shields.io/badge/Angular-20.1.4-red)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Material Design](https://img.shields.io/badge/Material%20Design-UI-green)
![License](https://img.shields.io/badge/license-MIT-blue)

## 🚀 Funcionalidades

- ✅ **Autenticação completa** - Login/Signup com validação
- ✅ **Dashboard moderno** - Interface limpa e responsiva
- ✅ **Gerenciamento de Pets** - CRUD completo de pets
- ✅ **Sistema de Eventos** - Agendamento de consultas e cuidados
- ✅ **Integração Google Maps** - Localização de veterinárias e petshops
- ✅ **Perfil de usuário** - Gerenciamento de dados pessoais
- ✅ **Design responsivo** - Funciona em desktop e mobile
- ✅ **Tema moderno** - Paleta azul/roxo minimalista

## 🛠️ Tecnologias

- **Framework**: Angular 20.1.4
- **UI Library**: Angular Material
- **Linguagem**: TypeScript
- **Estilização**: CSS3 + Material Design
- **Maps**: Google Maps API
- **Deploy**: Vercel
- **Gerenciamento de Estado**: RxJS

## ⚡ Quick Start

### 1. Clone o repositório
```bash
git clone https://github.com/caiovilquer/pet-care-front.git
cd pet-care-scheduler-front
```

### 2. Instale as dependências
```bash
npm install
```

### 3. Configure as variáveis de ambiente
```bash
# Copie o arquivo de exemplo
cp .env.example .env

# Edite o .env com suas chaves
API_URL=/api/v1
GOOGLE_MAPS_API_KEY=sua-chave-do-google-maps
```

### 4. Inicie o servidor de desenvolvimento
```bash
npm start
```

A aplicação estará rodando em `http://localhost:4200/`

## 🔧 Scripts Disponíveis

| Script | Descrição |
|--------|-----------|
| `npm start` | Inicia servidor de desenvolvimento |
| `npm run build` | Build para desenvolvimento |
| `npm run build:prod` | Build para produção com variáveis |
| `npm run set-env` | Gera arquivo de variáveis de ambiente |
| `npm test` | Executa testes unitários |

## 🌍 Configuração de Ambiente

### Desenvolvimento Local
1. Configure o arquivo `.env` na raiz do projeto
2. Use `npm start` para carregar as variáveis automaticamente

### Produção (Vercel)
1. Configure as variáveis no painel do Vercel:
   - `API_URL`: URL da sua API backend
   - `GOOGLE_MAPS_API_KEY`: Chave da API do Google Maps
2. O deploy automático usa `npm run build:prod`

📋 **Ver instruções detalhadas**: [SETUP.md](./SETUP.md) | [DEPLOY.md](./DEPLOY.md)

## 📱 Estrutura do Projeto

```
src/
├── app/
│   ├── core/                 # Serviços, guards, interceptors
│   │   ├── services/         # Serviços da aplicação
│   │   ├── models/           # Interfaces e tipos
│   │   └── guards/           # Guards de autenticação
│   ├── features/             # Funcionalidades principais
│   │   ├── auth/             # Login/Signup
│   │   ├── dashboard/        # Dashboard principal
│   │   ├── pets/             # Gerenciamento de pets
│   │   ├── events/           # Sistema de eventos
│   │   └── profile/          # Perfil do usuário
│   ├── shared/               # Componentes compartilhados
│   │   └── components/       # Layout, cards, mapas
│   └── environments/         # Configurações de ambiente
├── assets/                   # Recursos estáticos
└── styles.css               # Estilos globais
```

## 🎨 Design System

### Paleta de Cores
- **Primary**: `#6366f1` (Indigo)
- **Secondary**: `#8b5cf6` (Purple)
- **Success**: `#10b981` (Emerald)
- **Warning**: `#f59e0b` (Amber)
- **Error**: `#ef4444` (Red)

### Componentes
- Material Design Components
- Custom cards e layouts
- Responsive grid system
- Smooth animations e transitions

## 🔐 Variáveis de Ambiente

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `API_URL` | URL da API backend | `https://api.petcare.com/api/v1` |
| `GOOGLE_MAPS_API_KEY` | Chave da API do Google Maps | `AIzaSy...` |

## 🚀 Deploy

### Vercel (Recomendado)
1. Conecte seu repositório GitHub ao Vercel
2. Configure as variáveis de ambiente no painel
3. Deploy automático a cada push na main

### Build Local
```bash
npm run build:prod
```
Os arquivos gerados estarão em `dist/pet-care-scheduler-front/browser/`

## 🧪 Testes

```bash
# Testes unitários
npm test

# Testes com coverage
npm run test:coverage
```

## 📦 Dependências Principais

- `@angular/core` - Framework Angular
- `@angular/material` - Material Design Components
- `@angular/google-maps` - Integração Google Maps
- `@angular/forms` - Formulários reativos
- `rxjs` - Programação reativa

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👨‍💻 Autor

**Caio Vilquer**
- GitHub: [@caiovilquer](https://github.com/caiovilquer)

---

⭐ Se este projeto te ajudou, considere dar uma estrela no repositório!
