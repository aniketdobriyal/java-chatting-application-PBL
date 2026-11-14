import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useChat } from '../../hooks/useChat';
import { Avatar } from '../common/Avatar';
import { Toast } from '../common/Toast';
import {
  X,
  User,
  Shield,
  Sparkles,
  Dices,
  Key,
  Eye,
  EyeOff,
  Check,
  Copy,
  Lock,
  Loader2,
  CircleDot,
} from 'lucide-react';

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=200&q=80',
];

const STATUS_PRESETS = [
  '👋 Available',
  '💻 At work',
  '🚀 Coding non-stop',
  '⚡ Busy / Focus mode',
  '☕ Stepped away for coffee',
  '🏖️ Away / On leave',
];

const ProfileModalDialog = ({ user, onClose }) => {
  const { updateProfile, updatePassword } = useChat();

  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'security'

  // Profile Form States
  const [name, setName] = useState(user?.name || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [statusMessage, setStatusMessage] = useState(user?.statusMessage || '');
  const [online, setOnline] = useState(user?.online ?? true);

  // Security Form States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);

  // Status flags
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [toast, setToast] = useState(null);
  const [copiedKey, setCopiedKey] = useState(false);

  const handleRandomizeAvatar = () => {
    const seed = Math.random().toString(36).substring(2, 9);
    setAvatar(`https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setToast({ type: 'error', message: 'Name cannot be empty.' });
      return;
    }

    setIsSavingProfile(true);
    try {
      await updateProfile({
        name: name.trim(),
        avatar: avatar.trim(),
        statusMessage: statusMessage.trim(),
        online,
      });
      setToast({
        type: 'success',
        message: 'Profile updated! Live changes broadcast to all users.',
      });
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to update profile.' });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSavePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword) {
      setToast({ type: 'error', message: 'Please enter your current password.' });
      return;
    }
    if (newPassword.length < 6) {
      setToast({ type: 'error', message: 'New password must be at least 6 characters.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setToast({ type: 'error', message: 'New passwords do not match.' });
      return;
    }

    setIsSavingPassword(true);
    try {
      await updatePassword({
        currentPassword,
        newPassword,
      });
      setToast({ type: 'success', message: 'Password updated successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to update password.' });
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleCopyKey = () => {
    if (user?.publicKey) {
      navigator.clipboard.writeText(user.publicKey);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/80 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-xs">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Profile Settings</h2>
              <p className="text-xs text-slate-500">Manage your profile, presence & security</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-xl transition-all cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 px-6 bg-white gap-4">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-3 text-xs font-semibold flex items-center gap-2 border-b-2 cursor-pointer transition-all ${
              activeTab === 'profile'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Profile & Presence
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`py-3 text-xs font-semibold flex items-center gap-2 border-b-2 cursor-pointer transition-all ${
              activeTab === 'security'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Shield className="w-4 h-4" />
            Security & Encryption
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'profile' ? (
            <form onSubmit={handleSaveProfile} className="space-y-5">
              
              {/* Avatar Section */}
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Avatar & Profile Picture
                </label>
                
                <div className="flex items-center gap-4">
                  <Avatar name={name || 'User'} src={avatar} online={online} size="xl" />
                  
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleRandomizeAvatar}
                        className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Dices className="w-4 h-4" />
                        Generate Avatar
                      </button>
                      <button
                        type="button"
                        onClick={() => setAvatar('')}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium rounded-xl transition-colors cursor-pointer"
                      >
                        Reset to Initials
                      </button>
                    </div>

                    <input
                      type="url"
                      value={avatar}
                      onChange={(e) => setAvatar(e.target.value)}
                      placeholder="Or paste custom image URL..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>

                {/* Preset Avatars Grid */}
                <div>
                  <p className="text-[11px] font-medium text-slate-500 mb-2">Preset Avatars:</p>
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {PRESET_AVATARS.map((presetUrl, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setAvatar(presetUrl)}
                        className={`w-9 h-9 rounded-full overflow-hidden flex-shrink-0 border-2 transition-all cursor-pointer ${
                          avatar === presetUrl ? 'border-indigo-600 scale-110 shadow-xs' : 'border-transparent hover:border-slate-300'
                        }`}
                      >
                        <img src={presetUrl} alt="Preset avatar" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Display Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Your display name"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium"
                />
              </div>

              {/* Email (Readonly) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>Email Address</span>
                  <span className="text-[10px] text-slate-400 font-normal">Registered account email</span>
                </label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-500 cursor-not-allowed select-none"
                />
              </div>

              {/* Status Message / Bio */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Status Message / Bio
                </label>
                <input
                  type="text"
                  value={statusMessage}
                  onChange={(e) => setStatusMessage(e.target.value)}
                  placeholder="What's on your mind? (e.g. Working on a project)"
                  maxLength={150}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                />

                {/* Quick Presets */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {STATUS_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setStatusMessage(preset)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 text-xs rounded-lg transition-colors cursor-pointer"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Online Presence Status Toggle */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Online Presence Status
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setOnline(true)}
                    className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                      online
                        ? 'border-emerald-500 bg-emerald-50/50 text-emerald-950 font-semibold shadow-2xs'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <span className="w-3 h-3 rounded-full bg-emerald-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-slate-900">Online</p>
                      <p className="text-[11px] text-slate-500">Visible and active to everyone</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setOnline(false)}
                    className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                      !online
                        ? 'border-slate-400 bg-slate-100 text-slate-900 font-semibold shadow-2xs'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <span className="w-3 h-3 rounded-full bg-slate-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-slate-900">Invisible</p>
                      <p className="text-[11px] text-slate-500">Appear offline to others</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-60 text-white font-semibold rounded-xl shadow-md shadow-indigo-100 transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
                >
                  {isSavingProfile ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving changes...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Save Profile & Status
                    </>
                  )}
                </button>
              </div>

            </form>
          ) : (
            <div className="space-y-6">
              
              {/* E2EE Info Box */}
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-emerald-800">
                  <Lock className="w-4 h-4 flex-shrink-0" />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    End-to-End Encryption (E2EE)
                  </span>
                </div>
                <p className="text-xs text-emerald-700 leading-relaxed">
                  Your messages are protected by client-side <strong>AES-256-GCM</strong> authenticated encryption.
                  Diffie-Hellman shared secrets are derived with Curve25519 / NIST P-256. The server never sees plaintext messages.
                </p>

                {user?.publicKey && (
                  <div className="pt-2">
                    <p className="text-[11px] font-semibold text-emerald-800 mb-1">Your Public Key (SPKI):</p>
                    <div className="flex items-center gap-2 p-2 bg-white/80 border border-emerald-300 rounded-xl">
                      <p className="text-[10px] font-mono text-emerald-950 truncate flex-1 select-all">
                        {user.publicKey}
                      </p>
                      <button
                        type="button"
                        onClick={handleCopyKey}
                        className="p-1.5 hover:bg-emerald-100 rounded-lg text-emerald-700 transition-colors cursor-pointer flex-shrink-0"
                        title="Copy Public Key"
                      >
                        {copiedKey ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Password Change Form */}
              <form onSubmit={handleSavePassword} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Key className="w-4 h-4 text-indigo-600" />
                    Change Password
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowPasswords(!showPasswords)}
                    className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-medium cursor-pointer"
                  >
                    {showPasswords ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    {showPasswords ? 'Hide' : 'Show'}
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Current Password
                  </label>
                  <input
                    type={showPasswords ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    New Password
                  </label>
                  <input
                    type={showPasswords ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    placeholder="At least 6 characters"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type={showPasswords ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="Repeat new password"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSavingPassword}
                  className="w-full py-2.5 px-4 bg-slate-900 hover:bg-black active:bg-slate-800 disabled:opacity-60 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
                >
                  {isSavingPassword ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Updating password...
                    </>
                  ) : (
                    <>
                      <Key className="w-4 h-4" />
                      Update Password
                    </>
                  )}
                </button>
              </form>

            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <CircleDot className="w-3.5 h-3.5 text-emerald-500" />
            <span>Real-time Sync Active</span>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-slate-600 hover:text-slate-900 font-semibold cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>

      {/* Toast Notification */}
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
          duration={3500}
        />
      )}
    </div>
  );
};

export const ProfileModal = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  if (!isOpen) return null;
  return <ProfileModalDialog key={user?.id + (user?.name || '')} user={user} onClose={onClose} />;
};
