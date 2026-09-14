'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, Clock, Info, Shield, Key, Flame, Trash2, PauseCircle, PlayCircle } from 'lucide-react';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [now, setNow] = useState(Date.now());
  const [origin, setOrigin] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    if (isHistoryOpen) {
      const h = JSON.parse(localStorage.getItem('whispernet_history') || '[]');
      setHistory(h);
      setNow(Date.now());
      const interval = setInterval(() => setNow(Date.now()), 1000);
      return () => clearInterval(interval);
    }
  }, [isHistoryOpen]);

  const clearHistory = () => {
    localStorage.removeItem('whispernet_history');
    setHistory([]);
  };

  const handleAction = async (id: string, action: 'pause' | 'resume' | 'delete') => {
    const item = history.find(h => h.id === id);
    if (!item || !item.adminToken) return;
    
    setActionLoading(id);
    try {
      const res = await fetch(`/api/secrets/${id}/manage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminToken: item.adminToken, action })
      });
      if (res.ok) {
        let updated = [...history];
        if (action === 'delete') {
          updated = updated.filter(h => h.id !== id);
        } else {
          updated = updated.map(h => h.id === id ? { ...h, isPaused: action === 'pause' } : h);
        }
        setHistory(updated);
        localStorage.setItem('whispernet_history', JSON.stringify(updated));
      }
    } catch (e) {
      console.error('Action failed', e);
    }
    setActionLoading(null);
  };

  const formatTime = (expiresAt: number) => {
    const diff = expiresAt - now;
    if (diff <= 0) return 'Expired';
    const d = Math.floor(diff / (1000 * 60 * 60 * 24));
    const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const m = Math.floor((diff / (1000 * 60)) % 60);
    const s = Math.floor((diff / 1000) % 60);
    if (d > 0) return `${d}d ${h}h ${m}m`;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    return `${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`;
  };

  return (
    <>
      <header className="flex items-center justify-between px-8 py-5 border-b border-[#1a2333] relative z-30">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="text-cyan-400">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 12l5.25 5 2.625-3 2.625 3 2.625-3 2.625 3 5.25-5" />
            </svg>
          </div>
          <span className="font-bold text-[1.35rem] text-white tracking-tight">WhisperNet</span>
        </Link>
        
        <nav className="hidden md:flex gap-8 text-sm font-medium text-slate-300 absolute left-1/2 -translate-x-1/2">
          <Link href="/" className="hover:text-cyan-400 transition">Secure Share</Link>
          <button onClick={() => setIsAboutOpen(true)} className="hover:text-white transition">How It Works</button>
          <Link href="#" className="hover:text-white transition">Pricing</Link>
        </nav>

        <div className="flex items-center gap-3">
          <button className="hidden sm:block bg-[#121722] border border-[#242c3d] hover:bg-[#1a2333] hover:border-slate-600 text-white px-5 py-2 rounded-lg text-sm font-medium transition shadow-sm">
            Download
          </button>
          <div className="relative">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)} 
              className="p-2 bg-[#121722] border border-[#242c3d] hover:bg-[#1a2333] text-white rounded-lg transition flex items-center justify-center shadow-sm"
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            
            {isMenuOpen && (
              <div className="absolute right-0 mt-3 w-56 bg-[#121722] border border-[#242c3d] rounded-xl shadow-2xl overflow-hidden z-40 animate-in slide-in-from-top-2 fade-in duration-200">
                <button 
                  onClick={() => { setIsHistoryOpen(true); setIsMenuOpen(false); }} 
                  className="w-full text-left px-4 py-3.5 flex items-center gap-3 hover:bg-[#1a2333] text-slate-200 transition font-medium text-sm"
                >
                  <Clock className="w-4 h-4 text-cyan-400" /> My Secrets History
                </button>
                <button 
                  onClick={() => { setIsAboutOpen(true); setIsMenuOpen(false); }} 
                  className="w-full text-left px-4 py-3.5 flex items-center gap-3 hover:bg-[#1a2333] text-slate-200 transition font-medium text-sm border-t border-[#242c3d]"
                >
                  <Info className="w-4 h-4 text-cyan-400" /> About WhisperNet
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* History Modal */}
      {isHistoryOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#121722] border border-[#242c3d] rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 md:px-7 border-b border-[#242c3d]">
              <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
                <Clock className="text-cyan-400 w-5 h-5"/> My Secrets History
              </h2>
              <button onClick={() => setIsHistoryOpen(false)} className="text-slate-400 hover:text-white transition bg-slate-800/50 hover:bg-slate-800 p-1.5 rounded-lg">
                <X className="w-5 h-5"/>
              </button>
            </div>
            
            <div className="p-5 md:px-7 overflow-y-auto flex-1 space-y-4">
              {history.length === 0 ? (
                <div className="text-center text-slate-500 py-16 flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-[#0a0f18] border border-[#242c3d] flex items-center justify-center mb-4">
                    <Clock className="w-7 h-7 text-slate-600" />
                  </div>
                  <p>No secrets generated yet.</p>
                </div>
              ) : (
                history.map((item, i) => {
                  const expired = item.expiresAt <= now;
                  return (
                    <div key={i} className={`bg-[#0a0f18] border ${expired ? 'border-red-500/20' : item.isPaused ? 'border-orange-500/30' : 'border-[#242c3d]'} rounded-xl p-4 md:p-5 flex flex-col md:flex-row justify-between gap-4 transition-colors`}>
                      <div className="space-y-2 min-w-0 flex-1">
                        <div className="text-[14.5px] text-slate-300 flex items-center gap-2">
                          Token: <span className={`font-mono font-bold px-2 py-0.5 rounded ${expired ? 'bg-red-500/10 text-red-400' : item.isPaused ? 'bg-orange-500/10 text-orange-400' : 'bg-yellow-500/10 text-yellow-400'}`}>{item.token}</span>
                          {item.isPaused && <span className="bg-orange-500/20 text-orange-400 text-[11px] px-2 py-0.5 rounded uppercase font-bold tracking-wider border border-orange-500/20">Paused</span>}
                        </div>
                        <div className="text-[13px] text-slate-500 font-mono truncate cursor-default max-w-[280px]">
                          {origin}/secret/{item.id}
                        </div>
                        {item.adminToken && !expired && (
                          <div className="flex items-center gap-3 pt-2">
                            {item.isPaused ? (
                              <button 
                                onClick={() => handleAction(item.id, 'resume')}
                                disabled={actionLoading === item.id}
                                className="flex items-center gap-1.5 text-xs font-semibold text-green-400 hover:text-green-300 bg-green-500/10 hover:bg-green-500/20 px-3 py-1.5 rounded-md transition disabled:opacity-50"
                              >
                                <PlayCircle className="w-3.5 h-3.5" /> Resume Access
                              </button>
                            ) : (
                              <button 
                                onClick={() => handleAction(item.id, 'pause')}
                                disabled={actionLoading === item.id}
                                className="flex items-center gap-1.5 text-xs font-semibold text-orange-400 hover:text-orange-300 bg-orange-500/10 hover:bg-orange-500/20 px-3 py-1.5 rounded-md transition disabled:opacity-50"
                              >
                                <PauseCircle className="w-3.5 h-3.5" /> Pause Access
                              </button>
                            )}
                            
                            {confirmDelete === item.id ? (
                              <div className="flex items-center gap-1.5 animate-in fade-in slide-in-from-right-2">
                                <span className="text-xs text-slate-400 mr-1">Sure?</span>
                                <button 
                                  onClick={() => {
                                    handleAction(item.id, 'delete');
                                    setConfirmDelete(null);
                                  }}
                                  className="text-xs font-semibold text-white bg-red-500 hover:bg-red-600 px-2.5 py-1.5 rounded-md transition"
                                >
                                  Yes
                                </button>
                                <button 
                                  onClick={() => setConfirmDelete(null)}
                                  className="text-xs font-semibold text-slate-300 bg-slate-700 hover:bg-slate-600 px-2.5 py-1.5 rounded-md transition"
                                >
                                  No
                                </button>
                              </div>
                            ) : (
                              <button 
                                onClick={() => setConfirmDelete(item.id)}
                                disabled={actionLoading === item.id}
                                className="flex items-center gap-1.5 text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/10 px-2 py-1.5 rounded-md transition disabled:opacity-50"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="shrink-0 flex flex-row md:flex-col justify-between items-center md:items-end">
                        <div className={`text-[14px] font-bold tracking-wide ${expired ? 'text-red-400' : item.isPaused ? 'text-orange-400' : 'text-cyan-400'}`}>
                          {formatTime(item.expiresAt)}
                        </div>
                        <div className="text-[12px] text-slate-500 md:mt-1 font-medium">
                          {new Date(item.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
            
            {history.length > 0 && (
              <div className="p-4 md:px-7 border-t border-[#242c3d] bg-[#0a0f18] flex justify-end rounded-b-2xl">
                <button onClick={clearHistory} className="flex items-center gap-2 text-red-400 hover:text-red-300 text-sm font-semibold transition px-4 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20">
                  <Trash2 className="w-4 h-4"/> Clear History
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* About Modal */}
      {isAboutOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#121722] border border-[#242c3d] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 md:p-8 space-y-6 max-h-[85vh] overflow-y-auto">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-cyan-400 bg-cyan-500/10 p-2 rounded-xl">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12l5.25 5 2.625-3 2.625 3 2.625-3 2.625 3 5.25-5" /></svg>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white tracking-tight leading-none">WhisperNet</h2>
                    <span className="text-cyan-400 text-sm font-semibold">Secure Secret Share</span>
                  </div>
                </div>
                <button onClick={() => setIsAboutOpen(false)} className="text-slate-400 hover:text-white transition bg-slate-800/50 hover:bg-slate-800 p-1.5 rounded-lg"><X className="w-5 h-5"/></button>
              </div>
              
              <div className="text-slate-300 space-y-5 leading-relaxed text-[15px]">
                <p>
                  WhisperNet is a zero-compromise, hyper-secure platform designed for sharing sensitive information like production passwords, API keys, and private messages. 
                </p>
                
                <div className="space-y-3 mt-4">
                  <div className="flex items-start gap-3.5 bg-[#0a0f18] p-4 rounded-xl border border-[#242c3d]">
                    <Shield className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white block mb-1 text-[15px]">Military-Grade Encryption</strong>
                      <span className="text-sm text-slate-400">Your secrets are encrypted on a secure backend using standard AES-256-GCM authenticated cryptography.</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3.5 bg-[#0a0f18] p-4 rounded-xl border border-[#242c3d]">
                    <Key className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white block mb-1 text-[15px]">Hardened Key Derivation</strong>
                      <span className="text-sm text-slate-400">We utilize asynchronous Scrypt with memory-hard parameters to derive keys, fiercely protecting against brute-force attacks.</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3.5 bg-[#0a0f18] p-4 rounded-xl border border-[#242c3d]">
                    <Flame className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white block mb-1 text-[15px]">Burn on Read Validation</strong>
                      <span className="text-sm text-slate-400">The moment a secret is successfully decrypted, it is permanently purged from the database in the exact same execution cycle.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-[#242c3d] bg-[#0a0f18] text-center">
              <span className="text-slate-500 text-sm font-medium">Version 1.0.0 &bull; Fast, Hard & Secure by Design</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
