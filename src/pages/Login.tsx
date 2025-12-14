import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, Eye, EyeOff, Lock, Mail, AlertCircle, User, CheckCircle, Building2, Phone } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import { logAuthEvent } from '@/lib/auditLogger';

// Department options
const DEPARTMENTS = [
  'Security Operations Center (SOC)',
  'IT Security',
  'Information Technology',
  'Network Operations',
  'Cybersecurity',
  'Digital Forensics',
  'Incident Response',
  'Compliance & Audit',
  'Risk Management',
  'Other'
];

const loginSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(1, 'Password wajib diisi'),
});

const signupSchema = z.object({
  fullName: z.string().min(2, 'Nama minimal 2 karakter').max(100, 'Nama maksimal 100 karakter'),
  email: z.string().email('Email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  confirmPassword: z.string(),
  department: z.string().optional(),
  phone: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Password tidak cocok",
  path: ["confirmPassword"],
});

export default function Login() {
  const [activeTab, setActiveTab] = useState('login');
  
  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  
  // Signup state
  const [signupFullName, setSignupFullName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [signupDepartment, setSignupDepartment] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const { login, signup, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // FIXED: Only redirect if already authenticated and not in loading state
  useEffect(() => {
    // Wait until auth state is fully resolved
    if (!authLoading && isAuthenticated) {
      // Use setTimeout to avoid "too many calls" error
      const timer = setTimeout(() => {
        // Get the intended destination or default to dashboard
        const from = (location.state as any)?.from?.pathname || '/dashboard';
        console.log('🔄 Redirecting authenticated user to:', from);
        navigate(from, { replace: true });
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, authLoading, navigate, location]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate input
    const validation = loginSchema.safeParse({ email: loginEmail, password: loginPassword });
    if (!validation.success) {
      setError(validation.error.errors[0].message);
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await login(loginEmail, loginPassword);
      if (error) {
        setError(error);
      } else {
        // LOG AUDIT: Login berhasil
        await logAuthEvent('login', loginEmail);
        
        toast.success('Login berhasil', {
          description: 'Selamat datang di DFIR-Manager'
        });
        
        // Navigation will be handled by useEffect after auth state updates
      }
    } catch (err) {
      setError('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate input
    const validation = signupSchema.safeParse({ 
      fullName: signupFullName,
      email: signupEmail, 
      password: signupPassword,
      confirmPassword: signupConfirmPassword,
      department: signupDepartment,
      phone: signupPhone
    });
    
    if (!validation.success) {
      setError(validation.error.errors[0].message);
      return;
    }

    setIsLoading(true);

    try {
      // Pass additional data to signup function
      const { error } = await signup(
        signupEmail, 
        signupPassword, 
        signupFullName,
        signupDepartment || signupPhone ? {
          department: signupDepartment || null,
          phone: signupPhone || null
        } : undefined
      );
      
      if (error) {
        setError(error);
      } else {
        setSuccess('Akun berhasil dibuat! Silakan login.');
        setActiveTab('login');
        setLoginEmail(signupEmail);
        
        // Clear signup form
        setSignupFullName('');
        setSignupEmail('');
        setSignupPassword('');
        setSignupConfirmPassword('');
        setSignupDepartment('');
        setSignupPhone('');
        
        toast.success('Pendaftaran berhasil!', {
          description: 'Silakan login dengan akun baru Anda'
        });
      }
    } catch (err) {
      setError('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading screen while checking auth state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <span className="text-muted-foreground">Loading...</span>
        </div>
      </div>
    );
  }

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

      {/* Right Panel - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background overflow-y-auto">
        <div className="w-full max-w-md space-y-8 py-8">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <Shield className="h-10 w-10 text-primary" />
            <h1 className="text-2xl font-bold text-gradient">DFIR-Manager</h1>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Daftar</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-6 mt-6">
              <div className="text-center lg:text-left">
                <h2 className="text-2xl font-bold">Selamat datang kembali</h2>
                <p className="text-muted-foreground mt-2">Masuk untuk mengakses sistem</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                {error && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    {error}
                  </div>
                )}

                {success && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-500 text-sm">
                    <CheckCircle className="h-4 w-4 flex-shrink-0" />
                    {success}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="name@gmail.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="pl-10"
                      required
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="login-password"
                      type={showLoginPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="pl-10 pr-10"
                      required
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      Masuk...
                    </span>
                  ) : (
                    'Masuk'
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="space-y-6 mt-6">
              <div className="text-center lg:text-left">
                <h2 className="text-2xl font-bold">Buat akun baru</h2>
                <p className="text-muted-foreground mt-2">Daftar untuk mengakses sistem</p>
              </div>

              <form onSubmit={handleSignup} className="space-y-4">
                {error && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    {error}
                  </div>
                )}

                {/* Full Name - Required */}
                <div className="space-y-2">
                  <Label htmlFor="signup-name">
                    Nama Lengkap <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="Your Name"
                      value={signupFullName}
                      onChange={(e) => setSignupFullName(e.target.value)}
                      className="pl-10"
                      required
                      autoComplete="name"
                    />
                  </div>
                </div>

                {/* Email - Required */}
                <div className="space-y-2">
                  <Label htmlFor="signup-email">
                    Email <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="name@gmail.com"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      className="pl-10"
                      required
                      autoComplete="email"
                    />
                  </div>
                </div>

                {/* Department - Optional */}
                <div className="space-y-2">
                  <Label htmlFor="signup-department">Department</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                    <Select value={signupDepartment} onValueChange={setSignupDepartment}>
                      <SelectTrigger className="pl-10">
                        <SelectValue placeholder="Pilih department (opsional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {DEPARTMENTS.map((dept) => (
                          <SelectItem key={dept} value={dept}>
                            {dept}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Phone - Optional */}
                <div className="space-y-2">
                  <Label htmlFor="signup-phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-phone"
                      type="tel"
                      placeholder="+62 812-3456-7890 (opsional)"
                      value={signupPhone}
                      onChange={(e) => setSignupPhone(e.target.value)}
                      className="pl-10"
                      autoComplete="tel"
                    />
                  </div>
                </div>

                {/* Password - Required */}
                <div className="space-y-2">
                  <Label htmlFor="signup-password">
                    Password <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-password"
                      type={showSignupPassword ? 'text' : 'password'}
                      placeholder="Minimal 6 karakter"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      className="pl-10 pr-10"
                      required
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignupPassword(!showSignupPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showSignupPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password - Required */}
                <div className="space-y-2">
                  <Label htmlFor="signup-confirm">
                    Konfirmasi Password <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-confirm"
                      type={showSignupPassword ? 'text' : 'password'}
                      placeholder="Ulangi password"
                      value={signupConfirmPassword}
                      onChange={(e) => setSignupConfirmPassword(e.target.value)}
                      className="pl-10"
                      required
                      autoComplete="new-password"
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      Mendaftar...
                    </span>
                  ) : (
                    'Daftar'
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <p className="text-center text-sm text-muted-foreground">
            Dengan masuk atau mendaftar, Anda menyetujui{' '}
            <a href="#" className="text-primary hover:underline">Ketentuan Layanan</a>
            {' '}dan{' '}
            <a href="#" className="text-primary hover:underline">Kebijakan Privasi</a>
          </p>
        </div>
      </div>
    </div>
  );
}