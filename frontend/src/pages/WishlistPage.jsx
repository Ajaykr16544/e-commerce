import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Trash2, ArrowRight, Star } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { formatPrice } from '../utils/formatters';
import RatingStars from '../components/common/RatingStars';

const WishlistPage = () => {
  const { wishlist, removeFromWishlist, moveToCart } = useWishlist();

  if (!wishlist || wishlist.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="max-w-md mx-auto bg-white rounded-3xl p-10 border border-slate-100 shadow-card space-y-4">
          <div className="w-20 h-20 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto">
            <Heart className="w-10 h-10" />
          </div>
          <h2 className="font-display font-black text-2xl text-slate-900">
            Your Wishlist is Empty
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Save items that you like in your wishlist. Review them anytime and easily move them to your bag!
          </p>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl text-xs font-black shadow-lg shadow-brand-500/25 transition-transform hover:scale-105"
          >
            Explore Catalog <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-slate-900">
            My Wishlist
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {wishlist.length} saved {wishlist.length === 1 ? 'item' : 'items'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {wishlist.map((product) => {
          const imgUrl = product.images?.[0]?.url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=400&q=80';

          return (
            <div
              key={product._id}
              className="bg-white rounded-3xl border border-slate-100 shadow-card hover:shadow-card-hover transition-all duration-300 flex flex-col justify-between overflow-hidden relative"
            >
              {/* Image Box */}
              <div className="relative aspect-square bg-slate-100 overflow-hidden">
                <button
                  onClick={() => removeFromWishlist(product._id)}
                  className="absolute top-3 right-3 z-10 p-2 rounded-full bg-white/90 text-rose-500 hover:bg-rose-50 shadow-sm transition-colors"
                  title="Remove from wishlist"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <Link to={`/product/${product.slug || product._id}`} className="block w-full h-full">
                  <img
                    src={imgUrl}
                    alt={product.name}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  />
                </Link>
              </div>

              {/* Info */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <span className="text-[10px] font-bold text-brand-600 uppercase tracking-wider block mb-1">
                    {product.brand}
                  </span>
                  <Link
                    to={`/product/${product.slug || product._id}`}
                    className="block text-xs font-bold text-slate-900 hover:text-brand-600 line-clamp-2 leading-snug mb-2"
                  >
                    {product.name}
                  </Link>
                  <RatingStars rating={product.rating || 0} reviewsCount={product.numReviews} size="w-3 h-3" />
                </div>

                <div className="pt-2 border-t border-slate-100 space-y-3">
                  <div className="flex items-baseline gap-2">
                    <span className="text-base font-extrabold text-slate-900">
                      {formatPrice(product.discountPrice || product.price)}
                    </span>
                    {product.discountPrice && product.discountPrice < product.price && (
                      <span className="text-xs text-slate-400 line-through">
                        {formatPrice(product.price)}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => moveToCart(product)}
                    className="w-full py-2.5 px-4 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-colors"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" /> Move to Cart
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WishlistPage;
