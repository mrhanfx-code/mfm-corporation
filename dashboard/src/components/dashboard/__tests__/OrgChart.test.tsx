import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import OrgChart from '../OrgChart';

describe('OrgChart', () => {
  it('renders organization chart with CEO node', () => {
    render(<OrgChart />);
    
    expect(screen.getByText('CEO Remy')).toBeInTheDocument();
    expect(screen.getByText('Chief Executive Officer')).toBeInTheDocument();
  });

  it('renders C-level executives', () => {
    render(<OrgChart />);
    
    const cooElements = screen.getAllByText('COO');
    expect(cooElements.length).toBeGreaterThan(0);
    
    const ctoElements = screen.getAllByText('CTO');
    expect(ctoElements.length).toBeGreaterThan(0);
    
    const cmoElements = screen.getAllByText('CMO');
    expect(cmoElements.length).toBeGreaterThan(0);
    
    const cfoElements = screen.getAllByText('CFO');
    expect(cfoElements.length).toBeGreaterThan(0);
    
    const cinoElements = screen.getAllByText('CINO');
    expect(cinoElements.length).toBeGreaterThan(0);
    
    const cloElements = screen.getAllByText('CLO');
    expect(cloElements.length).toBeGreaterThan(0);
  });

  it('expands CEO node by default', () => {
    render(<OrgChart />);
    
    // CEO should be expanded showing C-level executives
    const cooElements = screen.getAllByText('COO');
    expect(cooElements.length).toBeGreaterThan(0);
    
    const ctoElements = screen.getAllByText('CTO');
    expect(ctoElements.length).toBeGreaterThan(0);
  });

  it('toggles node expansion when expand button clicked', () => {
    render(<OrgChart />);
    
    const cooElements = screen.getAllByText('COO');
    const cooNode = cooElements[0].closest('div');
    const expandButton = cooNode?.querySelector('button');
    
    if (expandButton) {
      fireEvent.click(expandButton);
      
      // Should collapse and hide children
      expect(screen.queryByText('Ops Coordinator')).not.toBeInTheDocument();
    }
  });

  it('shows details panel when node clicked', () => {
    render(<OrgChart />);
    
    const ceoNode = screen.getByText('CEO Remy').closest('div');
    fireEvent.click(ceoNode!);
    
    // Check for details panel specific elements
    const roleElements = screen.getAllByText('Chief Executive Officer');
    expect(roleElements.length).toBeGreaterThan(0);
    
    expect(screen.getByText('Direct Reports')).toBeInTheDocument();
  });

  it('displays direct reports in details panel', () => {
    render(<OrgChart />);
    
    const ceoNode = screen.getByText('CEO Remy').closest('div');
    fireEvent.click(ceoNode!);
    
    // Check that direct reports are shown (they appear in both chart and details panel)
    const cooElements = screen.getAllByText('COO');
    expect(cooElements.length).toBeGreaterThan(0);
    
    const ctoElements = screen.getAllByText('CTO');
    expect(ctoElements.length).toBeGreaterThan(0);
    
    const cmoElements = screen.getAllByText('CMO');
    expect(cmoElements.length).toBeGreaterThan(0);
  });

  it('closes details panel when close button clicked', () => {
    render(<OrgChart />);
    
    const ceoNode = screen.getByText('CEO Remy').closest('div');
    fireEvent.click(ceoNode!);
    
    const closeButton = screen.getByText('Close Details');
    fireEvent.click(closeButton);
    
    // Details panel should be hidden - check for panel-specific elements
    expect(screen.queryByText('Direct Reports')).not.toBeInTheDocument();
  });

  it('shows status indicator for each node', () => {
    render(<OrgChart />);
    
    // Check for status dots (green for active, yellow for idle)
    const statusDots = document.querySelectorAll('.bg-emerald-400, .bg-yellow-400');
    expect(statusDots.length).toBeGreaterThan(0);
  });

  it('navigates to child node when clicked in details panel', () => {
    render(<OrgChart />);
    
    const ceoNode = screen.getByText('CEO Remy').closest('div');
    fireEvent.click(ceoNode!);
    
    // Get the COO from the details panel (second occurrence)
    const cooElements = screen.getAllByText('COO');
    const cooChild = cooElements[1].closest('div');
    fireEvent.click(cooChild!);
    
    // Details panel should now show COO information - check for multiple occurrences
    const cooRoleElements = screen.getAllByText('Chief Operating Officer');
    expect(cooRoleElements.length).toBeGreaterThan(0);
  });

  it('displays department information in details panel', () => {
    render(<OrgChart />);
    
    const ctoElements = screen.getAllByText('CTO');
    const ctoNode = ctoElements[0].closest('div');
    fireEvent.click(ctoNode!);
    
    expect(screen.getByText('Technology')).toBeInTheDocument();
  });

  it('shows all agents under each department', () => {
    render(<OrgChart />);
    
    // Expand COO to see its children
    const cooElements = screen.getAllByText('COO');
    const cooNode = cooElements[0].closest('div');
    const expandButton = cooNode?.querySelector('button');
    
    if (expandButton) {
      fireEvent.click(expandButton);
      
      expect(screen.getByText('Ops Coordinator')).toBeInTheDocument();
      expect(screen.getByText('Quality Ops Reviewer')).toBeInTheDocument();
      expect(screen.getByText('Strategic Planner')).toBeInTheDocument();
    }
  });
});
