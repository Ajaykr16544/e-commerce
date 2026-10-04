import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowRight, CheckCircle2, PackageCheck } from 'lucide-react';
import api from '../services/api';
import { formatPrice } from '../utils/formatters';
import { useToast } from '../context/ToastContext';

const OrderSuccessPage = () => {
  const { orderId } = useParams();
  const { showToast } = useToast();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isCurrent = true;
    api
      .get(`/orders/${orderId}`)
      .then((response) => {
        if (isCurrent) setOrder(response.data.order);
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
  }, [orderId, showToast]);

  if (loading) {
    return <div className="mx-auto max-w-3xl px-4 py-20 text-center text-sm font-semibold text-slate-500">Loading your order…</div>;
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-black text-slate-900">We couldn’t load this order</h1>
        <Link className="mt-4 inline-flex items-center gap-2 font-bold text-brand-600" to="/profile?tab=orders">View your orders <ArrowRight className="h-4 w-4" /></Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <section className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-card">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-500 px-6 py-10 text-center text-white sm:px-10">
          <CheckCircle2 className="mx-auto h-14 w-14" />
          <p className="mt-4 text-xs font-bold uppercase tracking-[0.2em] text-emerald-100">Order received</p>
          <h1 className="mt-2 font-display text-3xl font-black">Thanks for shopping with us!</h1>
          <p className="mt-2 text-sm text-emerald-50">We’ll keep you updated as your order moves along.</p>
        </div>
        <div className="space-y-6 p-6 sm:p-9">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-5">
            <div>
              <p className="text-xs font-semibold text-slate-500">Order number</p>
              <p className="mt-1 font-extrabold text-slate-900">{order.orderId || order._id}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold text-slate-500">Order total</p>
              <p className="mt-1 text-lg font-black text-slate-900">{formatPrice(order.totalPrice)}</p>
            </div>
          </div>
          <div className="space-y-3">
            {order.items?.map((item, index) => (
              <div key={`${item.product || item.name}-${index}`} className="flex items-center justify-between gap-4 text-sm">
                <span className="text-slate-700">{item.name} <span className="text-slate-400">× {item.quantity}</span></span>
                <span className="font-bold text-slate-900">{formatPrice(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4">
            <PackageCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
            <div>
              <p className="text-sm font-bold text-slate-900">Delivering to {order.shippingAddress?.fullName}</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">{order.shippingAddress?.address}, {order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.pincode}</p>
              <p className="mt-1 text-xs text-slate-500">Status: {order.orderStatus} · Payment: {order.paymentStatus}</p>
            </div>
          </div>
          <Link to="/profile?tab=orders" className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-3.5 text-sm font-extrabold text-white hover:bg-brand-700">
            View all orders <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default OrderSuccessPage;
