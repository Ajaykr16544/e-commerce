import React, { useEffect, useState } from 'react';
import { ArrowRight, LockKeyhole, Mail, Phone, ShoppingBag, UserRound } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AuthPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, login, register } = useAuth();
  const isRegistering = location.pathname === '/register';
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [submitting, setSubmitting] = useState(false);
  const destination = new URLSearchParams(location.search).get('redirect') || '/profile';

  useEffect(() => {
    if (isAuthenticated) navigate(destination, { replace: true });
  }, [destination, isAuthenticated, navigate]);

  const updateField = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    const result = isRegistering
      ? await register(form.name.trim(), form.email.trim(), form.password, form.phone.trim())
      : await login(form.email.trim(), form.password);
    setSubmitting(false);
    if (result?.success) navigate(destination, { replace: true });
  };

  const inputClass =
    'w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10';

  return (
    <div className="mx-auto grid min-h-[620px] max-w-6xl items-center gap-10 px-4 py-12 md:grid-cols-2 sm:px-6">
      <section className="hidden rounded-[2rem] bg-gradient-to-br from-brand-950 via-indigo-900 to-slate-950 p-10 text-white md:block">
        <div className="mb-14 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
          <ShoppingBag className="h-7 w-7 text-brand-300" />
        </div>
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-brand-300">
          Your next favorite thing
        </p>
        <h1 className="font-display text-4xl font-black leading-tight">
          Great finds. A better way to shop.
        </h1>
        <p className="mt-5 max-w-sm text-sm leading-7 text-slate-300">
          Sign in to keep your wishlist close, track every order, and enjoy a faster checkout.
        </p>
        <div className="mt-10 flex items-center gap-2 text-sm font-semibold text-slate-200">
          <LockKeyhole className="h-4 w-4 text-emerald-400" />
          Secure account access
        </div>
      </section>

      <section className="mx-auto w-full max-w-md rounded-3xl border border-slate-100 bg-white p-7 shadow-card sm:p-9">
        <p className="text-xs font-extrabold uppercase tracking-widest text-brand-600">
          {isRegistering ? 'Join ShopNest' : 'Welcome back'}
        </p>
        <h2 className="mt-2 font-display text-3xl font-black text-slate-900">
          {isRegistering ? 'Create your account' : 'Sign in to ShopNest'}
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          {isRegistering ? 'A few details and you are ready to shop.' : 'Access your orders, saved items, and more.'}
        </p>

        <form className="mt-7 space-y-4" onSubmit={handleSubmit}>
          {isRegistering && (
            <>
              <label className="relative block">
                <span className="sr-only">Full name</span>
                <UserRound className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                <input className={inputClass} name="name" autoComplete="name" placeholder="Full name" required value={form.name} onChange={updateField} />
              </label>
              <label className="relative block">
                <span className="sr-only">Phone number</span>
                <Phone className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                <input className={inputClass} name="phone" autoComplete="tel" inputMode="tel" placeholder="Phone number (optional)" value={form.phone} onChange={updateField} />
              </label>
            </>
          )}
          <label className="relative block">
            <span className="sr-only">Email address</span>
            <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
            <input className={inputClass} name="email" type="email" autoComplete="email" placeholder="Email address" required value={form.email} onChange={updateField} />
          </label>
          <label className="relative block">
            <span className="sr-only">Password</span>
            <LockKeyhole className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
            <input className={inputClass} name="password" type="password" autoComplete={isRegistering ? 'new-password' : 'current-password'} minLength={6} placeholder="Password" required value={form.password} onChange={updateField} />
          </label>
          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-brand-600/20 transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Please wait…' : isRegistering ? 'Create account' : 'Sign in'}
            {!submitting && <ArrowRight className="h-4 w-4" />}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          {isRegistering ? 'Already have an account?' : 'New to ShopNest?'}{' '}
          <Link
            className="font-bold text-brand-600 hover:text-brand-700"
            to={`${isRegistering ? '/login' : '/register'}${location.search}`}
          >
            {isRegistering ? 'Sign in' : 'Create an account'}
          </Link>
        </p>
      </section>
    </div>
  );
};

export default AuthPage;
