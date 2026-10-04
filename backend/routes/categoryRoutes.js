const express = require('express');
const router = express.Router();
const {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/categoryController');
const { isAuthenticatedUser, authorizeRoles } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', getCategories);
router.get('/:identifier', getCategory);

// Admin routes
router.post(
  '/',
  isAuthenticatedUser,
  authorizeRoles('admin'),
  upload.single('image'),
  createCategory
);
router.put(
  '/:id',
  isAuthenticatedUser,
  authorizeRoles('admin'),
  upload.single('image'),
  updateCategory
);
router.delete('/:id', isAuthenticatedUser, authorizeRoles('admin'), deleteCategory);

module.exports = router;
