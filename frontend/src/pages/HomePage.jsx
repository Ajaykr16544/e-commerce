import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Sparkles,
  Zap,
  TrendingUp,
  Award,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Star,
  Quote,
} from 'lucide-react';
import api from '../services/api';
import ProductCard from '../components/product/ProductCard';
import QuickViewModal from '../components/product/QuickViewModal';
import SkeletonCard from '../components/common/SkeletonCard';
import { formatPrice } from '../utils/formatters';

const heroSlides = [
  {
    id: 1,
    badge: 'Flagship Technology',
    title: 'Experience The Future of Sound & Clarity',
    subtitle: 'Sony WH-1000XM5 wireless noise cancelling headphones with dual processor ANC and up to 30h battery.',
    cta: 'Shop Noise Cancelling',
    link: '/products?keyword=Sony',
    bgGradient: 'from-slate-950 via-indigo-950 to-slate-900',
    accentColor: 'text-brand-400',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1000&q=80',
    tag: 'Save ₹5,000 Today',
  },
  {
    id: 2,
    badge: 'Titanium Innovation',
    title: 'Apple iPhone 15 Pro Max',
    subtitle: 'Forged in aerospace-grade titanium with the powerful A17 Pro chip and all-new 5x telephoto camera.',
    cta: 'Explore Flagships',
    link: '/products?category=mobiles',
    bgGradient: 'from-zinc-950 via-slate-900 to-indigo-950',
    accentColor: 'text-amber-400',
    image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=1000&q=80',
    tag: 'Next-Gen 5G',
  },
  {
    id: 3,
    badge: 'Streetwear Heritage',
    title: 'Air Jordan 1 Retro High Chicago',
    subtitle: 'The timeless silhouette that transformed sneaker culture forever. Vintage cracked leather & iconic varsity red.',
    cta: 'Shop Footwear',
    link: '/products?category=shoes',
    bgGradient: 'from-rose-950 via-slate-950 to-red-950',
    accentColor: 'text-rose-400',
    image: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=1000&q=80',
    tag: 'Limited Collector Edition',
  },
];

const testimonials = [
  {
    name: 'Aarav Sharma',
    role: 'Verified Buyer, Bengaluru',
    rating: 5,
    text: 'ShopNest delivered my Sony XM5 headphones in less than 24 hours! Genuine packaging, original bill, and unbeatable price compared to other apps.',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80',
  },
  {
    name: 'Priya Mukherjee',
    role: 'Fashion Enthusiast, Mumbai',
    rating: 5,
    text: 'The checkout experience with Razorpay and the instant coupon discount made shopping effortless. The dress and blazer fits are completely true to size.',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80',
  },
  {
    name: 'Rohan Verma',
    role: 'Tech Creator, Delhi',
    rating: 5,
    text: 'Customer support answered my delivery tracking question within minutes. The product was in pristine condition. Highly recommended store!',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=120&q=80',
  },
];

