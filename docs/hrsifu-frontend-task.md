# HRSifu Frontend Development Task

## Task: Build HRSifu Web-Based SaaS Frontend

## Agent: Frontend Developer (CTO Department)

## Context
You are building the frontend for HRSifu, a web-based HR management system for Malaysian SMEs. The backend API has already been built and is available at the Cloudflare Workers endpoint.

## Backend API Reference
The backend provides these endpoints (all require X-API-Key and X-Company-ID headers):

- `POST /api/employees` - Create employee
- `GET /api/employees` - List employees
- `GET /api/employees/:id` - Get employee
- `PUT /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Delete employee
- `POST /api/documents/upload` - Upload document (multipart)
- `GET /api/documents/:id` - Download document
- `POST /api/settings` - Save setting
- `GET /api/settings/:company_id` - Get settings
- `POST /api/ai/chat` - AI chat with Sifu AI

## Requirements

### 1. Tech Stack
- React 18
- Tailwind CSS for styling
- React Router for navigation
- Vite for build tooling
- Deploy to Cloudflare Pages

### 2. Pages to Build

**Dashboard (Home)**
- Overview stats: total employees, recent documents
- Quick actions: add employee, upload document, chat with Sifu AI
- Recent activity list

**Employee Management**
- List all employees (table view)
- Add new employee form
- Edit employee modal
- Delete employee confirmation
- Search/filter employees

**Employee Detail**
- View employee profile
- List employee documents
- Upload new document
- View/download documents

**Document Management**
- List all documents
- Upload document form
- View/download document
- Filter by document type

**Sifu AI Chat**
- Chat interface with message history
- Language selector (BM, English, Mandarin)
- Display AI responses with citations
- Settings to configure OpenAI API key

**Settings**
- Company settings form
- OpenAI API key input
- Save/Load settings

### 3. Design Requirements
- Mobile-first responsive design
- Clean, professional UI
- Malaysian SME-friendly (simple, not overwhelming)
- Use HRSifu brand colors: primary blue (#1E40AF), secondary blue (#3B82F6), accent orange (#F59E0B)
- Loading states for async operations
- Error handling with user-friendly messages
- Form validation

### 4. State Management
- Use React Context for global state (API key, company ID)
- Local state for forms and lists
- Fetch data from backend API

### 5. File Structure
```
frontend/
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── index.css
│   ├── components/
│   │   ├── Layout.jsx
│   │   ├── Navbar.jsx
│   │   ├── EmployeeList.jsx
│   │   ├── EmployeeForm.jsx
│   │   ├── DocumentList.jsx
│   │   ├── DocumentUpload.jsx
│   │   ├── ChatInterface.jsx
│   │   └── Settings.jsx
│   ├── pages/
│   │   ├── Dashboard.jsx
│   │   ├── Employees.jsx
│   │   ├── EmployeeDetail.jsx
│   │   ├── Documents.jsx
│   │   ├── Chat.jsx
│   │   └── Settings.jsx
│   ├── context/
│   │   └── AppContext.jsx
│   └── api/
│       └── client.js
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
└── postcss.config.js
```

### 6. API Client
Create a client.js file to handle API calls:
- Base URL configuration
- Headers injection (API key, company ID)
- Error handling
- Response parsing

### 7. Cloudflare Pages Deployment
Create a `.github/workflows/deploy.yml` for automatic deployment to Cloudflare Pages when code is pushed to GitHub.

## Code Delivery Instructions
1. Add frontend code to the existing `hrsifu-web` GitHub repository
2. Create the `frontend/` directory structure
3. Push all frontend files using [TOOL:github-push]
4. Files to push:
   - frontend/package.json
   - frontend/vite.config.js
   - frontend/tailwind.config.js
   - frontend/postcss.config.js
   - frontend/index.html
   - frontend/src/main.jsx
   - frontend/src/App.jsx
   - frontend/src/index.css
   - frontend/src/components/*.jsx
   - frontend/src/pages/*.jsx
   - frontend/src/context/AppContext.jsx
   - frontend/src/api/client.js
   - .github/workflows/deploy.yml
5. Confirm the GitHub URL when complete

## Testing Plan
- Test all pages render correctly
- Test employee CRUD operations
- Test document upload/download
- Test AI chat interface
- Test settings save/load
- Test responsive design on mobile
- Test error handling

## Notes
- Keep each component file under 300 lines
- Follow React best practices (hooks, functional components)
- Use Tailwind utility classes for styling
- No external UI libraries (build from scratch)
- The backend API is already deployed and ready
