# 📸 Screenshots & Features

## 🖥️ Dashboard Principal
O dashboard oferece uma visão geral de todos os pets e eventos agendados, com cards interativos e navegação intuitiva.

**Funcionalidades:**
- Resumo de pets cadastrados
- Próximos eventos agendados
- Acesso rápido às principais funcionalidades
- Design responsivo para mobile e desktop

## 🐕 Gerenciamento de Pets
Interface completa para cadastro e gerenciamento de pets com todas as informações necessárias.

**Funcionalidades:**
- Cadastro completo de pets (nome, espécie, raça, idade)
- Upload de fotos
- Histórico médico
- Edição e remoção
- Filtros e busca

## 📅 Sistema de Eventos
Agendamento inteligente de consultas, vacinas e outros cuidados.

**Funcionalidades:**
- Calendário interativo
- Tipos de evento personalizáveis
- Notificações e lembretes
- Integração com mapas para localização
- Histórico de eventos

## 🗺️ Integração com Mapas
Localização de veterinárias e petshops próximos usando Google Maps.

**Funcionalidades:**
- Busca por localização
- Filtros por tipo de estabelecimento
- Informações de contato e avaliações
- Rotas e navegação
- Salvamento de locais favoritos

## 🔐 Autenticação
Sistema seguro de login e cadastro com validação completa.

**Funcionalidades:**
- Login com email/senha
- Cadastro de novos usuários
- Recuperação de senha
- Validação de formulários
- Design moderno e responsivo

## 🎨 Design System

### Paleta de Cores
- **Primária**: Azul índigo (#6366f1)
- **Secundária**: Roxo (#8b5cf6)  
- **Sucesso**: Verde esmeralda (#10b981)
- **Aviso**: Âmbar (#f59e0b)
- **Erro**: Vermelho (#ef4444)

### Componentes
- Cards com glassmorphism
- Botões com animações hover
- Formulários com Material Design
- Navegação lateral responsiva
- Modais e dialogs modernos

### Responsividade
- Mobile-first design
- Breakpoints otimizados
- Componentes flexíveis
- Touch-friendly interface

## 🚀 Performance

### Otimizações Implementadas
- Lazy loading de rotas
- Tree-shaking automático
- Compressão de assets
- Caching inteligente
- Bundle splitting

### Métricas
- First Contentful Paint: < 1.5s
- Largest Contentful Paint: < 2.5s
- Time to Interactive: < 3.5s
- Cumulative Layout Shift: < 0.1

## 🔧 Configurações Avançadas

### Proxy de Desenvolvimento
O projeto inclui configuração de proxy para desenvolvimento local:

```json
{
  "/api/*": {
    "target": "http://localhost:8080",
    "secure": true,
    "changeOrigin": true
  }
}
```

### Build Otimizado
Configurações específicas para produção:
- Minificação de CSS e JS
- Otimização de imagens
- Service Worker para cache
- Análise de bundle size

### PWA Ready
O projeto está preparado para ser uma Progressive Web App:
- Service Worker configurado
- Manifest.json incluído
- Ícones para diferentes tamanhos
- Funcionalidade offline básica
