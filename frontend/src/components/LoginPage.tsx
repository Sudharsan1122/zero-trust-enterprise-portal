import React, { useState } from 'react';
import type { User } from '../types';
import { Lock, ShieldCheck, KeyRound, ArrowRight, Check, UserCheck, AlertCircle } from 'lucide-react';

interface LoginPageProps {
  users: User[];
  onLoginSuccess: (user: User, mfaCode: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ users, onLoginSuccess }) => {
  const [selectedUsername, setSelectedUsername] = useState<string>('alice.finance');
  const [password, setPassword] = useState<string>('••••••••••••');
  const [mfaCode, setMfaCode] = useState<string>('123456');
  const [error, setError] = useState<string | null>(null);

  const currentUser = users.find(u => u.username === selectedUsername) || users[0];

  const handleSelectUser = (u: User) => {
    setSelectedUsername(u.username);
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setError('Please select an enterprise user identity.');
      return;
    }
    if (!password) {
      setError('Corporate password is required.');
      return;
    }
    if (!mfaCode || mfaCode.trim().length !== 6) {
      setError('A valid 6-digit Multi-Factor Authentication (MFA) TOTP code is required.');
      return;
    }

    onLoginSuccess(currentUser, mfaCode.trim());
  };

  return (
    <div className="max-w-xl mx-auto py-8 sm:py-12 space-y-6">
      
      {/* Step 1 Indicator */}
      <div className="text-center space-y-1">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#2563eb] text-white shadow-xs mb-2">
          <Lock className="w-6 h-6 stroke-[2.2]" />
        </div>
        <div className="text-[11px] font-bold uppercase tracking-wider text-[#2563eb]">
          Step 1 of 4: Authentication
        </div>
        <h1 className="text-[24px] font-bold text-[#101828] tracking-[-0.01em]">
          Zero-Trust Gateway Login
        </h1>
        <p className="text-[13px] text-[#667085] max-w-sm mx-auto">
          Authenticate your corporate identity with Argon2id credentials and 6-digit TOTP Multi-Factor Authentication.
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 rounded-xl bg-[#fef2f2] border border-[#fecaca] text-[#b91c1c] text-[12px] flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-[#ef4444] flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Login Card */}
      <div className="bg-white rounded-2xl p-6 sm:p-7 border border-[#eaecf0] shadow-xs">
        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* 1. Identity Selection */}
          <div>
            <label className="text-[11px] font-semibold text-[#667085] uppercase tracking-wider block mb-2">
              Select Enterprise Identity (User ID)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {users.map((u) => {
                const isSelected = selectedUsername === u.username;
                return (
                  <button
                    key={u.username}
                    type="button"
                    onClick={() => handleSelectUser(u)}
                    className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-[#f8faff] border-[#2563eb] shadow-xs ring-1 ring-[#2563eb]'
                        : 'bg-white border-[#eaecf0] hover:border-[#d0d5dd] hover:bg-[#fafbfc]'
                    }`}
                  >
                    <div className="truncate">
                      <div className="text-[13px] font-semibold text-[#101828] truncate">
                        {u.full_name}
                      </div>
                      <div className="text-[11px] text-[#667085] font-mono">
                        {u.username} ({u.role.replace('_OFFICER', '').replace('_ENGINEER', '')})
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-[#2563eb] flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-semibold text-[#667085] uppercase tracking-wider">
                Corporate Password (Argon2id Hash)
              </label>
              <span className="text-[10px] text-[#98a2b3] font-mono">AES-256 Transport</span>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter corporate password"
              className="w-full text-[13px] font-mono px-3.5 py-2.5 rounded-xl border border-[#d0d5dd] bg-white text-[#101828] outline-none focus:border-[#2563eb]"
            />
          </div>

          {/* 3. Multi-Factor Authentication (MFA) */}
          <div className="p-4 rounded-xl bg-[#fafbfc] border border-[#eaecf0] space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-[#101828] uppercase tracking-wider flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-[#2563eb]" />
                <span>6-Digit MFA / TOTP Code</span>
              </label>
              <button
                type="button"
                onClick={() => setMfaCode('123456')}
                className="text-[11px] text-[#2563eb] font-semibold hover:underline cursor-pointer"
              >
                Use Demo Code (123456)
              </button>
            </div>

            <input
              type="text"
              maxLength={6}
              value={mfaCode}
              onChange={(e) => setMfaCode(e.target.value)}
              placeholder="123456"
              className="w-full text-center tracking-[0.4em] font-mono text-xl font-bold py-2.5 px-3 rounded-lg border border-[#d0d5dd] bg-white focus:border-[#2563eb] outline-none text-[#101828]"
            />
            <p className="text-[11px] text-[#667085] text-center">
              Time-based One-Time Password synced with Enterprise Identity Provider.
            </p>
          </div>

          {/* 4. Submit Action */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-medium text-[13px] flex items-center justify-center gap-2 cursor-pointer shadow-xs transition"
            >
              <span>Verify Credentials & Proceed to Device Binding</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </form>
      </div>

      {/* Security Architecture Footnote */}
      <div className="text-center text-[11px] text-[#98a2b3] flex items-center justify-center gap-4">
        <span>TLS 1.3 Strict</span>
        <span>•</span>
        <span>MFA Enforced</span>
        <span>•</span>
        <span>NIST SP 800-207</span>
      </div>

    </div>
  );
};
