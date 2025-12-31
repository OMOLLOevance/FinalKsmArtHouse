import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface LoginFormProps {
  onLogin?: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLogin }) => {
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleDemoLogin = async () => {
    setLoading(true);
    setMessage(null);

    const result = await login('demo@test.com', 'demo123');

    if (result) {
      setMessage({ type: 'success', text: 'Login successful!' });
      onLogin?.();
    } else {
      setMessage({ type: 'error', text: 'Login failed' });
    }

    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (!formData.email || !formData.password) {
      setMessage({ type: 'error', text: 'Please fill in all fields.' });
      setLoading(false);
      return;
    }

    const result = await login(formData.email, formData.password);

    if (result) {
      setMessage({ type: 'success', text: 'Login successful!' });
      onLogin?.();
    } else {
      setMessage({ type: 'error', text: 'Invalid credentials' });
    }

    setLoading(false);
  };

  return (
    <div className="w-full space-y-6">
      <Card className="bg-white/95 backdrop-blur-sm border-brand-border shadow-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-brand-text">Sign In</CardTitle>
            <CardDescription className="text-brand-muted">Enter your email and password to access your account</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Demo Login Banner */}
            <div className="bg-brand-primary/10 border border-brand-primary/20 rounded-lg p-4 text-center">
              <p className="text-sm font-medium text-brand-primary mb-2">Quick Demo Access</p>
              <Button 
                variant="outline" 
                className="w-full border-brand-primary/30 hover:bg-brand-primary/10 text-brand-primary"
                onClick={handleDemoLogin}
                disabled={loading}
              >
                {loading ? 'Logging in...' : 'Login as Demo User'}
              </Button>
              <p className="text-xs text-brand-muted mt-2">demo@test.com / demo123</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-brand-text">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-brand-muted" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="pl-9 border-brand-border focus:border-brand-primary focus:ring-brand-primary/20"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-brand-text">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-brand-muted" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="pl-9 pr-9 border-brand-border focus:border-brand-primary focus:ring-brand-primary/20"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-brand-muted hover:text-brand-text transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {message && (
                <div className={`p-3 rounded-lg flex items-center gap-2 text-sm ${
                  message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'
                }`}>
                  {message.type === 'error' ? <AlertCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                  {message.text}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-brand-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-brand-muted">Or continue with</span>
              </div>
            </div>

            <Button variant="outline" className="w-full" type="button">
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google
            </Button>
          </CardContent>
          <CardFooter className="flex justify-center text-sm text-brand-muted space-x-4">
            <button className="hover:text-brand-primary underline transition-colors">Forgot password?</button>
            <span>•</span>
            <button className="hover:text-brand-primary underline transition-colors">Create account</button>
          </CardFooter>
        </Card>
    </div>
  );
};

export default LoginForm;