import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ShieldCheck, ShieldAlert, KeyRound, Mail, User, CheckCircle, AlertCircle, Phone, Lock } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import GlowButton from '../components/GlowButton';
import GlassInput from '../components/GlassInput';
import NeonCard from '../components/NeonCard';

export default function Auth({ login }) {
  const [searchParams] = useSearchParams();
  const verifyToken = searchParams.get('verifyToken');
  const resetToken = searchParams.get('resetToken');

  const [isLoginTab, setIsLoginTab] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // 2FA Verification Flow
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaType, setMfaType] = useState('none');
  const [tempToken, setTempToken] = useState('');
  const [otpCode, setOtpCode] = useState('');

  // Password Reset Flow
  const [showForgotScreen, setShowForgotScreen] = useState(false);
  const [resetSuccess, setResetSuccess] = useState('');

  // Feedback State
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Email verification trigger on mount
  useEffect(() => {
    if (verifyToken) {
      const verifyEmail = async () => {
        try {
          const res = await fetch('/api/auth/verify-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: verifyToken })
          });
          const data = await res.json();
          if (res.ok) {
            setInfo(data.message);
          } else {
            setError(data.message);
          }
        } catch (e) {
          setError('Failed to contact server for email verification.');
        }
      };
      verifyEmail();
    }
  }, [verifyToken]);

  // Password policy evaluator helper
  const checkPasswordStrength = (pass) => {
    if (!pass) return { score: 0, label: 'Empty', color: 'bg-slate-800', width: 'w-0' };
    
    let score = 0;
    if (pass.length >= 12) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[a-z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (pass.length < 8) return { score: 1, label: 'Critical: Too Short', color: 'bg-red-500', width: 'w-1/5' };
    
    switch (score) {
      case 0:
      case 1:
      case 2:
        return { score, label: 'Weak', color: 'bg-red-500', width: 'w-2/5' };
      case 3:
        return { score, label: 'Fair', color: 'bg-amber-500', width: 'w-3/5' };
      case 4:
        return { score, label: 'Good', color: 'bg-indigo-400', width: 'w-4/5' };
      case 5:
        return { score, label: 'Strong & Secure', color: 'bg-emerald-500', width: 'w-full' };
      default:
        return { score: 0, label: 'Empty', color: 'bg-slate-800', width: 'w-0' };
    }
  };

  const strength = checkPasswordStrength(password);

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setIsLoading(true);

    if (!isLoginTab && password !== confirmPassword) {
      setError('Passwords do not match.');
      setIsLoading(false);
      return;
    }

    const endpoint = isLoginTab ? '/api/auth/login' : '/api/auth/register';
    const body = isLoginTab ? { email, password } : { name, email, password };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (res.ok) {
        if (data.mfaRequired) {
          // Trigger OTP entry UI
          setMfaRequired(true);
          setMfaType(data.mfaType);
          setTempToken(data.tempToken);
        } else {
          // Log user directly
          login(data.token, data.user);
        }
      } else {
        setError(data.message || 'An error occurred during authentication.');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to reach server. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMfaSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/mfa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tempToken, code: otpCode })
      });

      const data = await res.json();
      if (res.ok) {
        login(data.token, data.user);
      } else {
        setError(data.message || 'Invalid code.');
      }
    } catch (e) {
      setError('Connection failure during 2FA check.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResetSuccess('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (res.ok) {
        setResetSuccess(data.message);
      } else {
        setError(data.message);
      }
    } catch (e) {
      setError('Failed to request reset token.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetConfirmSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResetSuccess('');
    setIsLoading(true);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/reset-password/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: resetToken, password })
      });
      const data = await res.json();
      if (res.ok) {
        setResetSuccess(data.message + ' Redirecting to Login...');
        setTimeout(() => {
          window.location.href = '/auth';
        }, 3000);
      } else {
        setError(data.message);
      }
    } catch (e) {
      setError('Failed to save updated password.');
    } finally {
      setIsLoading(false);
    }
  };

  // Email Verification View
  if (verifyToken) {
    const hasToken = !!localStorage.getItem('token');
    return (
      <div className="max-w-md mx-auto py-10 animate-in fade-in duration-300">
        <div className="text-center space-y-2 mb-8">
          <div className={`inline-flex p-3 rounded-2xl border ${error ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'}`}>
            {error ? <ShieldAlert className="h-8 w-8" /> : <ShieldCheck className="h-8 w-8" />}
          </div>
          <h2 className="text-2xl font-black tracking-tight">{error ? 'Verification Failed' : 'Verification Successful'}</h2>
          <p className="text-slate-500 text-xs">
            {error ? 'The email verification link was invalid or has expired.' : 'Your email address has been successfully verified.'}
          </p>
        </div>

        <GlassCard className="border border-white/5 bg-cyber-card text-center space-y-4 py-8">
          {error ? (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          ) : (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2">
              <CheckCircle className="h-4 w-4 shrink-0" />
              <span>{info || 'Verifying email address, please wait...'}</span>
            </div>
          )}

          <a
            href="/"
            className="inline-block w-full bg-indigo-650 hover:bg-indigo-550 text-white font-bold py-3 rounded-xl text-xs transition-all shadow-md mt-4"
          >
            {hasToken ? 'Go to Dashboard' : 'Proceed to Sign In'}
          </a>
        </GlassCard>
      </div>
    );
  }

  // 1. Password Reset Callback View
  if (resetToken) {
    return (
      <div className="max-w-md mx-auto py-10 animate-in fade-in duration-300">
        <div className="text-center space-y-2 mb-8">
          <div className="inline-flex p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/30 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
            <Lock className="h-8 w-8 text-indigo-400" />
          </div>
          <h2 className="text-2xl font-black tracking-tight bg-gradient-to-r from-indigo-300 to-purple-400 bg-clip-text text-transparent">Create New Password</h2>
          <p className="text-slate-500 text-xs">Enter your secure new credentials. Minimally 12 characters with complexity.</p>
        </div>

        <NeonCard className="bg-cyber-card">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 mb-4">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {resetSuccess && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 mb-4">
              <CheckCircle className="h-4 w-4 shrink-0" />
              <span>{resetSuccess}</span>
            </div>
          )}

          <form onSubmit={handleResetConfirmSubmit} className="space-y-4">
            <div>
              <GlassInput
                type="password"
                required
                label="New Password"
                icon={KeyRound}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
              
              {/* Strength indicator */}
              {password && (
                <div className="space-y-1 -mt-3 mb-4 px-1">
                  <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden">
                    <div className={`h-full transition-all duration-300 ${strength.color} ${strength.width}`}></div>
                  </div>
                  <span className="text-[10px] text-slate-500">Strength: <strong className="text-slate-350">{strength.label}</strong></span>
                </div>
              )}
            </div>

            <GlassInput
              type="password"
              required
              label="Confirm New Password"
              icon={KeyRound}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
            />

            <GlowButton
              type="submit"
              disabled={isLoading}
              className="w-full mt-4"
              variant="indigo"
            >
              {isLoading ? 'Saving...' : 'Set Password and Login'}
            </GlowButton>
          </form>
        </NeonCard>
      </div>
    );
  }

  // 2. 2FA Input View
  if (mfaRequired) {
    return (
      <div className="max-w-md mx-auto py-10 animate-in fade-in duration-300">
        <div className="text-center space-y-2 mb-8">
          <div className="inline-flex p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/30 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
            <Lock className="h-8 w-8 text-indigo-400" />
          </div>
          <h2 className="text-2xl font-black tracking-tight bg-gradient-to-r from-indigo-300 to-purple-400 bg-clip-text text-transparent">Security Check Required</h2>
          <p className="text-slate-500 text-xs">
            {mfaType === 'totp' ? 'Open your Authenticator App (Google/Duo) to obtain your 6-digit code.' : 
             mfaType === 'email' ? 'Enter the 6-digit OTP code dispatched to your registered Email.' :
             'Enter the 6-digit verification code sent to your registered Phone.'}
          </p>
        </div>

        <NeonCard className="bg-cyber-card">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 mb-4 animate-pulse">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleMfaSubmit} className="space-y-4">
            <GlassInput
              type="text"
              required
              label="Verification OTP Code / Recovery Code"
              icon={KeyRound}
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
              placeholder="e.g. 123456 or Backup Code"
              className="tracking-widest"
            />

            <GlowButton
              type="submit"
              disabled={isLoading}
              className="w-full mt-4"
              variant="indigo"
            >
              {isLoading ? 'Verifying OTP...' : 'Authenticate Access'}
            </GlowButton>
            
            <button
              type="button"
              onClick={() => {
                setMfaRequired(false);
                setOtpCode('');
                setError('');
              }}
              className="w-full text-center text-xs text-slate-500 hover:text-slate-400 pt-2 transition-colors"
            >
              Cancel and Return
            </button>
          </form>
        </NeonCard>
      </div>
    );
  }

  // 3. Forgot Password Request View
  if (showForgotScreen) {
    return (
      <div className="max-w-md mx-auto py-10 animate-in fade-in duration-300">
        <div className="text-center space-y-2 mb-8">
          <div className="inline-flex p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/30 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
            <KeyRound className="h-8 w-8 text-indigo-400" />
          </div>
          <h2 className="text-2xl font-black tracking-tight bg-gradient-to-r from-indigo-300 to-purple-400 bg-clip-text text-transparent">Recover Account Access</h2>
          <p className="text-slate-500 text-xs">Enter your email and we'll dispatch a cryptographic password reset token link.</p>
        </div>

        <NeonCard className="bg-cyber-card">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 mb-4">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {resetSuccess && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 mb-4">
              <CheckCircle className="h-4 w-4 shrink-0" />
              <span>{resetSuccess}</span>
            </div>
          )}

          <form onSubmit={handleForgotSubmit} className="space-y-4">
            <GlassInput
              type="email"
              required
              label="Email Address"
              icon={Mail}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john@example.com"
            />

            <GlowButton
              type="submit"
              disabled={isLoading}
              className="w-full mt-4"
              variant="indigo"
            >
              {isLoading ? 'Sending Request...' : 'Dispatch Reset Link'}
            </GlowButton>
            
            <button
              type="button"
              onClick={() => {
                setShowForgotScreen(false);
                setError('');
                setResetSuccess('');
              }}
              className="w-full text-center text-xs text-slate-500 hover:text-slate-400 pt-2 transition-colors"
            >
              Back to Sign In
            </button>
          </form>
        </NeonCard>
      </div>
    );
  }

  // 4. Standard Sign In / Sign Up Form
  return (
    <div className="max-w-md mx-auto py-10 animate-in fade-in duration-300">
      {/* Brand logo header */}
      <div className="text-center space-y-2 mb-8 animate-in fade-in duration-500">
        <div className="inline-flex p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/30 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
          <ShieldCheck className="h-8 w-8 text-indigo-400" />
        </div>
        <h2 className="text-2xl font-black tracking-tight bg-gradient-to-r from-indigo-300 to-purple-400 bg-clip-text text-transparent">Veritas AI Security Portal</h2>
        <p className="text-slate-500 text-xs">Unlock history archiving, saved reports, and default model targeting customization.</p>
      </div>

      <NeonCard className="bg-cyber-card">
        {/* Toggle tabs */}
        <div className="flex gap-2 mb-6 bg-slate-950 p-1 rounded-xl border border-slate-900/50">
          <button
            type="button"
            onClick={() => {
              setIsLoginTab(true);
              setError('');
              setInfo('');
            }}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
              isLoginTab ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setIsLoginTab(false);
              setError('');
              setInfo('');
            }}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
              !isLoginTab ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Create Account
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs font-semibold flex items-center gap-2 mb-4 animate-pulse">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {info && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-xl text-xs font-semibold flex items-center gap-2 mb-4">
            <CheckCircle className="h-4 w-4 shrink-0" />
            <span>{info}</span>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleAuthSubmit} className="space-y-4">
          
          {!isLoginTab && (
            <GlassInput
              type="text"
              required
              label="Full Name"
              icon={User}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
            />
          )}

          <GlassInput
            type="email"
            required
            label="Email Address"
            icon={Mail}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="john@example.com"
          />

          <div>
            <div className="flex justify-between items-center mb-1 px-1">
              <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">Security Password</span>
              {isLoginTab && (
                <button
                  type="button"
                  onClick={() => setShowForgotScreen(true)}
                  className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold transition-colors"
                >
                  Forgot Password?
                </button>
              )}
            </div>
            
            <GlassInput
              type="password"
              required
              label="Password"
              icon={KeyRound}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />

            {/* Visual Password Strength Meter (only on signup) */}
            {!isLoginTab && password && (
              <div className="space-y-1 -mt-3 mb-4 px-1">
                <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden">
                  <div className={`h-full transition-all duration-300 ${strength.color} ${strength.width}`}></div>
                </div>
                <span className="text-[10px] text-slate-500">Strength: <strong className="text-slate-350">{strength.label}</strong></span>
              </div>
            )}
          </div>

          {!isLoginTab && (
            <GlassInput
              type="password"
              required
              label="Confirm Password"
              icon={KeyRound}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
            />
          )}

          <GlowButton
            type="submit"
            disabled={isLoading}
            className="w-full mt-6"
            variant="indigo"
          >
            {isLoading ? 'Processing Authorization...' : isLoginTab ? 'Authenticate Session' : 'Register Credentials'}
          </GlowButton>

        </form>

      </NeonCard>

    </div>
  );
}
