'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Lock, Eye, EyeOff, Sparkles, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const router = useRouter();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.updateUser({ password });
      
      if (error) {
        setMessage({ type: 'error', text: error.message });
        toast.error(error.message);
      } else {
        setMessage({ type: 'success', text: 'Password has been reset successfully. Redirecting to login...' });
        toast.success('Password updated successfully!');
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: 'An unexpected error occurred.' });
      toast.error('System error during password update.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background animated-bg relative overflow-hidden px-4">
      <div className="mb-8 text-center animate-in fade-in zoom-in duration-700">
        <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-600 to-teal-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-primary/20 mb-4">
          <Sparkles className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-4xl font-serif font-black tracking-tighter text-logo mb-2">KSM.ART HOUSE</h1>
        <p className="text-muted-foreground font-bold tracking-[0.2em] uppercase text-xs">Security Recovery</p>
      </div>

      <div className="w-full max-w-md">
        <Card className="bg-card/95 backdrop-blur-xl border-primary/10 shadow-2xl overflow-hidden glass-card glow-primary">
          <div className="h-1.5 w-full bg-gradient-to-r from-primary via-indigo-600 to-teal-500" />
          <CardHeader className="text-center pt-8 pb-6">
            <CardTitle className="text-foreground text-2xl font-black tracking-tight uppercase">Update Passphrase</CardTitle>
            <CardDescription className="text-muted-foreground text-[10px] font-bold uppercase tracking-[0.2em] mt-1 opacity-70">
              Establish your new secure credentials
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-2">
            <form onSubmit={handleReset} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-muted-foreground/70 tracking-widest ml-1">New Passphrase</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-primary opacity-50" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min. 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 h-11 bg-muted/20 border-primary/5 focus:border-primary/30"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-muted-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-muted-foreground/70 tracking-widest ml-1">Confirm New Passphrase</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-primary opacity-50" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Repeat new passphrase"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 pr-10 h-11 bg-muted/20 border-primary/5 focus:border-primary/30"
                    required
                  />
                </div>
              </div>

              {message && (
                <div className={`p-3 rounded-xl flex items-start gap-3 text-xs font-bold ${
                  message.type === 'error' ? 'bg-destructive/10 text-destructive' : 'bg-success/10 text-success'
                }`}>
                  {message.type === 'error' ? <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" /> : <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" />}
                  <span>{message.text}</span>
                </div>
              )}

              <Button type="submit" className="w-full h-12 font-black uppercase tracking-widest text-[11px]" disabled={loading}>
                {loading ? 'Updating...' : 'Confirm New Credentials'}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="justify-center pb-8">
            <Button variant="ghost" className="text-xs font-bold" onClick={() => router.push('/login')}>
              Return to Login
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
