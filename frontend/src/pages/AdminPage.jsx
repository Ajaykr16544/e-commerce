import React, { useEffect, useState } from 'react';
import { AlertTriangle, Box, ClipboardList, IndianRupee, LoaderCircle, Users } from 'lucide-react';
import api from '../services/api';
import { formatPrice } from '../utils/formatters';
import { useToast } from '../context/ToastContext';

const AdminPage = () => {
  const { showToast } = useToast();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isCurrent = true;
    api
      .get('/users/admin/dashboard-stats')
      .then((response) => {
        if (isCurrent) setDashboard(response.data);
      })
      .catch((error) => {
        if (isCurrent) showToast(error.message, 'error');
      })
      .finally(() => {
        if (isCurrent) setLoading(false);
      });
    return () => {
      isCurrent = false;
    };
  }, [showToast]);

  if (loading) {
    return <div className="flex justify-center px-4 py-20"><LoaderCircle className="h-7 w-7 animate-spin text-brand-600" /></div>;
  }

  if (!dashboard) {
    return <div className="mx-auto max-w-5xl px-4 py-14 text-center text-sm text-slate-500">Dashboard data is unavailable. Please try again later.</div>;
  }

  const stats = dashboard.stats || {};
  const cards = [
    { label: 'Revenue', value: formatPrice(stats.totalRevenue || 0), Icon: IndianRupee, color: 'bg-emerald-50 text-emerald-600' },
    { label: 'Orders', value: stats.totalOrders || 0, Icon: ClipboardList, color: 'bg-brand-50 text-brand-600' },
    { label: 'Products', value: stats.totalProducts || 0, Icon: Box, color: 'bg-amber-50 text-amber-600' },
    { label: 'Customers', value: stats.totalUsers || 0, Icon: Users, color: 'bg-purple-50 text-purple-600' },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-brand-600">ShopNest management</p>
        <h1 className="mt-2 font-display text-3xl font-black text-slate-900">Store dashboard</h1>
      </div>
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(({ label, value, Icon, color }) => (
          <article key={label} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-card">
            <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${color}`}><Icon className="h-5 w-5" /></div>
            <p className="mt-4 text-sm font-semibold text-slate-500">{label}</p>
            <p className="mt-1 text-2xl font-black text-slate-900">{value}</p>
          </article>
        ))}
      </section>
      {(stats.pendingOrders > 0 || stats.lowStockProducts > 0) && (
        <div className="flex flex-wrap gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">
          <span className="flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> {stats.pendingOrders || 0} orders need attention</span>
          <span>{stats.lowStockProducts || 0} products are low on stock</span>
        </div>
      )}
      <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-card">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="font-display text-lg font-black text-slate-900">Recent orders</h2>
        </div>
        {(dashboard.recentOrders || []).length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr><th className="px-5 py-3">Order</th><th className="px-5 py-3">Customer</th><th className="px-5 py-3">Date</th><th className="px-5 py-3">Total</th><th className="px-5 py-3">Status</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dashboard.recentOrders.map((order) => (
                  <tr key={order._id}>
                    <td className="px-5 py-4 font-bold text-slate-800">{order.orderId || order._id}</td>
                    <td className="px-5 py-4 text-slate-600">{order.user?.name || order.shippingAddress?.fullName || 'Customer'}</td>
                    <td className="px-5 py-4 text-slate-600">{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td className="px-5 py-4 font-bold text-slate-800">{formatPrice(order.totalPrice)}</td>
                    <td className="px-5 py-4"><span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-bold text-brand-700">{order.orderStatus}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="p-8 text-center text-sm text-slate-500">Orders will appear here when customers check out.</p>
        )}
      </section>
    </div>
  );
};

export default AdminPage;
