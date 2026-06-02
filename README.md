# SIGESTI — Sistema de Gerenciamento de TI

Sistema web desenvolvido para a **EETEPA (Escola Estadual de Educação Profissional e Tecnológica da Amazônia)** como projeto integrador. O SIGESTI centraliza o gerenciamento de equipamentos de informática, manutenções, chamados técnicos, estoque de peças e agendamento de laboratórios da instituição.

🔗 **Acesso:** [sigesti-eetepa.vercel.app](https://sigesti-eetepa.vercel.app)

---

## Funcionalidades

- **Dashboard** — Painel com indicadores em tempo real: total de computadores, manutenções pendentes, peças em falta e gráficos de atividade
- **Computadores** — Inventário completo de equipamentos com patrimônio, localização e status
- **Manutenções** — Registro e acompanhamento de ordens de serviço com prioridade e histórico
- **Chamados** — Abertura e acompanhamento de chamados técnicos pelos usuários
- **Peças** — Controle de estoque com alertas de nível mínimo
- **Agendamento de Salas** — Reserva de laboratórios de informática
- **Setores** — Cadastro e gerenciamento de setores da escola
- **Relatórios** — Exportação de dados em PDF e Excel
- **Configurações** — Preferências do sistema, tema claro/escuro, notificações

---

## Perfis de Acesso

| Perfil | Permissões |
|--------|-----------|
| **Admin** | Acesso total — gerencia usuários, papéis, configurações e logs |
| **Técnico** | Cria e edita computadores, peças, manutenções e chamados |
| **Usuário** | Abre chamados e visualiza informações do sistema |

---

## Tecnologias Utilizadas

**Frontend**
- React 18 + TypeScript 5
- Vite 5
- React Router 6
- TanStack Query 5
- Tailwind CSS + shadcn/ui + Radix UI
- React Hook Form + Zod
- Recharts
- jsPDF + xlsx

**Backend**
- Supabase (PostgreSQL)
- Row Level Security (RLS) em todas as tabelas
- Edge Functions (criação e exclusão de usuários)
- Autenticação com controle de papéis

**Infraestrutura**
- Vercel (deploy automático via GitHub)

---

## Estrutura do Banco de Dados

| Tabela | Descrição |
|--------|-----------|
| `profiles` | Dados dos usuários |
| `user_roles` | Papéis de cada usuário |
| `computadores` | Inventário de equipamentos |
| `pecas` | Estoque de peças |
| `manutencoes` | Ordens de serviço |
| `chamados` | Chamados técnicos |
| `role_change_logs` | Auditoria de alterações de papéis |
| `admin_preferences` | Preferências do painel admin |

---

## Como Rodar Localmente

**Pré-requisitos:** Node.js 18+, npm

```bash
# Clone o repositório
git clone https://github.com/eetepasigesti01/gerenciadorcomputadores.git
cd gerenciadorcomputadores

# Instale as dependências
npm install

# Configure as variáveis de ambiente
# Crie um arquivo .env na raiz com:
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anon

# Rode o projeto
npm run dev
```

Acesse em `http://localhost:5173`

---

## Deploy

O projeto está configurado com deploy automático na Vercel. Basta fazer `git push` para a branch `main` que a Vercel publica a nova versão automaticamente.

---

## Desenvolvido por

Projeto Integrador — EETEPA  
Curso Técnico em Informática  
2026