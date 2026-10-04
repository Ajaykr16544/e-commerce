import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Heart,
  ShoppingCart,
  Zap,
  Truck,
  RotateCcw,
  ShieldCheck,
  Check,
  Star,
  Plus,
  Share2,
  ChevronRight,
  MapPin,
  MessageSquare,
} from 'lucide-react';
import api from '../services/api';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatPrice, formatDate } from '../utils/formatters';
import RatingStars from '../components/common/RatingStars';
import Modal from '../components/common/Modal';
import ProductCard from '../components/product/ProductCard';

const ProductDetailPage = () => {
  const { identifier } = useParams();
  const navigate = useNavigate();

  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { isAuthenticated, user } = useAuth();
  const { showToast } = useToast();

  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [distribution, setDistribution] = useState([]);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Gallery state
  const [selectedImg, setSelectedImg] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Variant & quantity states
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);

  // Pincode check
  const [pincode, setPincode] = useState('');
  const [pincodeStatus, setPincodeStatus] = useState(null);

  // Active tab (description, specs, reviews)
  const [activeTab, setActiveTab] = useState('description');

  // New review form state
  const [newRating, setNewRating] = useState(5);
  const [newTitle, setNewTitle] = useState('');
  const [newComment, setNewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Fetch product details
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setProduct(null);
        const res = await api.get(`/products/${identifier}`);
        if (res.data.success) {
          const prod = res.data.product;
          setProduct(prod);
          setReviews(res.data.reviews || []);
          setSelectedImg(0);
          setSelectedSize(prod.variants?.sizes?.[0] || '');
          setSelectedColor(
            prod.variants?.colors?.find((color) => color.inStock !== false)?.name || ''
          );

          // Fetch reviews with distribution
          try {
            const revRes = await api.get(`/reviews/${prod._id}`);
            if (revRes.data.success) {
              setDistribution(revRes.data.distribution || []);
            }
          } catch (e) {}

          // Fetch related products
          try {
            const relRes = await api.get(`/products/${prod._id}/related`);
            if (relRes.data.success) {
              setRelatedProducts(relRes.data.products || []);
            }
          } catch (e) {}
        }
      } catch (err) {
        console.error('Failed to load product details:', err.message);
        showToast('Product not found', 'error');
        navigate('/products');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [identifier, navigate]);

  // Image zoom handler
  const handleMouseMove = (e) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.pageX - left) / width) * 100;
    const y = ((e.pageY - top) / height) * 100;
    setMousePos({ x, y });
  };

  const handleAddToCart = async () => {
    setIsAdding(true);
    const added = await addToCart(product, quantity, selectedSize, selectedColor);
    if (added) {
      setTimeout(() => setIsAdding(false), 800);
    } else {
      setIsAdding(false);
    }
  };

  const handleBuyNow = async () => {
    const added = await addToCart(product, quantity, selectedSize, selectedColor);
    if (added) navigate('/checkout');
  };

  const handleCheckPincode = (e) => {
    e.preventDefault();
    if (!pincode || pincode.trim().length !== 6) {
      setPincodeStatus({ valid: false, message: 'Please enter a valid 6-digit postal pincode' });
      return;
    }
    setPincodeStatus({
      valid: true,
      message: 'Express Delivery available! Guaranteed dispatch within 24 hours.',
    });
  };

  const handleShare = async () => {
    const shareData = { title: product.name, url: window.location.href };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareData.url);
        showToast('Product link copied to clipboard', 'success');
      } else {
        showToast('Sharing is not available in this browser', 'warning');
      }
    } catch (error) {
      if (error.name !== 'AbortError') showToast(error.message, 'error');
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      showToast('Please sign in to write a review', 'warning');
      return;
    }

    if (!newComment.trim()) {
      showToast('Please provide your review feedback', 'warning');
      return;
    }

    try {
      setIsSubmittingReview(true);
      const res = await api.post('/reviews', {
        productId: product._id,
        rating: newRating,
        title: newTitle,
        comment: newComment,
      });

      if (res.data.success) {
        showToast('Review submitted successfully!', 'success');
        setReviews([res.data.review, ...reviews]);
        setNewComment('');
        setNewTitle('');
      }
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (loading || !product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 animate-pulse space-y-8">
        <div className="h-6 bg-slate-200 rounded w-1/4 mb-4"></div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="aspect-square bg-slate-200 rounded-3xl"></div>
          <div className="space-y-4">
            <div className="h-8 bg-slate-200 rounded w-3/4"></div>
            <div className="h-5 bg-slate-200 rounded w-1/3"></div>
            <div className="h-10 bg-slate-200 rounded w-1/2"></div>
            <div className="h-24 bg-slate-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  const isFavorited = isInWishlist(product._id);
  const images = product.images || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-16">
      
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-xs font-medium text-slate-500">
        <Link to="/" className="hover:text-slate-800">Home</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link to="/products" className="hover:text-slate-800">Products</Link>
        {product.category && (
          <>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link to={`/products?category=${product.category.slug}`} className="hover:text-slate-800">
              {product.category.name}
            </Link>
          </>
        )}
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-800 font-bold truncate max-w-xs">{product.name}</span>
      </nav>

      {/* Main Showcase Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        
        {/* Left: Gallery with Zoom Effect */}
        <div className="space-y-4 lg:sticky lg:top-28">
          <div
            onMouseEnter={() => setIsZoomed(true)}
            onMouseLeave={() => setIsZoomed(false)}
            onMouseMove={handleMouseMove}
            className="relative aspect-square rounded-3xl overflow-hidden bg-slate-100 border border-slate-100 shadow-card cursor-crosshair"
          >
            {/* Main Image */}
            <img
              src={images[selectedImg]?.url || images[0]?.url}
              alt={product.name}
              className={`w-full h-full object-cover object-center transition-transform duration-200 ${
                isZoomed ? 'scale-150' : 'scale-100'
              }`}
              style={
                isZoomed
                  ? {
                      transformOrigin: `${mousePos.x}% ${mousePos.y}%`,
                    }
                  : undefined
              }
            />

            {/* Badges */}
            <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
              {product.discountPercentage > 0 && (
                <span className="px-3 py-1 rounded-xl bg-rose-500 text-white text-xs font-black shadow-md">
                  {product.discountPercentage}% OFF
                </span>
              )}
              {product.isBestseller && (
                <span className="px-3 py-1 rounded-xl bg-amber-500 text-white text-xs font-black shadow-md">
                  Bestseller
                </span>
              )}
            </div>
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImg(idx)}
                  className={`w-20 h-20 rounded-2xl overflow-hidden border-2 transition-all shrink-0 ${
                    selectedImg === idx
                      ? 'border-brand-600 scale-95 shadow-md'
                      : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Product Details & Controls */}
        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-brand-600 uppercase tracking-widest">
                {product.brand}
              </span>
              <div className="flex items-center gap-3">
                <span className="text-slate-400 font-mono text-xs">SKU: {product.sku}</span>
                <button
                  type="button"
                  onClick={handleShare}
                  className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 transition-colors hover:text-brand-600"
                  aria-label={`Share ${product.name}`}
                >
                  <Share2 className="h-4 w-4" />
                  <span className="sr-only sm:not-sr-only">Share</span>
                </button>
              </div>
            </div>

            <h1 className="font-display font-black text-2xl sm:text-3xl text-slate-900 mt-2 mb-3 leading-tight">
              {product.name}
            </h1>

            {/* Ratings & Stock */}
            <div className="flex flex-wrap items-center gap-3">
              <RatingStars rating={product.rating || 0} reviewsCount={product.numReviews || 0} />
              <span className="text-slate-300">•</span>
              <span
                className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                  product.stock > 5
                    ? 'bg-emerald-50 text-emerald-700'
                    : product.stock > 0
                    ? 'bg-amber-50 text-amber-700'
                    : 'bg-rose-50 text-rose-700'
                }`}
              >
                {product.stock > 5
                  ? `In Stock (${product.stock} available)`
                  : product.stock > 0
                  ? `Hurry! Only ${product.stock} left in stock`
                  : 'Currently Out of Stock'}
              </span>
            </div>
          </div>

          {/* Pricing Box */}
          <div className="p-5 rounded-3xl bg-slate-50 border border-slate-100 flex flex-wrap items-baseline gap-4">
            <span className="text-3xl sm:text-4xl font-black text-slate-900">
              {formatPrice(product.discountPrice || product.price)}
            </span>
            {product.discountPrice && product.discountPrice < product.price && (
              <>
                <span className="text-base text-slate-400 line-through">
                  {formatPrice(product.price)}
                </span>
                <span className="px-2.5 py-1 bg-rose-100 text-rose-700 text-xs font-black rounded-xl">
                  {product.discountPercentage}% OFF
                </span>
                <span className="text-xs font-bold text-emerald-600 block sm:inline">
                  (You save {formatPrice(product.price - product.discountPrice)})
                </span>
              </>
            )}
            <p className="text-[11px] text-slate-400 w-full">
              Inclusive of all taxes. Free Express Shipping on this item.
            </p>
          </div>

          {/* Short Summary */}
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            {product.shortDescription || product.description?.substring(0, 180)}
          </p>

          {/* Size Selector */}
          {product.variants?.sizes?.length > 0 && (
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-slate-900">Select Size:</span>
                <button
                  type="button"
                  onClick={() => setIsSizeGuideOpen(true)}
                  className="text-[11px] text-brand-600 font-semibold hover:text-brand-700"
                >
                  Size Guide
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {product.variants.sizes.map((sz) => (
                  <button
                    type="button"
                    key={sz}
                    onClick={() => setSelectedSize(sz)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                      selectedSize === sz
                        ? 'border-brand-600 bg-brand-50 text-brand-700 shadow-sm'
                        : 'border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Color Selector */}
          {product.variants?.colors?.length > 0 && (
            <div>
              <span className="text-xs font-bold text-slate-900 block mb-2">
                Select Color: <span className="font-normal text-slate-500">{selectedColor}</span>
              </span>
              <div className="flex items-center gap-3">
                {product.variants.colors.map((c) => (
                  <button
                    type="button"
                    key={c.name}
                    onClick={() => setSelectedColor(c.name)}
                    disabled={c.inStock === false}
                    style={{ backgroundColor: c.hex }}
                    title={c.name}
                    aria-label={`Select ${c.name}${c.inStock === false ? ' (out of stock)' : ''}`}
                    aria-pressed={selectedColor === c.name}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      selectedColor === c.name
                        ? 'ring-2 ring-brand-500 ring-offset-2 scale-110 border-white'
                        : 'border-slate-300 hover:scale-105'
                    } ${c.inStock === false ? 'cursor-not-allowed opacity-30' : ''}`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Quantity & Action Buttons */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-4">
              <span className="text-xs font-bold text-slate-700">Quantity:</span>
              <div className="flex items-center border border-slate-200 rounded-xl bg-white shadow-sm">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  aria-label="Decrease quantity"
                  className="px-3 py-2 text-slate-500 hover:text-slate-800 font-bold"
                >
                  -
                </button>
                <span className="px-3 py-2 text-xs font-bold text-slate-800">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity(Math.min(product.stock || 10, quantity + 1))}
                  aria-label="Increase quantity"
                  className="px-3 py-2 text-slate-500 hover:text-slate-800 font-bold"
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className={`flex-1 py-4 px-6 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all shadow-lg ${
                  product.stock === 0
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : isAdding
                    ? 'bg-emerald-600 text-white shadow-emerald-500/30'
                    : 'bg-brand-600 hover:bg-brand-700 text-white shadow-brand-500/25'
                }`}
              >
                {isAdding ? <Check className="w-5 h-5" /> : <ShoppingCart className="w-5 h-5" />}
                {isAdding ? 'Added to Cart!' : 'Add to Cart'}
              </button>

              <button
                onClick={handleBuyNow}
                disabled={product.stock === 0}
                className="flex-1 py-4 px-6 rounded-2xl font-black text-sm bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center gap-2 shadow-lg transition-colors"
              >
                <Zap className="w-5 h-5 text-amber-400 fill-amber-400" />
                Buy Now
              </button>

              <button
                onClick={() => toggleWishlist(product)}
                className={`p-4 rounded-2xl border transition-colors flex items-center justify-center ${
                  isFavorited
                    ? 'border-rose-200 bg-rose-50 text-rose-500'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
                title="Wishlist"
              >
                <Heart className={`w-5 h-5 ${isFavorited ? 'fill-rose-500' : ''}`} />
              </button>
            </div>
          </div>

          {/* Delivery & Pincode Checker */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3">
            <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-brand-600" /> Check Estimated Delivery Date
            </span>
            <form onSubmit={handleCheckPincode} className="flex gap-2">
              <input
                type="text"
                maxLength={6}
                placeholder="Enter 6-digit Pincode"
                value={pincode}
                onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-900 transition-colors"
              >
                Check
              </button>
            </form>
            {pincodeStatus && (
              <p
                className={`text-xs font-medium ${
                  pincodeStatus.valid ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {pincodeStatus.message}
              </p>
            )}
          </div>

          {/* Trust Guarantees */}
          <div className="grid grid-cols-3 gap-3 pt-2 text-center text-xs text-slate-600">
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <ShieldCheck className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
              <span className="font-bold block text-slate-800 text-[11px]">100% Genuine</span>
              <span className="text-[10px] text-slate-400">Directly from brand</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <RotateCcw className="w-5 h-5 text-amber-600 mx-auto mb-1" />
              <span className="font-bold block text-slate-800 text-[11px]">14 Days Return</span>
              <span className="text-[10px] text-slate-400">Hassle-free refunds</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <Truck className="w-5 h-5 text-brand-600 mx-auto mb-1" />
              <span className="font-bold block text-slate-800 text-[11px]">Free Shipping</span>
              <span className="text-[10px] text-slate-400">Orders over ₹999</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs: Description, Specs, Reviews */}
      <div className="pt-8 border-t border-slate-200">
        <div className="flex border-b border-slate-200 gap-8 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('description')}
            className={`pb-4 text-sm font-bold border-b-2 transition-colors shrink-0 ${
              activeTab === 'description'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Product Overview & Description
          </button>
          <button
            onClick={() => setActiveTab('specifications')}
            className={`pb-4 text-sm font-bold border-b-2 transition-colors shrink-0 ${
              activeTab === 'specifications'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Specifications ({product.specifications?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`pb-4 text-sm font-bold border-b-2 transition-colors shrink-0 ${
              activeTab === 'reviews'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Customer Reviews ({reviews.length})
          </button>
        </div>

        {/* Tab Content */}
        <div className="py-8">
          {activeTab === 'description' && (
            <div className="prose max-w-none text-slate-700 text-sm leading-relaxed space-y-4">
              <p>{product.description}</p>
            </div>
          )}

          {activeTab === 'specifications' && (
            <div className="max-w-2xl bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-card">
              <table className="w-full text-xs text-left">
                <tbody>
                  {product.specifications?.map((spec, i) => (
                    <tr
                      key={i}
                      className={i % 2 === 0 ? 'bg-slate-50/50' : 'bg-white'}
                    >
                      <td className="px-6 py-3.5 font-bold text-slate-700 w-1/3 border-b border-slate-100">
                        {spec.key}
                      </td>
                      <td className="px-6 py-3.5 text-slate-600 border-b border-slate-100">
                        {spec.value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-10">
              {/* Ratings Overview & Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-6 rounded-3xl bg-slate-50 border border-slate-100">
                <div className="text-center md:border-r border-slate-200 pr-6 flex flex-col items-center justify-center">
                  <span className="font-display font-black text-5xl text-slate-900">
                    {Number(product.rating || 0).toFixed(1)}
                  </span>
                  <div className="my-2">
                    <RatingStars rating={product.rating || 0} size="w-5 h-5" showScore={false} />
                  </div>
                  <span className="text-xs text-slate-500">
                    Based on {product.numReviews || 0} verified reviews
                  </span>
                </div>

                {/* Rating bars */}
                <div className="md:col-span-2 space-y-2 flex flex-col justify-center">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const row = distribution.find((d) => d.star === star) || { count: 0, percentage: 0 };
                    return (
                      <div key={star} className="flex items-center gap-3 text-xs">
                        <span className="w-12 text-slate-600 font-semibold">{star} stars</span>
                        <div className="flex-1 h-2.5 rounded-full bg-slate-200 overflow-hidden">
                          <div
                            className="h-full bg-amber-400 rounded-full"
                            style={{ width: `${row.percentage}%` }}
                          />
                        </div>
                        <span className="w-10 text-right text-slate-400 text-[11px]">
                          {row.count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Write Review Form */}
              <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-card">
                <h4 className="font-bold text-sm text-slate-900 mb-4 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-brand-600" /> Write a Customer Review
                </h4>
                <form onSubmit={handleReviewSubmit} className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Your Rating:
                    </label>
                    <RatingStars
                      rating={newRating}
                      editable={true}
                      onRatingChange={(r) => setNewRating(r)}
                      size="w-6 h-6"
                      showScore={false}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Review Title:
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Incredible quality and super fast shipping!"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Your Detailed Review:
                    </label>
                    <textarea
                      rows={4}
                      placeholder="Share your experience with this product..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingReview}
                    className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
                  >
                    {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
                  </button>
                </form>
              </div>

              {/* Reviews List */}
              <div className="space-y-4">
                {reviews.length > 0 ? (
                  reviews.map((rev) => (
                    <div
                      key={rev._id}
                      className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <img
                            src={rev.user?.avatar?.url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80'}
                            alt={rev.user?.name}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                          <div>
                            <span className="font-bold text-xs text-slate-900 block">
                              {rev.user?.name || 'Customer'}
                            </span>
                            {rev.isVerifiedPurchase && (
                              <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                                <Check className="w-3 h-3" /> Verified Purchase
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="text-[11px] text-slate-400">
                          {formatDate(rev.createdAt)}
                        </span>
                      </div>

                      <RatingStars rating={rev.rating} size="w-3.5 h-3.5" showScore={false} />

                      {rev.title && (
                        <h5 className="font-bold text-xs text-slate-800">{rev.title}</h5>
                      )}
                      <p className="text-xs text-slate-600 leading-relaxed">{rev.comment}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 text-center py-6">
                    No customer reviews yet. Be the first to review this product!
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Frequently Bought Together Bundle */}
      {relatedProducts.length > 0 && (
        <section className="p-6 rounded-3xl bg-gradient-to-r from-brand-50 to-indigo-50 border border-brand-100 space-y-4">
          <span className="text-xs font-bold text-brand-600 uppercase tracking-widest block">
            Frequently Bought Together
          </span>
          <h3 className="font-display font-black text-xl text-slate-900">
            Complete the Setup & Save
          </h3>
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="flex items-center gap-3">
              <img
                src={product.images[0]?.url}
                alt={product.name}
                className="w-16 h-16 rounded-xl object-cover bg-white p-1 border border-slate-200"
              />
              <Plus className="w-5 h-5 text-slate-400" />
              <img
                src={relatedProducts[0]?.images[0]?.url}
                alt={relatedProducts[0]?.name}
                className="w-16 h-16 rounded-xl object-cover bg-white p-1 border border-slate-200"
              />
            </div>
            <div className="flex-1 text-xs text-slate-700">
              <p className="font-bold text-slate-900">{product.name} + {relatedProducts[0]?.name}</p>
              <p className="text-slate-500 mt-0.5">Bundle Price: <strong className="text-slate-900 font-extrabold">{formatPrice((product.discountPrice || product.price) + (relatedProducts[0]?.discountPrice || relatedProducts[0]?.price))}</strong></p>
            </div>
            <button
              type="button"
              onClick={async () => {
                const firstAdded = await addToCart(product, 1);
                if (!firstAdded) return;
                const secondAdded = await addToCart(relatedProducts[0], 1);
                if (!secondAdded) return;
                showToast('Bundle added to cart!', 'success');
              }}
              className="px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors"
            >
              Add Both to Cart
            </button>
          </div>
        </section>
      )}

      {/* Related Products Section */}
      {relatedProducts.length > 0 && (
        <section className="space-y-6">
          <h3 className="font-display font-black text-2xl text-slate-900">
            Similar Products You Might Like
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {relatedProducts.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        </section>
      )}

      <Modal
        isOpen={isSizeGuideOpen}
        onClose={() => setIsSizeGuideOpen(false)}
        title="Available product sizes"
        maxWidth="max-w-lg"
      >
        <p className="text-sm leading-6 text-slate-600">
          These are the size or model options currently offered for this product. Check the
          specifications for fit, dimensions, and compatibility details.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          {(product.variants?.sizes || []).map((size) => (
            <span key={size} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-700">
              {size}
            </span>
          ))}
        </div>
      </Modal>
    </div>
  );
};

export default ProductDetailPage;
