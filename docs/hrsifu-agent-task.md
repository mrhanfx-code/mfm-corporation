# HRSifu Web Application - Complete Build Task

## Task
Build the complete HRSifu web application (backend + frontend) and push all code to GitHub.

## Agents Required
- Backend Developer (CTO)
- Frontend Developer (CTO)

## Product Overview
HRSifu is a web-based HR management system for Malaysian SMEs. It includes employee records, payslip viewing, document management, and an AI-powered HR assistant (Sifu AI) that answers questions about Malaysian Employment Act 1955.

## Tech Stack
- **Backend**: Cloudflare Workers
- **Database**: Cloudflare D1 (SQLite)
- **Storage**: Cloudflare R2
- **Frontend**: React 18 + Tailwind CSS
- **Deployment**: Cloudflare Pages (frontend), Cloudflare Workers (backend)
- **AI**: OpenAI GPT-4o (customer-provided API key)

## Backend Requirements

### Database Schema (D1)
Create these tables:
- `employees`: id, name, nric, department, designation, date_joined, salary, employment_status, company_id, created_at, updated_at
- `settings`: id, company_id, key, value, updated_at
- `documents`: id, employee_id, company_id, document_type, r2_key, uploaded_at
- `employment_act`: id, section, title, content, created_at

### API Endpoints (Cloudflare Workers)
- `POST /api/employees` - Create employee
- `GET /api/employees` - List employees (by company_id)
- `GET /api/employees/:id` - Get employee
- `PUT /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Delete employee
- `POST /api/documents/upload` - Upload document to R2
- `GET /api/documents/:id` - Download document
- `POST /api/settings` - Save company setting
- `GET /api/settings/:company_id` - Get all settings
- `POST /api/ai/chat` - AI chat with Sifu AI

### AI Chat Implementation
- Retrieve OpenAI API key from settings
- Search employment_act table for relevant sections
- Build RAG prompt with retrieved sections
- Call OpenAI GPT-4o API
- Return response with citations

### Security
- API key authentication (X-API-Key header)
- Company ID isolation (X-Company-ID header)
- Input validation
- Parameterised queries (SQL injection prevention)
- CORS enabled

## Frontend Requirements

### Pages
1. **Dashboard** - Stats, quick actions, recent activity
2. **Employee Management** - List, add, edit, delete employees
3. **Employee Detail** - View profile, documents, upload documents
4. **Document Management** - List, upload, view/download documents
5. **Sifu AI Chat** - Chat interface with language selector
6. **Settings** - Configure OpenAI API key

### Design
- Mobile-first responsive design
- Brand colors: primary blue (#1E40AF), secondary blue (#3B82F6), accent orange (#F59E0B)
- Clean, professional UI
- Loading states
- Error handling
- Form validation

### State Management
- React Context for global state (API key, company ID)
- Local state for forms and lists
- API client for backend communication

## File Structure
```
hrsifu-web/
├── schema.sql
├── worker.js
├── wrangler.toml
├── src/
│   ├── db.js
│   ├── auth.js
│   ├── ai.js
│   └── utils.js
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── index.html
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── index.css
│       ├── components/
│       ├── pages/
│       ├── context/
│       └── api/
└── README.md
```

## Code Delivery
1. Create GitHub repository named `hrsifu-web`
2. Push all backend files
3. Push all frontend files
4. Confirm GitHub URL

## Notes
- Keep files under 500 lines
- Follow MFM coding standards
- No hardcoded secrets
- Use parameterised queries
- Mobile-first design
