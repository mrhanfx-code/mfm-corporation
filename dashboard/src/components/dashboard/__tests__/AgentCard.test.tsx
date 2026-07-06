import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AgentCard, { type Agent } from '../AgentCard';

// Mock the API module
vi.mock('@/lib/api.client', () => ({
  api: {
    post: vi.fn().mockResolvedValue({}),
  },
}));

describe('AgentCard', () => {
  const mockAgent: Agent = {
    id: 'agent-1',
    name: 'Test Agent',
    status: 'active',
    team: 'COO',
    taskCount: 5,
    qualityScore: 85,
    lastActivity: '2 minutes ago',
  };

  const mockOnStopped = vi.fn();

  it('renders agent information correctly', () => {
    render(<AgentCard agent={mockAgent} onStopped={mockOnStopped} />);
    
    expect(screen.getByText('Test Agent')).toBeInTheDocument();
    // Check for the stat values directly
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('85%')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('displays current activity when agent is active', () => {
    const agentWithActivity: Agent = {
      ...mockAgent,
      currentActivity: {
        task: 'Processing user request',
        timestamp: Date.now(),
      },
    };

    render(<AgentCard agent={agentWithActivity} onStopped={mockOnStopped} />);
    
    // The activity is displayed with a span separator
    expect(screen.getByText('Processing user request')).toBeInTheDocument();
  });

  it('shows last activity when no current activity', () => {
    render(<AgentCard agent={mockAgent} onStopped={mockOnStopped} />);
    
    // Check for the last activity timestamp
    expect(screen.getByText('2 minutes ago')).toBeInTheDocument();
  });

  it('displays stop button for active agents', () => {
    render(<AgentCard agent={mockAgent} onStopped={mockOnStopped} />);
    
    const stopButton = screen.getByLabelText(/Stop agent Test Agent/i);
    expect(stopButton).toBeInTheDocument();
    expect(stopButton).not.toBeDisabled();
  });

  it('disables stop button for stopped agents', () => {
    const stoppedAgent: Agent = { ...mockAgent, status: 'stopped' };
    
    render(<AgentCard agent={stoppedAgent} onStopped={mockOnStopped} />);
    
    const stopButton = screen.getByLabelText(/Stop agent Test Agent/i);
    expect(stopButton).toBeDisabled();
  });

  it('opens confirmation modal when stop button clicked', () => {
    render(<AgentCard agent={mockAgent} onStopped={mockOnStopped} />);
    
    const stopButton = screen.getByLabelText(/Stop agent Test Agent/i);
    fireEvent.click(stopButton);
    
    expect(screen.getByText(/Stop "Test Agent"/i)).toBeInTheDocument();
    expect(screen.getByText(/This agent will be stopped/)).toBeInTheDocument();
  });

  it('calls onStopped when stop is confirmed', async () => {
    render(<AgentCard agent={mockAgent} onStopped={mockOnStopped} />);
    
    const stopButton = screen.getByLabelText(/Stop agent Test Agent/i);
    fireEvent.click(stopButton);
    
    const confirmButton = screen.getByText('Stop Agent');
    fireEvent.click(confirmButton);
    
    // Wait for the dialog to close and callback to fire
    await new Promise(resolve => setTimeout(resolve, 10));
    
    expect(mockOnStopped).toHaveBeenCalledWith('agent-1');
  });

  it('renders different status colors correctly', () => {
    const { rerender } = render(<AgentCard agent={mockAgent} onStopped={mockOnStopped} />);
    
    // Active - green dot
    expect(screen.getByText('Active')).toBeInTheDocument();
    
    // Idle - gray dot
    const idleAgent: Agent = { ...mockAgent, status: 'idle' };
    rerender(<AgentCard agent={idleAgent} onStopped={mockOnStopped} />);
    expect(screen.getByText('Idle')).toBeInTheDocument();
    
    // Error - red dot
    const errorAgent: Agent = { ...mockAgent, status: 'error' };
    rerender(<AgentCard agent={errorAgent} onStopped={mockOnStopped} />);
    expect(screen.getByText('Error')).toBeInTheDocument();
    
    // Stopped - dark gray dot
    const stoppedAgent: Agent = { ...mockAgent, status: 'stopped' };
    rerender(<AgentCard agent={stoppedAgent} onStopped={mockOnStopped} />);
    expect(screen.getByText('Stopped')).toBeInTheDocument();
  });

  it('hides last activity when current activity is present', () => {
    const agentWithActivity: Agent = {
      ...mockAgent,
      currentActivity: {
        task: 'Processing task',
        timestamp: Date.now(),
      },
    };

    render(<AgentCard agent={agentWithActivity} onStopped={mockOnStopped} />);
    
    expect(screen.getByText('Processing task')).toBeInTheDocument();
    expect(screen.queryByText('Last:')).not.toBeInTheDocument();
  });
});
