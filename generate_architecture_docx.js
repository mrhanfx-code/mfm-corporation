const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType, Table, TableRow, TableCell } = require('docx');
const fs = require('fs');

// MFM Corporation Design Colors
const PRIMARY_COLOR = '#0369A1';
const BODY_COLOR = '#1E293B';
const CANVAS_COLOR = '#F8FAFC';

const doc = new Document({
  styles: {
    default: { document: { run: { font: 'Arial', size: 24 } } },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 32, bold: true, color: PRIMARY_COLOR, font: 'Arial' },
        paragraph: { spacing: { before: 240, after: 240 }, outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 28, bold: true, color: PRIMARY_COLOR, font: 'Arial' },
        paragraph: { spacing: { before: 180, after: 180 }, outlineLevel: 1 } },
      { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 24, bold: true, color: BODY_COLOR, font: 'Arial' },
        paragraph: { spacing: { before: 120, after: 120 }, outlineLevel: 2 } },
    ]
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
      }
    },
    children: [
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun('MFM Corporation')] }),
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('Architecture Briefing')] }),
      new Paragraph({ text: '' }),
      
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('System Overview')] }),
      new Paragraph({ 
        text: 'Hybrid cloud architecture combining static web frontend with serverless backend. CEO Remy commands 19 specialized AI teams through natural language chat interface.',
        spacing: { after: 200 }
      }),
      
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('Infrastructure Layers')] }),
      
      new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun('Frontend (GitHub Pages)')] }),
      createTable([
        ['Hosting', 'Static site on GitHub Pages (mrhanfx-code.github.io/mfm-corporation)'],
        ['Tech Stack', 'HTML5, vanilla JavaScript, CSS'],
        ['Design System', 'Professional navy blue (#0369A1) on white canvas, Inter typography'],
        ['Real-time', 'Supabase WebSocket subscriptions'],
        ['Authentication', '2FA secure login with session management']
      ]),
      
      new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun('Backend (Cloudflare Workers)')] }),
      createTable([
        ['Bot Worker', 'Telegram webhook handler (mfm-corporation-telegram-bot)'],
        ['API Worker', 'Web API for dashboard (mfm-corporation-api)'],
        ['D1 Database', 'SQLite-based (ID: 91e8699c-2731-4f0d-8a09-9f9765e7e4cc)'],
        ['KV Storage', 'Rate limiting and state caching'],
        ['R2 Storage', 'File uploads (mfm-corporation-uploads bucket)'],
        ['Queue', 'Async task processing (mfm-task-queue)']
      ]),
      
      new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun('Database Schema (Supabase PostgreSQL)')] }),
      createTable([
        ['executives', '5 C-Level executives'],
        ['teams', '19 specialized teams'],
        ['ceo_commands', 'Command tracking'],
        ['chat_messages', 'Conversation history'],
        ['team_tasks', 'Task management'],
        ['quality_issues', 'Quality control'],
        ['ceo_authentication', 'Security']
      ]),
      
      new Paragraph({ text: '', pageBreakBefore: true }),
      
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('AI Orchestration Layer')] }),
      new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun('Telegram Bot Flow')] }),
      new Paragraph({ 
        text: 'Telegram Message → SecurityManager → ConversationEngine → MemoryManager → Response',
        font: 'Courier',
        spacing: { after: 200 }
      }),
      
      new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun('Key Components')] }),
      createTable([
        ['SecurityManager', 'Rate limiting (30 req/min), input validation, audit logging'],
        ['ConversationEngine', 'AI response generation, sentiment analysis, team extraction'],
        ['MemoryManager', 'KV-backed conversation history'],
        ['MultiModalProcessor', 'Images, documents, audio, video handling']
      ]),
      
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('Corporate Hierarchy')] }),
      new Paragraph({ 
        text: 'CEO Remy (Human)\n  └── General Manager (AI Orchestrator)\n        ├── COO → Core Operations (3 teams)\n        ├── CTO → Technology (dev teams)\n        ├── CMO → Marketing & Media (2 teams)\n        ├── CFO → Finance & Planning\n        └── CINO → Innovation & Intelligence (4 teams)',
        font: 'Courier',
        spacing: { after: 200 }
      }),
      
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('Integration Points')] }),
      createTable([
        ['SendGrid', 'Email outbound/inbound'],
        ['OpenRouter API', 'AI conversation logic'],
        ['Cloudflare Workers AI', 'Image generation'],
        ['Telegram Bot API', 'Messaging platform']
      ]),
      
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('Deployment Status')] }),
      createTable([
        ['Frontend', 'Live on GitHub Pages'],
        ['Bot Worker', 'Deployed to Cloudflare Workers'],
        ['API Worker', 'Deployed to Cloudflare Workers'],
        ['Database', 'Supabase (Singapore region)'],
        ['Security', '2FA, rate limiting, input validation']
      ]),
      
      new Paragraph({ 
        text: 'Document generated: MFM-Corporation-Architecture-Briefing.docx',
        size: 18,
        color: '64748B',
        alignment: AlignmentType.CENTER,
        spacing: { before: 400 }
      })
    ]
  }]
});

function createTable(data) {
  const border = { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' };
  const borders = { top: border, bottom: border, left: border, right: border };
  
  const rows = data.map(([label, desc]) => 
    new TableRow({
      children: [
        new TableCell({
          borders,
          width: { size: 3000, type: WidthType.DXA },
          shading: { fill: PRIMARY_COLOR, type: ShadingType.CLEAR },
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
          children: [new Paragraph({ children: [new TextRun({ text: label, bold: true, color: 'FFFFFF' })] })]
        }),
        new TableCell({
          borders,
          width: { size: 6360, type: WidthType.DXA },
          shading: { fill: CANVAS_COLOR, type: ShadingType.CLEAR },
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
          children: [new Paragraph({ children: [new TextRun(desc)] })]
        })
      ]
    })
  );
  
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [3000, 6360],
    rows
  });
}

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync('MFM-Corporation-Architecture-Briefing.docx', buffer);
  console.log('DOCX generated successfully: MFM-Corporation-Architecture-Briefing.docx');
});
