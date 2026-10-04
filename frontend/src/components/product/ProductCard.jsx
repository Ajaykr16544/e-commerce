import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Eye, Star, Check } from 'lucide-react';
import { formatPrice } from '../../utils/formatters';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import RatingStars from '../common/RatingStars';

const ProductCard = ({ product, onQuickView, viewMode = 'grid' }) => {
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [isHovered, setIsHovered] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const isFavorited = isInWishlist(product._id);
  const primaryImg = product.images?.[0]?.url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80';
  const secondaryImg = product.images?.[1]?.url || primaryImg;

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsAdding(true);
    const added = await addToCart(product, 1);
    if (added) {
      setTimeout(() => setIsAdding(false), 800);
    } else {
      setIsAdding(false);
    }
  };

  const handleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
  };

  const handleQuickView = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onQuickView) onQuickView(product);
  };

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`group bg-white rounded-3xl border border-slate-100/80 shadow-card hover:shadow-card-hover transition-all duration-300 overflow-hidden relative ${
        viewMode === 'list' ? 'sm:flex sm:flex-row' : 'flex flex-col justify-between'
      }`}
    >
      {/* Top Image Box */}
      <div className={`relative w-full bg-slate-100 overflow-hidden ${
        viewMode === 'list' ? 'aspect-square sm:aspect-auto sm:w-56 sm:min-h-[220px] sm:shrink-0' : 'aspect-square'
      }`}>
        {/* Badges */}
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5 pointer-events-none">
          {product.discountPercentage > 0 && (
            <span className="px-2.5 py-1 rounded-xl bg-rose-500 text-white text-[11px] font-extrabold shadow-sm">
              {product.discountPercentage}% OFF
            </span>
          )}
          {product.isBestseller && (
            <span className="px-2.5 py-1 rounded-xl bg-amber-500 text-white text-[11px] font-extrabold shadow-sm">
              Bestseller
            </span>
          )}
          {product.isNewArrival && !product.isBestseller && (
            <span className="px-2.5 py-1 rounded-xl bg-brand-600 text-white text-[11px] font-extrabold shadow-sm">
              New
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          onClick={handleWishlist}
          type="button"
          className={`absolute top-3 right-3 z-10 p-2.5 rounded-full transition-all duration-200 ${
            isFavorited
              ? 'bg-rose-50 text-rose-500 shadow-md'
              : 'bg-white/90 text-slate-600 hover:text-rose-500 hover:bg-white shadow-sm'
          }`}
          aria-label={isFavorited ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
        >
          <Heart className={`w-4 h-4 ${isFavorited ? 'fill-rose-500' : ''}`} />
        </button>

        {/* Product Image Link */}
        <Link to={`/product/${product.slug || product._id}`} className="block w-full h-full">
          <img
            src={isHovered ? secondaryImg : primaryImg}
            alt={product.name}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        </Link>

        {/* Quick View Floating Action Overlay */}
        <div className="absolute inset-x-3 bottom-3 z-10 flex gap-2 opacity-100 transition-opacity duration-300 sm:opacity-0 sm:group-hover:opacity-100">
          <button
            onClick={handleQuickView}
            type="button"
            className="flex-1 py-2.5 px-3 bg-white/95 hover:bg-white text-slate-800 rounded-xl text-xs font-bold shadow-lg flex items-center justify-center gap-1.5 transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            Quick View
          </button>
        </div>
      </div>

      {/* Body Info */}
      <div className={`min-w-0 p-3 sm:p-4 flex-1 flex flex-col justify-between ${viewMode === 'list' ? 'sm:p-6' : ''}`}>
        <div>
          {/* Brand & Category */}
          <div className="flex min-w-0 items-center justify-between gap-1 text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
            <span className="min-w-0 truncate">{product.brand}</span>
            {product.stock <= 5 && product.stock > 0 && (
              <span className="shrink-0 text-[9px] text-amber-700 font-extrabold lowercase sm:text-[11px]">
                Only {product.stock} left
              </span>
            )}
          </div>

          {/* Product Title */}
          <Link
            to={`/product/${product.slug || product._id}`}
            className="block break-words text-sm font-bold text-slate-900 hover:text-brand-600 transition-colors line-clamp-2 leading-snug mb-2"
            title={product.name}
          >
            {product.name}
          </Link>

          {/* Rating */}
          <div className="mb-3">
            <RatingStars
              rating={product.rating || 0}
              reviewsCount={product.numReviews || 0}
              size="w-3 h-3 sm:w-3.5 sm:h-3.5"
              scoreClassName="hidden sm:inline"
              reviewsCountClassName="hidden sm:inline"
            />
          </div>
        </div>

        {/* Pricing and Add to Cart Row */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1 flex flex-col">
            <div className="flex flex-col gap-x-1.5 sm:flex-row sm:items-baseline">
              <span className="break-words text-sm sm:text-base font-extrabold text-slate-900">
                {formatPrice(product.discountPrice || product.price)}
              </span>
              {product.discountPrice && product.discountPrice < product.price && (
                <span className="break-words text-xs text-slate-600 line-through">
                  {formatPrice(product.price)}
                </span>
              )}
            </div>
            {product.discountPrice && product.discountPrice < product.price && (
              <span className="break-words text-[10px] font-bold text-emerald-700">
                Save {formatPrice(product.price - product.discountPrice)}
              </span>
            )}
          </div>

          <button
            onClick={handleAddToCart}
            type="button"
            disabled={product.stock === 0}
            className={`p-2.5 rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm ${
              product.stock === 0
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : isAdding
                ? 'bg-emerald-600 text-white'
                : 'bg-brand-50 hover:bg-brand-600 text-brand-600 hover:text-white'
            }`}
            title={product.stock === 0 ? 'Out of stock' : 'Add to cart'}
            aria-label={product.stock === 0 ? `${product.name} is out of stock` : `Add ${product.name} to cart`}
          >
            {isAdding ? (
              <Check className="w-4 h-4 animate-scaleIn" />
            ) : (
              <ShoppingCart className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
