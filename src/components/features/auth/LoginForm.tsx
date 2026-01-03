'use client';

import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, AlertCircle, CheckCircle, UserPlus, LogIn, Sparkles, Dumbbell, Utensils, Waves, Calendar } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import SuccessDialog from '@/components/ui/SuccessDialog';

interface LoginFormProps {
  onLogin?: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLogin }) => {
  const { login, signup } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [successData, setSuccessData] = useState<{ title: string; message: string }>({ title: '', message: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (formData.password.length < 6) {
          setMessage({ type: 'error', text: 'Security requirement: Password must be at least 6 characters long.' });
          setLoading(false);
          return;
      }

      if (mode === 'login') {
        if (!formData.email || !formData.password) {
          setMessage({ type: 'error', text: 'Authentication incomplete: Please provide your email and password.' });
          setLoading(false);
          return;
        }

        const result = await login(formData.email, formData.password);
        if (result.success) {
          setSuccessData({
            title: 'Welcome to KSM.ART HOUSE',
            message: 'Authentication successful. Synchronizing your professional workspace...'
          });
          setShowSuccessDialog(true);
        } else {
          setMessage({ type: 'error', text: result.message || 'Access denied: Invalid credentials provided. Please verify and try again.' });
        }
      } else {
        if (!formData.email || !formData.password || !formData.firstName || !formData.lastName) {
          setMessage({ type: 'error', text: 'Registration incomplete: All identity fields are required.' });
          setLoading(false);
          return;
        }

        const result = await signup({
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          role: 'staff',
        }, formData.password);

        if (result.success) {
          setSuccessData({
            title: 'Onboarding Successful',
            message: `Welcome to the team! Your professional profile is ready and you are now authenticated.`
          });
          setShowSuccessDialog(true);
        } else {
          setMessage({ type: 'error', text: result.message || 'Registration failed: An internal system error occurred during profile creation.' });
        }
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: 'System Error: We encountered an unexpected issue during the authentication process.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6 px-2">
      <Card className="bg-card/95 backdrop-blur-xl border-primary/10 shadow-2xl overflow-hidden glass-card glow-primary animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <div className="h-1.5 w-full bg-gradient-to-r from-primary via-indigo-600 to-teal-500" />
        
        <CardHeader className="text-center pt-8 pb-6">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 group hover:scale-110 transition-transform duration-500">
            <Sparkles className="w-6 h-6 text-primary animate-pulse" />
          </div>
          <CardTitle className="text-foreground text-2xl font-black tracking-tight uppercase">
            {mode === 'login' ? 'System Login' : 'Register Profile'}
          </CardTitle>
          <CardDescription className="text-muted-foreground text-[10px] font-bold uppercase tracking-[0.2em] mt-1 opacity-70">
            {mode === 'login' 
              ? 'Authorized personnel only' 
              : 'Enterprise onboarding portal'}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6 pt-2">
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-500">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-muted-foreground/70 tracking-widest ml-1">First Name</label>
                  <Input
                    placeholder="Enter first name"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="h-10 bg-muted/20 border-primary/5 focus:border-primary/30"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-muted-foreground/70 tracking-widest ml-1">Last Name</label>
                  <Input
                    placeholder="Enter last name"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="h-10 bg-muted/20 border-primary/5 focus:border-primary/30"
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="email" className="text-[10px] font-black uppercase text-muted-foreground/70 tracking-widest ml-1">
                Corporate Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-primary opacity-50" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@ksmarthouse.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="pl-10 h-11 bg-muted/20 border-primary/5 focus:border-primary/30"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-[10px] font-black uppercase text-muted-foreground/70 tracking-widest ml-1">
                Access Token
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-primary opacity-50" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Secret passphrase"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="pl-10 pr-10 h-11 bg-muted/20 border-primary/5 focus:border-primary/30"
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
            </div>

            {message && (
              <div className={`p-3 rounded-xl flex items-start gap-3 text-xs font-bold animate-in zoom-in-95 duration-300 ${
                message.type === 'error' 
                  ? 'bg-destructive/10 text-destructive border border-destructive/20 shadow-[0_0_15px_-5px_rgba(239,68,68,0.3)]' 
                  : 'bg-success/10 text-success border border-success/20 shadow-[0_0_15px_-5px_rgba(34,197,94,0.3)]'
              }`}>
                {message.type === 'error' ? <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" /> : <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" />}
                <span className="leading-relaxed">{message.text}</span>
              </div>
            )}

            <Button type="submit" className="w-full h-12 shadow-xl shadow-primary/20 font-black uppercase tracking-widest text-[11px] mt-2" disabled={loading}>
              {loading 
                ? (mode === 'login' ? 'Validating...' : 'Processing...') 
                : (mode === 'login' ? 'Verify Identity' : 'Establish Profile')}
            </Button>
          </form>

          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-primary/5" />
            </div>
            <div className="relative flex justify-center text-[9px] font-black uppercase tracking-[0.3em]">
              <span className="bg-card px-4 text-muted-foreground/50">Gateway Protocol</span>
            </div>
          </div>

          <Button 
            variant="ghost" 
            className="w-full h-11 hover:bg-primary/5 text-muted-foreground hover:text-primary font-bold text-xs rounded-xl transition-all" 
            onClick={() => {
              setMode(mode === 'login' ? 'signup' : 'login');
              setMessage(null);
            }}
            type="button"
          >
            {mode === 'login' ? (
              <><UserPlus className="mr-2 h-4 w-4 opacity-70" /> Initialize New Account</>
            ) : (
              <><LogIn className="mr-2 h-4 w-4 opacity-70" /> Return to Secure Login</>
            )}
          </Button>
        </CardContent>
        
        <CardFooter className="flex flex-col space-y-4 justify-center items-center pb-8">
          <div className="flex space-x-4 opacity-30 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-500">
            <Calendar className="h-4 w-4" />
            <Dumbbell className="h-4 w-4" />
            <Utensils className="h-4 w-4" />
            <Waves className="h-4 w-4" />
          </div>
          <p className="text-[8px] uppercase font-black tracking-[0.4em] text-muted-foreground opacity-40">
            Encrypted End-to-End
          </p>
        </CardFooter>
      </Card>
      
      <SuccessDialog
        isOpen={showSuccessDialog}
        onClose={() => setShowSuccessDialog(false)}
        title={successData.title}
        message={successData.message}
        onContinue={() => {
          setShowSuccessDialog(false);
          onLogin?.();
        }}
      />
    </div>
  );
};

export default LoginForm;