import React, { useState, useEffect } from 'react';
import { User, ShieldCheck, Mail, Settings, ShieldAlert, KeyRound, Monitor, Smartphone, Trash2, Power, Copy, RefreshCw, AlertTriangle } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import GlowButton from '../components/GlowButton';
import GlassInput from '../components/GlassInput';
import NeonCard from '../components/NeonCard';
import GlassSelect from '../components/GlassSelect';

export default function Profile({ token, user, updateProfile }) {
  // Settings Model preference
  const [modelPreference, setModelPreference] = useState(user?.modelPreference || 'Random Forest');
  const [modelSuccess, setModelSuccess] = useState(false);
  const [isUpdatingModel, setIsUpdatingModel] = useState(false);

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState('');
  const [isChangingPass, setIsChangingPass] = useState(false);

  // MFA Management State
  const [mfaEnabled, setMfaEnabled] = useState(user?.mfaEnabled || false);
  const [mfaType, setMfaType] = useState(user?.mfaType || 'none');
  const [mfaSetupData, setMfaSetupData] = useState(null); // { secret, qrCodeUrl }
  const [mfaCode, setMfaCode] = useState('');
  const [mfaTargetType, setMfaTargetType] = useState('totp');
  const [backupCodes, setBackupCodes] = useState([]);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');
  const [mfaError, setMfaError] = useState('');
  const [mfaSuccess, setMfaSuccess] = useState('');

  // Active Devices State
  const [devices, setDevices] = useState([]);
  const [devicesLoading, setDevicesLoading] = useState(true);

  // Fetch active sessions
  const fetchDevices = async () => {
    try {
      const res = await fetch('/api/auth/devices', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDevices(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setDevicesLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, [token]);

  // Model preference update
  const handleUpdateModel = async (e) => {
    e.preventDefault();
    setIsUpdatingModel(true);
    setModelSuccess(false);

    try {
      const res = await fetch('/api/auth/user/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ modelPreference })
      });

      if (res.ok) {
        const updatedUser = await res.json();
        updateProfile(updatedUser);
        setModelSuccess(true);
        setTimeout(() => setModelSuccess(false), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdatingModel(false);
    }
  };

  // Password change submission
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPassError('');
    setPassSuccess('');
    setIsChangingPass(true);

    if (newPassword !== confirmPassword) {
      setPassError('New passwords do not match.');
      setIsChangingPass(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/user/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const data = await res.json();
      if (res.ok) {
        setPassSuccess(data.message);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        fetchDevices(); // reload active sessions since other sessions get revoked
      } else {
        setPassError(data.message);
      }
    } catch (err) {
      setPassError('Connection error changing password.');
    } finally {
      setIsChangingPass(false);
    }
  };

  // Setup TOTP Wizard
  const startMfaSetup = async () => {
    setMfaError('');
    setMfaSetupData(null);
    try {
      const res = await fetch('/api/auth/mfa/setup', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMfaSetupData(data);
      } else {
        setMfaError('Failed to initialize MFA secrets.');
      }
    } catch (e) {
      setMfaError('Error requesting 2FA keys.');
    }
  };

  // Confirm TOTP or directly enable Email/SMS OTP
  const enableMfa = async (e) => {
    e.preventDefault();
    setMfaError('');
    setMfaSuccess('');

    const body = {
      type: mfaTargetType,
      secret: mfaTargetType === 'totp' ? mfaSetupData?.secret : null,
      code: mfaTargetType === 'totp' ? mfaCode : '123456' // email/sms defaults code to bypass
    };

    try {
      const res = await fetch('/api/auth/mfa/enable', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (res.ok) {
        setBackupCodes(data.backupCodes || []);
        setShowBackupModal(true);
        setMfaEnabled(true);
        setMfaType(mfaTargetType);
        setMfaSetupData(null);
        setMfaCode('');
        
        // Update user state globally
        updateProfile({ ...user, mfaEnabled: true, mfaType: mfaTargetType });
      } else {
        setMfaError(data.message || 'MFA validation failed.');
      }
    } catch (err) {
      setMfaError('Failed to contact auth servers.');
    }
  };

  // Disable MFA Settings
  const disableMfa = async (e) => {
    e.preventDefault();
    setMfaError('');
    setMfaSuccess('');

    try {
      const res = await fetch('/api/auth/mfa/disable', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ password: disablePassword })
      });
      const data = await res.json();
      if (res.ok) {
        setMfaSuccess(data.message);
        setMfaEnabled(false);
        setMfaType('none');
        setDisablePassword('');
        updateProfile({ ...user, mfaEnabled: false, mfaType: 'none' });
      } else {
        setMfaError(data.message);
      }
    } catch (e) {
      setMfaError('Connection error disabling 2FA.');
    }
  };

  // Terminate other active sessions
  const logoutAllDevices = async () => {
    if (!window.confirm('Are you sure you want to terminate all other active logins? You will remain signed in on this current browser tab.')) return;
    try {
      const res = await fetch('/api/auth/logout-all', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchDevices();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Password complexity meter
  const getPasswordStrength = (pass) => {
    if (!pass) return { label: 'Empty', color: 'bg-slate-800', width: 'w-0' };
    let score = 0;
    if (pass.length >= 12) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[a-z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;
    if (pass.length < 8) return { label: 'Too Short', color: 'bg-red-500', width: 'w-1/5' };
    
    switch (score) {
      case 0: case 1: case 2: return { label: 'Weak', color: 'bg-red-500', width: 'w-2/5' };
      case 3: return { label: 'Fair', color: 'bg-amber-500', width: 'w-3/5' };
      case 4: return { label: 'Good', color: 'bg-indigo-400', width: 'w-4/5' };
      case 5: return { label: 'Strong & Secure', color: 'bg-emerald-500', width: 'w-full' };
      default: return { label: 'Empty', color: 'bg-slate-800', width: 'w-0' };
    }
  };

  const strength = getPasswordStrength(newPassword);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Security Portal Settings</h1>
        <p className="text-slate-400 mt-1">Review active user metadata, configure credentials policies, activate Multi-Factor Auth, and check logins history.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Hand: Profile summary and active sessions list */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* User Details */}
          <GlassCard className="border border-white/5 space-y-5 text-center">
            <div className="mx-auto flex items-center justify-center p-4 bg-indigo-500/10 rounded-full border border-indigo-500/20 text-indigo-400 w-16 h-16">
              <User className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-slate-100">{user?.name}</h3>
              <p className="text-slate-500 text-xs mt-1 flex items-center justify-center gap-1">
                <Mail className="h-3.5 w-3.5" /> {user?.email}
              </p>
            </div>
            <div className="pt-4 border-t border-slate-900 text-xs text-slate-500 text-left space-y-2.5">
              <div className="flex justify-between">
                <span>Verification Status:</span>
                <span className={`font-bold ${user?.emailVerified ? 'text-emerald-400' : 'text-amber-500'}`}>
                  {user?.emailVerified ? 'Email Verified' : 'Email Unverified'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Account Created:</span>
                <span className="text-slate-300">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>
          </GlassCard>

          {/* Active Device Sessions */}
          <GlassCard className="border border-white/5 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-900">
              <h4 className="text-xs font-bold text-slate-450 uppercase tracking-wider">Device Log & Active Sessions</h4>
              <button
                onClick={fetchDevices}
                className="p-1 hover:bg-slate-900 rounded-lg text-slate-400 hover:text-slate-200 transition-colors"
                title="Refresh Devices List"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
            </div>

            {devicesLoading ? (
              <p className="text-xs text-slate-500 py-4 text-center">Fetching session registries...</p>
            ) : (
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {devices.map((dev) => (
                  <div key={dev.sessionId} className="p-3 bg-[#0a0b12] border border-slate-900/60 rounded-xl flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-slate-900 rounded-lg border border-slate-800 text-slate-400">
                        {dev.deviceName.includes('Phone') ? <Smartphone className="h-4 w-4" /> : <Monitor className="h-4 w-4" />}
                      </div>
                      <div className="space-y-0.5">
                        <span className="font-bold text-slate-200 block">{dev.deviceName}</span>
                        <span className="text-[10px] text-slate-500 block">{dev.ip} | {new Date(dev.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div>
                      {dev.isCurrent ? (
                        <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-[9px] font-bold uppercase tracking-wider">Current</span>
                      ) : (
                        <span className="text-[9px] text-slate-500 italic">Active</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={logoutAllDevices}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 font-bold rounded-xl text-xs transition-colors mt-2"
            >
              <Trash2 className="h-3.5 w-3.5" /> Logout All Other Devices
            </button>
          </GlassCard>

        </div>

        {/* Right Hand: Password form & MFA configurator */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Default Model preference */}
          <GlassCard className="border border-white/5 space-y-4">
            <div className="flex items-center gap-2">
              <Settings className="h-4.5 w-4.5 text-indigo-400" />
              <h3 className="font-extrabold text-slate-200">Assessment Preference</h3>
            </div>
            {modelSuccess && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4" /> Default model preferences saved.
              </div>
            )}
            <form onSubmit={handleUpdateModel} className="flex gap-4 items-center">
              <GlassSelect
                value={modelPreference}
                onChange={(e) => setModelPreference(e.target.value)}
                className="flex-1 mb-0"
              >
                <option value="Random Forest">Random Forest (Robust Decision Trees)</option>
                <option value="Logistic Regression">Logistic Regression (Fast statistical weights)</option>
                <option value="Naive Bayes">Naive Bayes (Standard Lexical Classifier)</option>
                <option value="BERT">BERT Transformer (Linguistic Representation)</option>
                <option value="RoBERTa">RoBERTa (Robustly Optimized BERT)</option>
              </GlassSelect>
              <GlowButton
                type="submit"
                disabled={isUpdatingModel}
                className="shrink-0"
                variant="indigo"
              >
                {isUpdatingModel ? 'Saving...' : 'Save Settings'}
              </GlowButton>
            </form>
          </GlassCard>

          {/* Change Password Card */}
          <GlassCard className="border border-white/5 space-y-4">
            <div className="flex items-center gap-2">
              <KeyRound className="h-4.5 w-4.5 text-indigo-400" />
              <h3 className="font-extrabold text-slate-200">Update Password</h3>
            </div>

            {passError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{passError}</span>
              </div>
            )}

            {passSuccess && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-xl text-xs font-semibold flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 shrink-0" />
                <span>{passSuccess}</span>
              </div>
            )}

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <GlassInput
                type="password"
                required
                label="Current Password"
                icon={KeyRound}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
              />

              <div>
                <GlassInput
                  type="password"
                  required
                  label="New Password"
                  icon={KeyRound}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 12 characters, complex"
                />
                
                {/* Strength Meter */}
                {newPassword && (
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
                disabled={isChangingPass}
                variant="indigo"
              >
                {isChangingPass ? 'Updating...' : 'Save New Password'}
              </GlowButton>
            </form>
          </GlassCard>

          {/* MFA Panel */}
          <GlassCard className="border border-white/5 space-y-4">
            <div className="flex items-center gap-2">
              <Power className="h-4.5 w-4.5 text-indigo-400" />
              <h3 className="font-extrabold text-slate-200">Multi-Factor Authentication (2FA)</h3>
            </div>

            {mfaError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs font-semibold flex items-center gap-2 animate-pulse">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{mfaError}</span>
              </div>
            )}

            {mfaSuccess && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-xl text-xs font-semibold flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 shrink-0" />
                <span>{mfaSuccess}</span>
              </div>
            )}

            {/* If 2FA is currently DISABLED */}
            {!mfaEnabled && !mfaSetupData && (
              <div className="space-y-4">
                <p className="text-xs text-slate-400 leading-relaxed">
                  Enhance account protection by demanding a verification OTP code alongside your standard password parameters upon login.
                </p>
                <div className="flex gap-4 items-center">
                  <GlassSelect
                    value={mfaTargetType}
                    onChange={(e) => setMfaTargetType(e.target.value)}
                    className="flex-1 mb-0"
                  >
                    <option value="totp">Authenticator App (TOTP - Google Authenticator)</option>
                    <option value="email">Email OTP Code (Simulated mail logs)</option>
                    <option value="sms">SMS Text OTP Code (Simulated SMS logs)</option>
                  </GlassSelect>
                  
                  {mfaTargetType === 'totp' ? (
                    <GlowButton
                      onClick={startMfaSetup}
                      className="shrink-0"
                      variant="indigo"
                    >
                      Configure App
                    </GlowButton>
                  ) : (
                    <GlowButton
                      onClick={enableMfa}
                      className="shrink-0"
                      variant="indigo"
                    >
                      Enable OTP
                    </GlowButton>
                  )}
                </div>
              </div>
            )}

            {/* TOTP Setup Verification Wizard */}
            {!mfaEnabled && mfaSetupData && (
              <div className="p-4 bg-[#0a0b12] border border-slate-900 rounded-2xl grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div className="flex flex-col items-center gap-3">
                  <img src={mfaSetupData.qrCodeUrl} alt="TOTP QR Code" className="w-40 h-40 border border-slate-800 rounded bg-white p-2" />
                  <span className="text-[10px] text-slate-500 font-mono tracking-wider break-all select-all">Secret: {mfaSetupData.secret}</span>
                </div>

                <form onSubmit={enableMfa} className="space-y-3.5">
                  <span className="block text-xs font-bold text-slate-200">Scan code & Verify</span>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Scan the QR code in Google Authenticator or enter the manual secret key, then paste the current 6-digit verification code below.
                  </p>
                  
                  <GlassInput
                    type="text"
                    required
                    label="Verification Code"
                    icon={KeyRound}
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value)}
                    placeholder="e.g. 123456"
                  />

                  <div className="flex gap-2 pt-2">
                    <GlowButton
                      type="submit"
                      className="flex-1"
                      variant="indigo"
                    >
                      Confirm Setup
                    </GlowButton>
                    <button
                      type="button"
                      onClick={() => setMfaSetupData(null)}
                      className="px-4 py-3 border border-slate-900 hover:bg-slate-900 rounded-xl text-xs text-slate-400 font-bold uppercase transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* If 2FA is currently ENABLED */}
            {mfaEnabled && (
              <div className="space-y-4">
                <div className="p-3.5 bg-emerald-500/5 border border-emerald-500/10 rounded-xl flex justify-between items-center gap-3 text-xs text-emerald-400 font-semibold">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4.5 w-4.5 text-emerald-400" />
                    <span>2FA protection active via {mfaType.toUpperCase()}</span>
                  </div>
                </div>

                {/* Disable Form */}
                <form onSubmit={disableMfa} className="p-4 bg-[#0a0b12] border border-slate-900 rounded-2xl space-y-3">
                  <span className="block text-xs font-bold text-slate-300">Disable Security Protection</span>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Enter your master password below to disable Multi-Factor Authentication. This will also clear emergency backup recovery codes.
                  </p>
                  <div className="flex gap-4 items-end">
                    <GlassInput
                      type="password"
                      required
                      label="Verify Password"
                      icon={KeyRound}
                      value={disablePassword}
                      onChange={(e) => setDisablePassword(e.target.value)}
                      placeholder="Enter password..."
                      className="flex-1 mb-0"
                    />
                    <GlowButton
                      type="submit"
                      className="shrink-0"
                      variant="rose"
                    >
                      Disable 2FA
                    </GlowButton>
                  </div>
                </form>
              </div>
            )}

          </GlassCard>

        </div>

      </div>

      {/* Backup codes modal */}
      {showBackupModal && (
        <div className="fixed inset-0 z-50 bg-[#000]/85 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-300">
          <NeonCard className="max-w-md w-full p-6 flex flex-col space-y-5" containerClassName="max-w-md w-full">
            <div className="text-center space-y-1">
              <ShieldCheck className="h-10 w-10 text-emerald-450 mx-auto mb-2 animate-bounce" />
              <h3 className="font-black text-slate-100 text-lg tracking-tight">Backup Recovery Codes Compiled</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Save these recovery codes in a secure vault. If you lose your Authenticator App, you can enter any code to bypass the 2FA check. Each code works exactly once.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 font-mono text-center text-xs text-cyan-455 bg-slate-950/90 p-4 rounded-xl border border-white/5 shadow-inner">
              {backupCodes.map((code, idx) => (
                <span key={idx} className="tracking-wider select-all bg-white/5 py-1 px-2 rounded border border-white/5 hover:border-cyan-500/30 transition-all">{code}</span>
              ))}
            </div>

            <GlowButton
              onClick={() => setShowBackupModal(false)}
              className="w-full"
              variant="indigo"
            >
              I Have Saved Recovery Codes
            </GlowButton>
          </NeonCard>
        </div>
      )}

    </div>
  );
}
