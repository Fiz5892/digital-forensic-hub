import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, Eye, EyeOff, Lock, Mail, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const success = await login(email, password);
      if (success) {
        toast.success('Login successful', {
          description: 'Welcome to DFIR-Manager'
        });
        navigate('/dashboard');
      } else {
        setError('Invalid email or password');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const demoUsers = [
    { email: 'reporter@dfir.com', role: 'Reporter' },
    { email: 'responder@dfir.com', role: 'First Responder' },
    { email: 'investigator@dfir.com', role: 'Investigator' },
    { email: 'manager@dfir.com', role: 'Manager' },
    { email: 'admin@dfir.com', role: 'Admin' },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/20 via-background to-background p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.1),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(59,130,246,0.05),transparent_50%)]" />
        
        <div className="relative">
          <div className="flex items-center gap-3">
            <Shield className="h-12 w-12 text-primary" />
            <div>
              <h1 className="text-3xl font-bold text-gradient">DFIR-Manager</h1>
              <p className="text-muted-foreground">Digital Forensic & Incident Response</p>
            </div>
          </div>
        </div>

        <div className="relative space-y-6">
          <h2 className="text-4xl font-bold leading-tight">
            Secure Incident<br />
            <span className="text-gradient">Management System</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-md">
            Professional digital forensic incident handling platform with chain of custody tracking, 
            evidence management, and comprehensive reporting.
          </p>
          
          <div className="flex gap-6">
            <div className="glass-card p-4 rounded-lg">
              <p className="text-2xl font-bold text-primary">99.9%</p>
              <p className="text-sm text-muted-foreground">Uptime</p>
            </div>
            <div className="glass-card p-4 rounded-lg">
              <p className="text-2xl font-bold text-primary">256-bit</p>
              <p className="text-sm text-muted-foreground">Encryption</p>
            </div>
            <div className="glass-card p-4 rounded-lg">
              <p className="text-2xl font-bold text-primary">NIST</p>
              <p className="text-sm text-muted-foreground">Compliant</p>
            </div>
          </div>
        </div>

        <div className="relative">
          <p className="text-sm text-muted-foreground">
            © 2024 DFIR-Manager v1.0 • Enterprise Security Platform
          </p>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <Shield className="h-10 w-10 text-primary" />
            <h1 className="text-2xl font-bold text-gradient">DFIR-Manager</h1>
          </div>

          <div className="text-center lg:text-left">
            <h2 className="text-2xl font-bold">Welcome back</h2>
            <p className="text-muted-foreground mt-2">Sign in to access the incident management system</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                'Sign in'
              )}
            </Button>
          </form>

          {/* Demo Credentials */}
          <div className="glass-card rounded-lg p-4 space-y-3">
            <p className="text-sm font-medium text-muted-foreground">Demo Accounts (password: pass123)</p>
            <div className="grid grid-cols-2 gap-2">
              {demoUsers.map((user) => (
                <button
                  key={user.email}
                  onClick={() => {
                    setEmail(user.email);
                    setPassword('pass123');
                  }}
                  className="text-left p-2 rounded-md hover:bg-muted/50 transition-colors text-xs"
                >
                  <p className="font-medium text-foreground">{user.role}</p>
                  <p className="text-muted-foreground truncate">{user.email}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
