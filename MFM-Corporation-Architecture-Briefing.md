# MFM Corporation
## Architecture Briefing

### System Overview
Hybrid cloud architecture combining static web frontend with serverless backend. CEO Remy commands 19 specialized AI teams through natural language chat interface.

### Infrastructure Layers

#### Frontend (GitHub Pages)
- **Hosting**: Static site on GitHub Pages (mrhanfx-code.github.io/mfm-corporation)
- **Tech Stack**: HTML5, vanilla JavaScript, CSS
- **Design System**: Professional navy blue (#0369A1) on white canvas, Inter typography
- **Real-time**: Supabase WebSocket subscriptions
- **Authentication**: 2FA secure login with session management

#### Backend (Cloudflare Workers)
- **Bot Worker**: Telegram webhook handler (mfm-corporation-telegram-bot)
- **API Worker**: Web API for dashboard (mfm-corporation-api)
- **D1 Database**: SQLite-based (ID: 91e8699c-2731-4f0d-8a09-9f9765e7e4cc)
- **KV Storage**: Rate limiting and state caching
- **R2 Storage**: File uploads (mfm-corporation-uploads bucket)
- **Queue**: Async task processing (mfm-task-queue)

#### Database Schema (Supabase PostgreSQL)
- **executives**: 5 C-Level executives
- **teams**: 19 specialized teams
- **ceo_commands**: Command tracking
- **chat_messages**: Conversation history
- **team_tasks**: Task management
- **quality_issues**: Quality control
- **ceo_authentication**: Security

### AI Orchestration Layer

#### Telegram Bot Flow
```
Telegram Message → SecurityManager → ConversationEngine → MemoryManager → Response
```

#### Key Components
- **SecurityManager**: Rate limiting (30 req/min), input validation, audit logging
- **ConversationEngine**: AI response generation, sentiment analysis, team extraction
- **MemoryManager**: KV-backed conversation history
- **MultiModalProcessor**: Images, documents, audio, video handling

### Corporate Hierarchy
```
CEO Remy (Human)
  └── General Manager (AI Orchestrator)
        ├── COO → Core Operations (3 teams)
        ├── CTO → Technology (dev teams)
        ├── CMO → Marketing & Media (2 teams)
        ├── CFO → Finance & Planning
        └── CINO → Innovation & Intelligence (4 teams)
```

### Integration Points
- **SendGrid**: Email outbound/inbound
- **OpenRouter API**: AI conversation logic
- **Cloudflare Workers AI**: Image generation
- **Telegram Bot API**: Messaging platform

### Deployment Status
- **Frontend**: Live on GitHub Pages
- **Bot Worker**: Deployed to Cloudflare Workers
- **API Worker**: Deployed to Cloudflare Workers
- **Database**: Supabase (Singapore region)
- **Security**: 2FA, rate limiting, input validation
