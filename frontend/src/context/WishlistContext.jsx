import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';
import { useCart } from './CartContext';
import { useToast } from './ToastContext';

const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const { showToast } = useToast();

  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchWishlist = useCallback(async () => {
    if (isAuthenticated) {
      try {
        setLoading(true);
        const res = await api.get('/wishlist');
        if (res.data.success) {
          setWishlist(res.data.wishlist || []);
        }
      } catch (err) {
        console.error('Error fetching wishlist:', err.message);
      } finally {
        setLoading(false);
      }
    } else {
      const guestWishlist = localStorage.getItem('shopnest_guest_wishlist');
      if (guestWishlist) {
        try {
          setWishlist(JSON.parse(guestWishlist));
        } catch (e) {}
      }
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const isInWishlist = useCallback(
    (productId) => {
      return wishlist.some((item) => (item._id || item) === productId);
    },
    [wishlist]
  );

  const toggleWishlist = async (product) => {
    const exists = isInWishlist(product._id);

    if (isAuthenticated) {
      try {
        if (exists) {
          await api.delete(`/wishlist/${product._id}`);
          setWishlist((prev) => prev.filter((p) => p._id !== product._id));
          showToast(`Removed "${product.name}" from wishlist`, 'info');
        } else {
          await api.post('/wishlist', { productId: product._id });
          setWishlist((prev) => [product, ...prev]);
          showToast(`Saved "${product.name}" to wishlist!`, 'success');
        }
      } catch (error) {
        showToast(error.message, 'error');
      }
    } else {
      // Guest wishlist
      let updated;
      if (exists) {
        updated = wishlist.filter((p) => p._id !== product._id);
        showToast(`Removed "${product.name}" from wishlist`, 'info');
      } else {
        updated = [product, ...wishlist];
        showToast(`Saved "${product.name}" to wishlist!`, 'success');
      }
      setWishlist(updated);
      localStorage.setItem('shopnest_guest_wishlist', JSON.stringify(updated));
    }
  };

  const removeFromWishlist = async (productId) => {
    if (isAuthenticated) {
      try {
        await api.delete(`/wishlist/${productId}`);
        setWishlist((prev) => prev.filter((p) => p._id !== productId));
        showToast('Item removed from wishlist', 'info');
      } catch (error) {
        showToast(error.message, 'error');
      }
    } else {
      const updated = wishlist.filter((p) => p._id !== productId);
      setWishlist(updated);
      localStorage.setItem('shopnest_guest_wishlist', JSON.stringify(updated));
      showToast('Item removed from wishlist', 'info');
    }
  };

  const moveToCart = async (product) => {
    const success = await addToCart(product, 1);
    if (success) {
      await removeFromWishlist(product._id);
      showToast(`Moved "${product.name}" to cart!`, 'success');
    }
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        wishlistCount: wishlist.length,
        loading,
        isInWishlist,
        toggleWishlist,
        removeFromWishlist,
        moveToCart,
        refreshWishlist: fetchWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};
