'use client';

import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, AlertCircle, CheckCircle, UserPlus, LogIn } from 'lucide-react';
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
      if (mode === 'login') {
        if (!formData.email || !formData.password) {
          setMessage({ type: 'error', text: 'Please fill in all fields.' });
          setLoading(false);
          return;
        }

        const result = await login(formData.email, formData.password);
        if (result) {
          setSuccessData({
            title: 'Welcome Back!',
            message: 'You have successfully logged into KSM.ART HOUSE management system.'
          });
          setShowSuccessDialog(true);
        } else {
          setMessage({ type: 'error', text: 'Invalid email or password.' });
        }
      } else {
        if (!formData.email || !formData.password || !formData.firstName || !formData.lastName) {
          setMessage({ type: 'error', text: 'Please fill in all fields.' });
          setLoading(false);
          return;
        }

        const result = await signup({
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          role: 'staff', // Default role
        }, formData.password);

        if (result.success) {
          setSuccessData({
            title: 'Account Created!',
            message: `Welcome to KSM.ART HOUSE! Your account has been created successfully and you are now logged in.`
          });
          setShowSuccessDialog(true);
        } else {
          setMessage({ type: 'error', text: result.message });
        }
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'An unexpected error occurred.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      <Card className="bg-card/95 backdrop-blur-sm border-border shadow-2xl overflow-hidden">
        <CardHeader className="text-center bg-muted/30 pb-8">
          <CardTitle className="text-foreground text-3xl font-serif">
            {mode === 'login' ? 'Sign In' : 'Create Account'}
          </CardTitle>
          <CardDescription className="text-muted-foreground mt-2">
            {mode === 'login' 
              ? 'Enter your credentials to access the premium suite' 
              : 'Join the KSM.ART HOUSE management platform'}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6 pt-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">First Name</label>
                  <Input
                    placeholder="John"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Last Name</label>
                  <Input
                    placeholder="Doe"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="pl-9"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="pl-9 pr-9"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {message && (
              <div className={`p-3 rounded-lg flex items-center gap-2 text-sm ${
                message.type === 'error' ? 'bg-destructive/10 text-destructive border border-destructive/20' : 'bg-success/10 text-success border border-success/20'
              }`}>
                {message.type === 'error' ? <AlertCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                {message.text}
              </div>
            )}

            <Button type="submit" className="w-full h-11 shadow-lg shadow-primary/20" disabled={loading}>
              {loading 
                ? (mode === 'login' ? 'Signing in...' : 'Creating account...') 
                : (mode === 'login' ? 'Sign In' : 'Sign Up')}
            </Button>
          </form>

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-4 text-muted-foreground">Account Options</span>
            </div>
          </div>

          <Button 
            variant="outline" 
            className="w-full h-11 border-border hover:bg-muted/50" 
            onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
            type="button"
          >
            {mode === 'login' ? (
              <><UserPlus className="mr-2 h-4 w-4" /> Create new account</>
            ) : (
              <><LogIn className="mr-2 h-4 w-4" /> Already have an account? Sign in</>
            )}
          </Button>
        </CardContent>
        
        <CardFooter className="flex justify-center text-xs text-muted-foreground pb-8 italic">
          KSM.ART HOUSE Premium Management Suite
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