const HomePage = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [bestsellers, setBestsellers] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quickViewProduct, setQuickViewProduct] = useState(null);

  // Countdown timer for Flash Deals (e.g. 14 hours 28 mins)
  const [timeLeft, setTimeLeft] = useState({ hours: 14, minutes: 28, seconds: 45 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 24, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Slide carousel auto rotation
  useEffect(() => {
    const slideTimer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 6000);
    return () => clearInterval(slideTimer);
  }, []);

  // Load home data
  useEffect(() => {
    const loadHomeData = async () => {
      try {
        setLoading(true);
        const [featRes, bestRes, newRes, catRes] = await Promise.all([
          api.get('/products/featured'),
          api.get('/products/bestsellers'),
          api.get('/products/new-arrivals'),
          api.get('/categories'),
        ]);

        if (featRes.data.success) setFeaturedProducts(featRes.data.products || []);
        if (bestRes.data.success) setBestsellers(bestRes.data.products || []);
        if (newRes.data.success) setNewArrivals(newRes.data.products || []);
        if (catRes.data.success) setCategories(catRes.data.categories || []);
      } catch (err) {
        console.error('Error fetching home data:', err.message);
      } finally {
        setLoading(false);
      }
    };
    loadHomeData();
  }, []);

  return (
    <div className="space-y-16 sm:space-y-24">
      {/* 1. Hero Banner Carousel */}
      <section className="relative overflow-hidden">
        <div className="relative min-h-[470px] sm:min-h-[520px] lg:min-h-[580px] flex items-center">
          {heroSlides.map((slide, index) => (
            <div
              key={slide.id}
              className={`absolute inset-0 bg-gradient-to-r ${slide.bgGradient} transition-opacity duration-1000 flex items-center ${
                index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
              }`}
            >
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-12">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                  
                  {/* Slide Text Content */}
                  <div className="space-y-5 text-white max-w-xl animate-fadeIn">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-bold tracking-wide">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>{slide.badge}</span>
                      <span className="text-white/40">•</span>
                      <span className="text-amber-300 font-extrabold">{slide.tag}</span>
                    </div>

                    <h1 className="font-display font-black text-3xl sm:text-5xl lg:text-6xl tracking-tight leading-[1.1]">
                      {slide.title}
                    </h1>

                    <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-lg">
                      {slide.subtitle}
                    </p>

                    <div className="pt-2 flex flex-wrap gap-4 items-center">
                      <Link
                        to={slide.link}
                        className="px-7 py-3.5 bg-brand-500 hover:bg-brand-600 text-white font-extrabold text-sm rounded-2xl shadow-xl shadow-brand-500/30 flex items-center gap-2 transition-transform hover:scale-105"
                      >
                        {slide.cta}
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                      <Link
                        to="/products"
                        className="px-6 py-3.5 bg-white/10 hover:bg-white/20 text-white font-bold text-sm rounded-2xl backdrop-blur-md border border-white/10 transition-colors"
                      >
                        Browse All Deals
                      </Link>
                    </div>
                  </div>

                  {/* Slide Showcase Image */}
                  <div className="hidden lg:flex justify-center items-center relative">
                    <div className="w-[420px] h-[420px] rounded-3xl overflow-hidden shadow-2xl border-4 border-white/10 relative transform rotate-1 hover:rotate-0 transition-transform duration-500">
                      <img
                        src={slide.image}
                        alt={slide.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Carousel Arrows */}
          <button
            onClick={() => setCurrentSlide((prev) => (prev === 0 ? heroSlides.length - 1 : prev - 1))}
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 p-2 sm:p-3 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-md border border-white/10 transition-colors"
            aria-label="Previous Slide"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => setCurrentSlide((prev) => (prev + 1) % heroSlides.length)}
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 p-2 sm:p-3 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-md border border-white/10 transition-colors"
            aria-label="Next Slide"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Slide Dots */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
            {heroSlides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`h-2 rounded-full transition-all ${
                  idx === currentSlide ? 'w-8 bg-brand-500' : 'w-2 bg-white/40 hover:bg-white/70'
                }`}
                aria-label={`Slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* 2. Category Cards Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-3 mb-6 sm:mb-8">
          <div>
            <span className="text-xs font-bold text-brand-600 uppercase tracking-widest block mb-1">
              Top Categories
            </span>
            <h2 className="font-display font-black text-2xl sm:text-3xl text-slate-900 tracking-tight">
              Curated Collections
            </h2>
          </div>
          <Link
            to="/products"
            className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
          >
            View All Categories <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {categories.slice(0, 6).map((cat) => (
            <Link
              key={cat._id}
              to={`/products?category=${cat.slug}`}
              className="group p-3 rounded-3xl bg-white border border-slate-100 shadow-card hover:shadow-card-hover transition-all text-center flex flex-col items-center"
            >
              <div className="w-full aspect-square rounded-2xl overflow-hidden mb-3 bg-slate-100 relative">
                <img
                  src={cat.image?.url || 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=400&q=80'}
                  alt={cat.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
              </div>
              <h3 className="text-xs font-extrabold text-slate-800 group-hover:text-brand-600 transition-colors">
                {cat.name}
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {cat.productCount ? `${cat.productCount} Products` : 'Shop Collection'}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. Flash Deals Banner with Live Countdown */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600 p-4 sm:p-10 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
          <div className="space-y-2 text-center md:text-left z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-black uppercase tracking-wider">
              <Zap className="w-3.5 h-3.5 fill-amber-300 text-amber-300" /> Flash Deals of the Day
            </div>
            <h3 className="font-display font-black text-2xl sm:text-4xl">
              Grab Up To 40% OFF Top Electronics
            </h3>
            <p className="text-xs sm:text-sm text-white/90 max-w-lg">
              Limited time offers on Sony, Apple, Dell, and premium sportswear. Hurry before inventory runs out!
            </p>
          </div>

          {/* Countdown timer blocks */}
          <div className="flex items-center gap-1 sm:gap-3 z-10 shrink-0">
            <div className="bg-black/30 backdrop-blur-md px-1.5 py-3 sm:px-4 rounded-2xl border border-white/20 text-center min-w-[38px] sm:min-w-[65px]">
              <span className="font-display font-black text-xl sm:text-2xl leading-none block">
                {String(timeLeft.hours).padStart(2, '0')}
              </span>
              <span className="text-[10px] text-white/70 uppercase font-semibold">Hours</span>
            </div>
            <span className="text-xl font-black">:</span>
            <div className="bg-black/30 backdrop-blur-md px-1.5 py-3 sm:px-4 rounded-2xl border border-white/20 text-center min-w-[38px] sm:min-w-[65px]">
              <span className="font-display font-black text-xl sm:text-2xl leading-none block">
                {String(timeLeft.minutes).padStart(2, '0')}
              </span>
              <span className="text-[10px] text-white/70 uppercase font-semibold">Mins</span>
            </div>
            <span className="text-xl font-black">:</span>
            <div className="bg-black/30 backdrop-blur-md px-1.5 py-3 sm:px-4 rounded-2xl border border-white/20 text-center min-w-[38px] sm:min-w-[65px]">
              <span className="font-display font-black text-xl sm:text-2xl leading-none block">
                {String(timeLeft.seconds).padStart(2, '0')}
              </span>
              <span className="text-[10px] text-white/70 uppercase font-semibold">Secs</span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Featured Products Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <span className="text-xs font-bold text-brand-600 uppercase tracking-widest block mb-1">
              Handpicked For You
            </span>
            <h2 className="font-display font-black text-2xl sm:text-3xl text-slate-900 tracking-tight">
              Featured Products
            </h2>
          </div>
          <Link
            to="/products"
            className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
          >
            See All Products <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {featuredProducts.slice(0, 8).map((product) => (
              <ProductCard
                key={product._id}
                product={product}
                onQuickView={(p) => setQuickViewProduct(p)}
              />
            ))}
          </div>
        )}
      </section>

      {/* 5. Promotional Split Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-3xl p-8 bg-gradient-to-tr from-slate-900 to-indigo-950 text-white relative overflow-hidden flex flex-col justify-between min-h-[260px] shadow-lg">
            <div className="space-y-2 z-10">
              <span className="px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 text-xs font-extrabold uppercase tracking-wide">
                Special Drop
              </span>
              <h3 className="font-display font-black text-2xl sm:text-3xl mt-2">
                Luxury Footwear & Sneakers
              </h3>
              <p className="text-xs text-slate-300 max-w-sm">
                Authentic Nike Air Jordans and Adidas Ultraboost with certified authenticity guarantee.
              </p>
            </div>
            <div className="pt-4 z-10">
              <Link
                to="/products?category=shoes"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-slate-900 font-extrabold text-xs rounded-xl hover:bg-slate-100 transition-colors"
              >
                Shop Footwear <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          <div className="rounded-3xl p-8 bg-gradient-to-tr from-purple-900 via-indigo-900 to-slate-900 text-white relative overflow-hidden flex flex-col justify-between min-h-[260px] shadow-lg">
            <div className="space-y-2 z-10">
              <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-extrabold uppercase tracking-wide">
                Beauty & Fragrances
              </span>
              <h3 className="font-display font-black text-2xl sm:text-3xl mt-2">
                Dior Sauvage & Estée Lauder
              </h3>
              <p className="text-xs text-slate-300 max-w-sm">
                Elevate your daily skincare and signature scent with the world's most coveted luxury beauty brands.
              </p>
            </div>
            <div className="pt-4 z-10">
              <Link
                to="/products?category=beauty"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-slate-900 font-extrabold text-xs rounded-xl hover:bg-slate-100 transition-colors"
              >
                Shop Beauty <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Best Sellers Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 text-amber-500 text-xs font-extrabold uppercase tracking-widest mb-1">
              <Award className="w-4 h-4" /> Most Popular Picks
            </div>
            <h2 className="font-display font-black text-2xl sm:text-3xl text-slate-900 tracking-tight">
              Best Sellers
            </h2>
          </div>
          <Link
            to="/products?sort=popular"
            className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
          >
            View All Bestsellers <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {bestsellers.slice(0, 8).map((product) => (
              <ProductCard
                key={product._id}
                product={product}
                onQuickView={(p) => setQuickViewProduct(p)}
              />
            ))}
          </div>
        )}
      </section>

      {/* 7. New Arrivals */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 text-brand-600 text-xs font-extrabold uppercase tracking-widest mb-1">
              <TrendingUp className="w-4 h-4" /> Just Landed
            </div>
            <h2 className="font-display font-black text-2xl sm:text-3xl text-slate-900 tracking-tight">
              New Arrivals
            </h2>
          </div>
          <Link
            to="/products?sort=newest"
            className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
          >
            Explore Latest Drops <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {newArrivals.slice(0, 8).map((product) => (
              <ProductCard
                key={product._id}
                product={product}
                onQuickView={(p) => setQuickViewProduct(p)}
              />
            ))}
          </div>
        )}
      </section>

      {/* 8. Customer Testimonials */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-12">
          <span className="text-xs font-bold text-brand-600 uppercase tracking-widest block mb-1">
            Customer Love
          </span>
          <h2 className="font-display font-black text-2xl sm:text-3xl text-slate-900 tracking-tight">
            Over 50,000+ Happy Shoppers
          </h2>
          <p className="text-xs text-slate-500 mt-2">
            See what customers across India say about their seamless experience with ShopNest.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, idx) => (
            <div
              key={idx}
              className="p-6 rounded-3xl bg-white border border-slate-100 shadow-card flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center gap-1 text-amber-400 mb-3">
                  {[...Array(t.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400" />
                  ))}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed italic">
                  "{t.text}"
                </p>
              </div>

              <div className="flex items-center gap-3 pt-3 border-t border-slate-50">
                <img
                  src={t.avatar}
                  alt={t.name}
                  className="w-10 h-10 rounded-xl object-cover"
                />
                <div>
                  <h4 className="font-bold text-xs text-slate-900">{t.name}</h4>
                  <p className="text-[11px] text-slate-400">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Quick View Modal */}
      <QuickViewModal
        product={quickViewProduct}
        isOpen={Boolean(quickViewProduct)}
        onClose={() => setQuickViewProduct(null)}
      />
    </div>
  );
};

export default HomePage;
