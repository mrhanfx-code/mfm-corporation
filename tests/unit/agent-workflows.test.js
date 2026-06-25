// Agent Workflow Test
// Tests: agent-specific workflow patterns and tool usage
import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..');
const AGENTS_DIR = path.join(ROOT, 'src', 'agents');

describe('Agent Workflows', () => {
  let agentFiles = [];

  beforeEach(() => {
    // Find all agent markdown files
    function findMarkdownFiles(dir, files = []) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          findMarkdownFiles(fullPath, files);
        } else if (entry.name.endsWith('.md') && entry.name !== '.agent-template.md') {
          files.push(fullPath);
        }
      }
      return files;
    }
    agentFiles = findMarkdownFiles(AGENTS_DIR);
  });

  it('should have at least 60 agent markdown files', () => {
    expect(agentFiles.length).toBeGreaterThanOrEqual(60);
  });

  describe('Workflow Pattern Validation', () => {
    it('should validate workflow sections in agent files', () => {
      agentFiles.forEach(filePath => {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Check for workflow-related sections
        expect(content).toMatch(/## Responsibilities/);
        expect(content).toMatch(/## Capabilities/);
        expect(content).toMatch(/## Dependencies/);
      });
    });
  });

  describe('Department-Specific Workflows', () => {
    it('COO agents should have operational workflow patterns', () => {
      const cooAgents = agentFiles.filter(f => f.includes('coo'));
      
      cooAgents.forEach(filePath => {
        const content = fs.readFileSync(filePath, 'utf8');
        // COO agents should mention operations, processes, or coordination
        const hasOperationalContext = 
          content.toLowerCase().includes('operation') ||
          content.toLowerCase().includes('process') ||
          content.toLowerCase().includes('coordination') ||
          content.toLowerCase().includes('optimization');
        
        expect(hasOperationalContext).toBe(true);
      });
    });

    it('CTO agents should have technical workflow patterns', () => {
      const ctoAgents = agentFiles.filter(f => f.includes('cto'));
      
      ctoAgents.forEach(filePath => {
        const content = fs.readFileSync(filePath, 'utf8');
        // CTO agents should mention development, technical, or engineering
        const hasTechnicalContext = 
          content.toLowerCase().includes('development') ||
          content.toLowerCase().includes('technical') ||
          content.toLowerCase().includes('engineering') ||
          content.toLowerCase().includes('code');
        
        expect(hasTechnicalContext).toBe(true);
      });
    });

    it('CMO agents should have marketing workflow patterns', () => {
      const cmoAgents = agentFiles.filter(f => f.includes('cmo'));
      
      cmoAgents.forEach(filePath => {
        const content = fs.readFileSync(filePath, 'utf8');
        // CMO agents should mention marketing, content, or social media
        const hasMarketingContext = 
          content.toLowerCase().includes('marketing') ||
          content.toLowerCase().includes('content') ||
          content.toLowerCase().includes('social media') ||
          content.toLowerCase().includes('brand');
        
        expect(hasMarketingContext).toBe(true);
      });
    });

    it('CFO agents should have financial workflow patterns', () => {
      const cfoAgents = agentFiles.filter(f => f.includes('cfo'));
      
      cfoAgents.forEach(filePath => {
        const content = fs.readFileSync(filePath, 'utf8');
        // CFO agents should mention financial, budget, or revenue
        const hasFinancialContext = 
          content.toLowerCase().includes('financial') ||
          content.toLowerCase().includes('budget') ||
          content.toLowerCase().includes('revenue') ||
          content.toLowerCase().includes('cost');
        
        expect(hasFinancialContext).toBe(true);
      });
    });

    it('CINO agents should have innovation workflow patterns', () => {
      const cinoAgents = agentFiles.filter(f => f.includes('cino'));
      
      cinoAgents.forEach(filePath => {
        const content = fs.readFileSync(filePath, 'utf8');
        // CINO agents should mention innovation, research, or ideas
        const hasInnovationContext = 
          content.toLowerCase().includes('innovation') ||
          content.toLowerCase().includes('research') ||
          content.toLowerCase().includes('idea') ||
          content.toLowerCase().includes('technology');
        
        expect(hasInnovationContext).toBe(true);
      });
    });
  });

  describe('Tool Workflow Integration', () => {
    it('agents with drive-write should have file storage workflows', () => {
      const contentCreationAgents = agentFiles.filter(f => 
        f.includes('content-writer.md') ||
        f.includes('media-producer.md') ||
        f.includes('social-media-content-generator.md') ||
        f.includes('social-media-manager.md')
      );

      contentCreationAgents.forEach(filePath => {
        const content = fs.readFileSync(filePath, 'utf8');
        expect(content).toMatch(/drive-write:/);
        // Should mention file storage or document management
        const hasFileWorkflow = 
          content.toLowerCase().includes('file') ||
          content.toLowerCase().includes('document') ||
          content.toLowerCase().includes('storage') ||
          content.toLowerCase().includes('drive');
        
        expect(hasFileWorkflow).toBe(true);
      });
    });

    it('agents with sms-alert should have alert workflows', () => {
      const criticalOpsAgents = agentFiles.filter(f => 
        f.includes('operations-team-lead.md') ||
        f.includes('support-team-lead.md') ||
        f.includes('quality-team-lead.md')
      );

      criticalOpsAgents.forEach(filePath => {
        const content = fs.readFileSync(filePath, 'utf8');
        expect(content).toMatch(/sms-alert:/);
        // Should mention alerts, notifications, or critical issues
        const hasAlertWorkflow = 
          content.toLowerCase().includes('alert') ||
          content.toLowerCase().includes('notification') ||
          content.toLowerCase().includes('critical') ||
          content.toLowerCase().includes('urgent');
        
        expect(hasAlertWorkflow).toBe(true);
      });
    });

    it('agents with social-post should have social media workflows', () => {
      const cmoTeamAgents = agentFiles.filter(f => 
        f.includes('cmo.md') ||
        f.includes('marketing-team-lead.md') ||
        f.includes('social-media-manager.md') ||
        f.includes('social-media-content-generator.md') ||
        f.includes('social-media-chat-agent.md')
      );

      cmoTeamAgents.forEach(filePath => {
        const content = fs.readFileSync(filePath, 'utf8');
        expect(content).toMatch(/social-post:/);
        // Should mention posting, publishing, or social media
        const hasSocialWorkflow = 
          content.toLowerCase().includes('post') ||
          content.toLowerCase().includes('publish') ||
          content.toLowerCase().includes('social media') ||
          content.toLowerCase().includes('engagement');
        
        expect(hasSocialWorkflow).toBe(true);
      });
    });
  });
});
