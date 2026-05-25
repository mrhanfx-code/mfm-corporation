import { Layout } from './Layout';

export function Dashboard() {
  return (
    <Layout>
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Agents</h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">43</p>
            <p className="text-sm text-green-600 dark:text-green-400 mt-1">All operational</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Tasks Today</h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">247</p>
            <p className="text-sm text-green-600 dark:text-green-400 mt-1">+12% from yesterday</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Avg Quality Score</h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">94.2</p>
            <p className="text-sm text-green-600 dark:text-green-400 mt-1">Excellent</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">System Uptime</h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">99.9%</p>
            <p className="text-sm text-green-600 dark:text-green-400 mt-1">24 hours</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">CEO Remy</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Requested market analysis</p>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">2 min ago</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Market Analyst</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Completed Q3 forecast</p>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">5 min ago</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Ops Coordinator</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Scheduled team meeting</p>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">12 min ago</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3">
              <button className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Send Command</p>
              </button>
              <button className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition">
                <p className="text-sm font-medium text-green-900 dark:text-green-100">View Tasks</p>
              </button>
              <button className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition">
                <p className="text-sm font-medium text-purple-900 dark:text-purple-100">Agent Status</p>
              </button>
              <button className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/30 transition">
                <p className="text-sm font-medium text-orange-900 dark:text-orange-100">Metrics</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
