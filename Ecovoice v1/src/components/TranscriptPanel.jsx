import React, { useEffect, useRef } from 'react';
import { History, Trash2, Volume2 } from 'lucide-react';

function TranscriptEntry({ entry }) {
  const isUser = entry.type === 'user';
  return (
    <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
      <div
        className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
          isUser
            ? 'bg-emerald-600 text-slate-950 font-medium rounded-tr-none'
            : 'bg-slate-800 text-slate-100 border border-slate-700 rounded-tl-none'
        }`}
      >
        {entry.text}
      </div>
      <span className="text-[10px] text-slate-500 mt-1 px-1">
        {new Date(entry.timestamp).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })}
      </span>
    </div>
  );
}

export default function TranscriptPanel({ entries = [], onClear }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries]);

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
      {/* Panel Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <History className="w-4 h-4 text-emerald-400" />
          Transcript
        </div>
        <button
          onClick={onClear}
          title="Clear transcript"
          className="text-slate-500 hover:text-rose-400 transition-colors p-1 rounded-lg hover:bg-slate-800"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Entries */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-slate-600 gap-3">
            <Volume2 className="w-10 h-10 stroke-[1.5]" />
            <p className="text-sm">No transcript yet.<br />Activate the microphone to begin.</p>
          </div>
        ) : (
          entries.map((entry) => (
            <TranscriptEntry key={entry.id} entry={entry} />
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
