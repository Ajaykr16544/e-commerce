import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  ShoppingCart,
  Heart,
  User,
  Menu,
  X,
  ChevronDown,
  LayoutDashboard,
  Package,
  LogOut,
  Clock,
  Sparkles,
  ShoppingBag,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import api from '../../services/api';
import { formatPrice } from '../../utils/formatters';

const Navbar = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { cart } = useCart();
  const { wishlistCount } = useWishlist();

  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [categories, setCategories] = useState([]);

  const searchContainerRef = useRef(null);
  const userMenuRef = useRef(null);

  // Load search history from localStorage
  useEffect(() => {
    const history = localStorage.getItem('shopnest_search_history');
    if (history) {
      try {
        setSearchHistory(JSON.parse(history));
      } catch (e) {}
    }
  }, []);

  // Fetch categories for navbar menu
  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await api.get('/categories');
        if (res.data.success) {
          setCategories(res.data.categories || []);
        }
      } catch (e) {}
    };
    fetchCats();
  }, []);

  // Live search suggestions debouncer
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSuggestions(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await api.get(`/products/search/suggestions?q=${encodeURIComponent(searchQuery.trim())}`);
        if (res.data.success) {
          setSuggestions(res.data.suggestions);
        }
      } catch (err) {}
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside listener for search suggestions & user menu
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setIsSearchFocused(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    if (!searchQuery.trim()) return;

    // Save to search history
    const trimmed = searchQuery.trim();
    const updatedHistory = [trimmed, ...searchHistory.filter((item) => item.toLowerCase() !== trimmed.toLowerCase())].slice(0, 6);
    setSearchHistory(updatedHistory);
    localStorage.setItem('shopnest_search_history', JSON.stringify(updatedHistory));

    setIsSearchFocused(false);
    navigate(`/products?keyword=${encodeURIComponent(trimmed)}`);
  };

  const handleHistoryClick = (item) => {
    setSearchQuery(item);
    setIsSearchFocused(false);
    navigate(`/products?keyword=${encodeURIComponent(item)}`);
  };

  const clearHistory = (e) => {
    e.stopPropagation();
    setSearchHistory([]);
    localStorage.removeItem('shopnest_search_history');
  };

  return (
    <header className="sticky top-0 z-40 w-full transition-all">
      {/* Top Promotional Bar */}
      <div className="bg-gradient-to-r from-brand-900 via-indigo-900 to-slate-900 text-brand-100 text-[10px] sm:text-xs py-2 px-3 text-center font-medium flex items-center justify-center gap-2">
        <Sparkles className="w-3.5 h-3.5 shrink-0 text-amber-400 animate-pulse" />
        <span>
          Sale: Flat 15% OFF with code{' '}
          <strong className="text-amber-300 font-bold bg-white/10 px-1.5 py-0.5 rounded">
            WELCOME50
          </strong>{' '}
          <span className="hidden sm:inline">| Free delivery on orders over ₹999!</span>
        </span>
      </div>

      {/* Main Navigation Bar */}
      <div className="glass border-b border-slate-200/80 shadow-sm">
        <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20 gap-2 sm:gap-4">
            
            {/* Logo */}
            <Link to="/" className="flex min-w-0 items-center gap-2 sm:gap-2.5 shrink-0 group">
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-brand-500/25 group-hover:scale-105 transition-transform">
                <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-display font-black text-xl sm:text-2xl tracking-tight text-slate-900">
                  Shop<span className="text-brand-600">Nest</span>
                </span>
                <span className="hidden sm:block text-[10px] font-semibold text-slate-600 uppercase tracking-widest -mt-1">
                  Premium Store
                </span>
              </div>
            </Link>

            {/* Desktop Search Bar */}
            <div ref={searchContainerRef} className="hidden md:flex flex-1 max-w-xl relative">
              <form onSubmit={handleSearchSubmit} className="w-full relative">
                <div className="relative flex items-center">
                  <input
                    type="text"
                    placeholder="Search for phones, laptops, sneakers, fashion, books..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setIsSearchFocused(true)}
                    className="w-full bg-slate-100/90 hover:bg-slate-100 focus:bg-white text-slate-800 text-sm pl-11 pr-24 py-3 rounded-2xl border border-slate-200/80 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 focus:outline-none transition-all placeholder:text-slate-600"
                  />
                  <Search className="w-5 h-5 text-slate-600 absolute left-3.5 pointer-events-none" />
                  <button
                    type="submit"
                    className="absolute right-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
                  >
                    Search
                  </button>
                </div>
              </form>

              {/* Live Search Suggestions & History Dropdown */}
              {isSearchFocused && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50 animate-slideUp">
                  {/* Suggestions Mode */}
                  {suggestions && (suggestions.products?.length > 0 || suggestions.categories?.length > 0) ? (
                    <div className="p-3">
                      {suggestions.categories?.length > 0 && (
                        <div className="mb-3">
                          <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider px-3 mb-1">
                            Categories
                          </p>
                          <div className="flex flex-wrap gap-1.5 px-2">
                            {suggestions.categories.map((c) => (
                              <button
                                key={c._id}
                                onClick={() => {
                                  setIsSearchFocused(false);
                                  navigate(`/products?category=${c.slug}`);
                                }}
                                className="px-3 py-1 bg-slate-100 hover:bg-brand-50 hover:text-brand-600 text-slate-700 text-xs rounded-lg transition-colors font-medium"
                              >
                                {c.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {suggestions.products?.length > 0 && (
                        <div>
                          <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider px-3 mb-1">
                            Products
                          </p>
                          <div className="space-y-1">
                            {suggestions.products.map((p) => (
                              <Link
                                key={p._id}
                                to={`/product/${p.slug}`}
                                onClick={() => setIsSearchFocused(false)}
                                className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-xl transition-colors"
                              >
                                <img
                                  src={p.images[0]?.url}
                                  alt={p.name}
                                  className="w-10 h-10 object-cover rounded-lg bg-slate-100 shrink-0"
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-semibold text-slate-800 truncate">
                                    {p.name}
                                  </p>
                                  <p className="text-[11px] text-slate-600">
                                    {p.brand} •{' '}
                                    <span className="font-bold text-brand-600">
                                      {formatPrice(p.discountPrice || p.price)}
                                    </span>
                                  </p>
                                </div>
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : searchQuery.length < 2 && searchHistory.length > 0 ? (
                    /* Search History Mode */
                    <div className="p-3">
                      <div className="flex items-center justify-between px-3 py-1 mb-1">
                        <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" /> Recent Searches
                        </span>
                        <button
                          onClick={clearHistory}
                          className="text-[11px] text-brand-600 hover:underline font-semibold"
                        >
                          Clear
                        </button>
                      </div>
                      <div className="space-y-1">
                        {searchHistory.map((item, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleHistoryClick(item)}
                            className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 rounded-lg flex items-center justify-between transition-colors"
                          >
                            <span>{item}</span>
                            <Search className="w-3.5 h-3.5 text-slate-500" />
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </div>

            {/* Right Action Menu */}
            <div className="flex items-center gap-2 sm:gap-4">
              
              {/* Wishlist */}
              <Link
                to="/wishlist"
                className="relative hidden sm:inline-flex p-2.5 rounded-2xl text-slate-700 hover:text-rose-600 hover:bg-slate-100 transition-colors"
                title="Wishlist"
                aria-label={`Wishlist${wishlistCount ? ` (${wishlistCount})` : ''}`}
              >
                <Heart className="w-5 h-5" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[11px] font-bold rounded-full flex items-center justify-center shadow-md animate-scaleIn">
                    {wishlistCount}
                  </span>
                )}
              </Link>

              {/* Cart */}
              <Link
                to="/cart"
                className="relative hidden sm:inline-flex p-2.5 rounded-2xl text-slate-700 hover:text-brand-600 hover:bg-slate-100 transition-colors"
                title="Shopping Cart"
                aria-label={`Shopping cart${cart.itemCount ? ` (${cart.itemCount} items)` : ''}`}
              >
                <ShoppingCart className="w-5 h-5" />
                {cart.itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-brand-600 text-white text-[11px] font-bold rounded-full flex items-center justify-center shadow-md animate-scaleIn">
                    {cart.itemCount}
                  </span>
                )}
              </Link>

              {/* User Dropdown */}
              <div ref={userMenuRef} className="relative">
                {isAuthenticated ? (
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    type="button"
                    aria-expanded={isUserMenuOpen}
                    aria-label="Open account menu"
                    className="flex items-center gap-2 p-1.5 sm:pr-2.5 rounded-2xl hover:bg-slate-100 transition-colors"
                  >
                    <img
                      src={user?.avatar?.url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80'}
                      alt={user?.name}
                      className="w-8 h-8 rounded-xl object-cover border border-slate-200"
                    />
                    <div className="hidden lg:flex flex-col text-left">
                      <span className="text-xs font-bold text-slate-800 leading-tight">
                        {user?.name?.split(' ')[0]}
                      </span>
                      <span className="text-[10px] text-slate-600 capitalize">
                        {user?.role}
                      </span>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-600 hidden lg:block" />
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <Link
                      to="/login"
                      aria-label="Sign in"
                      className="flex items-center justify-center p-2 sm:px-3 sm:py-2 text-xs font-semibold text-slate-700 hover:text-brand-600 rounded-xl transition-colors"
                    >
                      <User className="h-5 w-5 sm:hidden" />
                      <span className="hidden sm:inline">Sign In</span>
                    </Link>
                    <Link
                      to="/register"
                      className="hidden sm:inline-flex text-xs font-bold px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl shadow-sm transition-colors"
                    >
                      Register
                    </Link>
                  </div>
                )}

                {/* Dropdown Menu */}
                {isUserMenuOpen && isAuthenticated && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50 animate-slideUp">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-xs font-bold text-slate-900 truncate">{user?.name}</p>
                      <p className="text-[11px] text-slate-600 truncate">{user?.email}</p>
                    </div>

                    {isAdmin && (
                      <Link
                        to="/admin"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-brand-600 hover:bg-brand-50 transition-colors"
                      >
                        <LayoutDashboard className="w-4 h-4" />
                        Admin Dashboard
                      </Link>
                    )}

                    <Link
                      to="/profile"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <User className="w-4 h-4 text-slate-600" />
                      My Profile & Addresses
                    </Link>

                    <Link
                      to="/profile?tab=orders"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <Package className="w-4 h-4 text-slate-600" />
                      My Orders
                    </Link>

                    <Link
                      to="/wishlist"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <Heart className="w-4 h-4 text-slate-600" />
                      Wishlist ({wishlistCount})
                    </Link>

                    <div className="border-t border-slate-100 mt-1 pt-1">
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          logout();
                        }}
                        className="flex items-center gap-2.5 w-full text-left px-4 py-2.5 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                type="button"
                aria-expanded={isMobileMenuOpen}
                aria-controls="mobile-navigation"
                className="p-2 text-slate-600 hover:text-slate-900 md:hidden"
                aria-label="Toggle Menu"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Categories Horizontal Bar (Desktop) */}
          <div className="hidden md:flex items-center gap-6 py-2.5 border-t border-slate-100 text-xs font-medium text-slate-600 overflow-x-auto no-scrollbar">
            <Link
              to="/products"
              className="text-brand-600 font-bold hover:text-brand-700 shrink-0"
            >
              All Categories
            </Link>
            {categories.slice(0, 9).map((cat) => (
              <Link
                key={cat._id}
                to={`/products?category=${cat.slug}`}
                className="hover:text-slate-900 transition-colors shrink-0"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {isMobileMenuOpen && (
        <div id="mobile-navigation" className="md:hidden glass border-b border-slate-200 p-4 space-y-4 animate-slideUp max-h-[calc(100dvh-7rem)] overflow-y-auto">
          {/* Mobile Search Input */}
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-100 text-sm pl-10 pr-4 py-2.5 rounded-xl border border-slate-200"
            />
            <Search className="w-4 h-4 text-slate-600 absolute left-3.5 top-3.5" />
          </form>

          <div className="grid grid-cols-2 gap-2">
            <Link
              to="/cart"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-2 rounded-xl bg-brand-50 p-3 text-xs font-bold text-brand-700"
            >
              <ShoppingCart className="h-4 w-4" /> Cart ({cart.itemCount || 0})
            </Link>
            <Link
              to="/wishlist"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs font-bold text-rose-700"
            >
              <Heart className="h-4 w-4" /> Wishlist ({wishlistCount})
            </Link>
            {isAuthenticated ? (
              <>
                <Link
                  to="/profile"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-2 rounded-xl bg-slate-100 p-3 text-xs font-bold text-slate-700"
                >
                  <User className="h-4 w-4" /> My account
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    logout();
                  }}
                  className="flex items-center gap-2 rounded-xl bg-slate-100 p-3 text-left text-xs font-bold text-slate-700"
                >
                  <LogOut className="h-4 w-4" /> Sign out
                </button>
                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="col-span-2 flex items-center gap-2 rounded-xl bg-brand-50 p-3 text-xs font-bold text-brand-700"
                  >
                    <LayoutDashboard className="h-4 w-4" /> Admin dashboard
                  </Link>
                )}
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="rounded-xl bg-slate-100 p-3 text-center text-xs font-bold text-slate-700"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="rounded-xl bg-brand-600 p-3 text-center text-xs font-bold text-white"
                >
                  Create account
                </Link>
              </>
            )}
          </div>

          {/* Mobile Categories Links */}
          <div className="space-y-1">
            <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider px-2">
              Browse Categories
            </p>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <Link
                to="/products"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2.5 rounded-xl bg-slate-100 text-xs font-semibold text-brand-600"
              >
                All Products
              </Link>
              {categories.map((c) => (
                <Link
                  key={c._id}
                  to={`/products?category=${c.slug}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2.5 rounded-xl bg-slate-50 text-xs text-slate-700 hover:bg-slate-100"
                >
                  {c.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
