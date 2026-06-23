import React, { useState, useEffect } from 'react';
import { Search, Trash2, Clock, Terminal, Mic } from 'lucide-react';
import { getCommandHistory, clearCommandHistory } from '../services/commandHistory';

export default function HistoryPanel() {
  const [history, setHistory] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  const loadHistory = () => {
    // getCommandHistory returns oldest first; we want newest first for the history view
    const h = getCommandHistory();
    setHistory([...h].reverse());
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleClear = () => {
    if (window.confirm('Are you sure you want to clear your entire activity history?')) {
      clearCommandHistory();
      loadHistory();
    }
  };

  const filteredHistory = history.filter((entry) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (entry.transcript ?? '').toLowerCase().includes(q) ||
      (entry.action ?? '').toLowerCase().includes(q) ||
      (entry.result ?? '').toLowerCase().includes(q)
    );
  });

  const getResultBadgeClass = (result) => {
    switch (result) {
      case 'SUCCESS':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'FALLBACK':
        return 'bg-amber-50 text-amber-700 border border-amber-200';
      case 'MISSING_TARGET':
        return 'bg-blue-50 text-blue-700 border border-blue-200';
      case 'DUPLICATE':
        return 'bg-purple-50 text-purple-700 border border-purple-200';
      case 'ERROR':
      default:
        return 'bg-red-50 text-red-700 border border-red-200';
    }
  };

  return (
    <div className="flex flex-col h-full mt-4 sm:mt-6 min-h-[400px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 px-1 shrink-0">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-stone-800">Command History</h2>
          <p className="text-xs text-stone-400 mt-0.5">Logs of all processed voice and manual commands</p>
        </div>
        {history.length > 0 && (
          <button
            onClick={handleClear}
            className="flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 px-3 py-2 rounded-xl transition-all border border-transparent hover:border-red-100"
            title="Clear all history"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Clear History</span>
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative mb-4 shrink-0 px-1">
        <Search className="absolute left-4 top-3 h-4 w-4 text-stone-400" />
        <input
          type="text"
          placeholder="Search command history..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white border border-stone-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-stone-700 placeholder-stone-400 outline-none focus:border-forest-600 focus:shadow-sm transition-all font-medium"
        />
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pb-4 px-1 min-h-0">
        {filteredHistory.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-stone-100 p-6">
            <Clock className="w-8 h-8 text-stone-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-stone-600">
              {searchQuery ? 'No matching logs found.' : 'No command history yet.'}
            </p>
            <p className="text-xs text-stone-400 mt-1">
              {searchQuery ? 'Try searching for different keywords.' : 'Run voice commands to log activity.'}
            </p>
          </div>
        ) : (
          filteredHistory.map((entry) => {
            const date = new Date(entry.timestamp);
            const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
            const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
            const isVoice = entry.source === 'ai' || entry.source === 'parser' || entry.source === 'fallback';

            return (
              <div
                key={entry.id}
                className="bg-white hover:bg-stone-50/50 border border-stone-200/60 rounded-xl p-3.5 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                    isVoice ? 'bg-forest-50 text-forest-700' : 'bg-stone-50 text-stone-600'
                  }`}>
                    {isVoice ? <Mic className="w-4 h-4" /> : <Terminal className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-stone-800 leading-snug">
                      {entry.transcript ? `"${entry.transcript}"` : '(Empty voice input)'}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[10px] text-stone-400 font-medium">
                      <span className="font-bold text-stone-500 uppercase tracking-wide bg-stone-100 px-1.5 py-0.5 rounded">
                        {entry.action}
                      </span>
                      <span>•</span>
                      <span>{dateStr}, {timeStr}</span>
                      {entry.task && (
                        <>
                          <span>•</span>
                          <span className="truncate max-w-[150px] italic">Target: {entry.task}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <span className={`text-[9px] font-bold px-2 py-1 rounded-full uppercase tracking-wider ${getResultBadgeClass(entry.result)}`}>
                    {entry.result}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
