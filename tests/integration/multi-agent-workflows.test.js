// Multi-Agent Workflow Integration Test
// Tests: multi-agent coordination, handoffs, and collaborative workflows
import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..');
const AGENTS_DIR = path.join(ROOT, 'src', 'agents');

describe('Multi-Agent Workflows', () => {
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

  it('should have at least 60 agent files for multi-agent workflows', () => {
    expect(agentFiles.length).toBeGreaterThanOrEqual(60);
  });

  describe('Agent Hierarchy and Reporting Structure', () => {
    it('should validate reporting structure in agent files', () => {
      agentFiles.forEach(filePath => {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Check for reports_to field in frontmatter
        expect(content).toMatch(/reports_to:/);
      });
    });

    it('should have C-level executives defined', () => {
      const cLevelAgents = agentFiles.filter(f => 
        f.includes('coo.md') ||
        f.includes('cto.md') ||
        f.includes('cmo.md') ||
        f.includes('cfo.md') ||
        f.includes('cino.md')
      );

      expect(cLevelAgents.length).toBeGreaterThanOrEqual(5);
    });

    it('should have department structure', () => {
      const departments = ['coo', 'cto', 'cmo', 'cfo', 'cino', 'clo'];
      
      departments.forEach(dept => {
        const deptAgents = agentFiles.filter(f => f.includes(dept));
        expect(deptAgents.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Cross-Department Collaboration Patterns', () => {
    it('COO agents should have operational context', () => {
      const cooAgents = agentFiles.filter(f => f.includes('coo'));
      
      // COO agents should have operational context
      const hasOperationalContext = cooAgents.some(filePath => {
        const content = fs.readFileSync(filePath, 'utf8');
        return (
          content.toLowerCase().includes('operation') ||
          content.toLowerCase().includes('process') ||
          content.toLowerCase().includes('coordination') ||
          content.toLowerCase().includes('optimization')
        );
      });

      expect(hasOperationalContext).toBe(true);
    });

    it('CTO agents should have technical context', () => {
      const ctoAgents = agentFiles.filter(f => f.includes('cto'));
      
      const hasTechnicalContext = ctoAgents.some(filePath => {
        const content = fs.readFileSync(filePath, 'utf8');
        return (
          content.toLowerCase().includes('coo') ||
          content.toLowerCase().includes('cmo') ||
          content.toLowerCase().includes('cfo') ||
          content.toLowerCase().includes('cino')
        );
      });

      expect(hasTechnicalContext).toBe(true);
    });

    it('CMO agents should have marketing context', () => {
      const cmoAgents = agentFiles.filter(f => f.includes('cmo'));
      
      const hasMarketingContext = cmoAgents.some(filePath => {
        const content = fs.readFileSync(filePath, 'utf8');
        return (
          content.toLowerCase().includes('coo') ||
          content.toLowerCase().includes('cto') ||
          content.toLowerCase().includes('cfo') ||
          content.toLowerCase().includes('cino')
        );
      });

      expect(hasMarketingContext).toBe(true);
    });
  });

  describe('Collaborative Tool Usage', () => {
    it('multiple agents should share common tools for collaboration', () => {
      const toolsCount = {};
      
      agentFiles.forEach(filePath => {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Check for d1-query directly
        if (content.includes('d1-query:')) {
          toolsCount['d1-query'] = (toolsCount['d1-query'] || 0) + 1;
        }
        
        // Check for slack-notify directly
        if (content.includes('slack-notify:')) {
          toolsCount['slack-notify'] = (toolsCount['slack-notify'] || 0) + 1;
        }
        
        // Check for send-email directly
        if (content.includes('send-email:')) {
          toolsCount['send-email'] = (toolsCount['send-email'] || 0) + 1;
        }
      });

      // Check that d1-query is used by all agents (universal collaboration tool)
      expect(toolsCount['d1-query']).toBeGreaterThanOrEqual(60);
      
      // Check that slack-notify is widely used (communication tool)
      expect(toolsCount['slack-notify']).toBeGreaterThanOrEqual(40);
    });

    it('agents should have communication tools for coordination', () => {
      agentFiles.forEach(filePath => {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Check for communication-related tools
        const hasCommunicationTool = 
          content.includes('slack-notify') ||
          content.includes('send-email') ||
          content.includes('sms-alert');
        
        expect(hasCommunicationTool).toBe(true);
      });
    });
  });

  describe('Workflow Handoff Patterns', () => {
    it('agents should have dependencies section for handoffs', () => {
      agentFiles.forEach(filePath => {
        const content = fs.readFileSync(filePath, 'utf8');
        expect(content).toMatch(/## Dependencies/);
      });
    });

    it('agents should define communication protocols', () => {
      agentFiles.forEach(filePath => {
        const content = fs.readFileSync(filePath, 'utf8');
        expect(content).toMatch(/## Communication/);
      });
    });

    it('team leads should have coordination responsibilities', () => {
      const teamLeads = agentFiles.filter(f => 
        f.includes('team-lead.md') ||
        f.includes('manager.md')
      );

      teamLeads.forEach(filePath => {
        const content = fs.readFileSync(filePath, 'utf8');
        // Team leads should mention coordination, leadership, or team management
        const hasCoordination = 
          content.toLowerCase().includes('coordinate') ||
          content.toLowerCase().includes('lead') ||
          content.toLowerCase().includes('manage') ||
          content.toLowerCase().includes('team');
        
        expect(hasCoordination).toBe(true);
      });
    });
  });

  describe('Multi-Agent Scenario Validation', () => {
    it('should have agents for complete workflow coverage', () => {
      // Check for key workflow roles
      const requiredRoles = [
        'finance',      // Financial planning
        'development',  // Technical development
        'marketing',    // Marketing and content
        'operations',   // Operations and processes
        'innovation'    // Research and innovation
      ];

      requiredRoles.forEach(role => {
        const hasRoleAgent = agentFiles.some(filePath => {
          const content = fs.readFileSync(filePath, 'utf8').toLowerCase();
          return content.includes(role);
        });
        expect(hasRoleAgent).toBe(true);
      });
    });

    it('should have specialized agents for complex workflows', () => {
      const specializedAgents = agentFiles.filter(f => 
        f.includes('specialist') ||
        f.includes('analyst') ||
        f.includes('engineer') ||
        f.includes('developer')
      );

      expect(specializedAgents.length).toBeGreaterThanOrEqual(10);
    });
  });
});
