/**
 * MFM Corporation Architecture PDF Generator
 * Creates professional PDF document with architecture briefing using Node.js
 */

const PDFDocument = require('pdfkit');
const fs = require('fs');

// MFM Corporation Design Colors
const PRIMARY_COLOR = '#0369A1';
const PRIMARY_ACTIVE = '#0284C7';
const INK_COLOR = '#020617';
const BODY_COLOR = '#1E293B';
const MUTED_COLOR = '#64748B';
const CANVAS_COLOR = '#F8FAFC';

function createPDF() {
    const doc = new PDFDocument({
        size: 'A4',
        margins: {
            top: 72,
            bottom: 72,
            left: 72,
            right: 72
        }
    });

    const filename = 'MFM-Corporation-Architecture-Briefing.pdf';
    const filepath = `./${filename}`;

    doc.pipe(fs.createWriteStream(filepath));

    // Title
    doc.fontSize(24)
       .fillColor(PRIMARY_COLOR)
       .font('Helvetica-Bold')
       .text('MFM Corporation', { align: 'center' });
    
    doc.moveDown();
    
    doc.fontSize(16)
       .text('Architecture Briefing', { align: 'center' });
    
    doc.moveDown(0.5);

    // System Overview
    doc.fontSize(16)
       .fillColor(PRIMARY_COLOR)
       .text('System Overview');
    
    doc.moveDown();
    
    doc.fontSize(11)
       .fillColor(BODY_COLOR)
       .font('Helvetica')
       .text('Hybrid cloud architecture combining static web frontend with serverless backend. CEO Remy commands 19 specialized AI teams through natural language chat interface.', {
         width: doc.page.width - 144,
         align: 'justify'
       });
    
    doc.moveDown(0.5);

    // Infrastructure Layers
    doc.fontSize(16)
       .fillColor(PRIMARY_COLOR)
       .font('Helvetica-Bold')
       .text('Infrastructure Layers');
    
    doc.moveDown();

    // Frontend
    doc.fontSize(14)
       .fillColor(BODY_COLOR)
       .text('Frontend (GitHub Pages)');
    
    doc.moveDown(0.3);
    
    const frontendItems = [
        ['Hosting', 'Static site on GitHub Pages (mrhanfx-code.github.io/mfm-corporation)'],
        ['Tech Stack', 'HTML5, vanilla JavaScript, CSS'],
        ['Design System', 'Professional navy blue (#0369A1) on white canvas, Inter typography'],
        ['Real-time', 'Supabase WebSocket subscriptions'],
        ['Authentication', '2FA secure login with session management']
    ];
    
    frontendItems.forEach(([label, desc]) => {
        doc.fontSize(10)
           .fillColor(PRIMARY_COLOR)
           .font('Helvetica-Bold')
           .text(`${label}: `, { continued: true })
           .fillColor(BODY_COLOR)
           .font('Helvetica')
           .text(desc, { width: doc.page.width - 144 });
        doc.moveDown(0.2);
    });
    
    doc.moveDown(0.3);

    // Backend
    doc.fontSize(14)
       .fillColor(BODY_COLOR)
       .font('Helvetica-Bold')
       .text('Backend (Cloudflare Workers)');
    
    doc.moveDown(0.3);
    
    const backendItems = [
        ['Bot Worker', 'Telegram webhook handler (mfm-corporation-telegram-bot)'],
        ['API Worker', 'Web API for dashboard (mfm-corporation-api)'],
        ['D1 Database', 'SQLite-based (ID: 91e8699c-2731-4f0d-8a09-9f9765e7e4cc)'],
        ['KV Storage', 'Rate limiting and state caching'],
        ['R2 Storage', 'File uploads (mfm-corporation-uploads bucket)'],
        ['Queue', 'Async task processing (mfm-task-queue)']
    ];
    
    backendItems.forEach(([label, desc]) => {
        doc.fontSize(10)
           .fillColor(PRIMARY_COLOR)
           .font('Helvetica-Bold')
           .text(`${label}: `, { continued: true })
           .fillColor(BODY_COLOR)
           .font('Helvetica')
           .text(desc, { width: doc.page.width - 144 });
        doc.moveDown(0.2);
    });
    
    doc.moveDown(0.3);

    // Database
    doc.fontSize(14)
       .fillColor(BODY_COLOR)
       .font('Helvetica-Bold')
       .text('Database Schema (Supabase PostgreSQL)');
    
    doc.moveDown(0.3);
    
    const dbItems = [
        ['executives', '5 C-Level executives'],
        ['teams', '19 specialized teams'],
        ['ceo_commands', 'Command tracking'],
        ['chat_messages', 'Conversation history'],
        ['team_tasks', 'Task management'],
        ['quality_issues', 'Quality control'],
        ['ceo_authentication', 'Security']
    ];
    
    dbItems.forEach(([table, purpose]) => {
        doc.fontSize(10)
           .fillColor(PRIMARY_COLOR)
           .font('Helvetica-Bold')
           .text(`${table}: `, { continued: true })
           .fillColor(BODY_COLOR)
           .font('Helvetica')
           .text(purpose, { width: doc.page.width - 144 });
        doc.moveDown(0.2);
    });
    
    doc.addPage();

    // AI Orchestration Layer
    doc.fontSize(16)
       .fillColor(PRIMARY_COLOR)
       .font('Helvetica-Bold')
       .text('AI Orchestration Layer');
    
    doc.moveDown();

    doc.fontSize(14)
       .fillColor(BODY_COLOR)
       .text('Telegram Bot Flow');
    
    doc.moveDown(0.3);
    
    doc.fontSize(10)
       .fillColor(INK_COLOR)
       .font('Courier')
       .text('Telegram Message → SecurityManager → ConversationEngine → MemoryManager → Response', {
         width: doc.page.width - 144
       });
    
    doc.moveDown(0.5);

    doc.fontSize(14)
       .fillColor(BODY_COLOR)
       .font('Helvetica-Bold')
       .text('Key Components');
    
    doc.moveDown(0.3);
    
    const componentItems = [
        ['SecurityManager', 'Rate limiting (30 req/min), input validation, audit logging'],
        ['ConversationEngine', 'AI response generation, sentiment analysis, team extraction'],
        ['MemoryManager', 'KV-backed conversation history'],
        ['MultiModalProcessor', 'Images, documents, audio, video handling']
    ];
    
    componentItems.forEach(([label, desc]) => {
        doc.fontSize(10)
           .fillColor(PRIMARY_COLOR)
           .font('Helvetica-Bold')
           .text(`${label}: `, { continued: true })
           .fillColor(BODY_COLOR)
           .font('Helvetica')
           .text(desc, { width: doc.page.width - 144 });
        doc.moveDown(0.2);
    });
    
    doc.moveDown(0.3);

    // Corporate Hierarchy
    doc.fontSize(16)
       .fillColor(PRIMARY_COLOR)
       .font('Helvetica-Bold')
       .text('Corporate Hierarchy');
    
    doc.moveDown(0.3);
    
    doc.fontSize(10)
       .fillColor(INK_COLOR)
       .font('Courier')
       .text('CEO Remy (Human)', { width: doc.page.width - 144 });
    doc.text('  └── General Manager (AI Orchestrator)', { width: doc.page.width - 144 });
    doc.text('        ├── COO → Core Operations (3 teams)', { width: doc.page.width - 144 });
    doc.text('        ├── CTO → Technology (dev teams)', { width: doc.page.width - 144 });
    doc.text('        ├── CMO → Marketing & Media (2 teams)', { width: doc.page.width - 144 });
    doc.text('        ├── CFO → Finance & Planning', { width: doc.page.width - 144 });
    doc.text('        └── CINO → Innovation & Intelligence (4 teams)', { width: doc.page.width - 144 });
    
    doc.moveDown(0.5);

    // Integration Points
    doc.fontSize(16)
       .fillColor(PRIMARY_COLOR)
       .font('Helvetica-Bold')
       .text('Integration Points');
    
    doc.moveDown(0.3);
    
    const integrationItems = [
        ['SendGrid', 'Email outbound/inbound'],
        ['OpenRouter API', 'AI conversation logic'],
        ['Cloudflare Workers AI', 'Image generation'],
        ['Telegram Bot API', 'Messaging platform']
    ];
    
    integrationItems.forEach(([service, purpose]) => {
        doc.fontSize(10)
           .fillColor(PRIMARY_COLOR)
           .font('Helvetica-Bold')
           .text(`${service}: `, { continued: true })
           .fillColor(BODY_COLOR)
           .font('Helvetica')
           .text(purpose, { width: doc.page.width - 144 });
        doc.moveDown(0.2);
    });
    
    doc.moveDown(0.3);

    // Deployment Status
    doc.fontSize(16)
       .fillColor(PRIMARY_COLOR)
       .font('Helvetica-Bold')
       .text('Deployment Status');
    
    doc.moveDown(0.3);
    
    const deploymentItems = [
        ['Frontend', 'Live on GitHub Pages'],
        ['Bot Worker', 'Deployed to Cloudflare Workers'],
        ['API Worker', 'Deployed to Cloudflare Workers'],
        ['Database', 'Supabase (Singapore region)'],
        ['Security', '2FA, rate limiting, input validation']
    ];
    
    deploymentItems.forEach(([component, status]) => {
        doc.fontSize(10)
           .fillColor(PRIMARY_COLOR)
           .font('Helvetica-Bold')
           .text(`${component}: `, { continued: true })
           .fillColor(BODY_COLOR)
           .font('Helvetica')
           .text(status, { width: doc.page.width - 144 });
        doc.moveDown(0.2);
    });
    
    doc.moveDown(0.5);

    // Footer
    doc.fontSize(9)
       .fillColor(MUTED_COLOR)
       .text(`Document generated: ${filename}`, { align: 'center' });

    doc.end();

    console.log(`PDF generated successfully: ${filepath}`);
}

// Check if pdfkit is installed, if not install it
try {
    require('pdfkit');
    createPDF();
} catch (e) {
    console.log('Installing pdfkit...');
    const { execSync } = require('child_process');
    execSync('npm install pdfkit', { stdio: 'inherit' });
    createPDF();
}
