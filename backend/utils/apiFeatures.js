class ApiFeatures {
  constructor(query, queryStr) {
    this.query = query;
    this.queryStr = queryStr;
  }

  // 1. Search across name, brand, SKU, tags, or description
  search() {
    if (this.queryStr.keyword) {
      const keyword = this.queryStr.keyword.trim();
      const regex = new RegExp(keyword, 'i');

      this.query = this.query.find({
        $or: [
          { name: { $regex: regex } },
          { brand: { $regex: regex } },
          { sku: { $regex: regex } },
          { tags: { $in: [regex] } },
          { description: { $regex: regex } },
        ],
      });
    }
    return this;
  }

  // 2. Filter by Category, Brand, Price range, Rating, Discount, Availability, Size, Color
  filter() {
    const queryCopy = { ...this.queryStr };

    // Fields to remove from filter object
    const removeFields = ['keyword', 'page', 'limit', 'sort', 'fields'];
    removeFields.forEach((key) => delete queryCopy[key]);

    // Handle minPrice / maxPrice
    if (queryCopy.minPrice || queryCopy.maxPrice) {
      const priceFilter = {};
      if (queryCopy.minPrice) priceFilter.$gte = Number(queryCopy.minPrice);
      if (queryCopy.maxPrice) priceFilter.$lte = Number(queryCopy.maxPrice);
      this.query = this.query.find({ price: priceFilter });
      delete queryCopy.minPrice;
      delete queryCopy.maxPrice;
    }

    // Handle minRating
    if (queryCopy.minRating) {
      this.query = this.query.find({ rating: { $gte: Number(queryCopy.minRating) } });
      delete queryCopy.minRating;
    }

    // Handle minDiscount
    if (queryCopy.minDiscount) {
      this.query = this.query.find({ discountPercentage: { $gte: Number(queryCopy.minDiscount) } });
      delete queryCopy.minDiscount;
    }

    // Handle inStock filter
    if (queryCopy.inStock === 'true' || queryCopy.inStock === true) {
      this.query = this.query.find({ stock: { $gt: 0 } });
      delete queryCopy.inStock;
    }

    // Handle multiple brands or categories if passed as comma separated
    if (queryCopy.brand && typeof queryCopy.brand === 'string') {
      const brands = queryCopy.brand.split(',').map((b) => b.trim());
      if (brands.length > 1) {
        this.query = this.query.find({ brand: { $in: brands } });
        delete queryCopy.brand;
      }
    }

    if (queryCopy.category && typeof queryCopy.category === 'string') {
      const categories = queryCopy.category.split(',').map((c) => c.trim());
      if (categories.length > 1) {
        this.query = this.query.find({ category: { $in: categories } });
        delete queryCopy.category;
      }
    }

    // Handle size variant
    if (queryCopy.size) {
      this.query = this.query.find({ 'variants.sizes': queryCopy.size });
      delete queryCopy.size;
    }

    // Handle color variant
    if (queryCopy.color) {
      this.query = this.query.find({ 'variants.colors.name': new RegExp(queryCopy.color, 'i') });
      delete queryCopy.color;
    }

    // Advanced filtering for gte, gt, lte, lt
    let queryStr = JSON.stringify(queryCopy);
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte)\b/g, (match) => `$${match}`);

    this.query = this.query.find(JSON.parse(queryStr));
    return this;
  }

  // 3. Sorting (low-to-high, high-to-low, newest, rating, popularity, discount)
  sort() {
    if (this.queryStr.sort) {
      let sortBy = this.queryStr.sort;
      switch (sortBy) {
        case 'price-asc':
        case 'price_asc':
          this.query = this.query.sort('price');
          break;
        case 'price-desc':
        case 'price_desc':
          this.query = this.query.sort('-price');
          break;
        case 'newest':
          this.query = this.query.sort('-createdAt');
          break;
        case 'rating':
        case 'highest-rated':
          this.query = this.query.sort('-rating -numReviews');
          break;
        case 'popular':
        case 'bestseller':
          this.query = this.query.sort('-isBestseller -numReviews');
          break;
        case 'discount':
        case 'highest-discount':
          this.query = this.query.sort('-discountPercentage');
          break;
        default:
          const sorts = sortBy.split(',').join(' ');
          this.query = this.query.sort(sorts);
          break;
      }
    } else {
      // Default: newest first
      this.query = this.query.sort('-createdAt');
    }
    return this;
  }

  // 4. Server-Side Pagination
  pagination(resPerPage) {
    const currentPage = Number(this.queryStr.page) || 1;
    const limit = Number(this.queryStr.limit) || resPerPage;
    const skip = limit * (currentPage - 1);

    this.query = this.query.limit(limit).skip(skip);
    return this;
  }
}

module.exports = ApiFeatures;
