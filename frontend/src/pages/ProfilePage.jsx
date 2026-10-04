import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ClipboardList, LoaderCircle, Package, UserRound } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatPrice } from '../utils/formatters';

const ProfilePage = () => {
  const { user, updateProfile } = useAuth();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') === 'orders' ? 'orders' : 'profile';
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(user?.name || '');
    setPhone(user?.phone || '');
  }, [user]);

  useEffect(() => {
    if (activeTab !== 'orders') return;
    let isCurrent = true;
    setLoadingOrders(true);
    api
      .get('/orders/my-orders')
      .then((response) => {
        if (isCurrent) setOrders(response.data.orders || []);
      })
      .catch((error) => showToast(error.message, 'error'))
      .finally(() => {
        if (isCurrent) setLoadingOrders(false);
      });
    return () => {
      isCurrent = false;
    };
  }, [activeTab, showToast]);

  const saveProfile = async (event) => {
    event.preventDefault();
    setSaving(true);
    await updateProfile({ name: name.trim(), phone: phone.trim() });
    setSaving(false);
  };

  const selectTab = (tab) => setSearchParams(tab === 'orders' ? { tab: 'orders' } : {});

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-widest text-brand-600">Your account</p>
        <h1 className="mt-2 font-display text-3xl font-black text-slate-900">Hello, {user?.name}</h1>
      </div>
      <div className="grid gap-8 md:grid-cols-[220px_1fr]">
        <nav className="flex gap-2 md:flex-col" aria-label="Account sections">
          <button onClick={() => selectTab('profile')} className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-bold ${activeTab === 'profile' ? 'bg-brand-50 text-brand-700' : 'text-slate-500 hover:bg-white'}`}>
            <UserRound className="h-4 w-4" /> Profile
          </button>
          <button onClick={() => selectTab('orders')} className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-bold ${activeTab === 'orders' ? 'bg-brand-50 text-brand-700' : 'text-slate-500 hover:bg-white'}`}>
            <ClipboardList className="h-4 w-4" /> My orders
          </button>
        </nav>

        {activeTab === 'profile' ? (
          <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-card sm:p-8">
            <h2 className="font-display text-xl font-black text-slate-900">Personal information</h2>
            <p className="mt-1 text-sm text-slate-500">Keep your contact details up to date.</p>
            <form onSubmit={saveProfile} className="mt-6 max-w-lg space-y-4">
              <label className="block text-sm font-semibold text-slate-700">
                Full name
                <input className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 font-normal outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10" value={name} onChange={(event) => setName(event.target.value)} required />
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                Email address
                <input className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-normal text-slate-500" value={user?.email || ''} readOnly />
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                Phone number
                <input className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 font-normal outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10" value={phone} onChange={(event) => setPhone(event.target.value)} />
              </label>
              <button disabled={saving} className="rounded-xl bg-brand-600 px-5 py-3 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-60">
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </form>
          </section>
        ) : (
          <section className="space-y-4">
            <h2 className="font-display text-xl font-black text-slate-900">Order history</h2>
            {loadingOrders ? (
              <div className="flex justify-center rounded-3xl bg-white p-12"><LoaderCircle className="h-6 w-6 animate-spin text-brand-600" /></div>
            ) : orders.length ? (
              orders.map((order) => (
                <Link key={order._id} to={`/order-success/${order._id}`} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-card transition hover:shadow-card-hover">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600"><Package className="h-5 w-5" /></span>
                    <div>
                      <p className="font-bold text-slate-900">{order.orderId || `Order ${order._id.slice(-6)}`}</p>
                      <p className="mt-1 text-xs text-slate-500">{new Date(order.createdAt).toLocaleDateString()} · {order.items?.length || 0} items</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-extrabold text-slate-900">{formatPrice(order.totalPrice)}</p>
                    <p className="mt-1 text-xs font-bold text-brand-600">{order.orderStatus}</p>
                  </div>
                </Link>
              ))
            ) : (
              <div className="rounded-3xl border border-slate-100 bg-white p-10 text-center">
                <p className="font-bold text-slate-800">No orders yet</p>
                <Link to="/products" className="mt-3 inline-block text-sm font-bold text-brand-600">Explore products</Link>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
