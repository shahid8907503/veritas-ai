import React, { useState, useEffect } from 'react';
import { History, Trash2, Download, Search, AlertCircle, Calendar, Shield } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import GlassInput from '../components/GlassInput';
import NeonCard from '../components/NeonCard';

export default function ScanHistory({ token }) {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/analytics', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const stats = await res.json();
        setScans(stats.history || []);
      } else {
        setError('Failed to retrieve your scan log.');
      }
    } catch (err) {
      console.error(err);
      setError('Unable to connect to service. Check network.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [token]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this scan record?')) return;

    try {
      const res = await fetch(`/api/analytics/history/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        // Remove from list
        setScans(prev => prev.filter(item => item.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete history item:', err);
    }
  };

  const downloadReport = (scan) => {
    const reportText = `VERITAS AI - NEWS ACCURACY VERIFICATION REPORT
======================================================
Report ID:        ${scan.id}
Date Compiled:    ${new Date(scan.timestamp).toLocaleString()}
Classification:   ${scan.category.toUpperCase()}
Authenticity:     ${scan.authenticityScore}% Trust Rating
Engine Applied:   ${scan.engineUsed}
======================================================

ANALYZED EXCERPT:
"${scan.textSnippet}"

Source URL Check: ${scan.url || 'Not provided (Manual input / Upload)'}

======================================================
This report was generated autonomously by Veritas AI's multi-layered deep language models classifier. Verification is stored for educational and review purposes.
`;

    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Veritas_AI_Report_${scan.id}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getCategoryColor = (cat) => {
    switch (cat) {
      case 'Real News': return 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10';
      case 'Fake News': return 'text-red-400 border-red-500/20 bg-red-500/10';
      case 'Misleading News': return 'text-amber-400 border-amber-500/20 bg-amber-500/10';
      case 'Satire': return 'text-cyan-400 border-cyan-500/20 bg-cyan-500/10';
      default: return 'text-violet-400 border-violet-500/20 bg-violet-500/10';
    }
  };

  const filteredScans = scans.filter(s => 
    s.textSnippet.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Your Scan History</h1>
        <p className="text-slate-400 mt-1">Access detailed breakdowns, print logs, or remove entries from your classification history repository.</p>
      </div>

      <div className="space-y-4">
        {/* Search */}
        <GlassInput
          type="text"
          label="Search History"
          icon={Search}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search through past snippets or labels..."
          className="max-w-md mb-0"
        />

        {loading ? (
          <div className="py-20 text-center">
            <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-500 text-sm">Loading audit logs...</p>
          </div>
        ) : error ? (
          <div className="py-10 text-center text-red-400 bg-red-500/5 border border-red-500/10 rounded-2xl max-w-md mx-auto">
            <AlertCircle className="h-8 w-8 mx-auto mb-2 text-red-500" />
            <p>{error}</p>
          </div>
        ) : filteredScans.length === 0 ? (
          <div className="py-16 text-center border border-dashed border-slate-800 rounded-2xl bg-[#0a0b10]/20">
            <History className="h-10 w-10 text-slate-600 mx-auto mb-3" />
            <h3 className="font-bold text-slate-400">No scans logged</h3>
            <p className="text-xs text-slate-500 mt-1">Your evaluated news items will populate here automatically.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredScans.map((scan) => (
              <GlassCard key={scan.id} className="border border-white/5 flex flex-col justify-between h-56">
                
                {/* Top content */}
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${getCategoryColor(scan.category)}`}>
                      {scan.category}
                    </span>
                    <span className="text-xs font-black text-slate-300 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">
                      {scan.authenticityScore}% Trust
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed italic line-clamp-3">
                    "{scan.textSnippet}"
                  </p>
                </div>

                {/* Bottom options */}
                <div className="border-t border-slate-900 pt-3 flex items-center justify-between text-[11px] text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{new Date(scan.timestamp).toLocaleDateString()}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => downloadReport(scan)}
                      className="p-2 rounded-lg border text-indigo-400 hover:text-white transition-all duration-300"
                      style={{
                        borderColor: 'rgba(99, 102, 241, 0.4)',
                        backgroundColor: 'transparent'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = '0 0 10px #6366f1';
                        e.currentTarget.style.backgroundColor = '#6366f1';
                        e.currentTarget.style.borderColor = 'transparent';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = 'none';
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.4)';
                      }}
                      title="Download Verification Certificate"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(scan.id)}
                      className="p-2 rounded-lg border text-red-400 hover:text-white transition-all duration-300"
                      style={{
                        borderColor: 'rgba(239, 68, 68, 0.4)',
                        backgroundColor: 'transparent'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = '0 0 10px #f43f5e';
                        e.currentTarget.style.backgroundColor = '#f43f5e';
                        e.currentTarget.style.borderColor = 'transparent';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = 'none';
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.4)';
                      }}
                      title="Delete Log"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

              </GlassCard>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
