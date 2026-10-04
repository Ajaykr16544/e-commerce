import React from 'react';
import { RotateCcw, Star, Check } from 'lucide-react';
import { formatPrice } from '../../utils/formatters';

const ProductFilters = ({
  categories = [],
  selectedCategory,
  onSelectCategory,
  selectedBrand,
  onSelectBrand,
  priceRange,
  onPriceChange,
  minRating,
  onRatingChange,
  minDiscount,
  onDiscountChange,
  inStockOnly,
  onToggleInStock,
  selectedSize,
  onSelectSize,
  selectedColor,
  onSelectColor,
  onClearAll,
  availableBrands = [],
  availableSizes = [],
  availableColors = [],
}) => {
  const ratings = [4, 3, 2];
  const discounts = [10, 20, 30, 40];

  const hasActiveFilters =
    Boolean(selectedCategory) ||
    Boolean(selectedBrand) ||
    priceRange.min > 0 ||
    priceRange.max < 200000 ||
    Boolean(minRating) ||
    Boolean(minDiscount) ||
    inStockOnly ||
    Boolean(selectedSize) ||
    Boolean(selectedColor);

  return (
    <aside className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <h3 className="font-display font-extrabold text-base text-slate-900">
          Filter Catalog
        </h3>
        {hasActiveFilters && (
          <button
            onClick={onClearAll}
            className="flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-700 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset All
          </button>
        )}
      </div>

      {/* Stock Availability Toggle */}
      <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
        <span className="text-xs font-bold text-slate-800">In Stock Only</span>
        <button
          type="button"
          onClick={() => onToggleInStock(!inStockOnly)}
          className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
            inStockOnly ? 'bg-brand-600 justify-end' : 'bg-slate-300 justify-start'
          }`}
        >
          <div className="w-4 h-4 rounded-full bg-white shadow-md"></div>
        </button>
      </div>

      {/* Categories */}
      {categories.length > 0 && (
        <div>
          <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider mb-2.5">
            Category
          </h4>
          <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
            <button
              onClick={() => onSelectCategory('')}
              className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                !selectedCategory
                  ? 'bg-brand-50 text-brand-600 font-bold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              All Categories
            </button>
            {categories.map((c) => (
              <button
                key={c._id}
                onClick={() => onSelectCategory(c.slug)}
                className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs flex items-center justify-between transition-colors ${
                  selectedCategory === c.slug
                    ? 'bg-brand-50 text-brand-600 font-bold'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span>{c.name}</span>
                {c.productCount !== undefined && (
                  <span className="text-[10px] text-slate-400">({c.productCount})</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Price Range */}
      <div>
        <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider mb-2.5">
          Price Range (INR)
        </h4>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <span className="text-[10px] text-slate-600 block mb-1">Min (₹)</span>
              <input
                type="number"
                min="0"
                value={priceRange.min || ''}
                onChange={(e) => onPriceChange({ ...priceRange, min: Number(e.target.value) || 0 })}
                placeholder="0"
                className="w-full text-xs p-2 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-500"
              />
            </div>
            <span className="text-slate-400 mt-4">-</span>
            <div className="flex-1">
              <span className="text-[10px] text-slate-600 block mb-1">Max (₹)</span>
              <input
                type="number"
                min="0"
                value={!priceRange.max || priceRange.max === 200000 ? '' : priceRange.max}
                onChange={(e) => onPriceChange({ ...priceRange, max: Number(e.target.value) })}
                placeholder="2,00,000"
                className="w-full text-xs p-2 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Brands */}
      {availableBrands.length > 0 && (
        <div>
          <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider mb-2.5">
            Brand
          </h4>
          <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
            <button
              onClick={() => onSelectBrand('')}
              className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                !selectedBrand
                  ? 'bg-brand-50 text-brand-600 font-bold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              All Brands
            </button>
            {availableBrands.map((b) => (
              <button
                key={b}
                onClick={() => onSelectBrand(selectedBrand === b ? '' : b)}
                className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs flex items-center justify-between transition-colors ${
                  selectedBrand === b
                    ? 'bg-brand-50 text-brand-600 font-bold'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span>{b}</span>
                {selectedBrand === b && <Check className="w-3.5 h-3.5 text-brand-600" />}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Minimum Rating */}
      <div>
        <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider mb-2.5">
          Customer Rating
        </h4>
        <div className="space-y-1.5">
          {ratings.map((r) => (
            <button
              key={r}
              onClick={() => onRatingChange(minRating === r ? null : r)}
              className={`w-full text-left px-3 py-1.5 rounded-xl text-xs flex items-center gap-2 border transition-all ${
                minRating === r
                  ? 'border-brand-600 bg-brand-50 text-brand-700 font-bold'
                  : 'border-slate-200 hover:border-slate-300 text-slate-700'
              }`}
            >
              <div className="flex items-center text-amber-400">
                {[...Array(r)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                ))}
              </div>
              <span>& above</span>
            </button>
          ))}
        </div>
      </div>

      {/* Minimum Discount */}
      <div>
        <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider mb-2.5">
          Discount
        </h4>
        <div className="grid grid-cols-2 gap-2">
          {discounts.map((d) => (
            <button
              key={d}
              onClick={() => onDiscountChange(minDiscount === d ? null : d)}
              className={`py-2 px-2.5 rounded-xl text-xs font-bold text-center border transition-all ${
                minDiscount === d
                  ? 'border-brand-600 bg-brand-600 text-white'
                  : 'border-slate-200 hover:border-slate-300 text-slate-700'
              }`}
            >
              {d}% or more
            </button>
          ))}
        </div>
      </div>

      {/* Size Filter */}
      {availableSizes.length > 0 && <div>
        <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider mb-2.5">
          Sizes
        </h4>
        <div className="flex flex-wrap gap-1.5">
          {availableSizes.map((sz) => (
            <button
              key={sz}
              onClick={() => onSelectSize(selectedSize === sz ? '' : sz)}
              aria-pressed={selectedSize === sz}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                selectedSize === sz
                  ? 'border-brand-600 bg-brand-50 text-brand-700 font-bold'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {sz}
            </button>
          ))}
        </div>
      </div>}

      {/* Color Filter */}
      {availableColors.length > 0 && <div>
        <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider mb-2.5">
          Color
        </h4>
        <div className="flex flex-wrap gap-2">
          {availableColors.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => onSelectColor(selectedColor === color ? '' : color)}
              aria-pressed={selectedColor === color}
              className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                selectedColor === color
                  ? 'border-brand-600 bg-brand-50 text-brand-700 font-bold'
                  : 'border-slate-200 text-slate-600 hover:border-slate-400'
              }`}
            >
              {color}
            </button>
          ))}
        </div>
      </div>}
    </aside>
  );
};

export default ProductFilters;
