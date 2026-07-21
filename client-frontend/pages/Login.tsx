import { motion } from "framer-motion";
import { ArrowLeft, ArrowUpRight, Eye, LockKeyhole, Mail } from "lucide-react";
import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LoginResponse, ApiError } from "@shared/api";

export default function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isActionPending, setIsActionPending] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await response.json()) as LoginResponse | ApiError;
      if (!response.ok || !("ok" in data)) throw new Error("error" in data ? data.error : "Unable to sign in.");
      localStorage.setItem("alex_user_id", data.userId);
      if (rememberMe) localStorage.setItem("alex_remembered_email", email);
      if (data.hasCompletedOnboarding) {
        navigate("/dashboard");
      } else {
        navigate("/questionnaire");
      }
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Unable to sign in. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    setError("");
    setNotice("");
    setIsActionPending(true);
    try {
      const response = await fetch("/api/auth/forgot-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
      const data = (await response.json()) as { ok?: boolean; message?: string; error?: string };
      if (!response.ok) throw new Error(data.error ?? "Unable to request a reset.");
      setNotice(data.message ?? "If an account exists for that email, reset instructions are on their way.");
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Unable to request a reset.");
    } finally {
      setIsActionPending(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setIsActionPending(true);
    try {
      window.location.href = "/api/auth/google";
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Unable to start Google sign-in.");
      setIsActionPending(false);
    }
  };

  const handleAnonymousLogin = async () => {
    setError("");
    setIsActionPending(true);
    try {
      const response = await fetch("/api/auth/anon", { method: "POST" });
      const data = (await response.json()) as { ok?: boolean; userId?: string; error?: string };
      if (!response.ok || !data.ok) throw new Error(data.error ?? "Unable to sign in anonymously.");
      localStorage.setItem("alex_user_id", data.userId!);
      navigate("/questionnaire");
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Unable to sign in anonymously.");
      setIsActionPending(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f5f0e8] text-[#192d2b]">
      <div className="grid min-h-screen lg:grid-cols-[0.85fr_1.15fr]">
        <section className="relative hidden overflow-hidden bg-[#183b39] p-10 text-[#fbf7ef] lg:flex lg:flex-col lg:justify-between xl:p-14">
          <img src="https://cdn.builder.io/api/v1/image/assets%2F32a7e967e38946a18979c1eb330ccf9b%2Fb00043c9d416437c890ca7540f6c91fc?format=webp&width=800&height=1200" alt="" className="absolute inset-0 h-full w-full object-cover object-center opacity-75" />
          <div className="absolute inset-0 bg-[#183b39]/55" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#183b39]/90 via-[#183b39]/25 to-[#183b39]/45" />
          <div className="relative z-10 flex items-center gap-2 text-lg font-extrabold tracking-[-0.07em]"><span className="grid h-7 w-7 place-items-center rounded-full bg-[#e6775b] text-sm text-[#183b39]">a</span>alex</div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="relative z-10 max-w-md">
            <p className="mb-5 text-xs font-bold uppercase tracking-[0.2em] text-[#a1c9ae]">Your space is waiting</p>
            <h1 className="text-5xl font-semibold leading-[0.96] tracking-[-0.055em] xl:text-7xl">Come back to yourself.</h1>
            <p className="mt-6 max-w-sm text-base leading-relaxed text-[#d7e4d7]">A familiar place to pause, reflect, and be met without judgment.</p>
          </motion.div>
          <p className="relative z-10 text-xs text-[#a1c9ae]">Private by design. Made for your inner world.</p>
        </section>

        <section className="flex min-h-screen flex-col px-5 py-7 sm:px-10 lg:px-16 xl:px-24">
          <div className="flex items-center justify-between lg:justify-end"><Link to="/" className="flex items-center gap-2 text-sm font-medium text-[#4c605d] transition-colors hover:text-[#183b39] lg:absolute lg:left-10 lg:top-10"><ArrowLeft size={16} /> Back home</Link><div className="flex items-center gap-2 text-lg font-extrabold tracking-[-0.07em] lg:hidden"><span className="grid h-7 w-7 place-items-center rounded-full bg-[#e6775b] text-sm text-[#183b39]">a</span>alex</div></div>
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65 }} className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-12">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#e6775b]">Welcome back</p>
            <h2 className="mt-4 text-4xl font-semibold tracking-[-0.055em] sm:text-5xl">Good to see you.</h2>
            <p className="mt-4 text-sm leading-relaxed text-[#4c605d]">Sign in to continue your conversation with Alex.</p>

            <form onSubmit={handleSubmit} className="mt-9 space-y-5">
              <label className="block"><span className="mb-2 block text-sm font-medium">Email address</span><div className="relative"><Mail size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#78908b]" /><input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="h-13 w-full rounded-2xl border border-[#b9c9be] bg-white/45 pl-11 pr-4 text-sm outline-none transition-colors placeholder:text-[#91a39d] focus:border-[#183b39] focus:ring-2 focus:ring-[#183b39]/10" /></div></label>
              <label className="block"><span className="mb-2 block text-sm font-medium">Password</span><div className="relative"><LockKeyhole size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#78908b]" /><input type={showPassword ? "text" : "password"} required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" className="h-13 w-full rounded-2xl border border-[#b9c9be] bg-white/45 pl-11 pr-12 text-sm outline-none transition-colors placeholder:text-[#91a39d] focus:border-[#183b39] focus:ring-2 focus:ring-[#183b39]/10" /><button type="button" onClick={() => setShowPassword((visible) => !visible)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#78908b] transition-colors hover:text-[#183b39]" aria-label={showPassword ? "Hide password" : "Show password"}><Eye size={17} /></button></div></label>
              <div className="flex items-center justify-between text-xs"><label className="flex items-center gap-2 text-[#4c605d]"><input type="checkbox" checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} className="h-4 w-4 rounded border-[#b9c9be] accent-[#183b39]" /> Remember me</label><button type="button" onClick={handleForgotPassword} disabled={isActionPending} className="font-semibold text-[#183b39] hover:underline disabled:opacity-50">Forgot password?</button></div>
              {error && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}
              {notice && <p role="status" className="rounded-xl bg-[#e8f4eb] px-3 py-2 text-xs text-[#315b4b]">{notice}</p>}
              <button type="submit" disabled={isSubmitting} className="group flex h-13 w-full items-center justify-center gap-2 rounded-full bg-[#183b39] text-sm font-semibold text-[#fbf7ef] transition-transform hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-60">{isSubmitting ? "Signing in..." : "Sign in"} {!isSubmitting && <ArrowUpRight size={17} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />}</button>
            </form>
            <div className="my-7 flex items-center gap-4 text-xs text-[#91a39d]"><span className="h-px flex-1 bg-[#cbd8ce]" />or<span className="h-px flex-1 bg-[#cbd8ce]" /></div>
            <button type="button" onClick={handleGoogleLogin} disabled={isActionPending} className="h-13 w-full rounded-full border border-[#b9c9be] bg-transparent text-sm font-medium transition-colors hover:bg-[#dbe9db] disabled:cursor-wait disabled:opacity-60">{isActionPending ? "Connecting to Google..." : "Sign in with Google"}</button>
            <div className="my-3 flex items-center gap-4 text-xs text-[#91a39d]"><span className="h-px flex-1 bg-[#cbd8ce]" />or<span className="h-px flex-1 bg-[#cbd8ce]" /></div>
            <button type="button" onClick={handleAnonymousLogin} disabled={isActionPending} className="h-13 w-full rounded-full border border-[#b9c9be] bg-transparent text-sm font-medium transition-colors hover:bg-[#dbe9db] disabled:cursor-wait disabled:opacity-60">{isActionPending ? "Signing in..." : "Continue anonymously"}</button>
            <p className="mt-8 text-center text-sm text-[#4c605d]">New to Alex? <Link to="/questionnaire" className="font-semibold text-[#183b39] hover:underline">Create an account</Link></p>
          </motion.div>
          <p className="pb-2 text-center text-xs text-[#91a39d]">By continuing, you agree to our terms and privacy policy.</p>
        </section>
      </div>
    </main>
  );
}
