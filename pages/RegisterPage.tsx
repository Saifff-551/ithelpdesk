import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebase';
import { createTenantWithDefaults, createUserProfile } from '../services/firestore';
import { isSubdomainAvailable, isValidSubdomain } from '../services/tenantResolver';
import { useTenant } from '../services/TenantContext';
import {
  Building2,
  Mail,
  Loader2,
  ArrowRight,
  ChevronRight,
  Shield,
  Globe,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { tenant, isPublicAccess } = useTenant();

  // Form state
  const [companyName, setCompanyName] = useState('');
  const [companyUrl, setCompanyUrl] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subdomainStatus, setSubdomainStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');

  // If we're on a tenant domain, redirect to login (employees can't self-register)
  useEffect(() => {
    if (tenant && !isPublicAccess) {
      navigate('/login');
    }
  }, [tenant, isPublicAccess, navigate]);

  // Auto-generate subdomain from company name
  useEffect(() => {
    if (companyName && !subdomain) {
      const suggested = companyName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .slice(0, 20);
      if (suggested.length >= 3) {
        setSubdomain(suggested);
      }
    }
  }, [companyName]);

  // Check subdomain availability with debounce
  const checkSubdomain = useCallback(async (value: string) => {
    if (!value || value.length < 3) {
      setSubdomainStatus('idle');
      return;
    }

    if (!isValidSubdomain(value)) {
      setSubdomainStatus('invalid');
      return;
    }

    setSubdomainStatus('checking');

    try {
      const available = await isSubdomainAvailable(value);
      setSubdomainStatus(available ? 'available' : 'taken');
    } catch {
      setSubdomainStatus('idle');
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      checkSubdomain(subdomain);
    }, 500);

    return () => clearTimeout(timer);
  }, [subdomain, checkSubdomain]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validations
    if (password !== confirmPassword) {
      setError("Passwords don't match");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    if (!acceptTerms) {
      setError("Please accept the Terms of Service and Privacy Policy");
      setLoading(false);
      return;
    }

    if (subdomainStatus !== 'available') {
      setError("Please choose an available subdomain");
      setLoading(false);
      return;
    }

    try {
      // 1. Create Firebase Auth User FIRST (so we're authenticated for Firestore writes)
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Create Tenant with defaults (SLAs, etc.)
      const tenantData = await createTenantWithDefaults({
        name: companyName,
        subdomain: subdomain,
        website_url: companyUrl || undefined,
        primary_color: '#9213ec',
        secondary_color: '#7a10c4',
      });

      // 3. Create User Profile as company_admin
      await createUserProfile(user.uid, {
        tenant_id: tenantData.id,
        full_name: fullName,
        email: email,
        role_id: 'company_admin',
        phone: phone || undefined,
        is_active: true,
      });

      // 4. Redirect to dashboard
      // In production, this would redirect to the new subdomain
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'Failed to register');
    } finally {
      setLoading(false);
    }
  };

  const getSubdomainIcon = () => {
    switch (subdomainStatus) {
      case 'checking':
        return <Loader2 className="h-5 w-5 animate-spin text-gray-400" />;
      case 'available':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'taken':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'invalid':
        return <AlertCircle className="h-5 w-5 text-amber-500" />;
      default:
        return <Globe className="h-5 w-5 text-gray-400" />;
    }
  };

  const getSubdomainMessage = () => {
    switch (subdomainStatus) {
      case 'available':
        return <span className="text-green-600">This subdomain is available!</span>;
      case 'taken':
        return <span className="text-red-600">This subdomain is already taken</span>;
      case 'invalid':
        return <span className="text-amber-600">Use only lowercase letters, numbers, and hyphens (3-63 chars)</span>;
      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen w-full font-display">
      {/* Left Side - Hero Section */}
      <div className="relative hidden w-0 flex-1 lg:block">
        <div
          className="absolute inset-0 h-full w-full bg-cover bg-center"
          style={{
            backgroundImage: 'url("https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=2000&q=80")'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-purple-900/80 to-primary-hover/90 mix-blend-multiply"></div>
          <div className="absolute inset-0 bg-black/10 backdrop-brightness-100"></div>
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'4\' height=\'4\'%3E%3Crect width=\'4\' height=\'4\' fill=\'%23fff\' fill-opacity=\'0.05\'/%3E%3C/svg%3E")'
            }}
          ></div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-16 text-white z-10 flex flex-col justify-end h-full bg-gradient-to-t from-black/60 via-transparent to-transparent">
          <blockquote className="max-w-2xl relative">
            <div className="w-12 h-1 bg-gradient-to-r from-primary to-purple-400 mb-6 rounded-full"></div>
            <p className="text-3xl font-medium leading-tight tracking-tight text-white/95 drop-shadow-sm">
              "Empower your organization with a platform built for{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-200 to-indigo-200 font-bold">
                scale, security, and velocity
              </span>
              ."
            </p>
            <footer className="mt-6 flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/10">
                <Shield className="text-white h-5 w-5" />
              </div>
              <div className="text-sm font-medium text-white/80">
                <div className="text-white font-semibold">Enterprise Grade Security</div>
                <div className="text-xs text-white/60">SOC2 Type II Certified</div>
              </div>
            </footer>
          </blockquote>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex flex-1 flex-col justify-center px-4 py-8 sm:px-6 lg:flex-none lg:px-20 xl:px-32 bg-white dark:bg-background-dark w-full lg:w-[48%] xl:w-[45%] relative overflow-y-auto max-h-screen shadow-2xl shadow-black/10 z-20">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary via-purple-500 to-primary-hover lg:hidden"></div>

        <div className="mx-auto w-full max-w-sm lg:w-[36rem] py-6">
          {/* Header */}
          <div className="flex flex-col items-center text-center lg:items-start lg:text-left gap-5 mb-8">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary to-secondary rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative h-14 w-14 rounded-2xl bg-white dark:bg-surface-dark flex items-center justify-center shadow-sm border border-slate-100 dark:border-white/10">
                <Building2 className="h-7 w-7 text-primary" />
              </div>
            </div>
            <div>
              <h2 className="text-3xl font-bold leading-9 tracking-tight text-slate-900 dark:text-white">
                Register Your Organization
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
                Deploy your AI routing infrastructure in minutes. Get your own branded control plane.
              </p>
            </div>
          </div>

          {/* Form */}
          <div>
            <form onSubmit={handleRegister} className="space-y-4">
              {/* Core Details Grid */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Company Name */}
                <div>
                  <label htmlFor="company_name" className="block text-sm font-semibold leading-6 text-slate-700 dark:text-slate-300 ml-1">
                    Company Name
                  </label>
                  <div className="mt-1 relative">
                    <input
                      id="company_name"
                      name="company_name"
                      type="text"
                      autoComplete="organization"
                      required
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="e.g. Acme Industries"
                      className="block w-full rounded-xl border-0 py-2.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 dark:ring-white/10 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-primary dark:bg-white/5 dark:text-white sm:text-sm sm:leading-6 pl-4 transition-all duration-200 ease-in-out hover:ring-slate-300 dark:hover:ring-white/20 bg-slate-50/30"
                    />
                  </div>
                </div>

                {/* Company Website URL */}
                <div>
                  <label htmlFor="company_url" className="block text-sm font-semibold leading-6 text-slate-700 dark:text-slate-300 ml-1">
                    Company Website <span className="text-slate-400 font-normal">(optional)</span>
                  </label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Globe className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      id="company_url"
                      name="company_url"
                      type="url"
                      value={companyUrl}
                      onChange={(e) => setCompanyUrl(e.target.value)}
                      placeholder="https://www.yourcompany.com"
                      className="block w-full rounded-xl border-0 py-2.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 dark:ring-white/10 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-primary dark:bg-white/5 dark:text-white sm:text-sm sm:leading-6 pl-10 transition-all duration-200 ease-in-out hover:ring-slate-300 dark:hover:ring-white/20 bg-slate-50/30"
                    />
                  </div>
                  <p className="mt-1 text-xs text-slate-500 ml-1">
                    🤖 AI uses this to customize branding
                  </p>
                </div>
              </div>

              {/* Subdomain & Contact Grid */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Subdomain */}
                <div>
                  <label htmlFor="subdomain" className="block text-sm font-semibold leading-6 text-slate-700 dark:text-slate-300 ml-1">
                    Your Platform URL
                  </label>
                  <div className="mt-1 relative">
                    <div className="flex rounded-xl shadow-sm ring-1 ring-inset ring-slate-200 dark:ring-white/10 focus-within:ring-2 focus-within:ring-primary bg-slate-50/30 dark:bg-white/5">
                      <input
                        id="subdomain"
                        name="subdomain"
                        type="text"
                        required
                        value={subdomain}
                        onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                        placeholder="yourcompany"
                        className="block w-full min-w-0 flex-1 rounded-l-xl border-0 bg-transparent py-2.5 pl-4 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-0 sm:text-sm sm:leading-6"
                      />
                      <span className="flex select-none items-center pr-2 text-slate-500 text-sm">
                        .ithelpdesk.app
                      </span>
                      <span className="flex items-center pr-3">
                        {getSubdomainIcon()}
                      </span>
                    </div>
                    {getSubdomainMessage() && (
                      <p className="mt-1 text-xs ml-1">{getSubdomainMessage()}</p>
                    )}
                  </div>
                </div>

                {/* Contact Phone */}
                <div>
                  <label htmlFor="phone" className="block text-sm font-semibold leading-6 text-slate-700 dark:text-slate-300 ml-1">
                    Contact Phone <span className="text-slate-400 font-normal">(optional)</span>
                  </label>
                  <div className="mt-1 relative">
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      autoComplete="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      className="block w-full rounded-xl border-0 py-2.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 dark:ring-white/10 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-primary dark:bg-white/5 dark:text-white sm:text-sm sm:leading-6 pl-4 transition-all duration-200 hover:ring-slate-300 dark:hover:ring-white/20 bg-slate-50/30"
                    />
                  </div>
                </div>
              </div>

              {/* Admin Grid */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Admin Name */}
                <div>
                  <label htmlFor="full_name" className="block text-sm font-semibold leading-6 text-slate-700 dark:text-slate-300 ml-1">
                    Administrator Name
                  </label>
                  <div className="mt-1 relative">
                    <input
                      id="full_name"
                      name="full_name"
                      type="text"
                      autoComplete="name"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="John Doe"
                      className="block w-full rounded-xl border-0 py-2.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 dark:ring-white/10 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-primary dark:bg-white/5 dark:text-white sm:text-sm sm:leading-6 pl-4 transition-all duration-200 hover:ring-slate-300 dark:hover:ring-white/20 bg-slate-50/30"
                    />
                  </div>
                </div>

                {/* Administrator Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold leading-6 text-slate-700 dark:text-slate-300 ml-1">
                    Administrator Email
                  </label>
                  <div className="mt-1 relative">
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@company.com"
                      className="block w-full rounded-xl border-0 py-2.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 dark:ring-white/10 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-primary dark:bg-white/5 dark:text-white sm:text-sm sm:leading-6 pl-4 pr-10 transition-all duration-200 hover:ring-slate-300 dark:hover:ring-white/20 bg-slate-50/30"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-slate-400">
                      <Mail className="h-5 w-5" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Password Grid */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="password" className="block text-sm font-semibold leading-6 text-slate-700 dark:text-slate-300 ml-1">
                    Password
                  </label>
                  <div className="mt-1 relative rounded-xl shadow-sm">
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="new-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="block w-full rounded-xl border-0 py-2.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 dark:ring-white/10 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-primary dark:bg-white/5 dark:text-white sm:text-sm sm:leading-6 pl-4 transition-all duration-200 hover:ring-slate-300 dark:hover:ring-white/20 bg-slate-50/30"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="password_confirmation" className="block text-sm font-semibold leading-6 text-slate-700 dark:text-slate-300 ml-1">
                    Confirm
                  </label>
                  <div className="mt-1 relative rounded-xl shadow-sm">
                    <input
                      id="password_confirmation"
                      name="password_confirmation"
                      type="password"
                      autoComplete="new-password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="block w-full rounded-xl border-0 py-2.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 dark:ring-white/10 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-primary dark:bg-white/5 dark:text-white sm:text-sm sm:leading-6 pl-4 transition-all duration-200 hover:ring-slate-300 dark:hover:ring-white/20 bg-slate-50/30"
                    />
                  </div>
                </div>
              </div>

              {/* Terms Checkbox */}
              <div className="flex items-start pt-2">
                <div className="flex h-6 items-center">
                  <input
                    id="terms"
                    name="terms"
                    type="checkbox"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-primary focus:ring-primary dark:bg-white/10 cursor-pointer"
                  />
                </div>
                <div className="ml-3 text-sm leading-6">
                  <label htmlFor="terms" className="font-medium text-slate-600 dark:text-slate-400">
                    I agree to the{' '}
                    <a href="#" className="font-semibold text-primary hover:text-primary-dark underline decoration-2 decoration-primary/30 underline-offset-2 transition-colors">
                      Terms
                    </a>{' '}
                    and{' '}
                    <a href="#" className="font-semibold text-primary hover:text-primary-dark underline decoration-2 decoration-primary/30 underline-offset-2 transition-colors">
                      Privacy Policy
                    </a>
                    .
                  </label>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="rounded-xl bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-600 dark:text-red-400">
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading || subdomainStatus !== 'available'}
                  className="group relative flex w-full justify-center rounded-xl bg-gradient-to-r from-primary to-secondary px-3 py-3.5 text-sm font-bold leading-6 text-white shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:from-primary-dark hover:to-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      Creating Organization...
                    </>
                  ) : (
                    <>
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <ArrowRight className="h-5 w-5 text-white/90" />
                      </span>
                      Create Organization
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Divider */}
            <div className="relative mt-10">
              <div aria-hidden="true" className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-sm font-medium leading-6">
                <span className="bg-white dark:bg-background-dark px-4 text-slate-500 dark:text-slate-400">
                  Already have an account?
                </span>
              </div>
            </div>

            {/* Sign In Link */}
            <div className="mt-6 text-center">
              <Link
                to="/login"
                className="group inline-flex items-center text-sm font-semibold text-primary hover:text-secondary transition-colors"
              >
                Sign in to your control plane
                <ChevronRight className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-12 border-t border-slate-100 dark:border-white/5 pt-6 text-center lg:text-left">
            <p className="text-xs leading-5 text-slate-400 dark:text-slate-500">
              © {new Date().getFullYear()} MATIE Enterprise. Secure Infrastructure Systems.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
