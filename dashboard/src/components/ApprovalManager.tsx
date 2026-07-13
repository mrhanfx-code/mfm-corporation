'use client';

import { useState, useEffect } from 'react';

interface ApprovalRequest {
  id: string;
  user_id: string;
  platform: string;
  content: string;
  media_url: string | null;
  scheduled_for: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  created_at: string;
  expires_at: string;
  approved_at: string | null;
  rejected_at: string | null;
  rejection_reason: string | null;
  metadata: string;
}

export default function ApprovalManager({ userId }: { userId: string }) {
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

  useEffect(() => {
    fetchApprovals();
  }, [userId, filter]);

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/v1/dashboard/approvals?userId=${userId}`);
      if (!response.ok) throw new Error('Failed to fetch approvals');
      const data = await response.json();
      setApprovals(data.approvals || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (approvalId: string) => {
    try {
      const response = await fetch(`/api/v1/dashboard/approvals/${approvalId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      if (!response.ok) throw new Error('Failed to approve');
      await fetchApprovals();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to approve');
    }
  };

  const handleReject = async (approvalId: string, reason: string) => {
    try {
      const response = await fetch(`/api/v1/dashboard/approvals/${approvalId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, reason })
      });
      if (!response.ok) throw new Error('Failed to reject');
      await fetchApprovals();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to reject');
    }
  };

  const filteredApprovals = approvals.filter(a => 
    filter === 'all' ? true : a.status === filter
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'expired': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'tiktok': return '🎵';
      case 'instagram': return '📸';
      case 'facebook': return '📘';
      default: return '📱';
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          Error: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Approval Queue</h2>
        <div className="flex gap-2">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg capitalize ${
                filter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {filteredApprovals.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg">No {filter === 'all' ? '' : filter} approvals found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredApprovals.map((approval) => (
            <div
              key={approval.id}
              className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getPlatformIcon(approval.platform)}</span>
                  <div>
                    <h3 className="font-semibold text-gray-900 capitalize">
                      {approval.platform} Post
                    </h3>
                    <p className="text-sm text-gray-500">
                      ID: <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                        {approval.id}
                      </code>
                    </p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(approval.status)}`}>
                  {approval.status}
                </span>
              </div>

              <div className="mb-4">
                <p className="text-gray-700 bg-gray-50 p-4 rounded-lg whitespace-pre-wrap">
                  {approval.content}
                </p>
              </div>

              {approval.media_url && (
                <div className="mb-4">
                  <p className="text-sm text-gray-500 mb-2">Media:</p>
                  <a
                    href={approval.media_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    View Media
                  </a>
                </div>
              )}

              {approval.scheduled_for && (
                <div className="mb-4">
                  <p className="text-sm text-gray-500">
                    Scheduled for: {new Date(approval.scheduled_for).toLocaleString('en-MY', { timeZone: 'Asia/Kuala_Lumpur' })}
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                <p>Created: {new Date(approval.created_at).toLocaleString('en-MY', { timeZone: 'Asia/Kuala_Lumpur' })}</p>
                <p>Expires: {new Date(approval.expires_at).toLocaleString('en-MY', { timeZone: 'Asia/Kuala_Lumpur' })}</p>
              </div>

              {approval.status === 'pending' && (
                <div className="flex gap-3">
                  <button
                    onClick={() => handleApprove(approval.id)}
                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => {
                      const reason = prompt('Rejection reason:');
                      if (reason) handleReject(approval.id, reason);
                    }}
                    className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Reject
                  </button>
                </div>
              )}

              {approval.status === 'rejected' && approval.rejection_reason && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">
                    <strong>Reason:</strong> {approval.rejection_reason}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
