import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { api, getErrorMessage } from "@/api/client";
import { useAuthStore } from "@/contexts/authStore";

const inputClass =
  "w-full bg-transparent border-b border-charcoal-900/20 py-3 outline-none focus:border-clay-500 transition-colors";

function AuthShell({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:block relative">
        <img
          src="https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=1400&auto=format&fit=crop"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-charcoal-950/40" />
        <Link to="/" className="absolute top-10 left-10 font-display text-xl text-sand-50">
          Aetherlume
        </Link>
      </div>
      <div className="flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm"
        >
          <Link to="/" className="lg:hidden font-display text-xl mb-10 block">Aetherlume</Link>
          <h1 className="font-display text-3xl mb-2">{title}</h1>
          {subtitle && <p className="text-sm text-charcoal-700/70 mb-8">{subtitle}</p>}
          {children}
        </motion.div>
      </div>
    </div>
  );
}

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setTokens, setUser } = useAuthStore();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { data } = await api.post("/auth/login", { email, password });
      setTokens(data.access_token, data.refresh_token);
      const me = await api.get("/auth/me");
      setUser(me.data);
      navigate(me.data.user_type === "STAFF" ? "/admin" : "/dashboard");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to your client account.">
      <form onSubmit={submit} className="space-y-6">
        <div>
          <label className="text-xs uppercase tracking-widest2 text-charcoal-700/60">Email</label>
          <input type="email" required className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label className="text-xs uppercase tracking-widest2 text-charcoal-700/60">Password</label>
          <input type="password" required className={inputClass} value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={loading} className="btn-primary w-full justify-center disabled:opacity-60">
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>
      <div className="flex justify-between mt-6 text-xs text-charcoal-700/70">
        <Link to="/forgot-password" className="hover:text-charcoal-900">Forgot password?</Link>
        <Link to="/register" className="hover:text-charcoal-900">Create an account</Link>
      </div>
    </AuthShell>
  );
}

export function Register() {
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api.post("/auth/register", { ...form, phone: form.phone || null });
      setDone(true);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <AuthShell title="Account created">
        <p className="text-sm text-charcoal-700 mb-8">
          Your account is ready. You can sign in now — check your email for a verification link.
        </p>
        <Link to="/login" className="btn-primary w-full justify-center">Go to Sign In</Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Create your account" subtitle="Track your enquiries, projects and approvals in one place.">
      <form onSubmit={submit} className="space-y-6">
        <div>
          <label className="text-xs uppercase tracking-widest2 text-charcoal-700/60">Full Name</label>
          <input required className={inputClass} value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
        </div>
        <div>
          <label className="text-xs uppercase tracking-widest2 text-charcoal-700/60">Email</label>
          <input type="email" required className={inputClass} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div>
          <label className="text-xs uppercase tracking-widest2 text-charcoal-700/60">Phone</label>
          <input className={inputClass} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>
        <div>
          <label className="text-xs uppercase tracking-widest2 text-charcoal-700/60">Password</label>
          <input type="password" required minLength={8} className={inputClass} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <p className="text-[11px] text-charcoal-700/50 mt-2">At least 8 characters, with a letter and a number.</p>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={loading} className="btn-primary w-full justify-center disabled:opacity-60">
          {loading ? "Creating..." : "Create Account"}
        </button>
      </form>
      <p className="mt-6 text-xs text-charcoal-700/70">
        Already have an account? <Link to="/login" className="underline">Sign in</Link>
      </p>
    </AuthShell>
  );
}

export function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    await api.post("/auth/forgot-password", { email }).catch(() => null);
    setSent(true);
  }

  return (
    <AuthShell title="Reset your password" subtitle="We'll send a reset link if an account exists.">
      {sent ? (
        <>
          <p className="text-sm text-charcoal-700 mb-8">
            If that email is registered, a reset link is on its way. Use the token from the email
            on the reset page.
          </p>
          <Link to="/reset-password" className="btn-primary w-full justify-center">Enter Reset Token</Link>
        </>
      ) : (
        <form onSubmit={submit} className="space-y-6">
          <div>
            <label className="text-xs uppercase tracking-widest2 text-charcoal-700/60">Email</label>
            <input type="email" required className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <button type="submit" className="btn-primary w-full justify-center">Send Reset Link</button>
        </form>
      )}
      <p className="mt-6 text-xs"><Link to="/login" className="underline">Back to sign in</Link></p>
    </AuthShell>
  );
}

export function ResetPassword() {
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await api.post("/auth/reset-password", { token, new_password: password });
      setDone(true);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  return (
    <AuthShell title="Set a new password">
      {done ? (
        <>
          <p className="text-sm text-charcoal-700 mb-8">Your password has been updated.</p>
          <Link to="/login" className="btn-primary w-full justify-center">Sign In</Link>
        </>
      ) : (
        <form onSubmit={submit} className="space-y-6">
          <div>
            <label className="text-xs uppercase tracking-widest2 text-charcoal-700/60">Reset Token</label>
            <input required className={inputClass} value={token} onChange={(e) => setToken(e.target.value)} />
          </div>
          <div>
            <label className="text-xs uppercase tracking-widest2 text-charcoal-700/60">New Password</label>
            <input type="password" required minLength={8} className={inputClass} value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" className="btn-primary w-full justify-center">Update Password</button>
        </form>
      )}
    </AuthShell>
  );
}

export function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setTokens, setUser } = useAuthStore();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { data } = await api.post("/auth/admin/login", { email, password });
      setTokens(data.access_token, data.refresh_token);
      const me = await api.get("/auth/me");
      if (me.data.user_type !== "STAFF") {
        setError("This login is for studio staff only.");
        return;
      }
      setUser(me.data);
      navigate("/admin");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-charcoal-950 flex items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm text-sand-50"
      >
        <p className="font-display text-xl mb-10">Aetherlume</p>
        <h1 className="font-display text-3xl mb-2">Studio Login</h1>
        <p className="text-sm text-sand-300/60 mb-8">Staff access only.</p>
        <form onSubmit={submit} className="space-y-6">
          <div>
            <label className="text-xs uppercase tracking-widest2 text-sand-300/50">Email</label>
            <input
              type="email"
              required
              className="w-full bg-transparent border-b border-sand-100/20 py-3 outline-none focus:border-clay-500 transition-colors"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-widest2 text-sand-300/50">Password</label>
            <input
              type="password"
              required
              className="w-full bg-transparent border-b border-sand-100/20 py-3 outline-none focus:border-clay-500 transition-colors"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-sand-50 text-charcoal-900 py-3.5 text-sm tracking-wide hover:bg-clay-500 hover:text-sand-50 transition-colors disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
