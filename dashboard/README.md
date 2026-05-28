# MFM Corporation Dashboard

CEO Remy Command Center - Real-time agent monitoring and control interface.

## 🚀 Live Deployment

**URL:** https://mfm-corp.cc.cd

## 🛠️ Technology Stack

- **React 19.2.6** - UI Framework
- **TypeScript 6.0.2** - Type Safety
- **Vite 8.0.12** - Build Tool
- **Tailwind CSS 4.3.0** - Styling
- **Zustand 5.0.13** - State Management
- **Recharts 3.8.1** - Data Visualization
- **Socket.io Client 4.8.3** - Real-time Communication

## 📊 Features

### Dashboard Components
- **LoginGate** - Secret-based authentication
- **Sidebar** - Navigation with team filtering
- **AgentCard** - Individual agent display with controls
- **TelemetryTable** - Real-time task logs
- **ControlModal** - Agent configuration interface
- **ChatWindow** - CEO communication interface
- **SettingsPanel** - System settings and status
- **LogsModal** - Detailed log viewer

### Agent Management
- **42 Agents** across 6 departments (COO, CTO, CMO, CFO, CINO, CLO)
- **Real-time Status** - Running, Idle, Error states
- **Load Monitoring** - CPU/memory usage per agent
- **Quality Scoring** - Performance metrics (avg 52.6)
- **Team Filtering** - Filter by department
- **Grid/List Views** - Flexible display options

### Global Controls
- **Pause All** - Stop all agents
- **Deploy Cluster** - Spin up new agent clusters
- **Theme Toggle** - Dark/Light mode
- **Export CSV** - Telemetry data export

## 🔐 Authentication

Dashboard requires secret-based authentication:
- Secret stored in localStorage (mfm_secret)
- Verified against Cloudflare Worker API
- Auto-verification on page load
- Logout functionality available

## 📡 API Integration

**Worker URL:** https://mfm-corporation-telegram-bot.mrhan-fx.workers.dev

**Endpoints:**
- `/api/v1/dashboard/status` - System health metrics
- `/api/v1/dashboard/agents` - Agent list and status
- `/api/v1/dashboard/tasks` - Task history and logs
- `/api/v1/dashboard/commands` - Agent control commands

**Data Refresh:** 30-second polling interval

## 🎨 Development

### Prerequisites
- Node.js 14.0.0+
- npm or yarn

### Installation
```bash
npm install
```

### Development
```bash
npm run dev
```

### Build
```bash
npm run build
```

### Preview
```bash
npm run preview
```

### Deploy
```bash
npm run deploy
```

## 📁 Project Structure

```
dashboard/
├── src/
│   ├── components/
│   │   ├── DashboardNew.tsx    # Main dashboard component
│   │   ├── Sidebar.tsx         # Navigation sidebar
│   │   ├── AgentCard.tsx       # Agent display card
│   │   ├── TelemetryTable.tsx  # Task logs table
│   │   ├── ControlModal.tsx    # Agent configuration modal
│   │   ├── ChatWindow.tsx      # CEO chat interface
│   │   ├── SettingsPanel.tsx   # Settings panel
│   │   └── LogsModal.tsx       # Detailed logs viewer
│   ├── App.tsx                 # Root component
│   ├── main.tsx                # Entry point
│   └── index.css               # Global styles
├── public/                     # Static assets
├── index.html                  # HTML template
├── vite.config.ts              # Vite configuration
├── tsconfig.json               # TypeScript configuration
└── package.json                # Dependencies
```

## 🔧 Configuration

### Environment Variables
No environment variables required. Dashboard connects directly to Cloudflare Worker API.

### Worker URL
Set `WORKER_URL` in `DashboardNew.tsx` to change the backend endpoint (default: https://mfm-corporation-telegram-bot.mrhan-fx.workers.dev)

## 📈 System Status (Last Updated: May 28, 2026)

**Overall Rating:** A- (Operational)

### Infrastructure
- All 7 components operational (KV, D1, R2, Queue, Telegram, LLM, Cerebras)
- API response time: <1 second
- Database query time: 0.44ms average
- System uptime: 99.9%

### Agent Performance
- Total agents: 42
- Active agents: 7/42 (last 24 hours)
- Quality scores: 78-96 (good to excellent)
- Task completion rate: 96.4%

### Security Note
⚠️ Dashboard authentication is operational, but backend secrets require rotation (see main SYSTEM-TEST-REPORT-2026-05-28.md)

## 📱 Responsive Design

Dashboard is fully responsive and optimized for:
- Desktop (1920x1080+)
- Tablet (768x1024)
- Mobile (375x667+)

## 🎯 Getting Started

1. Clone the repository
2. Run `npm install`
3. Run `npm run dev`
4. Open http://localhost:5173
5. Enter dashboard secret to authenticate

---

*MFM Corporation Dashboard - CEO Remy Command Center*
