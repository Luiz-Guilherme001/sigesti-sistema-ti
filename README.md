# SIGESTI — Sistema Integrado de Gestão de TI

Sistema web desenvolvido como **Projeto Integrador** para a EETEPA Vilhena Alves (Escola Estadual de Educação Profissional e Tecnológica da Amazônia). O SIGESTI centraliza o gerenciamento de equipamentos de informática, manutenções, chamados técnicos, estoque de peças e agendamento de laboratórios da instituição.

> 🔗 **Demo:** [sigesti-sistema-ti.vercel.app](https://sigesti-sistema-ti.vercel.app)  
> 🏫 **Sistema oficial da escola:** [sigesti-eetepa.vercel.app](https://sigesti-eetepa.vercel.app)

---

## Acesso para Demonstração

O sistema possui três perfis de acesso com permissões diferentes. Use as credenciais abaixo para explorar cada nível:

| Perfil | E-mail | Senha |
|---|---|---|
| **Técnico** | tecnico@demo.com | Demo@123456 |
| **Usuário** | usuario@demo.com | Demo@123456 |

> O perfil **Administrador** é demonstrado no vídeo abaixo.

---

## Sobre o projeto

Este repositório é o fork pessoal do sistema, mantido para fins de portfólio. O desenvolvimento foi conduzido de forma **independente e integral** — do levantamento de requisitos ao deploy em produção — por Luiz Guilherme P. Pinto, estudante do Curso Técnico em Informática da EETEPA e de Ciência da Computação na UNINTER.

### Metodologia de desenvolvimento com IA

O projeto utilizou 4 ferramentas de inteligência artificial com funções específicas, com **revisão e validação manual de todo o código gerado**:

| Ferramenta | Função |
|---|---|
| **Lovable** | Prototipagem rápida de interfaces e estrutura inicial do banco |
| **Claude** | Arquitetura, lógica complexa e resolução de problemas estruturais |
| **ChatGPT** | Sintaxe, correções de bugs do dia a dia e consultas rápidas |
| **DeepSeek** | Otimização de consultas SQL e comparação de abordagens |

---

## Funcionalidades

- **Dashboard** — Indicadores em tempo real: computadores, manutenções pendentes, peças em falta e gráficos de atividade
- **Computadores** — Inventário completo com patrimônio, localização, status e histórico de manutenções
- **Manutenções** — Ordens de serviço com prioridade, técnico responsável e controle de status
- **Chamados** — Abertura e acompanhamento de chamados técnicos pelos usuários
- **Peças** — Controle de estoque com alertas automáticos de nível mínimo
- **Agendamento** — Reserva de laboratórios, auditório e sala de multimídia com detecção de conflito de horário
- **Setores** — Cadastro de espaços da escola com ícone e foto ilustrativa
- **Relatórios** — Exportação em PDF e Excel
- **Configurações** — Painel admin com gerenciamento de usuários, papéis, setores, estatísticas e logs de auditoria

---

## Perfis de Acesso

| Perfil | Permissões |
|---|---|
| **Admin** | Acesso total — gerencia usuários, papéis, configurações e logs de auditoria |
| **Técnico** | Cria e edita computadores, peças, manutenções e chamados |
| **Usuário** | Abre chamados e visualiza informações do sistema |

---

## Stack Tecnológica

**Frontend**
- React 18 + TypeScript 5
- Vite 5
- React Router 6
- TanStack Query 5
- Tailwind CSS + shadcn/ui + Radix UI
- React Hook Form + Zod
- Recharts
- jsPDF + xlsx (exportação de relatórios)

**Backend**
- Supabase (PostgreSQL)
- Row Level Security (RLS) em todas as tabelas
- Edge Functions — criação e exclusão segura de usuários
- Triggers automáticos — `handle_new_user`, `prevent_last_admin_removal`, `log_role_change`
- Autenticação com controle de papéis hierárquicos

**Infraestrutura**
- Vercel — deploy automático a cada `git push`
- GitHub — versionamento e pipeline CI/CD

---

## Estrutura do Banco de Dados

| Tabela | Descrição |
|---|---|
| `profiles` | Dados dos usuários (nome, email, setor) |
| `user_roles` | Papéis de cada usuário (admin, tecnico, usuario) |
| `computadores` | Inventário de equipamentos |
| `pecas` | Estoque de peças com controle de mínimo |
| `manutencoes` | Ordens de serviço |
| `chamados` | Chamados técnicos abertos pelos usuários |
| `setores` | Espaços físicos da escola |
| `laboratorios` | Espaços disponíveis para agendamento |
| `reserva_salas` | Reservas de laboratórios e espaços |
| `role_change_logs` | Auditoria de alterações de papéis |
| `admin_preferences` | Preferências do painel admin |

---

## Como Rodar Localmente

**Pré-requisitos:** Node.js 18+, npm

```bash
# Clone o repositório
git clone https://github.com/Luiz-Guilherme001/sigesti-sistema-ti.git
cd sigesti-sistema-ti

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

O projeto usa deploy contínuo via Vercel. A cada `git push` para a branch `main`, a Vercel publica automaticamente a nova versão em produção.

---

## Desenvolvido por

**Luiz Guilherme P. Pinto**  
Estudante de Ciência da Computação — UNINTER  
Curso Técnico em Informática — EETEPA Vilhena Alves  
2025–2026

[![LinkedIn](https://img.shields.io/badge/LinkedIn-Luiz%20Guilherme-0077B5?style=flat&logo=linkedin)](https://www.linkedin.com/in/luiz-guilherme-penedo-pinto)
[![GitHub](https://img.shields.io/badge/GitHub-Luiz--Guilherme001-181717?style=flat&logo=github)](https://github.com/Luiz-Guilherme001)
