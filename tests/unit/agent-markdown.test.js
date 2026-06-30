// Agent Markdown File Validation Test
// Tests: agent markdown file structure, frontmatter, tools section
import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..');
const AGENTS_DIR = path.join(ROOT, 'src', 'agents');

describe('Agent Markdown Files', () => {
  let agentFiles = [];

  beforeEach(() => {
    // Recursively find all .md files in agents directory
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

  it('should have at least 60 agent files', () => {
    expect(agentFiles.length).toBeGreaterThanOrEqual(60);
  });

  describe('Frontmatter Validation', () => {
    it('should validate frontmatter for all agents', () => {
      agentFiles.forEach(filePath => {
        const relativePath = path.relative(ROOT, filePath);
        const content = fs.readFileSync(filePath, 'utf8');
        
        expect(content).toMatch(/^---\s*\n/);

        const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
        if (frontmatterMatch) {
          const frontmatter = frontmatterMatch[1];
          expect(frontmatter).toMatch(/agent_id:/);
          expect(frontmatter).toMatch(/agent_name:/);
          expect(frontmatter).toMatch(/team:/);
          expect(frontmatter).toMatch(/department:/);
          expect(frontmatter).toMatch(/reports_to:/);
          expect(frontmatter).toMatch(/position:/);
          expect(frontmatter).toMatch(/role:/);
          expect(frontmatter).toMatch(/created:/);
          expect(frontmatter).toMatch(/version:/);
          expect(frontmatter).toMatch(/status:/);
        }
      });
    });
  });

  describe('Tools Section Validation', () => {
    it('should validate tools section for all agents', () => {
      agentFiles.forEach(filePath => {
        const relativePath = path.relative(ROOT, filePath);
        const content = fs.readFileSync(filePath, 'utf8');
        
        expect(content).toMatch(/## Tools/);
        expect(content).toMatch(/d1-query:/);
        expect(content).toMatch(/web-fetch:/);
        expect(content).toMatch(/send-email:/);
        expect(content).toMatch(/slack-notify:/);
      });
    });
  });

  describe('Required Sections', () => {
    it('should validate required sections for all agents', () => {
      agentFiles.forEach(filePath => {
        const relativePath = path.relative(ROOT, filePath);
        const content = fs.readFileSync(filePath, 'utf8');
        
        expect(content).toMatch(/## Overview/);
        expect(content).toMatch(/## Position Details/);
        expect(content).toMatch(/## Responsibilities/);
        expect(content).toMatch(/## Capabilities/);
        expect(content).toMatch(/## Communication/);
        expect(content).toMatch(/## KPIs/);
        expect(content).toMatch(/## Dependencies/);
        expect(content).toMatch(/## Notes/);
      });
    });
  });

  describe('Tool-Specific Coverage', () => {
    it('should validate drive-write for content creation agents', () => {
      const contentCreationAgents = [
        'content-writer.md',
        'media-producer.md',
        'social-media-content-generator.md',
        'social-media-manager.md'
      ];

      contentCreationAgents.forEach(agentName => {
        const agentPath = agentFiles.find(f => f.endsWith(agentName));
        if (agentPath) {
          const content = fs.readFileSync(agentPath, 'utf8');
          expect(content).toMatch(/drive-write:/);
        }
      });
    });

    it('should validate sms-alert for critical ops agents', () => {
      const criticalOpsAgents = [
        'operations-team-lead.md',
        'support-team-lead.md',
        'quality-team-lead.md'
      ];

      criticalOpsAgents.forEach(agentName => {
        const agentPath = agentFiles.find(f => f.endsWith(agentName));
        if (agentPath) {
          const content = fs.readFileSync(agentPath, 'utf8');
          expect(content).toMatch(/sms-alert:/);
        }
      });
    });

    it('should validate social-post for CMO team agents', () => {
      const cmoTeamAgents = [
        'cmo.md',
        'marketing-team-lead.md',
        'social-media-manager.md',
        'social-media-content-generator.md',
        'social-media-chat-agent.md'
      ];

      cmoTeamAgents.forEach(agentName => {
        const agentPath = agentFiles.find(f => f.endsWith(agentName));
        if (agentPath) {
          const content = fs.readFileSync(agentPath, 'utf8');
          expect(content).toMatch(/social-post:/);
        }
      });
    });
  });
});
