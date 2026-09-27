import React, { useState } from 'react';
import { LogOut, Trash2, AlertTriangle } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../contexts/LanguageContext';

export const AccountActionsSection: React.FC = () => {
  const { user, signOut, deleteAccount } = useAuth();
  const { locale, isRTL, t } = useTranslation();

  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleSignOutConfirm = async () => {
    setIsSigningOut(true);
    setActionError(null);
    try {
      await signOut();
      setShowSignOutModal(false);
    } catch (err: any) {
      console.error('Sign out error:', err);
      setActionError('Sign out error occurred, clearing session locally.');
      setShowSignOutModal(false);
    } finally {
      setIsSigningOut(false);
    }
  };

  const handleDeleteAccountConfirm = async () => {
    setIsDeleting(true);
    setActionError(null);
    try {
      await deleteAccount();
      setShowDeleteModal(false);
    } catch (err: any) {
      console.error('Failed to delete account:', err);
      setActionError(err?.message || 'Could not complete account deletion. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!user) return null;

  return (
    <>
      <Card variant="default" padded="none" className="overflow-hidden border-rose-200/80 dark:border-rose-900/60 shadow-2xs">
        {/* Section Header */}
        <div className="p-4 bg-gradient-to-r from-rose-50/60 to-stone-50 dark:from-rose-950/40 dark:to-stone-900 border-b border-rose-100 dark:border-rose-900/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-xl bg-rose-600 text-white flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </span>
            <h3 className="text-xs font-bold text-rose-900 dark:text-rose-300 uppercase tracking-wider">
              {t('settings.accountActions')}
            </h3>
          </div>
        </div>

        <div className="divide-y divide-stone-100 dark:divide-stone-800 p-4 space-y-3">
          {actionError && (
            <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
              <span>{actionError}</span>
            </div>
          )}

          {/* Sign Out Action */}
          <div className="flex items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-2xl bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 flex items-center justify-center shrink-0">
                <LogOut className="w-4 h-4 text-stone-600 dark:text-stone-400 rtl-flip" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-stone-800 dark:text-stone-200 block">
                  {t('settings.signOut')}
                </span>
                <span className="text-[11px] text-stone-400 dark:text-stone-500 block truncate">
                  {user?.email || user?.displayName || 'Current Session'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowSignOutModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 font-bold text-xs transition cursor-pointer active:scale-95 shrink-0"
            >
              {t('settings.signOut')}
            </button>
          </div>

          {/* Delete Account Action */}
          <div className="flex items-center justify-between gap-3 pt-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-2xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <Trash2 className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-rose-700 dark:text-rose-400 block">
                  {t('settings.deleteAccount')}
                </span>
                <span className="text-[11px] text-stone-400 dark:text-stone-500 block truncate">
                  {t('settings.deleteAccountDesc')}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 font-bold text-xs transition cursor-pointer active:scale-95 shrink-0"
            >
              {t('settings.deleteAccount')}
            </button>
          </div>
        </div>
      </Card>

      {/* In-App Sign Out Confirmation Modal */}
      {showSignOutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-stone-900 rounded-3xl p-5 shadow-2xl border border-stone-200 dark:border-stone-800 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-stone-100 dark:bg-stone-800 text-[#0F5132] dark:text-emerald-400 flex items-center justify-center mx-auto">
              <LogOut className="w-6 h-6 rtl-flip text-[#0F5132] dark:text-emerald-400" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className={`text-base font-bold text-stone-900 dark:text-stone-100 ${locale === 'ur' ? 'font-urdu' : ''}`}>
                {t('settings.signOut')}
              </h3>
              <p className={`text-xs text-stone-600 dark:text-stone-300 leading-relaxed ${locale === 'ur' ? 'font-urdu' : ''}`}>
                {t('settings.signOutConfirm')}
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <Button
                variant="primary"
                size="md"
                fullWidth
                disabled={isSigningOut}
                loading={isSigningOut}
                onClick={handleSignOutConfirm}
              >
                {t('settings.signOut')}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                fullWidth
                disabled={isSigningOut}
                onClick={() => setShowSignOutModal(false)}
              >
                {t('common.cancel')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Confirmation Dialog Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-stone-900 rounded-3xl p-5 shadow-2xl border border-rose-200 dark:border-rose-900/60 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6 text-rose-600 dark:text-rose-400" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className={`text-base font-bold text-stone-900 dark:text-stone-100 ${locale === 'ur' ? 'font-urdu' : ''}`}>
                {t('settings.deleteAccountModalTitle')}
              </h3>
              <p className={`text-xs text-stone-600 dark:text-stone-300 leading-relaxed ${locale === 'ur' ? 'font-urdu' : ''}`}>
                {t('settings.deleteAccountWarning')}
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <Button
                variant="danger"
                size="md"
                fullWidth
                disabled={isDeleting}
                loading={isDeleting}
                onClick={handleDeleteAccountConfirm}
              >
                {t('settings.deleteAccountConfirm')}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                fullWidth
                disabled={isDeleting}
                onClick={() => setShowDeleteModal(false)}
              >
                {t('common.cancel')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
