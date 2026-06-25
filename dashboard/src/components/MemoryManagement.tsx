import { useState, useEffect } from 'react';

interface Memory {
  id: string;
  content: string;
  keywords: string;
  agent: string;
  pinned: number;
  created_at: number;
}

export function MemoryManagement() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [newMemory, setNewMemory] = useState('');

  useEffect(() => {
    fetchMemories();
  }, []);

  const fetchMemories = async () => {
    setLoading(true);
    try {
      // This would call the actual API - for now using mock data
      const mockMemories: Memory[] = [];
      setMemories(mockMemories);
    } catch (error) {
      console.error('Failed to fetch memories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMemory = async () => {
    if (!newMemory.trim()) return;
    try {
      // This would call the actual API via Telegram bot
      alert('Memory added via Telegram: /remember ' + newMemory);
      setNewMemory('');
    } catch (error) {
      console.error('Failed to add memory:', error);
    }
  };

  const handlePin = async (id: string) => {
    try {
      // This would call the actual API
      alert('Pin via Telegram: /pin ' + id);
    } catch (error) {
      console.error('Failed to pin memory:', error);
    }
  };

  const filteredMemories = memories.filter(m =>
    m.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.keywords.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Memory Management</h2>

      {/* Add Memory */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Memory</h3>
        <div className="flex gap-4">
          <input
            type="text"
            value={newMemory}
            onChange={(e) => setNewMemory(e.target.value)}
            placeholder="Enter memory content..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleAddMemory}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Add Memory
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Or use Telegram: <code className="bg-gray-100 px-2 py-1 rounded">/remember [content]</code>
        </p>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search memories..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Memory List */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Memories ({filteredMemories.length})
        </h3>
        {filteredMemories.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-2">No memories found</p>
            <p className="text-sm text-gray-400">
              Add memories via Telegram: <code className="bg-gray-100 px-2 py-1 rounded">/remember [content]</code>
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredMemories.map((memory) => (
              <div
                key={memory.id}
                className={`p-4 border rounded-lg ${
                  memory.pinned ? 'border-yellow-400 bg-yellow-50' : 'border-gray-200'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="text-sm text-gray-900 mb-2">{memory.content}</p>
                    <div className="flex gap-2 text-xs text-gray-500">
                      <span className="bg-gray-100 px-2 py-1 rounded">
                        {memory.agent}
                      </span>
                      <span className="bg-gray-100 px-2 py-1 rounded">
                        {memory.keywords}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handlePin(memory.id)}
                    className={`ml-4 px-3 py-1 text-sm rounded ${
                      memory.pinned
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {memory.pinned ? '📌 Pinned' : 'Pin'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Telegram Commands Reference */}
      <div className="mt-6 bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">Telegram Commands</h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <code className="bg-blue-100 px-2 py-1 rounded">/remember [content]</code>
            <span className="text-blue-800">Store a new memory</span>
          </div>
          <div className="flex items-center gap-2">
            <code className="bg-blue-100 px-2 py-1 rounded">/recall [query]</code>
            <span className="text-blue-800">Search memories by keywords</span>
          </div>
          <div className="flex items-center gap-2">
            <code className="bg-blue-100 px-2 py-1 rounded">/pin [memory-id]</code>
            <span className="text-blue-800">Pin important memory</span>
          </div>
          <div className="flex items-center gap-2">
            <code className="bg-blue-100 px-2 py-1 rounded">/unpin [memory-id]</code>
            <span className="text-blue-800">Unpin memory</span>
          </div>
        </div>
      </div>
    </div>
  );
}
