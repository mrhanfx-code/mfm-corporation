# ADR-0001: Use Cloudflare Workers Infrastructure

## Status
Accepted

## Context
MFM Corporation requires a serverless, globally distributed infrastructure for the AI automation system. The system needs to handle:
- Telegram bot webhooks
- Real-time agent coordination
- File storage and processing
- Database operations
- Email integration

## Decision
Use Cloudflare Workers as the primary infrastructure platform with:
- **Workers**: Serverless compute for bot logic and API endpoints
- **D1**: SQLite-compatible database for structured data
- **KV**: Key-value storage for rate limiting and caching
- **R2**: Object storage for file uploads
- **Pages**: Static hosting for dashboard
- **SendGrid**: Email service integration

## Consequences
### Positive
- Global edge deployment (300+ data centers)
- Zero cold starts for Workers
- Built-in DDoS protection
- Pay-per-use pricing model
- Integrated developer experience (Wrangler CLI)

### Negative
- Vendor lock-in to Cloudflare ecosystem
- Limited execution time (CPU time limits)
- D1 is in beta (production readiness concerns)
- Learning curve for Wrangler CLI

### Alternatives Considered
- AWS Lambda + API Gateway (more complex, higher cost)
- Vercel (limited database options)
- Self-hosted Kubernetes (higher operational overhead)

## Implementation
- Deploy telegram-bot-fixed.js to Cloudflare Workers
- Configure D1 database with schema migrations
- Set up KV namespace for rate limiting
- Configure R2 bucket for file storage
- Deploy dashboard to Cloudflare Pages

## References
- Cloudflare Workers Documentation: https://developers.cloudflare.com/workers/
- D1 Documentation: https://developers.cloudflare.com/d1/
