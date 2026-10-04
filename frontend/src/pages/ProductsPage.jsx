import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Filter,
  SlidersHorizontal,
  Grid,
  List,
  Search,
  X,
  PackageSearch,
  RotateCcw,
} from 'lucide-react';
import api from '../services/api';
import ProductCard from '../components/product/ProductCard';
import ProductFilters from '../components/product/ProductFilters';
import QuickViewModal from '../components/product/QuickViewModal';
import SkeletonCard from '../components/common/SkeletonCard';
import Pagination from '../components/common/Pagination';

const ProductsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [availableBrands, setAvailableBrands] = useState([]);
  const [availableSizes, setAvailableSizes] = useState([]);
  const [availableColors, setAvailableColors] = useState([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(Number(searchParams.get('page')) || 1);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [viewMode, setViewMode] = useState('grid');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState(null);

  // Active Filter States synced with URL query params
  const keyword = searchParams.get('keyword') || '';
  const selectedCategory = searchParams.get('category') || '';
  const selectedBrand = searchParams.get('brand') || '';
  const sort = searchParams.get('sort') || 'newest';
  const minRating = searchParams.get('minRating') ? Number(searchParams.get('minRating')) : null;
  const minDiscount = searchParams.get('minDiscount') ? Number(searchParams.get('minDiscount')) : null;
  const inStockOnly = searchParams.get('inStock') === 'true';
  const selectedSize = searchParams.get('size') || '';
  const selectedColor = searchParams.get('color') || '';
  const priceRange = {
    min: Number(searchParams.get('minPrice')) || 0,
    max: Number(searchParams.get('maxPrice')) || 200000,
  };

  // Fetch categories on mount
  useEffect(() => {
    const fetchCatalogOptions = async () => {
      const [categoriesResult, filtersResult] = await Promise.allSettled([
        api.get('/categories'),
        api.get('/products/filters'),
      ]);

      if (categoriesResult.status === 'fulfilled' && categoriesResult.value.data.success) {
        setCategories(categoriesResult.value.data.categories || []);
      } else if (categoriesResult.status === 'rejected') {
        console.error('Failed to load product categories:', categoriesResult.reason.message);
      }

      if (filtersResult.status === 'fulfilled' && filtersResult.value.data.success) {
        const filters = filtersResult.value.data.filters || {};
        setAvailableBrands(filters.brands || []);
        setAvailableSizes(filters.sizes || []);
        setAvailableColors(filters.colors || []);
      } else if (filtersResult.status === 'rejected') {
        console.error('Failed to load product filter options:', filtersResult.reason.message);
      }
    };
    fetchCatalogOptions();
  }, []);

  // Fetch Products based on URL query
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError('');

      const params = new URLSearchParams(searchParams);
      if (!params.get('page')) params.set('page', '1');
      if (!params.get('limit')) params.set('limit', '12');

      const res = await api.get(`/products?${params.toString()}`);
      if (res.data.success) {
        setProducts(res.data.products || []);
        setTotalProducts(res.data.totalProducts || 0);
        setTotalPages(res.data.totalPages || 1);
        setCurrentPage(res.data.page || 1);

      }
    } catch (error) {
      setLoadError(error.message || 'Could not load products. Please try again.');
      console.error('Failed to load products:', error.message);
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchProducts();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [fetchProducts]);

  // Helper to update query params
  const updateQueryParam = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value === null || value === '' || value === undefined) {
      newParams.delete(key);
    } else {
      newParams.set(key, String(value));
    }
    newParams.set('page', '1'); // reset to page 1 on filter change
    setSearchParams(newParams);
  };

  const handlePriceChange = ({ min, max }) => {
    const newParams = new URLSearchParams(searchParams);
    if (min > 0) newParams.set('minPrice', String(min));
    else newParams.delete('minPrice');

    if (max > 0 && max < 200000) newParams.set('maxPrice', String(max));
    else newParams.delete('maxPrice');

    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const handleClearAll = () => {
    setSearchParams(new URLSearchParams());
  };

  const handlePageChange = (page) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', String(page));
    setSearchParams(newParams);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Breadcrumb & Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-slate-900 tracking-tight">
            {keyword
              ? `Results for "${keyword}"`
              : selectedCategory
              ? `${selectedCategory.toUpperCase()} Catalog`
              : 'Explore All Products'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Showing {totalProducts} {totalProducts === 1 ? 'item' : 'items'} available for delivery
          </p>
        </div>

        {/* Controls: Sort and Grid/List view */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Mobile Filter Button */}
          <button
            onClick={() => setIsMobileFilterOpen(true)}
            className="lg:hidden flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs font-bold text-slate-800 shadow-sm"
          >
            <SlidersHorizontal className="w-4 h-4 text-brand-600" />
            Filters
          </button>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-2xl px-3 py-2 text-xs font-medium text-slate-700 shadow-sm">
            <span className="text-slate-400 hidden sm:inline">Sort By:</span>
            <select
              value={sort}
              onChange={(e) => updateQueryParam('sort', e.target.value)}
              className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="newest">Newest Arrivals</option>
              <option value="popular">Most Popular</option>
              <option value="rating">Highest Rated</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="discount">Highest Discount</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="hidden sm:flex items-center bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'grid' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
              }`}
              title="Grid View"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'list' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
              }`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Active Filter Tags */}
      {(keyword || selectedCategory || selectedBrand || selectedSize || selectedColor || minRating || minDiscount || inStockOnly) && (
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <span className="text-xs font-bold text-slate-400">Active Filters:</span>
          {keyword && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-brand-50 text-brand-700 text-xs font-semibold">
              Keyword: "{keyword}"
              <button onClick={() => updateQueryParam('keyword', '')}><X className="w-3.5 h-3.5" /></button>
            </span>
          )}
          {selectedCategory && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-brand-50 text-brand-700 text-xs font-semibold">
              Category: {selectedCategory}
              <button onClick={() => updateQueryParam('category', '')}><X className="w-3.5 h-3.5" /></button>
            </span>
          )}
          {selectedBrand && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-brand-50 text-brand-700 text-xs font-semibold">
              Brand: {selectedBrand}
              <button onClick={() => updateQueryParam('brand', '')}><X className="w-3.5 h-3.5" /></button>
            </span>
          )}
          {selectedSize && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-brand-50 text-brand-700 text-xs font-semibold">
              Size: {selectedSize}
              <button onClick={() => updateQueryParam('size', '')}><X className="w-3.5 h-3.5" /></button>
            </span>
          )}
          {selectedColor && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-brand-50 text-brand-700 text-xs font-semibold">
              Color: {selectedColor}
              <button onClick={() => updateQueryParam('color', '')} aria-label="Remove color filter"><X className="w-3.5 h-3.5" /></button>
            </span>
          )}
          {minRating && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-50 text-amber-800 text-xs font-semibold">
              Rating: {minRating}★+
              <button onClick={() => updateQueryParam('minRating', '')}><X className="w-3.5 h-3.5" /></button>
            </span>
          )}
          {minDiscount && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-50 text-rose-700 text-xs font-semibold">
              Discount: {minDiscount}%+
              <button onClick={() => updateQueryParam('minDiscount', '')} aria-label="Remove discount filter"><X className="w-3.5 h-3.5" /></button>
            </span>
          )}
          {inStockOnly && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-semibold">
              In stock
              <button onClick={() => updateQueryParam('inStock', '')} aria-label="Remove in-stock filter"><X className="w-3.5 h-3.5" /></button>
            </span>
          )}
          <button
            onClick={handleClearAll}
            className="text-xs font-bold text-rose-600 hover:underline ml-2"
          >
            Clear All
          </button>
        </div>
      )}

      {/* Main Grid: Sidebar + Products */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Desktop Sidebar Filter */}
        <div className="hidden lg:block lg:col-span-1">
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-card sticky top-28">
            <ProductFilters
              categories={categories}
              selectedCategory={selectedCategory}
              onSelectCategory={(slug) => updateQueryParam('category', slug)}
              selectedBrand={selectedBrand}
              onSelectBrand={(b) => updateQueryParam('brand', b)}
              priceRange={priceRange}
              onPriceChange={handlePriceChange}
              minRating={minRating}
              onRatingChange={(r) => updateQueryParam('minRating', r)}
              minDiscount={minDiscount}
              onDiscountChange={(d) => updateQueryParam('minDiscount', d)}
              inStockOnly={inStockOnly}
              onToggleInStock={(v) => updateQueryParam('inStock', v ? 'true' : '')}
              selectedSize={selectedSize}
              onSelectSize={(sz) => updateQueryParam('size', sz)}
              selectedColor={selectedColor}
              onSelectColor={(c) => updateQueryParam('color', c)}
              onClearAll={handleClearAll}
              availableBrands={availableBrands}
              availableSizes={availableSizes}
              availableColors={availableColors}
            />
          </div>
        </div>

        {/* Product Cards Container */}
        <div className="lg:col-span-3">
          {loading ? (
            <div className="grid grid-cols-1 min-[300px]:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6">
              {[...Array(6)].map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : loadError ? (
            <div className="mx-auto my-12 max-w-md rounded-3xl border border-rose-100 bg-white p-10 text-center shadow-card">
              <h3 className="font-display text-xl font-black text-slate-900">Products couldn’t load</h3>
              <p className="mt-2 text-sm text-slate-500">{loadError}</p>
              <button
                type="button"
                onClick={fetchProducts}
                className="mt-5 rounded-xl bg-brand-600 px-5 py-3 text-xs font-extrabold text-white hover:bg-brand-700"
              >
                Try again
              </button>
            </div>
          ) : products.length > 0 ? (
            <div>
              <div
                className={
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 min-[300px]:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6'
                    : 'space-y-4'
                }
              >
                {products.map((product) => (
                  <ProductCard
                    key={product._id}
                    product={product}
                    viewMode={viewMode}
                    onQuickView={(p) => setQuickViewProduct(p)}
                  />
                ))}
              </div>

              {/* Server-Side Pagination */}
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          ) : (
            /* No Results Empty State */
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-card max-w-md mx-auto my-12">
              <div className="w-16 h-16 rounded-3xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto mb-4">
                <PackageSearch className="w-8 h-8" />
              </div>
              <h3 className="font-display font-black text-xl text-slate-900 mb-2">
                No matching products found
              </h3>
              <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                We couldn't find any products matching your specific filters or keyword. Try adjusting your search query or reset filters.
              </p>
              <button
                onClick={handleClearAll}
                className="inline-flex items-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Reset All Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Filters Slide-over Modal */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm lg:hidden flex justify-end">
          <div className="w-full max-w-xs bg-white h-full p-6 overflow-y-auto animate-slideLeft">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <h3 className="font-display font-extrabold text-base text-slate-900">
                Filters
              </h3>
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <ProductFilters
              categories={categories}
              selectedCategory={selectedCategory}
              onSelectCategory={(slug) => {
                updateQueryParam('category', slug);
                setIsMobileFilterOpen(false);
              }}
              selectedBrand={selectedBrand}
              onSelectBrand={(b) => {
                updateQueryParam('brand', b);
                setIsMobileFilterOpen(false);
              }}
              priceRange={priceRange}
              onPriceChange={handlePriceChange}
              minRating={minRating}
              onRatingChange={(r) => {
                updateQueryParam('minRating', r);
                setIsMobileFilterOpen(false);
              }}
              minDiscount={minDiscount}
              onDiscountChange={(d) => {
                updateQueryParam('minDiscount', d);
                setIsMobileFilterOpen(false);
              }}
              inStockOnly={inStockOnly}
              onToggleInStock={(v) => {
                updateQueryParam('inStock', v ? 'true' : '');
                setIsMobileFilterOpen(false);
              }}
              selectedSize={selectedSize}
              onSelectSize={(sz) => {
                updateQueryParam('size', sz);
                setIsMobileFilterOpen(false);
              }}
              selectedColor={selectedColor}
              onSelectColor={(c) => {
                updateQueryParam('color', c);
                setIsMobileFilterOpen(false);
              }}
              onClearAll={() => {
                handleClearAll();
                setIsMobileFilterOpen(false);
              }}
              availableBrands={availableBrands}
              availableSizes={availableSizes}
              availableColors={availableColors}
            />
          </div>
        </div>
      )}

      {/* Quick View Modal */}
      <QuickViewModal
        product={quickViewProduct}
        isOpen={Boolean(quickViewProduct)}
        onClose={() => setQuickViewProduct(null)}
      />
    </div>
  );
};

export default ProductsPage;
