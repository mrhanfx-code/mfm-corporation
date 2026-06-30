// Agent Initialization Test
// Tests: agent class instantiation, properties, and inheritance
import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..');
const AGENTS_DIR = path.join(ROOT, 'src', 'agents');

describe('Agent Initialization', () => {
  let agentClasses = [];

  beforeEach(async () => {
    // Dynamically import all agent classes
    function findAgentFiles(dir, files = []) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          findAgentFiles(fullPath, files);
        } else if (entry.name.endsWith('.js') && entry.name !== '.agent-template.js') {
          files.push(fullPath);
        }
      }
      return files;
    }

    const agentFiles = findAgentFiles(AGENTS_DIR);
    
    for (const filePath of agentFiles) {
      try {
        const module = await import(filePath);
        const exportedClasses = Object.values(module).filter(
          exp => typeof exp === 'function' && exp.name && exp.name !== 'AgentBase'
        );
        agentClasses.push(...exportedClasses);
      } catch (error) {
        // Skip files that can't be imported
      }
    }
  });

  it('should have at least 40 agent classes', () => {
    expect(agentClasses.length).toBeGreaterThanOrEqual(40);
  });

  describe('Agent Class Properties', () => {
    it('should validate agent properties for representative agents', () => {
      // Test a few representative agents from different departments
      const testAgents = agentClasses.slice(0, 10); // Test first 10 agents
      
      testAgents.forEach(AgentClass => {
        const className = AgentClass.name;
        
        expect(() => new AgentClass()).not.toThrow();
        
        const agent = new AgentClass();
        expect(agent.name).toBeDefined();
        expect(typeof agent.name).toBe('string');
        expect(agent.name.length).toBeGreaterThan(0);
        
        expect(agent.model).toBeDefined();
        expect(typeof agent.model).toBe('string');
        
        expect(agent.tools).toBeDefined();
        expect(Array.isArray(agent.tools)).toBe(true);
        
        expect(agent.systemPrompt).toBeDefined();
        expect(typeof agent.systemPrompt).toBe('string');
        expect(agent.systemPrompt.length).toBeGreaterThan(0);
        
        // Check for universal tool (d1-query is truly universal)
        expect(agent.tools).toContain('d1-query');
      });
    });
  });

  describe('Tool-Specific Validation', () => {
    it('content creation agents should have drive-write', () => {
      const contentCreationAgents = agentClasses.filter(AgentClass => 
        ['ContentWriter', 'MediaProducer', 'SocialMediaContentGenerator', 'SocialMediaManager']
          .includes(AgentClass.name)
      );

      contentCreationAgents.forEach(AgentClass => {
        const agent = new AgentClass();
        expect(agent.tools).toContain('drive-write');
      });
    });

    it('critical ops agents should have sms-alert', () => {
      const criticalOpsAgents = agentClasses.filter(AgentClass => 
        ['OperationsTeamLead', 'SupportTeamLead', 'QualityTeamLead']
          .includes(AgentClass.name)
      );

      criticalOpsAgents.forEach(AgentClass => {
        const agent = new AgentClass();
        expect(agent.tools).toContain('sms-alert');
      });
    });

    it('CMO team agents should have social-post', () => {
      const cmoTeamAgents = agentClasses.filter(AgentClass => 
        ['Cmo', 'MarketingTeamLead', 'SocialMediaManager', 'SocialMediaContentGenerator', 'SocialMediaChatAgent']
          .includes(AgentClass.name)
      );

      cmoTeamAgents.forEach(AgentClass => {
        const agent = new AgentClass();
        expect(agent.tools).toContain('social-post');
      });
    });
  });
});
