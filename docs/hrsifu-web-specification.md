# HRSifu Web-Based SaaS Specification

## Overview
Web-based HR management system for Malaysian SMEs, adapted from original desktop specification to leverage MFM-Corp's cloud-first architecture.

## Task for MFM-Corp Agents
Build the complete HRSifu web application including both backend and frontend. Create a GitHub repository and push all code.

## Tech Stack
- **Backend**: Cloudflare Workers
- **Database**: Cloudflare D1 (SQLite)
- **Storage**: Cloudflare R2 (PDFs, documents)
- **Frontend**: React + Tailwind CSS on Cloudflare Pages
- **AI**: OpenAI GPT-4o (customer-provided API key)
- **Search**: D1 full-text search (replaces LanceDB)

## Phase 1 MVP (Month 1-2)

### Module 1: Employee Records
- Add/edit employee profiles: name, NRIC/passport, department, designation, date joined, salary
- Employment status: permanent, contract, probation
- Document storage (R2): offer letter, NRIC copy
- Basic organizational listing
- D1 Schema: employees table

### Module 2: Payslip Viewer
- Upload payslips to R2 (PDF)
- Employee can view their own payslip
- Note: Full payroll calculation in Phase 2

### Module 3: Sifu AI - HR Assistant
- Chat interface in Bahasa Malaysia, English, Mandarin
- **Capabilities**:
  - Leave balance queries
  - Payslip queries
  - Company policy questions (admin uploads handbook to R2)
  - General HR best practices
- **Document Generation**:
  - Offer letters (from template)
  - Warning letters
  - Resignation acknowledgement
  - Leave approval/rejection notices
- **AI Architecture**:
  - Customer provides OpenAI API key in settings
  - D1 stores Employment Act 1955 text
  - Full-text search retrieves relevant sections
  - RAG prompt assembly with citations
  - GPT-4o generates answers with section citations

## Data Privacy Design
- D1 database in Cloudflare (encrypted at rest)
- R2 storage for documents (encrypted)
- AI queries only contain: user question + relevant Act text excerpts
- No employee data sent to third parties (except OpenAI for AI processing)
- Customer manages their own OpenAI API key
- Customer can export data at any time

## Phase 2 Features (Month 3-4)
- Payroll Engine (EPF, SOCSO, EIS, PCB calculations)
- Bank payment file generation
- Payslip PDF generation
- Leave Management
- Leave ↔ Payroll sync
- EA Form + Form E generation

## Phase 3 Features (Month 5-6)
- Claims & Expenses module
- Attendance (manual + CSV import)
- HRD Corp levy tracker
- SBL-KHAS form generation

## Monetization (Adapted for Web)
- Free Trial: 30 days, full access
- Standard License: RM 2,400/year (single company, 5-200 employees)
- Enterprise License: RM 6,000/year (unlimited companies)
- No per-user fees, no module fees
- Customer pays their own OpenAI API costs

## Deployment Architecture
```
Cloudflare Pages (Frontend)
    ↓ API calls
Cloudflare Workers (Backend)
    ↓ D1 queries
Cloudflare D1 (Database)
    ↓ Storage
Cloudflare R2 (Documents)
```

## Development Priority
1. Create GitHub repository named `hrsifu-web`
2. D1 schema design (employees, settings, documents, employment_act)
3. Backend API (Workers) with all endpoints
4. Frontend dashboard (React) with all pages
5. AI chat integration
6. Document upload/view
7. Payslip viewer
8. Push all code to GitHub
9. Confirm GitHub URL
