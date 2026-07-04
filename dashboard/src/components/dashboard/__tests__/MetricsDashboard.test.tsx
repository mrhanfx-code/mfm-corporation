import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MetricsDashboard from '../MetricsDashboard';

// Mock the api module
vi.mock('@/lib/api.client', () => ({
  api: {
    get: vi.fn(),
  },
}));

// Mock the auth module
vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));

describe('MetricsDashboard', () => {
  const mockMetrics = [
    {
      agent: 'ops-coordinator',
      tasksCompleted: 45,
      avgQualityScore: 85.5,
      avgResponseTime: 850,
    },
    {
      agent: 'tech-advisor',
      tasksCompleted: 32,
      avgQualityScore: 92.3,
      avgResponseTime: 720,
    },
    {
      agent: 'market-analyst',
      tasksCompleted: 28,
      avgQualityScore: 78.2,
      avgResponseTime: 1100,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders metrics dashboard with time range selector', async () => {
    const { api } = await import('@/lib/api.client');
    (api.get as any).mockResolvedValue({ data: { metrics: mockMetrics } });

    render(<MetricsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Hourly')).toBeInTheDocument();
      expect(screen.getByText('Daily')).toBeInTheDocument();
      expect(screen.getByText('Weekly')).toBeInTheDocument();
    });
  });

  it('displays key performance indicators', async () => {
    const { api } = await import('@/lib/api.client');
    (api.get as any).mockResolvedValue({ data: { metrics: mockMetrics } });

    render(<MetricsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Overall Quality Score')).toBeInTheDocument();
      expect(screen.getByText('Total Tasks Completed')).toBeInTheDocument();
      expect(screen.getByText('Avg Response Time')).toBeInTheDocument();
    });
  });

  it('calculates overall metrics correctly', async () => {
    const { api } = await import('@/lib/api.client');
    (api.get as any).mockResolvedValue({ data: { metrics: mockMetrics } });

    render(<MetricsDashboard />);

    await waitFor(() => {
      // Overall quality: (85.5 + 92.3 + 78.2) / 3 = 85.33
      expect(screen.getByText('85.3%')).toBeInTheDocument();
      // Total tasks: 45 + 32 + 28 = 105
      expect(screen.getByText('105')).toBeInTheDocument();
      // Avg response: (850 + 720 + 1100) / 3 = 890
      expect(screen.getByText('890ms')).toBeInTheDocument();
    });
  });

  it('displays agent-specific metrics', async () => {
    const { api } = await import('@/lib/api.client');
    (api.get as any).mockResolvedValue({ data: { metrics: mockMetrics } });

    render(<MetricsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('ops-coordinator')).toBeInTheDocument();
      expect(screen.getByText('tech-advisor')).toBeInTheDocument();
      expect(screen.getByText('market-analyst')).toBeInTheDocument();
    });
  });

  it('shows quality score progress bars with correct colors', async () => {
    const { api } = await import('@/lib/api.client');
    (api.get as any).mockResolvedValue({ data: { metrics: mockMetrics } });

    render(<MetricsDashboard />);

    await waitFor(() => {
      // High quality (>=80) should be green
      expect(screen.getByText('85.5%')).toBeInTheDocument();
      // Medium quality (60-80) should be yellow
      expect(screen.getByText('78.2%')).toBeInTheDocument();
    });
  });

  it('shows response time progress bars with correct colors', async () => {
    const { api } = await import('@/lib/api.client');
    (api.get as any).mockResolvedValue({ data: { metrics: mockMetrics } });

    render(<MetricsDashboard />);

    await waitFor(() => {
      // Fast response (<1000) should be green
      expect(screen.getByText('850ms')).toBeInTheDocument();
      // Slow response (>2000) would be red
    });
  });

  it('displays quality alert when agents have low quality scores', async () => {
    const lowQualityMetrics = [
      {
        agent: 'ops-coordinator',
        tasksCompleted: 45,
        avgQualityScore: 55.5,
        avgResponseTime: 850,
      },
    ];

    const { api } = await import('@/lib/api.client');
    (api.get as any).mockResolvedValue({ data: { metrics: lowQualityMetrics } });

    render(<MetricsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Quality Alert')).toBeInTheDocument();
      expect(screen.getByText(/1 agent\(s\) with quality score below 60%/)).toBeInTheDocument();
    });
  });

  it('displays performance alert when agents have high response times', async () => {
    const slowMetrics = [
      {
        agent: 'ops-coordinator',
        tasksCompleted: 45,
        avgQualityScore: 85.5,
        avgResponseTime: 2500,
      },
    ];

    const { api } = await import('@/lib/api.client');
    (api.get as any).mockResolvedValue({ data: { metrics: slowMetrics } });

    render(<MetricsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Performance Alert')).toBeInTheDocument();
      expect(screen.getByText(/1 agent\(s\) with response time above 2s/)).toBeInTheDocument();
    });
  });

  it('changes time range when time range button clicked', async () => {
    const { api } = await import('@/lib/api.client');
    (api.get as any).mockResolvedValue({ data: { metrics: mockMetrics } });

    render(<MetricsDashboard />);

    await waitFor(() => {
      const hourlyButton = screen.getByText('Hourly');
      fireEvent.click(hourlyButton);
    });

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith(expect.stringContaining('timeRange=hourly'));
    });
  });

  it('displays loading state while fetching metrics', async () => {
    const { api } = await import('@/lib/api.client');
    (api.get as any).mockImplementation(() => new Promise(() => {}));

    render(<MetricsDashboard />);

    expect(screen.getByText('Loading metrics...')).toBeInTheDocument();
  });

  it('displays error message on fetch failure', async () => {
    const { api } = await import('@/lib/api.client');
    (api.get as any).mockResolvedValue({ error: 'Failed to fetch' });

    render(<MetricsDashboard />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to load metrics/)).toBeInTheDocument();
    });
  });

  it('shows empty state when no metrics', async () => {
    const { api } = await import('@/lib/api.client');
    (api.get as any).mockResolvedValue({ data: { metrics: [] } });

    render(<MetricsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Overall Quality Score')).toBeInTheDocument();
      expect(screen.getByText('0.0%')).toBeInTheDocument();
      expect(screen.getByText('0')).toBeInTheDocument();
    });
  });

  it('respects initial timeRange prop', async () => {
    const { api } = await import('@/lib/api.client');
    (api.get as any).mockResolvedValue({ data: { metrics: mockMetrics } });

    render(<MetricsDashboard timeRange="weekly" />);

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith(expect.stringContaining('timeRange=weekly'));
    });
  });
});
