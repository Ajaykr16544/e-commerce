import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const { showToast } = useToast();

  const [cart, setCart] = useState({
    items: [],
    itemCount: 0,
    subtotal: 0,
    discount: 0,
    shipping: 0,
    tax: 0,
    grandTotal: 0,
    coupon: null,
  });
  const [loading, setLoading] = useState(false);

  // Load cart from backend when authenticated, or from localStorage for guests
  const fetchCart = useCallback(async () => {
    if (isAuthenticated) {
      try {
        setLoading(true);
        const res = await api.get('/cart');
        if (res.data.success) {
          setCart(res.data.cart);
        }
      } catch (err) {
        console.error('Error fetching cart:', err.message);
      } finally {
        setLoading(false);
      }
    } else {
      // LocalStorage guest cart
      const guestCart = localStorage.getItem('shopnest_guest_cart');
      if (guestCart) {
        try {
          const parsed = JSON.parse(guestCart);
          setCart(parsed);
        } catch (e) {}
      }
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart, user?._id]);

  // Add to cart
  const addToCart = async (product, quantity = 1, size = '', color = '') => {
    const price = product.discountPrice || product.price;

    if (isAuthenticated) {
      try {
        const res = await api.post('/cart', {
          productId: product._id,
          quantity,
          size,
          color,
        });
        if (res.data.success) {
          setCart(res.data.cart);
          showToast(`Added "${product.name}" to cart!`, 'success');
          return true;
        }
      } catch (error) {
        showToast(error.message, 'error');
        return false;
      }
    } else {
      // Guest add to cart
      let currentItems = [...cart.items];
      const existingIdx = currentItems.findIndex(
        (i) => i.product._id === product._id && i.size === size && i.color === color
      );

      if (existingIdx > -1) {
        currentItems[existingIdx].quantity += quantity;
      } else {
        currentItems.push({
          _id: 'guest_' + Date.now() + Math.random(),
          product,
          quantity,
          size,
          color,
          price,
          itemTotal: price * quantity,
        });
      }

      const subtotal = currentItems.reduce(
        (acc, item) => acc + (item.product.discountPrice || item.product.price) * item.quantity,
        0
      );
      const shipping = subtotal > 999 || subtotal === 0 ? 0 : 99;
      const tax = Math.round(subtotal * 0.05);
      const grandTotal = subtotal + shipping + tax;

      const newCart = {
        items: currentItems,
        itemCount: currentItems.reduce((acc, i) => acc + i.quantity, 0),
        subtotal,
        discount: 0,
        shipping,
        tax,
        grandTotal,
        coupon: null,
      };

      setCart(newCart);
      localStorage.setItem('shopnest_guest_cart', JSON.stringify(newCart));
      showToast(`Added "${product.name}" to cart!`, 'success');
      return true;
    }
  };

  // Update item quantity
  const updateQuantity = async (itemId, quantity) => {
    if (quantity < 1) return;

    if (isAuthenticated) {
      try {
        const res = await api.put(`/cart/item/${itemId}`, { quantity });
        if (res.data.success) {
          setCart(res.data.cart);
        }
      } catch (error) {
        showToast(error.message, 'error');
      }
    } else {
      const updatedItems = cart.items.map((item) =>
        item._id === itemId
          ? { ...item, quantity, itemTotal: item.price * quantity }
          : item
      );

      const subtotal = updatedItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
      const shipping = subtotal > 999 || subtotal === 0 ? 0 : 99;
      const tax = Math.round(subtotal * 0.05);

      const updated = {
        ...cart,
        items: updatedItems,
        itemCount: updatedItems.reduce((acc, i) => acc + i.quantity, 0),
        subtotal,
        shipping,
        tax,
        grandTotal: subtotal + shipping + tax,
      };

      setCart(updated);
      localStorage.setItem('shopnest_guest_cart', JSON.stringify(updated));
    }
  };

  // Remove from cart
  const removeFromCart = async (itemId) => {
    if (isAuthenticated) {
      try {
        const res = await api.delete(`/cart/item/${itemId}`);
        if (res.data.success) {
          setCart(res.data.cart);
          showToast('Item removed from cart', 'info');
        }
      } catch (error) {
        showToast(error.message, 'error');
      }
    } else {
      const filtered = cart.items.filter((item) => item._id !== itemId);
      const subtotal = filtered.reduce((acc, item) => acc + item.price * item.quantity, 0);
      const shipping = subtotal > 999 || subtotal === 0 ? 0 : 99;
      const tax = Math.round(subtotal * 0.05);

      const updated = {
        ...cart,
        items: filtered,
        itemCount: filtered.reduce((acc, i) => acc + i.quantity, 0),
        subtotal,
        shipping,
        tax,
        grandTotal: subtotal + shipping + tax,
      };

      setCart(updated);
      localStorage.setItem('shopnest_guest_cart', JSON.stringify(updated));
      showToast('Item removed from cart', 'info');
    }
  };

  // Clear cart
  const clearCart = async () => {
    if (isAuthenticated) {
      try {
        await api.delete('/cart');
      } catch (e) {}
    }
    const empty = {
      items: [],
      itemCount: 0,
      subtotal: 0,
      discount: 0,
      shipping: 0,
      tax: 0,
      grandTotal: 0,
      coupon: null,
    };
    setCart(empty);
    localStorage.removeItem('shopnest_guest_cart');
  };

  // Apply Coupon
  const applyCoupon = async (code) => {
    if (!isAuthenticated) {
      showToast('Please log in to apply coupons', 'warning');
      return false;
    }
    try {
      const res = await api.post('/cart/coupon', { code });
      if (res.data.success) {
        setCart(res.data.cart);
        showToast(res.data.message, 'success');
        return true;
      }
    } catch (error) {
      showToast(error.message, 'error');
      return false;
    }
  };

  // Remove Coupon
  const removeCoupon = async () => {
    if (isAuthenticated) {
      try {
        const res = await api.delete('/cart/coupon');
        if (res.data.success) {
          setCart(res.data.cart);
          showToast(res.data.message, 'info');
        }
      } catch (error) {
        showToast(error.message, 'error');
      }
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        applyCoupon,
        removeCoupon,
        refreshCart: fetchCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
