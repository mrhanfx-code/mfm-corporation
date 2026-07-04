import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Sidebar from '../Sidebar';

describe('Sidebar', () => {
  const mockOnTeamChange = vi.fn();

  it('renders sidebar with main navigation items', () => {
    render(<Sidebar activeTeam="dashboard" onTeamChange={mockOnTeamChange} />);
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Agents')).toBeInTheDocument();
    expect(screen.getByText('Tasks')).toBeInTheDocument();
    expect(screen.getByText('Metrics')).toBeInTheDocument();
    expect(screen.getByText('Org Chart')).toBeInTheDocument();
  });

  it('renders department teams section', () => {
    render(<Sidebar activeTeam="all" onTeamChange={mockOnTeamChange} />);
    
    expect(screen.getByText('Department Teams')).toBeInTheDocument();
    expect(screen.getByText('All Agents')).toBeInTheDocument();
    expect(screen.getByText('COO Team')).toBeInTheDocument();
    expect(screen.getByText('CTO Team')).toBeInTheDocument();
    expect(screen.getByText('CMO Team')).toBeInTheDocument();
    expect(screen.getByText('CFO Team')).toBeInTheDocument();
    expect(screen.getByText('CINO Team')).toBeInTheDocument();
    expect(screen.getByText('CLO Team')).toBeInTheDocument();
  });

  it('renders global controls section', () => {
    render(<Sidebar activeTeam="settings" onTeamChange={mockOnTeamChange} />);
    
    expect(screen.getByText('Controls')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('Logs')).toBeInTheDocument();
  });

  it('highlights active navigation item', () => {
    render(<Sidebar activeTeam="dashboard" onTeamChange={mockOnTeamChange} />);
    
    const dashboardButton = screen.getByText('Dashboard');
    expect(dashboardButton).toHaveClass('bg-emerald-500/10');
    expect(dashboardButton).toHaveClass('text-emerald-400');
  });

  it('calls onTeamChange when navigation item clicked', () => {
    render(<Sidebar activeTeam="dashboard" onTeamChange={mockOnTeamChange} />);
    
    const agentsButton = screen.getByText('Agents');
    fireEvent.click(agentsButton);
    
    expect(mockOnTeamChange).toHaveBeenCalledWith('agents');
  });

  it('toggles collapse state when collapse button clicked', () => {
    render(<Sidebar activeTeam="dashboard" onTeamChange={mockOnTeamChange} />);
    
    const collapseButton = screen.getByTitle('Collapse sidebar');
    fireEvent.click(collapseButton);
    
    // Sidebar should collapse (width changes from w-56 to w-16)
    // Department teams section should be hidden when collapsed
    expect(screen.queryByText('Department Teams')).not.toBeInTheDocument();
  });

  it('expands sidebar when collapse button clicked while collapsed', () => {
    render(<Sidebar activeTeam="dashboard" onTeamChange={mockOnTeamChange} />);
    
    const collapseButton = screen.getByTitle('Collapse sidebar');
    fireEvent.click(collapseButton);
    
    const expandButton = screen.getByTitle('Expand sidebar');
    fireEvent.click(expandButton);
    
    expect(screen.getByText('Department Teams')).toBeInTheDocument();
  });

  it('shows icons in collapsed mode', () => {
    render(<Sidebar activeTeam="dashboard" onTeamChange={mockOnTeamChange} />);
    
    const collapseButton = screen.getByTitle('Collapse sidebar');
    fireEvent.click(collapseButton);
    
    // Icons should still be visible
    expect(screen.getByText('📊')).toBeInTheDocument();
    expect(screen.getByText('🤖')).toBeInTheDocument();
  });

  it('hides labels in collapsed mode', () => {
    render(<Sidebar activeTeam="dashboard" onTeamChange={mockOnTeamChange} />);
    
    const collapseButton = screen.getByTitle('Collapse sidebar');
    fireEvent.click(collapseButton);
    
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
    expect(screen.queryByText('Agents')).not.toBeInTheDocument();
  });

  it('shows tooltips on navigation items in collapsed mode', () => {
    render(<Sidebar activeTeam="dashboard" onTeamChange={mockOnTeamChange} />);
    
    const collapseButton = screen.getByTitle('Collapse sidebar');
    fireEvent.click(collapseButton);
    
    const dashboardIcon = screen.getByText('📊').closest('button');
    expect(dashboardIcon).toHaveAttribute('title', 'Dashboard');
  });

  it('renders MFM Corp branding', () => {
    render(<Sidebar activeTeam="dashboard" onTeamChange={mockOnTeamChange} />);
    
    expect(screen.getByText('MFM Corp')).toBeInTheDocument();
    expect(screen.getByText('Command Center')).toBeInTheDocument();
  });

  it('hides branding text in collapsed mode', () => {
    render(<Sidebar activeTeam="dashboard" onTeamChange={mockOnTeamChange} />);
    
    const collapseButton = screen.getByTitle('Collapse sidebar');
    fireEvent.click(collapseButton);
    
    expect(screen.queryByText('MFM Corp')).not.toBeInTheDocument();
    expect(screen.queryByText('Command Center')).not.toBeInTheDocument();
  });

  it('maintains M logo in collapsed mode', () => {
    render(<Sidebar activeTeam="dashboard" onTeamChange={mockOnTeamChange} />);
    
    const collapseButton = screen.getByTitle('Collapse sidebar');
    fireEvent.click(collapseButton);
    
    expect(screen.getByText('M')).toBeInTheDocument();
  });
});
