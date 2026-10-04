import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Modal from '../common/Modal';
import RatingStars from '../common/RatingStars';
import { formatPrice } from '../../utils/formatters';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { ShoppingCart, Heart, ExternalLink, Check, ShieldCheck, Truck } from 'lucide-react';

const QuickViewModal = ({ product, isOpen, onClose }) => {
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const [selectedImg, setSelectedImg] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    setSelectedImg(0);
    setSelectedSize(product?.variants?.sizes?.[0] || '');
    setSelectedColor(product?.variants?.colors?.find((color) => color.inStock !== false)?.name || '');
    setQuantity(1);
    setIsAdding(false);
  }, [product?._id]);

  if (!product) return null;

  const isFavorited = isInWishlist(product._id);
  const sizes = product.variants?.sizes || [];
  const colors = product.variants?.colors || [];

  const handleAddToCart = async () => {
    setIsAdding(true);
    const added = await addToCart(product, quantity, selectedSize, selectedColor);
    if (added) {
      setTimeout(() => {
        setIsAdding(false);
        onClose();
      }, 600);
    } else {
      setIsAdding(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Product Quick View" maxWidth="max-w-4xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Left: Gallery */}
        <div className="space-y-4">
          <div className="aspect-square bg-slate-100 rounded-2xl overflow-hidden border border-slate-100">
            <img
              src={product.images?.[selectedImg]?.url || product.images?.[0]?.url}
              alt={product.name}
              className="w-full h-full object-cover object-center"
            />
          </div>

          {/* Thumbnails */}
          {product.images?.length > 1 && (
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImg(idx)}
                  className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                    selectedImg === idx ? 'border-brand-600 scale-95' : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Info */}
        <div className="flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-brand-600 uppercase tracking-wider">
              <span>{product.brand}</span>
              <span className="text-slate-400 font-mono text-[11px]">SKU: {product.sku}</span>
            </div>

            <h2 className="text-xl font-display font-extrabold text-slate-900 mt-1 mb-2">
              {product.name}
            </h2>

            <div className="flex items-center gap-3 mb-4">
              <RatingStars rating={product.rating || 0} reviewsCount={product.numReviews || 0} />
              <span className="text-xs text-slate-300">•</span>
              <span className="text-xs font-semibold text-emerald-600">
                {product.stock > 0 ? `In Stock (${product.stock})` : 'Out of Stock'}
              </span>
            </div>

            {/* Price Box */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 mb-4 flex items-baseline gap-3">
              <span className="text-2xl font-black text-slate-900">
                {formatPrice(product.discountPrice || product.price)}
              </span>
              {product.discountPrice && product.discountPrice < product.price && (
                <>
                  <span className="text-sm text-slate-400 line-through">
                    {formatPrice(product.price)}
                  </span>
                  <span className="px-2 py-0.5 bg-rose-100 text-rose-700 text-xs font-extrabold rounded-lg">
                    {product.discountPercentage}% OFF
                  </span>
                </>
              )}
            </div>

            {/* Short Description */}
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              {product.shortDescription || product.description?.substring(0, 160) + '...'}
            </p>

            {/* Sizes */}
            {sizes.length > 0 && (
              <div className="mb-4">
                <span className="text-xs font-bold text-slate-700 block mb-1.5">
                  Select Size:
                </span>
                <div className="flex flex-wrap gap-2">
                  {sizes.map((sz) => (
                    <button
                      key={sz}
                      onClick={() => setSelectedSize(sz)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                        (selectedSize || sizes[0]) === sz
                          ? 'border-brand-600 bg-brand-50 text-brand-700'
                          : 'border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Colors */}
            {colors.length > 0 && (
              <div className="mb-4">
                <span className="text-xs font-bold text-slate-700 block mb-1.5">
                  Select Color:
                </span>
                <div className="flex items-center gap-2">
                  {colors.map((c) => (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => setSelectedColor(c.name)}
                      disabled={c.inStock === false}
                      title={c.name}
                      style={{ backgroundColor: c.hex }}
                      className={`w-7 h-7 rounded-full border-2 transition-all ${
                        (selectedColor || colors[0]?.name) === c.name
                          ? 'ring-2 ring-brand-500 ring-offset-2 scale-110 border-white'
                          : 'border-slate-300'
                      } ${c.inStock === false ? 'cursor-not-allowed opacity-30' : ''}`}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Quantity Stepper */}
            <div className="flex items-center gap-3 mb-6">
              <span className="text-xs font-bold text-slate-700">Quantity:</span>
              <div className="flex items-center border border-slate-200 rounded-xl bg-white">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-1.5 text-slate-500 hover:text-slate-800 font-bold"
                >
                  -
                </button>
                <span className="px-3 py-1.5 text-xs font-bold text-slate-800">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity(Math.min(product.stock || 10, quantity + 1))}
                  className="px-3 py-1.5 text-slate-500 hover:text-slate-800 font-bold"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <div className="flex gap-3">
              <button
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className={`flex-1 py-3 px-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md ${
                  product.stock === 0
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : isAdding
                    ? 'bg-emerald-600 text-white shadow-emerald-500/30'
                    : 'bg-brand-600 hover:bg-brand-700 text-white shadow-brand-500/25'
                }`}
              >
                {isAdding ? <Check className="w-4 h-4" /> : <ShoppingCart className="w-4 h-4" />}
                {isAdding ? 'Added to Cart!' : 'Add to Cart'}
              </button>

              <button
                onClick={() => toggleWishlist(product)}
                className={`p-3 rounded-2xl border transition-colors ${
                  isFavorited
                    ? 'border-rose-200 bg-rose-50 text-rose-500'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
                title="Wishlist"
              >
                <Heart className={`w-5 h-5 ${isFavorited ? 'fill-rose-500' : ''}`} />
              </button>
            </div>

            <Link
              to={`/product/${product.slug || product._id}`}
              onClick={onClose}
              className="w-full py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              View Full Product Specifications & Reviews
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default QuickViewModal;
