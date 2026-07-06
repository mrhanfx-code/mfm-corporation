# MFM Corporation Dashboard

A real-time monitoring and management dashboard for the MFM Corporation AI agent system.

## Tech Stack

- **React** 19.2.6 - UI framework
- **TypeScript** 6.0.2 - Type safety
- **Vite** 8.0.12 - Build tool and dev server
- **Tailwind CSS** 4.3.0 - Styling
- **Recharts** 3.8.1 - Data visualization
- **Zustand** 5.0.13 - State management
- **Socket.io-client** 4.8.3 - Real-time WebSocket communication
- **Vitest** - Testing framework

## Features

### Real-Time Monitoring
- **Agent Activity Display**: Live updates of agent status, current tasks, and quality scores
- **WebSocket Integration**: Real-time data streaming from the backend system
- **Live Metrics**: Dynamic charts showing performance metrics over time

### Agent Management
- **Agent Grid**: Visual grid display of all agents with status indicators
- **Agent Cards**: Detailed agent information including task count, quality score, and activity
- **Stop/Start Controls**: Ability to stop individual agents with confirmation modal
- **Department Filtering**: Filter agents by department (COO, CTO, CMO, CFO, CINO, CLO)

### Task Queue Management
- **Task Queue UI**: View and manage pending, in-progress, and completed tasks
- **Task Actions**: Pause, resume, and cancel tasks
- **Task Details**: View detailed task information and status
- **Filtering**: Filter tasks by agent, status, and time range

### Metrics Dashboard
- **Performance Metrics**: Overall quality score, task completion rate, response time
- **Time Range Selection**: Hourly, daily, and weekly views
- **Agent Performance**: Per-agent performance breakdown
- **Alerts**: Quality and performance alerts for problematic agents

### Organization Chart
- **Interactive Org Chart**: Visual representation of the organizational structure
- **Department Views**: Drill-down into specific departments
- **C-Level Executive Cards**: CEO, COO, CTO, CMO, CFO, CINO, CLO information
- **Expand/Collapse**: Interactive node expansion for detailed views

### Chat Interface
- **Real-time Chat**: Communicate with agents
- **File Upload**: Upload files to share with agents
- **Message History**: View conversation history
- **Agent Selection**: Choose which agent to chat with

### Settings Panel
- **Dashboard Configuration**: Customize dashboard settings
- **Notification Preferences**: Configure alert settings
- **Theme Settings**: Dark/light mode toggle
- **System Settings**: Global system configuration

### Additional Features
- **Cost Tracking**: Monitor API and model usage costs
- **Memory Management**: View and manage agent memory
- **Responsive Design**: Works on desktop and tablet devices
- **Authentication**: Login gate with secret verification

## Getting Started

First, install dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
```

Then, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173) with your browser to see the result.

## Building for Production

```bash
npm run build
# or
yarn build
# or
pnpm build
```

The built files will be in the `dist` directory.

## Testing

Run the test suite:

```bash
npm test
# or
yarn test
# or
pnpm test
```

## Deployment

### GitHub Pages
The dashboard is deployed to GitHub Pages at:
https://mrhanfx-code.github.io/mfm-corporation

To deploy:
```bash
npm run deploy
```

### Cloudflare Pages
Alternative deployment at:
https://mfm-corp.cc.cd

To deploy:
```bash
npm run build
npx wrangler pages deploy dist --project-name=mfm-corp-dashboard
```

## Architecture

The dashboard connects to:
- **Cloudflare Workers** - Main bot backend
- **D1 Database** - Primary operational data
- **Supabase** - Analytics and dashboard data sync
- **WebSocket Server** - Real-time updates

## Environment Variables

- `VITE_API_URL` - Backend API URL
- `VITE_WS_URL` - WebSocket server URL
- `VITE_DASHBOARD_SECRET` - Dashboard authentication secret

## License

Copyright © 2026 MFM Corporation. All rights reserved.
