import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Trash2,
  ArrowRight,
  ShoppingBag,
  ShieldCheck,
  Tag,
  Check,
  X,
  Truck,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { formatPrice } from '../utils/formatters';

const CartPage = () => {
  const navigate = useNavigate();
  const { cart, updateQuantity, removeFromCart, clearCart, applyCoupon, removeCoupon } = useCart();
  const { showToast } = useToast();

  const [couponCode, setCouponCode] = useState('');
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    setIsApplyingCoupon(true);
    await applyCoupon(couponCode.trim());
    setIsApplyingCoupon(false);
  };

  const freeShippingThreshold = 999;
  const amountToFreeShipping = Math.max(0, freeShippingThreshold - cart.subtotal);
  const freeShippingProgress = Math.min(100, Math.round((cart.subtotal / freeShippingThreshold) * 100));

  if (!cart.items || cart.items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="max-w-md mx-auto bg-white rounded-3xl p-10 border border-slate-100 shadow-card space-y-4">
          <div className="w-20 h-20 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center mx-auto">
            <ShoppingBag className="w-10 h-10" />
          </div>
          <h2 className="font-display font-black text-2xl text-slate-900">
            Your Cart is Empty
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Looks like you haven't added anything to your cart yet. Discover trending deals, latest technology, and fashion!
          </p>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl text-xs font-black shadow-lg shadow-brand-500/25 transition-transform hover:scale-105"
          >
            Start Shopping Now <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Title */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-slate-900">
            Shopping Cart
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {cart.itemCount} {cart.itemCount === 1 ? 'item' : 'items'} in your bag
          </p>
        </div>
        <button
          onClick={clearCart}
          className="text-xs font-bold text-rose-600 hover:underline flex items-center gap-1"
        >
          <Trash2 className="w-3.5 h-3.5" /> Clear Cart
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
        
        {/* Left: Items List */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Free Shipping Progress Indicator */}
          <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800 flex items-start sm:items-center gap-1.5 min-w-0">
                <Truck className="w-4 h-4 text-brand-600" />
                <span>
                  {amountToFreeShipping === 0
                    ? '🎉 Free Express Shipping unlocked'
                    : `Add ${formatPrice(amountToFreeShipping)} more for free shipping`}
                </span>
              </span>
              <span className="font-bold text-brand-600">{freeShippingProgress}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${freeShippingProgress}%` }}
              />
            </div>
          </div>

          {/* Cart Item Cards */}
          <div className="space-y-3">
            {cart.items.map((item) => {
              const product = item.product || {};
              const imgUrl = product.images?.[0]?.url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=200&q=80';

              return (
                <div
                  key={item._id}
                  className="p-3 sm:p-5 rounded-3xl bg-white border border-slate-100 shadow-card flex flex-col sm:flex-row items-center gap-3 sm:gap-6 justify-between"
                >
                  <div className="flex items-center gap-3 sm:gap-4 w-full sm:flex-1 sm:min-w-0">
                    <img
                      src={imgUrl}
                      alt={product.name}
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover bg-slate-100 shrink-0 border border-slate-100"
                    />
                    <div className="min-w-0 space-y-1">
                      <span className="text-[10px] font-bold text-brand-600 uppercase tracking-wider">
                        {product.brand}
                      </span>
                      <Link
                        to={`/product/${product.slug || product._id}`}
                        className="text-xs sm:text-sm font-bold text-slate-900 hover:text-brand-600 line-clamp-1 block"
                      >
                        {product.name}
                      </Link>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        {item.size && <span>Size: <strong className="text-slate-700">{item.size}</strong></span>}
                        {item.size && item.color && <span>•</span>}
                        {item.color && <span>Color: <strong className="text-slate-700">{item.color}</strong></span>}
                      </div>
                      <span className="text-xs font-black text-slate-900 block sm:hidden">
                        {formatPrice(item.price)}
                      </span>
                    </div>
                  </div>

                  {/* Stepper & Total */}
                  <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-5 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    {/* Stepper */}
                    <div className="flex items-center border border-slate-200 rounded-xl bg-white shadow-sm">
                      <button
                        onClick={() => updateQuantity(item._id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        className="px-3 py-1.5 text-slate-500 hover:text-slate-800 disabled:opacity-30 font-bold"
                      >
                        -
                      </button>
                      <span className="px-3 py-1.5 text-xs font-bold text-slate-900">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item._id, item.quantity + 1)}
                        className="px-3 py-1.5 text-slate-500 hover:text-slate-800 font-bold"
                      >
                        +
                      </button>
                    </div>

                    <div className="text-right min-w-0 sm:min-w-[90px]">
                      <span className="text-sm font-black text-slate-900 block">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {formatPrice(item.price)} each
                      </span>
                    </div>

                    <button
                      onClick={() => removeFromCart(item._id)}
                      className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-colors"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Order Summary */}
        <div className="space-y-6">
          
          {/* Coupon Card */}
          <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-card space-y-3">
            <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <Tag className="w-4 h-4 text-brand-600" /> Apply Promo Code
            </span>

            {cart.coupon ? (
              <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs">
                <div>
                  <span className="font-extrabold text-emerald-800 uppercase block">
                    {cart.coupon.code}
                  </span>
                  <span className="text-[11px] text-emerald-600">
                    Saved {formatPrice(cart.discount)} on your order!
                  </span>
                </div>
                <button
                  onClick={removeCoupon}
                  className="p-1 rounded-lg text-emerald-700 hover:bg-emerald-100"
                  title="Remove coupon"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. WELCOME50, FLAT200"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  className="flex-1 text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 uppercase font-mono tracking-wider focus:outline-none focus:border-brand-500"
                />
                <button
                  type="submit"
                  disabled={isApplyingCoupon}
                  className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
                >
                  Apply
                </button>
              </form>
            )}

            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="text-[10px] text-slate-400">Popular:</span>
              <button
                onClick={() => setCouponCode('WELCOME50')}
                className="text-[10px] font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-md hover:bg-brand-100"
              >
                WELCOME50
              </button>
              <button
                onClick={() => setCouponCode('FLAT200')}
                className="text-[10px] font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-md hover:bg-brand-100"
              >
                FLAT200
              </button>
            </div>
          </div>

          {/* Breakdown Summary */}
          <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-card space-y-4">
            <h3 className="font-display font-black text-base text-slate-900">
              Order Summary
            </h3>

            <div className="space-y-2.5 text-xs text-slate-600 border-b border-slate-100 pb-4">
              <div className="flex justify-between">
                <span>Items Subtotal</span>
                <span className="font-bold text-slate-800">{formatPrice(cart.subtotal)}</span>
              </div>

              {cart.discount > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>Coupon Discount</span>
                  <span>- {formatPrice(cart.discount)}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>Estimated Shipping</span>
                <span className="font-bold text-slate-800">
                  {cart.shipping === 0 ? (
                    <span className="text-emerald-600 uppercase font-bold">Free</span>
                  ) : (
                    formatPrice(cart.shipping)
                  )}
                </span>
              </div>

              <div className="flex justify-between">
                <span>Estimated Taxes (5% GST)</span>
                <span className="font-bold text-slate-800">{formatPrice(cart.tax)}</span>
              </div>
            </div>

            <div className="flex justify-between items-baseline text-slate-900 font-black">
              <span className="text-sm">Total Amount</span>
              <span className="text-xl text-brand-600">{formatPrice(cart.grandTotal)}</span>
            </div>

            <button
              onClick={() => navigate('/checkout')}
              className="w-full py-4 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xl shadow-brand-500/25 transition-transform hover:scale-[1.02]"
            >
              Proceed to Checkout <ArrowRight className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 pt-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Safe & Secure 256-Bit Encrypted Payments</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
