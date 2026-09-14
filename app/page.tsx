'use client';
import { useState, useEffect } from 'react';
import { Check, Copy, Clock, Flame, Lock, ShieldCheck, Plus, QrCode, X, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import Header from '@/components/Header';
import QRCode from 'react-qr-code';

export default function Home() {
  const [secret, setSecret] = useState('');
  const [expiration, setExpiration] = useState('3600');
  const [passphrase, setPassphrase] = useState('');
  const [burnOnRead, setBurnOnRead] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ id: string; token: string; expiresAt: number; adminToken: string } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');
  const [showQR, setShowQR] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!result) return;
    const interval = setInterval(() => {
      const now = Date.now();
      const diff = result.expiresAt - now;
      if (diff <= 0) {
        setTimeLeft('Expired');
        clearInterval(interval);
      } else {
        const d = Math.floor(diff / (1000 * 60 * 60 * 24));
        const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const m = Math.floor((diff / 1000 / 60) % 60);
        const s = Math.floor((diff / 1000) % 60);
        
        if (d > 0) {
          setTimeLeft(`${d}d ${h}h ${m}m`);
        } else if (h > 0) {
          setTimeLeft(`${h}h ${m}m ${s}s`);
        } else {
          setTimeLeft(`${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')} minutes`);
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [result]);

  const handleEncrypt = async () => {
    if (!secret) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/secrets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret, expiration, passphrase, burnOnRead })
      });
      const data = await res.json();
      if (res.ok && data.id) {
        setResult(data);
        try {
          const historyItem = {
            id: data.id,
            token: data.token,
            adminToken: data.adminToken,
            expiresAt: data.expiresAt,
            createdAt: Date.now(),
            isPaused: false
          };
          const existing = JSON.parse(localStorage.getItem('whispernet_history') || '[]');
          localStorage.setItem('whispernet_history', JSON.stringify([historyItem, ...existing]));
        } catch (err) {
          console.error('Failed to save history', err);
        }
      } else {
        setError(data.error || 'Failed to encrypt secret and generate link');
      }
    } catch (e) {
      console.error(e);
      setError('Unable to reach server to encrypt secret. Please check your connection.');
    }
    setLoading(false);
  };

  const handleReset = () => {
    setSecret('');
    setPassphrase('');
    setExpiration('3600');
    setBurnOnRead(false);
    setResult(null);
    setShowQR(false);
    setError(null);
  };

  const linkUrl = result && typeof window !== 'undefined' ? `${window.location.origin}/secret/${result.id}` : '';
  const displayLinkUrl = result && typeof window !== 'undefined' ? `${window.location.host}/secret/${result.id.slice(0, 8)}...` : '';

  const copyToClipboard = (text: string, type: 'link' | 'token') => {
    navigator.clipboard.writeText(text);
    if (type === 'link') {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } else {
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#0a0f18] text-slate-300 font-sans selection:bg-cyan-500/30">
      <Header />

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center p-6 w-full max-w-6xl mx-auto py-12 md:py-20">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-4xl font-extrabold text-white mb-4 tracking-tight">
            <span className="text-cyan-400">WhisperNet</span> One-Time Secret Share
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto text-[17px] leading-relaxed">
            Encrypt, share, and self-destruct. Send sensitive data securely with a single-use access token.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-10 w-full max-w-5xl mx-auto">
          {/* Left Panel */}
          <div className="space-y-4 flex flex-col">
            <h2 className="text-xl font-bold text-white mb-1 shrink-0">1. Create Encrypted Secret</h2>
            <div className={`bg-[#121722] border border-[#1a2333] p-6 rounded-2xl shadow-xl flex-1 flex flex-col transition-all duration-300 ${result ? 'opacity-50 pointer-events-none' : ''}`}>
              <textarea
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                disabled={!!result}
                placeholder="The database password for production is:&#10;p@ssw0rd123!"
                className="w-full flex-1 min-h-[140px] bg-[#0a0f18] border border-[#242c3d] rounded-xl p-4 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition resize-none leading-relaxed text-[15px]"
              />
              
              <div className="space-y-4 mt-5 mb-5 shrink-0">
                <div className="relative">
                  <select
                    value={expiration}
                    onChange={(e) => setExpiration(e.target.value)}
                    disabled={!!result}
                    className="w-full bg-[#0a0f18] border border-[#242c3d] rounded-xl p-3.5 text-slate-300 text-[15px] focus:outline-none focus:border-cyan-500/50 appearance-none pr-10 disabled:opacity-80"
                  >
                    <option value="300">Expiration: 5 Minutes</option>
                    <option value="900">Expiration: 15 Minutes</option>
                    <option value="1800">Expiration: 30 Minutes</option>
                    <option value="3600">Expiration: 1 Hour</option>
                    <option value="43200">Expiration: 12 Hours</option>
                    <option value="86400">Expiration: 24 Hours</option>
                    <option value="259200">Expiration: 3 Days</option>
                    <option value="604800">Expiration: 7 Days</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-slate-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
                
                <input
                  type="password"
                  value={passphrase}
                  onChange={(e) => setPassphrase(e.target.value)}
                  disabled={!!result}
                  placeholder="Access passphrase (optional)"
                  className="w-full bg-[#0a0f18] border border-[#242c3d] rounded-xl p-3.5 text-slate-300 text-[15px] focus:outline-none focus:border-cyan-500/50 disabled:opacity-80"
                />

                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative flex items-center justify-center">
                    <input 
                      type="checkbox" 
                      checked={burnOnRead}
                      onChange={(e) => setBurnOnRead(e.target.checked)}
                      disabled={!!result}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${burnOnRead ? 'bg-orange-500 border-orange-500' : 'bg-[#0a0f18] border-[#242c3d] group-hover:border-cyan-500/50'} ${!!result && 'opacity-50'}`}>
                      {burnOnRead && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-slate-200 text-sm font-medium">Burn after reading (Single-use)</span>
                    <span className="text-slate-500 text-[12px]">If unchecked, link remains active until expiration time</span>
                  </div>
                </label>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm flex items-center gap-2 shrink-0">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                onClick={handleEncrypt}
                disabled={loading || !secret || !!result}
                className={`w-full font-bold text-[17px] rounded-xl py-3.5 mt-auto shrink-0 transition ${
                  result 
                    ? 'bg-[#1a2333] text-slate-500 border border-[#242c3d]' 
                    : 'bg-cyan-400 hover:bg-cyan-300 text-black shadow-[0_0_20px_rgba(34,211,238,0.2)] hover:shadow-[0_0_25px_rgba(34,211,238,0.3)] disabled:opacity-50 disabled:cursor-not-allowed'
                }`}
              >
                {loading ? 'Encrypting...' : result ? 'Encrypted & Locked' : 'Encrypt & Generate Link'}
              </button>
            </div>
          </div>

          {/* Right Panel */}
          <div className="space-y-4 flex flex-col">
            <h2 className="text-xl font-bold text-white mb-1 shrink-0">2. Your Secure Token & Link</h2>
            <div className={`bg-[#121722] border ${result ? 'border-[#242c3d] ring-1 ring-cyan-500/10' : 'border-[#1a2333]'} p-5 sm:p-6 rounded-2xl shadow-xl flex-1 flex flex-col transition-all duration-300`}>
              {result ? (
                <div className="space-y-5 animate-in fade-in zoom-in-95 duration-300 flex-1 flex flex-col">
                  
                  <div className="flex items-center gap-2.5 shrink-0">
                    <div className="w-[22px] h-[22px] rounded-full bg-green-500 flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5 text-[#121722] stroke-[3]" />
                    </div>
                    <span className="text-white font-medium text-[15.5px]">Your message has been encrypted!</span>
                  </div>

                  <div className="space-y-3 shrink-0 min-w-0">
                    <div className="bg-[#0a0f18] border border-[#242c3d] rounded-xl p-3.5 sm:p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-3 sm:gap-4 group min-w-0">
                      <div className="flex flex-col gap-1 min-w-0 flex-1">
                        <span className="text-slate-300 text-[14.5px] shrink-0">Encrypted Link</span>
                        <span className="text-cyan-400 text-[15px] truncate w-full block">{displayLinkUrl}</span>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button 
                          onClick={() => setShowQR(true)}
                          className="flex items-center justify-center p-2 rounded-lg border border-[#242c3d] hover:bg-[#1a2333] text-slate-300 transition bg-[#121722]"
                          title="View QR Code"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => copyToClipboard(linkUrl, 'link')}
                          className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-[#242c3d] hover:bg-[#1a2333] text-slate-300 text-sm font-medium transition bg-[#121722]"
                        >
                          <Copy className="w-4 h-4" />
                          {copiedLink ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                    </div>

                    <div className="bg-[#0a0f18] border border-cyan-500/30 rounded-xl p-3.5 sm:p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-3 sm:gap-4 group shadow-[0_0_15px_rgba(6,182,212,0.05)] min-w-0">
                      <div className="flex flex-col gap-1 min-w-0 flex-1">
                        <span className="text-slate-300 text-[14.5px] shrink-0">Secret Token</span>
                        <span className="text-yellow-400 font-bold text-[17px] tracking-wide truncate w-full block">{result.token}</span>
                      </div>
                      <button 
                        onClick={() => copyToClipboard(result.token, 'token')}
                        className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-[#242c3d] hover:bg-[#1a2333] text-slate-300 text-sm font-medium transition shrink-0 bg-[#121722] w-full sm:w-auto"
                      >
                        <Copy className="w-4 h-4" />
                        {copiedToken ? 'Copied' : 'Copy Token'}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2 text-[14px] shrink-0">
                    <div className="flex items-center gap-2.5 text-slate-400">
                      <Clock className="w-4 h-4" />
                      <span>Expires in {timeLeft}</span>
                    </div>
                    {burnOnRead ? (
                      <div className="flex items-center gap-2.5">
                        <Flame className="w-4 h-4 text-orange-500 shrink-0" />
                        <span className="text-white">Single-Use: Destroys automatically after first view.</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2.5">
                        <ShieldCheck className="w-4 h-4 text-green-500 shrink-0" />
                        <span className="text-white">Multi-Use: Active until expiration time.</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-slate-400">
                      <div className="flex items-center gap-2.5">
                        <ShieldCheck className="w-4 h-4 text-cyan-500/80" />
                        <span className="text-white">AES-256 Cryptography</span>
                      </div>
                      <Lock className="w-4 h-4 opacity-50" />
                    </div>
                  </div>

                  {/* Reset/New Secret Action at the bottom */}
                  <div className="pt-6 mt-auto shrink-0">
                    <button
                      onClick={handleReset}
                      className="w-full bg-[#1a2333] hover:bg-slate-700 border border-[#242c3d] text-white font-semibold text-[15px] rounded-xl py-3 transition flex items-center justify-center gap-2"
                    >
                      <Plus className="w-5 h-5" />
                      Create New Secret
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-500 min-h-[320px] text-center px-4 opacity-60">
                  <div className="w-16 h-16 rounded-full bg-[#0a0f18] border border-[#242c3d] flex items-center justify-center mb-5">
                    <Lock className="w-7 h-7 text-slate-500" />
                  </div>
                  <p className="font-medium text-slate-400 text-sm">Your secure link and token will appear here once you generate a secret.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* QR Code Modal */}
      {showQR && result && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#121722] border border-[#242c3d] rounded-2xl w-full max-w-sm flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-[#242c3d]">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <QrCode className="text-cyan-400 w-5 h-5"/> Share Link
              </h2>
              <button onClick={() => setShowQR(false)} className="text-slate-400 hover:text-white transition bg-slate-800/50 hover:bg-slate-800 p-1.5 rounded-lg">
                <X className="w-5 h-5"/>
              </button>
            </div>
            <div className="p-8 flex flex-col items-center justify-center bg-white m-6 rounded-xl">
              <QRCode 
                value={linkUrl} 
                size={200}
                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
              />
            </div>
            <div className="px-6 pb-6 text-center text-sm text-slate-400">
              Scan with a mobile device to immediately open the secure link.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



