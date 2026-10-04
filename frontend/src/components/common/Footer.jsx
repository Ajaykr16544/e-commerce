import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingBag,
  ShieldCheck,
  Truck,
  RotateCcw,
  Headphones,
  Mail,
  ArrowRight,
  Heart,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';

const Footer = () => {
  const [email, setEmail] = useState('');
  const { showToast } = useToast();

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      showToast('Please enter a valid email address', 'warning');
      return;
    }
    showToast('🎉 Thank you for subscribing to ShopNest exclusive alerts!', 'success');
    setEmail('');
  };

  return (
    <footer className="bg-slate-900 text-slate-300 pt-16 pb-12 mt-20 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Value Proposition Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pb-14 border-b border-slate-800">
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-800/40 border border-slate-700/50">
            <div className="w-12 h-12 rounded-xl bg-brand-500/10 text-brand-400 flex items-center justify-center shrink-0">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">Free Express Shipping</h4>
              <p className="text-xs text-slate-400 mt-0.5">On all orders above ₹999 across India</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-800/40 border border-slate-700/50">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">100% Genuine Products</h4>
              <p className="text-xs text-slate-400 mt-0.5">Directly sourced from verified brands</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-800/40 border border-slate-700/50">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">14-Day Easy Returns</h4>
              <p className="text-xs text-slate-400 mt-0.5">No questions asked return policy</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-800/40 border border-slate-700/50">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
              <Headphones className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">24/7 Dedicated Support</h4>
              <p className="text-xs text-slate-400 mt-0.5">Always here to assist with your orders</p>
            </div>
          </div>
        </div>

        {/* Links & Newsletter Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 py-14">
          
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white font-bold shadow-lg shadow-brand-500/20">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <span className="font-display font-black text-2xl tracking-tight text-white">
                Shop<span className="text-brand-400">Nest</span>
              </span>
            </Link>
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
              ShopNest is India's most modern next-generation digital marketplace, bringing together top technology, fashion, luxury footwear, and lifestyle goods.
            </p>

            {/* Newsletter */}
            <div className="pt-2">
              <p className="text-xs font-bold text-white uppercase tracking-wider mb-2">
                Subscribe for exclusive discounts & launch drops
              </p>
              <form onSubmit={handleSubscribe} className="flex gap-2 max-w-md">
                <div className="relative flex-1">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  <input
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-800 text-white text-xs pl-9 pr-3 py-3 rounded-xl border border-slate-700 focus:outline-none focus:border-brand-500 transition-colors"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-3 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0"
                >
                  Join <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </div>

          {/* Quick Categories */}
          <div>
            <h5 className="font-bold text-white text-sm mb-4">Shop Categories</h5>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li><Link to="/products?category=electronics" className="hover:text-white transition-colors">Electronics & Gadgets</Link></li>
              <li><Link to="/products?category=mobiles" className="hover:text-white transition-colors">Flagship Smartphones</Link></li>
              <li><Link to="/products?category=laptops" className="hover:text-white transition-colors">Laptops & Computing</Link></li>
              <li><Link to="/products?category=shoes" className="hover:text-white transition-colors">Sneakers & Footwear</Link></li>
              <li><Link to="/products?category=fashion" className="hover:text-white transition-colors">Fashion & Apparel</Link></li>
              <li><Link to="/products?category=home-kitchen" className="hover:text-white transition-colors">Home & Kitchen</Link></li>
            </ul>
          </div>

          {/* Customer Care */}
          <div>
            <h5 className="font-bold text-white text-sm mb-4">Customer Care</h5>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li><Link to="/profile?tab=orders" className="hover:text-white transition-colors">Track Your Order</Link></li>
              <li><Link to="/profile?tab=addresses" className="hover:text-white transition-colors">Shipping Addresses</Link></li>
              <li><Link to="/wishlist" className="hover:text-white transition-colors">Saved Wishlist</Link></li>
              <li><span className="hover:text-white cursor-pointer">Return & Exchange Policy</span></li>
              <li><span className="hover:text-white cursor-pointer">Help Center & FAQ</span></li>
              <li><span className="hover:text-white cursor-pointer">Terms & Conditions</span></li>
            </ul>
          </div>

          {/* Payment Methods */}
          <div>
            <h5 className="font-bold text-white text-sm mb-4">Secure Payments</h5>
            <p className="text-xs text-slate-400 mb-3">
              We support UPI, all major debit/credit cards, NetBanking, and Cash on Delivery.
            </p>
            <div className="flex flex-wrap gap-2 text-[10px] font-bold text-slate-300">
              <span className="px-2.5 py-1.5 bg-slate-800 rounded-lg border border-slate-700">UPI / GPay</span>
              <span className="px-2.5 py-1.5 bg-slate-800 rounded-lg border border-slate-700">Razorpay</span>
              <span className="px-2.5 py-1.5 bg-slate-800 rounded-lg border border-slate-700">Visa / MC</span>
              <span className="px-2.5 py-1.5 bg-slate-800 rounded-lg border border-slate-700">Cash on Delivery</span>
            </div>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} ShopNest Inc. All rights reserved.</p>
          <div className="flex items-center gap-1">
            <span>Engineered with</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
            <span>for seamless shopping</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
