'use client';

import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, AlertCircle, CheckCircle, UserPlus, LogIn, Sparkles, Dumbbell, Utensils, Waves, Calendar, Loader } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/Select';
import SuccessDialog from '@/components/ui/SuccessDialog';
import { toast } from 'sonner';

interface LoginFormProps {
  onLogin?: () => void;
  initialMode?: 'login' | 'signup' | 'reset';
}

const LoginForm: React.FC<LoginFormProps> = ({ onLogin, initialMode = 'login' }) => {
  const { login, signup, resetPassword } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>(initialMode);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    role: 'staff',
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
      if (mode === 'reset') {
        if (!formData.email) {
          toast.error('Please enter your email address.');
          setLoading(false);
          return;
        }
        const result = await resetPassword(formData.email);
        if (result.success) {
          setMessage({ type: 'success', text: result.message });
          toast.success(result.message);
        } else {
          setMessage({ type: 'error', text: result.message });
          toast.error(result.message);
        }
        setLoading(false);
        return;
      }

      if (formData.password.length < 6) {
          const errorMsg = 'Security requirement: Password must be at least 6 characters long.';
          setMessage({ type: 'error', text: errorMsg });
          toast.error(errorMsg);
          setLoading(false);
          return;
      }

      if (mode === 'login') {
        const result = await login(formData.email, formData.password);
        if (result.success) {
          setSuccessData({
            title: 'Welcome to KSM.ART HOUSE',
            message: 'Authentication successful. Synchronizing your professional workspace...'
          });
          setShowSuccessDialog(true);
        } else {
          let errorText = result.message || 'Access Denied: The email or password provided is incorrect.';
          setMessage({ type: 'error', text: errorText });
          toast.error(errorText);
        }
      } else {
        if (formData.password !== formData.confirmPassword) {
          const errorMsg = 'Validation Error: Passwords do not match.';
          setMessage({ type: 'error', text: errorMsg });
          toast.error(errorMsg);
          setLoading(false);
          return;
        }

        const result = await signup({
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          role: formData.role as any,
        }, formData.password);

        if (result.success) {
          setSuccessData({
            title: 'Onboarding Successful',
            message: `Your professional profile has been created. Please check your email (${formData.email}) to verify your account before logging in.`
          });
          setShowSuccessDialog(true);
        } else {
          setMessage({ type: 'error', text: result.message });
          toast.error(result.message);
        }
      }
    } catch (err: any) {
      toast.error('System Error: Authentication process failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto px-4 pb-10">
      <Card className="bg-card/95 backdrop-blur-xl border-primary/10 shadow-2xl overflow-hidden glass-card glow-primary animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <div className="h-1.5 w-full bg-gradient-to-r from-primary via-indigo-600 to-teal-500" />
        
        <CardHeader className="text-center pt-8 pb-6 px-4">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 group hover:scale-110 transition-transform duration-500">
            <Sparkles className="w-6 h-6 text-primary animate-pulse" />
          </div>
          <CardTitle className="text-foreground text-2xl font-semibold tracking-tight uppercase">
            {mode === 'login' ? 'System Login' : mode === 'signup' ? 'Register Profile' : 'Reset Passphrase'}
          </CardTitle>
          <CardDescription className="text-muted-foreground text-xs font-medium uppercase tracking-widest mt-1 opacity-70">
            {mode === 'login' ? 'Authorized personnel only' : mode === 'signup' ? 'Enterprise onboarding portal' : 'Security recovery protocol'}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6 pt-2 px-4 sm:px-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="firstName" className="text-xs font-semibold uppercase text-muted-foreground/70 tracking-widest ml-1">First Name</label>
                    <Input id="firstName" placeholder="First name" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} required />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="lastName" className="text-xs font-semibold uppercase text-muted-foreground/70 tracking-widest ml-1">Last Name</label>
                    <Input id="lastName" placeholder="Last name" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} required />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="role" className="text-xs font-semibold uppercase text-muted-foreground/70 tracking-widest ml-1">Professional Role</label>
                  <Select
                    value={formData.role}
                    onValueChange={(val) => setFormData({ ...formData, role: val })}
                    disabled={mode === 'signup'}
                  >
                    <SelectTrigger id="role" className="w-full h-11 rounded-xl bg-muted/20 border-primary/5 font-semibold uppercase tracking-widest text-xs">
                      <SelectValue placeholder="Select Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="staff">STAFF MEMBER</SelectItem>
                      <SelectItem value="admin">ADMINISTRATOR</SelectItem>
                      <SelectItem value="investor">INVESTOR</SelectItem>
                      <SelectItem value="director">DIRECTOR</SelectItem>
                      <SelectItem value="operations_manager">OPERATIONS MANAGER</SelectItem>
                    </SelectContent>
                  </Select>
                  {mode === 'signup' && (
                    <p className="text-[10px] text-muted-foreground ml-1 italic">* Roles are assigned by administrators after verification.</p>
                  )}
                </div>
              </>
            )}

            <div className="space-y-1.5">
              <label htmlFor="email" className="text-xs font-semibold uppercase text-muted-foreground/70 tracking-widest ml-1">Corporate Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-primary opacity-50" />
                <Input id="email" type="email" placeholder="name@ksmarthouse.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="pl-10 h-11 font-medium" required />
              </div>
            </div>

            {mode !== 'reset' && (
              <div className="space-y-1.5">
                <div className="flex justify-between items-center px-1">
                  <label htmlFor="password" className="text-xs font-semibold uppercase text-muted-foreground/70 tracking-widest">
                    {mode === 'login' ? 'Access Token' : 'Create Passphrase'}
                  </label>
                  {mode === 'login' && (
                    <button type="button" onClick={() => setMode('reset')} className="text-xs font-bold uppercase text-primary hover:underline">Forgot?</button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-primary opacity-50" />
                  <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="Passphrase" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="pl-10 pr-10 h-11 font-medium" required={(mode as any) !== 'reset'} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-muted-foreground hover:text-primary transition-colors" aria-label={showPassword ? "Hide password" : "Show password"}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}

            {mode === 'signup' && (
              <div className="space-y-1.5">
                <label htmlFor="confirmPassword" className="text-xs font-semibold uppercase text-muted-foreground/70 tracking-widest ml-1">Confirm Passphrase</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-primary opacity-50" />
                  <Input id="confirmPassword" type={showPassword ? 'text' : 'password'} placeholder="Repeat passphrase" value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} className="pl-10 h-11 font-medium" required />
                </div>
              </div>
            )}

            {message && (
              <div className={`p-3 rounded-xl flex items-start gap-3 text-xs font-bold ${message.type === 'error' ? 'bg-destructive/10 text-destructive border border-destructive/20' : 'bg-success/10 text-success border border-success/20'}`}>
                {message.type === 'error' ? <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" /> : <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" />}
                <span className="leading-relaxed">{message.text}</span>
              </div>
            )}

            <Button type="submit" className="w-full h-12 shadow-xl shadow-primary/20 font-bold uppercase tracking-widest text-xs mt-2" disabled={loading}>
              {loading ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                mode === 'login' ? 'Verify Identity' : mode === 'signup' ? 'Establish Profile' : 'Request Recovery'
              )}
            </Button>
          </form>

          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-primary/5" />
            </div>
            <div className="relative flex justify-center text-[10px] font-semibold uppercase tracking-[0.2em]">
              <span className="bg-card px-4 text-muted-foreground/50">Gateway Protocol</span>
            </div>
          </div>

          <Button 
            variant="ghost" 
            className="w-full h-11 hover:bg-primary/5 text-muted-foreground hover:text-primary font-semibold text-xs rounded-xl transition-all" 
            onClick={() => {
              const nextMode: 'login' | 'signup' | 'reset' = mode === 'reset' ? 'login' : (mode === 'login' ? 'signup' : 'login');
              setMode(nextMode);
              setMessage(null);
            }}
            type="button"
          >
            {mode === 'login' ? <><UserPlus className="mr-2 h-4 w-4 opacity-70" /> Initialize New Account</> : <><LogIn className="mr-2 h-4 w-4 opacity-70" /> Return to Secure Login</>}
          </Button>
        </CardContent>
        
        <CardFooter className="flex flex-col space-y-4 justify-center items-center pb-8 px-4">
          <div className="flex space-x-4 opacity-30 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-500">
            <Calendar className="h-4 w-4" /><Dumbbell className="h-4 w-4" /><Utensils className="h-4 w-4" /><Waves className="h-4 w-4" />
          </div>
          <p className="text-[9px] uppercase font-bold tracking-[0.3em] text-muted-foreground opacity-40">Encrypted End-to-End</p>
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
