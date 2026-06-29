/* eslint-disable react-hooks/set-state-in-effect */
import { motion } from 'framer-motion';
import { Camera, Check, Loader2, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';

import { PageShell } from '@/components/page-shell';
import { UserAvatar } from '@/components/user-avatar';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useDocumentTitle } from '@/lib/use-document-title';

export function AccountPage() {
  useDocumentTitle('Profile');
  const {
    user,
    isLoading: authLoading,
    updateProfile,
    uploadAvatar,
    deleteAccount,
    logout,
  } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName ?? '');
    }
  }, [user]);

  if (authLoading || !user) return null;

  const handleAvatarPick = async (file: File) => {
    setUploadingAvatar(true);
    setError('');
    try {
      await uploadAvatar(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      await updateProfile({
        displayName: displayName.trim() || undefined,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await deleteAccount();
      logout();
      navigate('/');
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Failed to delete account'
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <PageShell title="Account" maxWidth="max-w-lg">
      <main className="flex flex-col gap-6">
        {/* Avatar + display name */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut', delay: 0.05 }}
          className="mb-4 flex items-center gap-5"
        >
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingAvatar}
            className="group relative flex shrink-0 cursor-pointer items-center justify-center rounded-full border-none bg-transparent p-0 disabled:cursor-wait"
            title="Change avatar"
          >
            <UserAvatar
              avatarUrl={user.avatarUrl}
              name={user.displayName ?? user.email}
              size={84}
            />
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/45 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
              {uploadingAvatar ? (
                <Loader2 size={20} className="animate-spin" color="#fff" />
              ) : (
                <Camera size={20} color="#fff" />
              )}
            </div>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={e => {
              const file = e.target.files?.[0];
              if (file) handleAvatarPick(file);
              e.target.value = '';
            }}
          />
          <div>
            <div className="text-[1.05rem] font-bold">
              {user.displayName || user.email.split('@')[0]}
            </div>
            <div className="text-muted-foreground text-[0.82rem]">
              {user.email}
            </div>
            <div className="text-muted-foreground mt-0.5 text-[0.78rem]">
              {user.role === 'admin' ? 'Administrator' : 'Member'}
            </div>
          </div>
        </motion.section>

        {/* Profile form */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut', delay: 0.1 }}
          className="mb-4 flex flex-col gap-4"
        >
          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor="displayName"
              className="text-secondary-foreground/80 text-[0.78rem] font-semibold"
            >
              Display Name
            </Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="How you want to be called"
              maxLength={120}
            />
          </div>

          {error && <p className="text-destructive text-[0.85rem]">{error}</p>}

          <div className="mt-2 flex items-center gap-3">
            <Button
              onClick={handleSave}
              disabled={saving}
              variant="default"
              className="min-w-35"
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </Button>
            {saved && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-1.5 text-[0.85rem] text-emerald-500"
              >
                <Check size={14} /> Saved
              </motion.span>
            )}
          </div>
        </motion.section>

        {/* Danger zone */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut', delay: 0.2 }}
        >
          <Card className="border-destructive/25 bg-destructive/4 rounded-2xl p-5 shadow-[0_8px_30px_var(--destructive-glow)]">
            <CardHeader className="p-0">
              <CardTitle className="text-destructive text-sm font-bold">
                Danger Zone
              </CardTitle>
              <CardDescription className="text-destructive/80 text-sm">
                Permanently delete your account. This cannot be undone.
              </CardDescription>
            </CardHeader>
            <CardContent className="mt-0 p-0">
              <Button
                onClick={handleDeleteAccount}
                disabled={deleting}
                variant="destructive"
                className="flex items-center gap-1.5"
              >
                <Trash2 size={14} />
                {deleting ? 'Deleting…' : 'Delete Account'}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </PageShell>
  );
}

export default AccountPage;
