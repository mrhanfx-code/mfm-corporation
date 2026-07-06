import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TaskQueue, { type Task } from '../TaskQueue';

// Mock the api module
vi.mock('@/lib/api.client', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

// Mock the auth module
vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));

describe('TaskQueue', () => {
  const mockTasks: Task[] = [
    {
      id: 'task-1',
      agent: 'ops-coordinator',
      input: 'Process user request',
      status: 'running',
      qualityScore: 85,
      createdAt: '2026-07-04T10:00:00Z',
    },
    {
      id: 'task-2',
      agent: 'tech-advisor',
      input: 'Review code changes',
      status: 'queued',
      createdAt: '2026-07-04T10:05:00Z',
    },
    {
      id: 'task-3',
      agent: 'market-analyst',
      input: 'Analyze market trends',
      status: 'completed',
      qualityScore: 92,
      createdAt: '2026-07-04T09:00:00Z',
      completedAt: '2026-07-04T09:30:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders task queue with filter tabs', async () => {
    const { api } = await import('@/lib/api.client');
    (api.get as any).mockResolvedValue({ data: { tasks: mockTasks } });

    render(<TaskQueue />);

    await waitFor(() => {
      expect(screen.getByText('All (3)')).toBeInTheDocument();
      expect(screen.getByText('Queued (1)')).toBeInTheDocument();
      expect(screen.getByText('Running (1)')).toBeInTheDocument();
      expect(screen.getByText('Completed (1)')).toBeInTheDocument();
    });
  });

  it('displays tasks with correct status indicators', async () => {
    const { api } = await import('@/lib/api.client');
    (api.get as any).mockResolvedValue({ data: { tasks: mockTasks } });

    render(<TaskQueue />);

    await waitFor(() => {
      expect(screen.getByText('Running')).toBeInTheDocument();
      expect(screen.getByText('Queued')).toBeInTheDocument();
      expect(screen.getByText('Completed')).toBeInTheDocument();
    });
  });

  it('filters tasks by status', async () => {
    const { api } = await import('@/lib/api.client');
    (api.get as any).mockResolvedValue({ data: { tasks: mockTasks } });

    render(<TaskQueue />);

    await waitFor(() => {
      expect(screen.getByText('All (3)')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Running (1)'));

    await waitFor(() => {
      expect(screen.getByText('Process user request')).toBeInTheDocument();
      expect(screen.queryByText('Review code changes')).not.toBeInTheDocument();
    });
  });

  it('shows pause and stop buttons for running tasks', async () => {
    const { api } = await import('@/lib/api.client');
    (api.get as any).mockResolvedValue({ data: { tasks: mockTasks } });

    render(<TaskQueue />);

    await waitFor(() => {
      const pauseButton = screen.getByTitle('Pause task');
      const stopButton = screen.getByTitle('Stop task');
      expect(pauseButton).toBeInTheDocument();
      expect(stopButton).toBeInTheDocument();
    });
  });

  it('shows retry button for failed tasks', async () => {
    const failedTask: Task = {
      id: 'task-4',
      agent: 'ops-coordinator',
      input: 'Failed task',
      status: 'failed',
      createdAt: '2026-07-04T10:00:00Z',
    };

    const { api } = await import('@/lib/api.client');
    (api.get as any).mockResolvedValue({ data: { tasks: [failedTask] } });

    render(<TaskQueue />);

    await waitFor(() => {
      const retryButton = screen.getByTitle('Retry task');
      expect(retryButton).toBeInTheDocument();
    });
  });

  it('shows resume button for paused tasks', async () => {
    const pausedTask: Task = {
      id: 'task-5',
      agent: 'ops-coordinator',
      input: 'Paused task',
      status: 'paused',
      createdAt: '2026-07-04T10:00:00Z',
    };

    const { api } = await import('@/lib/api.client');
    (api.get as any).mockResolvedValue({ data: { tasks: [pausedTask] } });

    render(<TaskQueue />);

    await waitFor(() => {
      const resumeButton = screen.getByTitle('Resume task');
      expect(resumeButton).toBeInTheDocument();
    });
  });

  it('opens confirmation modal when task action clicked', async () => {
    const { api } = await import('@/lib/api.client');
    (api.get as any).mockResolvedValue({ data: { tasks: mockTasks } });

    render(<TaskQueue />);

    await waitFor(() => {
      const pauseButton = screen.getByTitle('Pause task');
      fireEvent.click(pauseButton);
    });

    await waitFor(() => {
      expect(screen.getByText('Pause Task')).toBeInTheDocument();
      expect(screen.getByText(/Are you sure you want to pause this task/)).toBeInTheDocument();
    });
  });

  it('executes task action when confirmed', async () => {
    const { api } = await import('@/lib/api.client');
    (api.get as any).mockResolvedValue({ data: { tasks: mockTasks } });
    (api.post as any).mockResolvedValue({ data: { success: true } });

    render(<TaskQueue />);

    await waitFor(() => {
      const pauseButton = screen.getByTitle('Pause task');
      fireEvent.click(pauseButton);
    });

    await waitFor(() => {
      const confirmButton = screen.getByText('Pause');
      fireEvent.click(confirmButton);
    });

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/commands', {
        command_type: 'pause',
        target: 'task-1',
        payload: { agent: 'ops-coordinator' },
      });
    });
  });

  it('displays loading state while fetching tasks', async () => {
    const { api } = await import('@/lib/api.client');
    (api.get as any).mockImplementation(() => new Promise(() => {}));

    render(<TaskQueue />);

    expect(screen.getByText('Loading tasks...')).toBeInTheDocument();
  });

  it('displays error message on fetch failure', async () => {
    const { api } = await import('@/lib/api.client');
    (api.get as any).mockResolvedValue({ error: 'Failed to fetch' });

    render(<TaskQueue />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to load tasks/)).toBeInTheDocument();
    });
  });

  it('shows empty state when no tasks', async () => {
    const { api } = await import('@/lib/api.client');
    (api.get as any).mockResolvedValue({ data: { tasks: [] } });

    render(<TaskQueue />);

    await waitFor(() => {
      expect(screen.getByText('No tasks found')).toBeInTheDocument();
    });
  });

  it('filters by agent when agent prop provided', async () => {
    const { api } = await import('@/lib/api.client');
    (api.get as any).mockResolvedValue({ data: { tasks: mockTasks } });

    render(<TaskQueue agent="ops-coordinator" />);

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith(expect.stringContaining('agent=ops-coordinator'));
    });
  });

  it('respects limit parameter', async () => {
    const { api } = await import('@/lib/api.client');
    (api.get as any).mockResolvedValue({ data: { tasks: mockTasks } });

    render(<TaskQueue limit={10} />);

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith(expect.stringContaining('limit=10'));
    });
  });

  it('displays task details correctly', async () => {
    const { api } = await import('@/lib/api.client');
    (api.get as any).mockResolvedValue({ data: { tasks: mockTasks } });

    render(<TaskQueue />);

    await waitFor(() => {
      expect(screen.getByText('Process user request')).toBeInTheDocument();
      expect(screen.getByText('ops-coordinator')).toBeInTheDocument();
      expect(screen.getByText('Quality: 85%')).toBeInTheDocument();
    });
  });
});
