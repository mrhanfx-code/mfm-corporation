#!/usr/bin/env python3
"""
MFM Corporation Architecture PDF Generator
Creates professional PDF document with architecture briefing
"""

from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import os

# MFM Corporation Design Colors
PRIMARY_COLOR = colors.HexColor('#0369A1')
PRIMARY_ACTIVE = colors.HexColor('#0284C7')
INK_COLOR = colors.HexColor('#020617')
BODY_COLOR = colors.HexColor('#1E293B')
MUTED_COLOR = colors.HexColor('#64748B')
CANVAS_COLOR = colors.HexColor('#F8FAFC')

def create_pdf():
    """Generate MFM Corporation Architecture PDF"""
    
    # Create PDF
    filename = 'MFM-Corporation-Architecture-Briefing.pdf'
    filepath = os.path.join(os.path.dirname(__file__), filename)
    doc = SimpleDocTemplate(
        filepath,
        pagesize=A4,
        rightMargin=72,
        leftMargin=72,
        topMargin=72,
        bottomMargin=18
    )
    
    # Story container
    story = []
    
    # Custom styles
    styles = getSampleStyleSheet()
    
    # Title style
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=PRIMARY_COLOR,
        spaceAfter=30,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold'
    )
    
    # Heading style
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=16,
        textColor=PRIMARY_COLOR,
        spaceAfter=12,
        spaceBefore=20,
        fontName='Helvetica-Bold'
    )
    
    # Subheading style
    subheading_style = ParagraphStyle(
        'CustomSubheading',
        parent=styles['Heading3'],
        fontSize=14,
        textColor=BODY_COLOR,
        spaceAfter=10,
        spaceBefore=15,
        fontName='Helvetica-Bold'
    )
    
    # Body style
    body_style = ParagraphStyle(
        'CustomBody',
        parent=styles['Normal'],
        fontSize=11,
        textColor=BODY_COLOR,
        spaceAfter=12,
        leading=16,
        fontName='Helvetica'
    )
    
    # Code/list style
    code_style = ParagraphStyle(
        'CustomCode',
        parent=styles['Code'],
        fontSize=10,
        textColor=INK_COLOR,
        spaceAfter=8,
        leftIndent=20,
        fontName='Courier'
    )
    
    # Title
    story.append(Paragraph('MFM Corporation', title_style))
    story.append(Paragraph('Architecture Briefing', heading_style))
    story.append(Spacer(1, 0.3*inch))
    
    # System Overview
    story.append(Paragraph('System Overview', heading_style))
    story.append(Paragraph(
        'Hybrid cloud architecture combining static web frontend with serverless backend. '
        'CEO Remy commands 19 specialized AI teams through natural language chat interface.',
        body_style
    ))
    story.append(Spacer(1, 0.2*inch))
    
    # Infrastructure Layers
    story.append(Paragraph('Infrastructure Layers', heading_style))
    
    # Frontend
    story.append(Paragraph('Frontend (GitHub Pages)', subheading_style))
    frontend_data = [
        ['Component', 'Description'],
        ['Hosting', 'Static site on GitHub Pages (mrhanfx-code.github.io/mfm-corporation)'],
        ['Tech Stack', 'HTML5, vanilla JavaScript, CSS'],
        ['Design System', 'Professional navy blue (#0369A1) on white canvas, Inter typography'],
        ['Real-time', 'Supabase WebSocket subscriptions'],
        ['Authentication', '2FA secure login with session management']
    ]
    frontend_table = Table(frontend_data, colWidths=[2*inch, 4*inch])
    frontend_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), PRIMARY_COLOR),
        ('TEXTCOLOR', (0, 0), (0, -1), colors.white),
        ('BACKGROUND', (1, 0), (1, -1), CANVAS_COLOR),
        ('GRID', (0, 0), (-1, -1), 1, colors.grey),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [CANVAS_COLOR, colors.white])
    ]))
    story.append(frontend_table)
    story.append(Spacer(1, 0.2*inch))
    
    # Backend
    story.append(Paragraph('Backend (Cloudflare Workers)', subheading_style))
    backend_data = [
        ['Component', 'Description'],
        ['Bot Worker', 'Telegram webhook handler (mfm-corporation-telegram-bot)'],
        ['API Worker', 'Web API for dashboard (mfm-corporation-api)'],
        ['D1 Database', 'SQLite-based (ID: 91e8699c-2731-4f0d-8a09-9f9765e7e4cc)'],
        ['KV Storage', 'Rate limiting and state caching'],
        ['R2 Storage', 'File uploads (mfm-corporation-uploads bucket)'],
        ['Queue', 'Async task processing (mfm-task-queue)']
    ]
    backend_table = Table(backend_data, colWidths=[2*inch, 4*inch])
    backend_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), PRIMARY_COLOR),
        ('TEXTCOLOR', (0, 0), (0, -1), colors.white),
        ('BACKGROUND', (1, 0), (1, -1), CANVAS_COLOR),
        ('GRID', (0, 0), (-1, -1), 1, colors.grey),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [CANVAS_COLOR, colors.white])
    ]))
    story.append(backend_table)
    story.append(Spacer(1, 0.2*inch))
    
    # Database
    story.append(Paragraph('Database Schema (Supabase PostgreSQL)', subheading_style))
    db_data = [
        ['Table', 'Purpose'],
        ['executives', '5 C-Level executives'],
        ['teams', '19 specialized teams'],
        ['ceo_commands', 'Command tracking'],
        ['chat_messages', 'Conversation history'],
        ['team_tasks', 'Task management'],
        ['quality_issues', 'Quality control'],
        ['ceo_authentication', 'Security']
    ]
    db_table = Table(db_data, colWidths=[2*inch, 4*inch])
    db_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), PRIMARY_COLOR),
        ('TEXTCOLOR', (0, 0), (0, -1), colors.white),
        ('BACKGROUND', (1, 0), (1, -1), CANVAS_COLOR),
        ('GRID', (0, 0), (-1, -1), 1, colors.grey),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [CANVAS_COLOR, colors.white])
    ]))
    story.append(db_table)
    story.append(Spacer(1, 0.2*inch))
    
    story.append(PageBreak())
    
    # AI Orchestration Layer
    story.append(Paragraph('AI Orchestration Layer', heading_style))
    story.append(Paragraph('Telegram Bot Flow', subheading_style))
    story.append(Paragraph(
        'Telegram Message → SecurityManager → ConversationEngine → MemoryManager → Response',
        code_style
    ))
    story.append(Spacer(1, 0.2*inch))
    
    story.append(Paragraph('Key Components', subheading_style))
    components_data = [
        ['Component', 'Function'],
        ['SecurityManager', 'Rate limiting (30 req/min), input validation, audit logging'],
        ['ConversationEngine', 'AI response generation, sentiment analysis, team extraction'],
        ['MemoryManager', 'KV-backed conversation history'],
        ['MultiModalProcessor', 'Images, documents, audio, video handling']
    ]
    components_table = Table(components_data, colWidths=[2.5*inch, 3.5*inch])
    components_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), PRIMARY_COLOR),
        ('TEXTCOLOR', (0, 0), (0, -1), colors.white),
        ('BACKGROUND', (1, 0), (1, -1), CANVAS_COLOR),
        ('GRID', (0, 0), (-1, -1), 1, colors.grey),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [CANVAS_COLOR, colors.white])
    ]))
    story.append(components_table)
    story.append(Spacer(1, 0.2*inch))
    
    # Corporate Hierarchy
    story.append(Paragraph('Corporate Hierarchy', heading_style))
    hierarchy_text = """CEO Remy (Human)
  └── General Manager (AI Orchestrator)
        ├── COO → Core Operations (3 teams)
        ├── CTO → Technology (dev teams)
        ├── CMO → Marketing & Media (2 teams)
        ├── CFO → Finance & Planning
        └── CINO → Innovation & Intelligence (4 teams)"""
    story.append(Paragraph(hierarchy_text, code_style))
    story.append(Spacer(1, 0.2*inch))
    
    # Integration Points
    story.append(Paragraph('Integration Points', heading_style))
    integrations_data = [
        ['Service', 'Purpose'],
        ['SendGrid', 'Email outbound/inbound'],
        ['OpenRouter API', 'AI conversation logic'],
        ['Cloudflare Workers AI', 'Image generation'],
        ['Telegram Bot API', 'Messaging platform']
    ]
    integrations_table = Table(integrations_data, colWidths=[2.5*inch, 3.5*inch])
    integrations_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), PRIMARY_COLOR),
        ('TEXTCOLOR', (0, 0), (0, -1), colors.white),
        ('BACKGROUND', (1, 0), (1, -1), CANVAS_COLOR),
        ('GRID', (0, 0), (-1, -1), 1, colors.grey),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [CANVAS_COLOR, colors.white])
    ]))
    story.append(integrations_table)
    story.append(Spacer(1, 0.2*inch))
    
    # Deployment Status
    story.append(Paragraph('Deployment Status', heading_style))
    deployment_data = [
        ['Component', 'Status'],
        ['Frontend', 'Live on GitHub Pages'],
        ['Bot Worker', 'Deployed to Cloudflare Workers'],
        ['API Worker', 'Deployed to Cloudflare Workers'],
        ['Database', 'Supabase (Singapore region)'],
        ['Security', '2FA, rate limiting, input validation']
    ]
    deployment_table = Table(deployment_data, colWidths=[2.5*inch, 3.5*inch])
    deployment_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), PRIMARY_COLOR),
        ('TEXTCOLOR', (0, 0), (0, -1), colors.white),
        ('BACKGROUND', (1, 0), (1, -1), CANVAS_COLOR),
        ('GRID', (0, 0), (-1, -1), 1, colors.grey),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [CANVAS_COLOR, colors.white])
    ]))
    story.append(deployment_table)
    story.append(Spacer(1, 0.5*inch))
    
    # Footer
    story.append(Paragraph(
        'Document generated: ' + os.path.basename(filepath),
        ParagraphStyle(
            'Footer',
            parent=styles['Normal'],
            fontSize=9,
            textColor=MUTED_COLOR,
            alignment=TA_CENTER
        )
    ))
    
    # Build PDF
    doc.build(story)
    
    print(f'PDF generated successfully: {filepath}')
    return filepath

if __name__ == '__main__':
    try:
        create_pdf()
    except ImportError:
        print('Installing reportlab...')
        os.system('pip install reportlab')
        create_pdf()
