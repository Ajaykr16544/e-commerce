const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductFilters,
  getProductDetails,
  getSearchSuggestions,
  getFeaturedProducts,
  getBestsellers,
  getNewArrivals,
  getRelatedProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getAdminProducts,
} = require('../controllers/productController');
const { isAuthenticatedUser, authorizeRoles } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Public routes
router.get('/', getProducts);
router.get('/featured', getFeaturedProducts);
router.get('/bestsellers', getBestsellers);
router.get('/new-arrivals', getNewArrivals);
router.get('/filters', getProductFilters);
router.get('/search/suggestions', getSearchSuggestions);
router.get('/:identifier', getProductDetails);
router.get('/:id/related', getRelatedProducts);

// Admin routes
router.get('/admin/all', isAuthenticatedUser, authorizeRoles('admin'), getAdminProducts);
router.post(
  '/',
  isAuthenticatedUser,
  authorizeRoles('admin'),
  upload.array('images', 8),
  createProduct
);
router.put(
  '/:id',
  isAuthenticatedUser,
  authorizeRoles('admin'),
  upload.array('images', 8),
  updateProduct
);
router.delete('/:id', isAuthenticatedUser, authorizeRoles('admin'), deleteProduct);

module.exports = router;
