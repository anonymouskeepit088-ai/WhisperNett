'use client';

import { useState, useEffect, use } from 'react';
import { Lock, AlertTriangle, ShieldCheck, Flame, Copy, Key } from 'lucide-react';
import Link from 'next/link';
import Header from '@/components/Header';

export default function ViewSecret({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;
  
  const [token, setToken] = useState('');
  const [passphrase, setPassphrase] = useState('');
  const [loading, setLoading] = useState(false);
  const [decryptedSecret, setDecryptedSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<'checking' | 'exists' | 'not-found'>('checking');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch(`/api/secrets/${id}`)
      .then(res => {
        if (res.ok) setStatus('exists');
        else setStatus('not-found');
      })
      .catch(() => setStatus('not-found'));
  }, [id]);

  const handleDecrypt = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/secrets/${id}/decrypt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, passphrase })
      });
      const data = await res.json();
      if (res.ok && data.secret) {
        setDecryptedSecret(data.secret);
      } else {
        setError(data.error || 'Failed to decrypt');
      }
    } catch (e) {
      setError('An error occurred while decrypting.');
    }
    setLoading(false);
  };

  const handleCopy = () => {
    if (decryptedSecret) {
      navigator.clipboard.writeText(decryptedSecret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (status === 'checking') {
    return (
      <div className="min-h-screen bg-[#0a0f18] text-slate-300 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <Lock className="w-8 h-8 text-cyan-500" />
          <p className="font-medium text-lg">Verifying secure link...</p>
        </div>
      </div>
    );
  }

  if (status === 'not-found' && !decryptedSecret) {
    return (
      <div className="min-h-screen bg-[#0a0f18] text-slate-300 flex flex-col items-center justify-center p-6">
        <div className="bg-[#121722] border border-red-500/30 p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-5">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Secret Not Found</h2>
          <p className="text-slate-400 mb-8 leading-relaxed">
            This secret does not exist. It may have expired, or it has already been viewed and permanently destroyed.
          </p>
          <Link href="/" className="inline-block bg-[#1a2333] hover:bg-slate-700 border border-[#242c3d] text-white px-6 py-3 rounded-xl transition font-medium w-full">
            Create a New Secret
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0f18] text-slate-300 font-sans flex flex-col">
      <Header />

      <div className="flex-1 flex flex-col items-center justify-center p-6 py-12">
        <div className="max-w-lg w-full">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-cyan-500/10 text-cyan-400 mb-5 shadow-[0_0_30px_rgba(6,182,212,0.15)]">
              {decryptedSecret ? <ShieldCheck className="w-8 h-8" /> : <Lock className="w-8 h-8" />}
            </div>
            <h1 className="text-3xl font-extrabold text-white mb-3">
              {decryptedSecret ? "Secret Decrypted" : "Secure Secret Access"}
            </h1>
            <p className="text-slate-400 text-[17px]">
              {decryptedSecret 
                ? "This secret has been permanently destroyed from our servers."
                : "Enter your secure token to decrypt and view this secret."}
            </p>
          </div>

          <div className="bg-[#121722] border border-[#242c3d] p-7 md:p-9 rounded-2xl shadow-xl relative overflow-hidden">
            {/* Subtle top highlight */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500/0 via-cyan-500/50 to-cyan-500/0"></div>
            
            {!decryptedSecret ? (
              <form onSubmit={handleDecrypt} className="space-y-6">
                {error && (
                  <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex gap-3 text-red-400 text-sm animate-in fade-in">
                    <AlertTriangle className="w-5 h-5 shrink-0" />
                    <p>{error}</p>
                  </div>
                )}
                
                <div className="space-y-5">
                  <div>
                    <label className="block text-[14.5px] font-semibold text-slate-400 mb-2">Secret Token</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
                        <Key className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        required
                        value={token}
                        onChange={(e) => setToken(e.target.value.toUpperCase())}
                        placeholder="WNET-XXXX-XXXX"
                        className="w-full bg-[#0a0f18] border border-[#242c3d] rounded-xl py-3.5 pl-11 pr-4 text-white font-mono uppercase tracking-wider focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition text-[15px]"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[14.5px] font-semibold text-slate-400 mb-2">Passphrase <span className="text-slate-500 font-normal">(if required)</span></label>
                    <input
                      type="password"
                      value={passphrase}
                      onChange={(e) => setPassphrase(e.target.value)}
                      placeholder="Enter passphrase"
                      className="w-full bg-[#0a0f18] border border-[#242c3d] rounded-xl p-3.5 text-white focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition text-[15px]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !token}
                  className="w-full bg-cyan-400 hover:bg-cyan-300 text-black font-bold text-[17px] rounded-xl py-3.5 transition shadow-[0_0_20px_rgba(34,211,238,0.2)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
                >
                  <ShieldCheck className="w-5 h-5" />
                  {loading ? 'Decrypting...' : 'Decrypt & View Secret'}
                </button>

                <div className="flex items-start md:items-center justify-center gap-2 text-[14px] text-orange-400/90 pt-4 border-t border-[#1a2333]">
                  <Flame className="w-4 h-4 shrink-0 mt-0.5 md:mt-0" />
                  <span className="font-medium text-white">Warning: Viewing this secret will permanently destroy it.</span>
                </div>
              </form>
            ) : (
              <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex gap-3 text-emerald-400 text-sm mb-2">
                  <ShieldCheck className="w-5 h-5 shrink-0" />
                  <p className="font-medium leading-relaxed">Decryption successful. The secret has been securely burned from our servers.</p>
                </div>

                <div className="relative">
                  <label className="block text-[14.5px] font-semibold text-slate-400 mb-2">Decrypted Content</label>
                  <div className="w-full min-h-[160px] bg-[#0a0f18] border border-cyan-500/30 rounded-xl p-5 text-slate-100 whitespace-pre-wrap font-mono break-all leading-relaxed shadow-inner text-[15px]">
                    {decryptedSecret}
                  </div>
                </div>

                <button
                  onClick={handleCopy}
                  className="w-full bg-[#1a2333] hover:bg-slate-700 border border-[#242c3d] text-white font-semibold text-[17px] rounded-xl py-3.5 transition flex items-center justify-center gap-2.5"
                >
                  <Copy className="w-5 h-5" />
                  {copied ? 'Copied to Clipboard!' : 'Copy Secret Content'}
                </button>
                
                <div className="text-center pt-5">
                   <Link href="/" className="text-cyan-400 hover:text-cyan-300 text-sm font-medium transition flex items-center justify-center gap-1">
                     ← Create another secret
                   </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

