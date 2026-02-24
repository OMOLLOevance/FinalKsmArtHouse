'use client';

import React, { useState } from 'react';
import { Lock, Eye, EyeOff, Loader, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface ChangePasswordFormProps {
  onSuccess?: () => void;
  showTitle?: boolean;
}

export const ChangePasswordForm: React.FC<ChangePasswordFormProps> = ({ 
  onSuccess,
  showTitle = true 
}) => {
  const { user, setForcePasswordChange, refreshUser } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getPasswordStrength = (password: string) => {
    if (password.length === 0) return { label: '', color: 'bg-transparent' };
    if (password.length < 6) return { label: 'Too short', color: 'bg-destructive' };
    if (password.length < 10) return { label: 'Medium', color: 'bg-yellow-500' };
    return { label: 'Strong', color: 'bg-success' };
  };

  const strength = getPasswordStrength(newPassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      // 1. Update Supabase Auth password
      const { error: authError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (authError) throw authError;

      // 2. Update public.users.must_change_password (if it was true)
      if (user?.mustChangePassword) {
        const { error: profileError } = await supabase
          .from('users')
          .update({ must_change_password: false })
          .eq('id', user.id);

        if (profileError) throw profileError;
        setForcePasswordChange(false);
      }

      toast.success('Password updated successfully.');
      setNewPassword('');
      setConfirmPassword('');
      await refreshUser();
      onSuccess?.();
    } catch (err: any) {
      console.error('Error changing password:', err);
      setError(err.message || 'Failed to update password. Please try again.');
      toast.error('Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {showTitle && (
        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-foreground mb-4">Security Credentials</h3>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase text-muted-foreground/70 tracking-widest ml-1">New Passphrase</label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-primary opacity-50" />
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter new passphrase"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="pl-10 pr-10 h-11 font-medium bg-muted/20"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 text-muted-foreground hover:text-primary transition-colors"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {newPassword && (
            <div className="flex items-center gap-2 px-1">
              <div className="h-1 flex-1 bg-muted rounded-full overflow-hidden">
                <div className={`h-full ${strength.color} transition-all duration-500`} style={{ width: newPassword.length < 6 ? '33%' : newPassword.length < 10 ? '66%' : '100%' }} />
              </div>
              <span className="text-[9px] font-bold uppercase tracking-wider opacity-60">{strength.label}</span>
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase text-muted-foreground/70 tracking-widest ml-1">Confirm Passphrase</label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-primary opacity-50" />
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="Repeat new passphrase"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="pl-10 h-11 font-medium bg-muted/20"
              required
            />
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 flex items-start gap-3 text-xs font-bold text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <Button 
          type="submit" 
          className="w-full h-11 font-black uppercase tracking-[0.2em] text-[10px] mt-2 shadow-lg shadow-primary/20" 
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader className="mr-2 h-4 w-4 animate-spin" />
              Verifying...
            </>
          ) : (
            'Update Passphrase'
          )}
        </Button>
      </form>
    </div>
  );
};
