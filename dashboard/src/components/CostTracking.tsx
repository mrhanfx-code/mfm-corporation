import { useState, useEffect } from 'react';

interface CostData {
  total_cost: number;
  total_tokens: number;
  total_calls: number;
  by_model: Record<string, { cost: number; tokens: number; calls: number }>;
  by_task: Record<string, { cost: number; tokens: number; calls: number }>;
  period_days: number;
}

export function CostTracking() {
  const [costData, setCostData] = useState<CostData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);

  useEffect(() => {
    fetchCostData();
  }, [days]);

  const fetchCostData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`https://mfm-corporation-api.mrhan-fx.workers.dev/api/v1/dashboard/costs?days=${days}`);
      const data = await response.json();
      setCostData(data);
    } catch (error) {
      console.error('Failed to fetch cost data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!costData) {
    return (
      <div className="p-6">
        <p className="text-gray-500">Failed to load cost data</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Cost Tracking</h2>
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value={1}>Last 24 hours</option>
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500 mb-1">Total Cost</p>
          <p className="text-3xl font-bold text-gray-900">${costData.total_cost.toFixed(4)}</p>
          <p className="text-xs text-gray-400 mt-1">Last {costData.period_days} days</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500 mb-1">Total Tokens</p>
          <p className="text-3xl font-bold text-gray-900">{costData.total_tokens.toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-1">{costData.total_calls} API calls</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500 mb-1">Avg Cost per 1K Tokens</p>
          <p className="text-3xl font-bold text-gray-900">
            ${costData.total_tokens > 0 ? ((costData.total_cost / costData.total_tokens) * 1000).toFixed(4) : '0.0000'}
          </p>
          <p className="text-xs text-gray-400 mt-1">Cost efficiency</p>
        </div>
      </div>

      {/* Cost by Model */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Cost by Model</h3>
        {Object.keys(costData.by_model).length === 0 ? (
          <p className="text-gray-500">No data available</p>
        ) : (
          <div className="space-y-3">
            {Object.entries(costData.by_model).map(([model, data]) => (
              <div key={model} className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{model}</p>
                  <p className="text-xs text-gray-500">{data.calls} calls • {data.tokens.toLocaleString()} tokens</p>
                </div>
                <p className="text-sm font-semibold text-gray-900">${data.cost.toFixed(4)}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cost by Task Type */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Cost by Task Type</h3>
        {Object.keys(costData.by_task).length === 0 ? (
          <p className="text-gray-500">No data available</p>
        ) : (
          <div className="space-y-3">
            {Object.entries(costData.by_task).map(([task, data]) => (
              <div key={task} className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 capitalize">{task}</p>
                  <p className="text-xs text-gray-500">{data.calls} calls • {data.tokens.toLocaleString()} tokens</p>
                </div>
                <p className="text-sm font-semibold text-gray-900">${data.cost.toFixed(4)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
