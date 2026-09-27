import React, { useState, useRef } from 'react';
import { 
  Camera, 
  User, 
  Mail, 
  Check, 
  X, 
  Edit2, 
  Loader2, 
  Upload, 
  KeyRound, 
  AlertCircle
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../contexts/LanguageContext';
import { auth, storage } from '../../firebase/config';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';

export const AccountSection: React.FC = () => {
  const { user, userProfile, updateProfilePhoto, updateDisplayName, changePassword } = useAuth();
  const { locale, isRTL, t } = useTranslation();

  // Profile Photo Upload State
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoSuccessMsg, setPhotoSuccessMsg] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Display Name Editing State
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(userProfile?.name || user?.displayName || '');
  const [nameSuccessMsg, setNameSuccessMsg] = useState(false);

  // Change Password State
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Determine provider: Hide change password for Google users
  const isGoogleUser = 
    user && 
    'providerData' in user && 
    Array.isArray(user.providerData) && 
    user.providerData.some((p: { providerId?: string }) => p?.providerId === 'google.com');

  const canChangePassword = !!auth.currentUser && !isGoogleUser;

  // Process and compress image file quickly
  const handleFileSelected = (file: File) => {
    setIsUploadingPhoto(true);
    setPhotoSuccessMsg(false);

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 360;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);

          // 1. INSTANT optimistic state update
          updateProfilePhoto(compressedDataUrl);
          setIsUploadingPhoto(false);
          setPhotoSuccessMsg(true);
          setTimeout(() => setPhotoSuccessMsg(false), 2500);

          // 2. Background Storage Upload
          if (user?.uid) {
            try {
              const storageRef = ref(storage, `profiles/${user.uid}_${Date.now()}.jpg`);
              Promise.race([
                uploadString(storageRef, compressedDataUrl, 'data_url').then(() => getDownloadURL(storageRef)),
                new Promise<string>((_, reject) => setTimeout(() => reject(new Error('Storage timeout')), 2500))
              ]).then((downloadUrl) => {
                if (downloadUrl) {
                  updateProfilePhoto(downloadUrl);
                }
              }).catch(() => {});
            } catch {}
          }
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSaveName = () => {
    const trimmed = nameInput.trim();
    if (!trimmed) return;
    
    updateDisplayName(trimmed);
    setIsEditingName(false);
    setNameSuccessMsg(true);
    setTimeout(() => setNameSuccessMsg(false), 2500);
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (newPassword.length < 6) {
      setPasswordError(t('settings.passwordTooShort'));
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError(t('settings.passwordMismatch'));
      return;
    }

    setIsUpdatingPassword(true);
    try {
      await changePassword(currentPassword, newPassword);
      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setPasswordSuccess(false);
        setShowPasswordForm(false);
      }, 2000);
    } catch (err: any) {
      console.error('Change password failed:', err);
      if (
        err?.code === 'auth/wrong-password' ||
        err?.code === 'auth/invalid-credential' ||
        err?.message?.includes('invalid-credential')
      ) {
        setPasswordError(t('settings.wrongPassword'));
      } else {
        setPasswordError(err?.message || 'Password update failed. Please verify current credentials.');
      }
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const currentPhotoURL = userProfile?.photoURL || user?.photoURL;
  const displayName = userProfile?.name || user?.displayName || 'Sahiwal Citizen';
  const displayEmail = userProfile?.email || user?.email || 'citizen@sahiwal.pk';

  return (
    <Card variant="default" padded="none" className="overflow-hidden border-stone-200/90 dark:border-stone-800 shadow-2xs">
      {/* Section Header */}
      <div className="p-4 bg-gradient-to-r from-emerald-50/60 to-stone-50 dark:from-emerald-950/40 dark:to-stone-900 border-b border-stone-200/70 dark:border-stone-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-xl bg-[#0F5132] dark:bg-emerald-600 text-white flex items-center justify-center">
            <User className="w-4 h-4" />
          </span>
          <h3 className="text-xs font-bold text-stone-900 dark:text-stone-100 uppercase tracking-wider">
            {t('settings.account')}
          </h3>
        </div>
        <span className="text-[11px] text-stone-400 dark:text-stone-500 font-medium">
          {userProfile?.citizenNumber || 'Citizen Account'}
        </span>
      </div>

      <div className="divide-y divide-stone-100 dark:divide-stone-800 p-4 space-y-4">
        {/* 1. Profile Photo Picker & Live Preview */}
        <div className="flex items-center justify-between gap-4 pt-1">
          <div className="flex items-center gap-3.5 min-w-0">
            {/* Avatar with tap-to-upload hover/tap overlay */}
            <div className="relative group shrink-0">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-16 h-16 rounded-3xl overflow-hidden bg-gradient-to-br from-[#0F5132] to-[#0A3B24] dark:from-emerald-700 dark:to-emerald-900 text-white flex items-center justify-center font-bold text-xl shadow-md border-2 border-white dark:border-stone-800 ring-4 ring-emerald-900/10 dark:ring-emerald-400/20 cursor-pointer"
              >
                {currentPhotoURL ? (
                  <img
                    src={currentPhotoURL}
                    alt={displayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{displayName.slice(0, 2).toUpperCase()}</span>
                )}
              </div>

              {/* Uploading Spinner Overlay */}
              {isUploadingPhoto && (
                <div className="absolute inset-0 rounded-3xl bg-black/60 flex items-center justify-center text-white backdrop-blur-xs">
                  <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
                </div>
              )}

              {/* Camera Badge Icon */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingPhoto}
                className="absolute -bottom-1 -end-1 w-6 h-6 rounded-full bg-amber-500 hover:bg-amber-600 text-stone-950 flex items-center justify-center shadow-md border-2 border-white dark:border-stone-800 transition active:scale-95 cursor-pointer"
                title={t('settings.tapToChangePhoto')}
              >
                <Camera className="w-3 h-3" />
              </button>
            </div>

            <div className="min-w-0">
              <span className="text-xs font-bold text-stone-800 dark:text-stone-200 block truncate">
                {t('settings.profilePhoto')}
              </span>
              <span className="text-[11px] text-stone-400 dark:text-stone-500 block truncate mt-0.5">
                {t('settings.tapToChangePhoto')}
              </span>
              {photoSuccessMsg && (
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 mt-1 animate-fade-in">
                  <Check className="w-3 h-3" /> {t('settings.photoUpdated')}
                </span>
              )}
            </div>
          </div>

          {/* Hidden File and Camera Inputs */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileSelected(file);
            }}
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="user"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileSelected(file);
            }}
          />

          {/* Photo Actions Button Group */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              disabled={isUploadingPhoto}
              className="p-2 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200/80 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-xs font-medium transition cursor-pointer active:scale-95"
              title={t('settings.takePhoto')}
            >
              <Camera className="w-4 h-4 text-[#0F5132] dark:text-emerald-400" />
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingPhoto}
              className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800/60 text-[#0F5132] dark:text-emerald-300 text-xs font-bold transition cursor-pointer active:scale-95 flex items-center gap-1"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{t('settings.chooseGallery')}</span>
            </button>
          </div>
        </div>

        {/* 2. Inline Editable Display Name */}
        <div className="pt-3">
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
              {t('settings.displayName')}
            </label>
            {!isEditingName && (
              <button
                type="button"
                onClick={() => {
                  setNameInput(displayName);
                  setIsEditingName(true);
                }}
                className="text-xs font-bold text-[#0F5132] dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Edit2 className="w-3 h-3" />
                <span>{t('settings.edit')}</span>
              </button>
            )}
          </div>

          {isEditingName ? (
            <div className="flex items-center gap-2 mt-1.5 animate-fade-in">
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveName();
                  if (e.key === 'Escape') setIsEditingName(false);
                }}
                placeholder={t('settings.namePlaceholder')}
                className="flex-1 px-3 py-2 bg-white dark:bg-stone-850 rounded-xl border border-[#0F5132] dark:border-emerald-500 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
                autoFocus
              />
              <button
                type="button"
                onClick={handleSaveName}
                disabled={!nameInput.trim()}
                className="p-2 rounded-xl bg-[#0F5132] dark:bg-emerald-600 text-white hover:bg-[#0A3B24] dark:hover:bg-emerald-500 transition cursor-pointer active:scale-95 disabled:opacity-50"
                title={t('common.save')}
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsEditingName(false)}
                className="p-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700 transition cursor-pointer"
                title={t('common.cancel')}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between py-1">
              <span className="text-sm font-bold text-stone-900 dark:text-stone-100">{displayName}</span>
              {nameSuccessMsg && (
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 animate-fade-in">
                  <Check className="w-3 h-3" /> {t('settings.nameUpdated')}
                </span>
              )}
            </div>
          )}
        </div>

        {/* 3. Read-Only Email Display */}
        <div className="pt-3">
          <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1">
            {t('settings.email')}
          </label>
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-stone-50 dark:bg-stone-850 border border-stone-200/80 dark:border-stone-800 text-xs">
            <div className="flex items-center gap-2 text-stone-700 dark:text-stone-300 min-w-0">
              <Mail className="w-3.5 h-3.5 text-stone-400 dark:text-stone-500 shrink-0" />
              <span className="font-medium truncate">{displayEmail}</span>
            </div>
            <span className="text-[10px] text-stone-400 dark:text-stone-500 font-medium shrink-0 ps-2">
              {t('settings.readOnly')}
            </span>
          </div>
        </div>

        {/* 4. Change Password (Only for Email/Password citizens) */}
        {canChangePassword && (
          <div className="pt-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-stone-500 dark:text-stone-400" />
                <span className="text-xs font-semibold text-stone-800 dark:text-stone-200">
                  {t('settings.changePassword')}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowPasswordForm(!showPasswordForm);
                  setPasswordError(null);
                  setPasswordSuccess(false);
                }}
                className="px-3 py-1 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200/80 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-xs font-bold transition cursor-pointer"
              >
                {showPasswordForm ? t('common.close') : t('settings.edit')}
              </button>
            </div>

            {showPasswordForm && (
              <form
                onSubmit={handleChangePasswordSubmit}
                className="mt-3 p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-850 border border-stone-200 dark:border-stone-800 space-y-3 animate-fade-in"
              >
                {passwordError && (
                  <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                    <span>{passwordError}</span>
                  </div>
                )}

                {passwordSuccess && (
                  <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>{t('settings.passwordUpdated')}</span>
                  </div>
                )}

                <div>
                  <label className="text-[11px] font-bold text-stone-700 dark:text-stone-300 block mb-1">
                    {t('settings.currentPassword')}
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    placeholder={t('settings.currentPasswordPlaceholder')}
                    className="w-full px-3 py-2 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-700 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#0F5132]/30 dark:focus:ring-emerald-500/30"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-stone-700 dark:text-stone-300 block mb-1">
                    {t('settings.newPassword')}
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder={t('settings.newPasswordPlaceholder')}
                    className="w-full px-3 py-2 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-700 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#0F5132]/30 dark:focus:ring-emerald-500/30"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-stone-700 dark:text-stone-300 block mb-1">
                    {t('settings.confirmNewPassword')}
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder={t('settings.confirmNewPasswordPlaceholder')}
                    className="w-full px-3 py-2 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-700 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#0F5132]/30 dark:focus:ring-emerald-500/30"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPasswordForm(false)}
                  >
                    {t('common.cancel')}
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    loading={isUpdatingPassword}
                  >
                    {t('settings.updatePasswordBtn')}
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}

        {isGoogleUser && (
          <div className="pt-2 text-[11px] text-stone-400 dark:text-stone-500 italic">
            {t('settings.googleUserPasswordNotice')}
          </div>
        )}
      </div>
    </Card>
  );
};
