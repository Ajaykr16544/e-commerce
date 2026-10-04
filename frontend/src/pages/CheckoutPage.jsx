import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  MapPin,
  Truck,
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  Plus,
  ArrowRight,
  ChevronLeft,
  Lock,
  Sparkles,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { formatPrice } from '../utils/formatters';

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { cart, clearCart } = useCart();
  const { showToast } = useToast();

  const [step, setStep] = useState(1); // 1: Address, 2: Delivery, 3: Payment

  // Address State
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [showNewAddressModal, setShowNewAddressModal] = useState(false);
  const [newAddress, setNewAddress] = useState({
    fullName: user?.name || '',
    phone: user?.phone || '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
    addressType: 'Home',
  });

  // Delivery & Payment Method
  const [deliveryOption, setDeliveryOption] = useState('express'); // 'express' or 'standard'
  const [paymentMethod, setPaymentMethod] = useState('Razorpay'); // 'Razorpay' or 'COD'
  const [isProcessing, setIsProcessing] = useState(false);

  // Require login for checkout
  useEffect(() => {
    if (!isAuthenticated) {
      showToast('Please log in to proceed with checkout', 'info');
      navigate('/login?redirect=checkout');
    }
  }, [isAuthenticated, navigate]);

  // Redirect if cart is empty
  useEffect(() => {
    if (!cart.items || cart.items.length === 0) {
      navigate('/cart');
    }
  }, [cart.items, navigate]);

  // Fetch user addresses
  useEffect(() => {
    const fetchAddresses = async () => {
      if (isAuthenticated) {
        try {
          const res = await api.get('/users/addresses');
          if (res.data.success) {
            const list = res.data.addresses || [];
            setAddresses(list);
            const defaultAddr = list.find((a) => a.isDefault) || list[0];
            if (defaultAddr) setSelectedAddressId(defaultAddr._id);
          }
        } catch (e) {}
      }
    };
    fetchAddresses();
  }, [isAuthenticated]);

  const handleAddNewAddress = async (e) => {
    e.preventDefault();
    if (!newAddress.fullName || !newAddress.phone || !newAddress.address || !newAddress.pincode) {
      showToast('Please fill all required address fields', 'warning');
      return;
    }

    try {
      const res = await api.post('/users/addresses', newAddress);
      if (res.data.success) {
        setAddresses([res.data.address, ...addresses]);
        setSelectedAddressId(res.data.address._id);
        setShowNewAddressModal(false);
        showToast('Address saved successfully!', 'success');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Compute final charges based on delivery method
  const shippingCharge = deliveryOption === 'express' ? 0 : cart.shipping;
  const grandTotal = Math.max(0, cart.subtotal - cart.discount + shippingCharge + cart.tax);

  // Trigger Order Creation & Payment Gateway
  const handlePlaceOrder = async () => {
    const activeAddress = addresses.find((a) => a._id === selectedAddressId);
    if (!activeAddress) {
      showToast('Please select or add a delivery address', 'warning');
      setStep(1);
      return;
    }

    setIsProcessing(true);

    try {
      const orderItems = cart.items.map((i) => ({
        product: i.product._id,
        name: i.product.name,
        image: i.product.images?.[0]?.url || '',
        price: i.price,
        quantity: i.quantity,
        size: i.size,
        color: i.color,
      }));

      const orderData = {
        items: orderItems,
        shippingAddress: {
          fullName: activeAddress.fullName,
          phone: activeAddress.phone,
          address: activeAddress.address,
          city: activeAddress.city,
          state: activeAddress.state,
          pincode: activeAddress.pincode,
          country: activeAddress.country || 'India',
        },
        paymentMethod,
        itemsPrice: cart.subtotal,
        discountAmount: cart.discount,
        couponCode: cart.coupon?.code || '',
        shippingPrice: shippingCharge,
        taxPrice: cart.tax,
        totalPrice: grandTotal,
      };

      if (paymentMethod === 'COD') {
        // Direct COD Order Creation
        const res = await api.post('/orders', orderData);
        if (res.data.success) {
          clearCart();
          showToast('Order placed successfully!', 'success');
          navigate(`/order-success/${res.data.order._id}`);
        }
      } else {
        // Razorpay Online Flow
        const payOrderRes = await api.post('/payments/create', { amount: grandTotal });
        const { order: rzpOrder } = payOrderRes.data;

        // If simulated or test mode without popup blocking
        if (rzpOrder.isSimulated || !window.Razorpay) {
          // Complete verified order simulation
          const verifyRes = await api.post('/payments/verify', {
            razorpayOrderId: rzpOrder.id,
            razorpayPaymentId: 'pay_mock_' + Math.random().toString(36).substring(2, 10),
            razorpaySignature: 'simulated_valid_signature',
          });

          if (verifyRes.data.success) {
            orderData.paymentDetails = {
              razorpayOrderId: rzpOrder.id,
              razorpayPaymentId: 'pay_mock_' + Math.random().toString(36).substring(2, 10),
              razorpaySignature: 'simulated_valid_signature',
            };

            const createdOrderRes = await api.post('/orders', orderData);
            clearCart();
            showToast('Payment verified! Order placed successfully.', 'success');
            navigate(`/order-success/${createdOrderRes.data.order._id}`);
          }
        } else {
          // Standard live Razorpay popup
          const options = {
            key: rzpOrder.keyId,
            amount: rzpOrder.amount,
            currency: 'INR',
            name: 'ShopNest Store',
            description: 'Order Checkout Payment',
            order_id: rzpOrder.id,
            handler: async (response) => {
              try {
                await api.post('/payments/verify', {
                  razorpayOrderId: response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature,
                });

                orderData.paymentDetails = {
                  razorpayOrderId: response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature,
                };

                const res = await api.post('/orders', orderData);
                clearCart();
                navigate(`/order-success/${res.data.order._id}`);
              } catch (err) {
                showToast('Payment verification failed: ' + err.message, 'error');
              }
            },
            prefill: {
              name: user?.name,
              email: user?.email,
              contact: user?.phone || activeAddress.phone,
            },
            theme: { color: '#4F46E5' },
          };

          const rzp = new window.Razorpay(options);
          rzp.open();
        }
      }
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Checkout Progress Stepper */}
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between relative">
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-200 -translate-y-1/2 z-0" />
          <div
            className="absolute top-1/2 left-0 h-0.5 bg-brand-600 -translate-y-1/2 z-0 transition-all duration-300"
            style={{ width: step === 1 ? '0%' : step === 2 ? '50%' : '100%' }}
          />

          {/* Step 1 */}
          <button
            onClick={() => setStep(1)}
            className="relative z-10 flex flex-col items-center gap-1.5 focus:outline-none"
          >
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${
                step >= 1 ? 'bg-brand-600 text-white shadow-md' : 'bg-slate-200 text-slate-500'
              }`}
            >
              1
            </div>
            <span className="text-xs font-bold text-slate-800">Address</span>
          </button>

          {/* Step 2 */}
          <button
            onClick={() => selectedAddressId && setStep(2)}
            className="relative z-10 flex flex-col items-center gap-1.5 focus:outline-none"
          >
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${
                step >= 2 ? 'bg-brand-600 text-white shadow-md' : 'bg-slate-200 text-slate-500'
              }`}
            >
              2
            </div>
            <span className="text-xs font-bold text-slate-800">Delivery</span>
          </button>

          {/* Step 3 */}
          <button
            onClick={() => selectedAddressId && setStep(3)}
            className="relative z-10 flex flex-col items-center gap-1.5 focus:outline-none"
          >
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${
                step >= 3 ? 'bg-brand-600 text-white shadow-md' : 'bg-slate-200 text-slate-500'
              }`}
            >
              3
            </div>
            <span className="text-xs font-bold text-slate-800">Payment</span>
          </button>
        </div>
      </div>

      {/* Main Form & Summary Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
        
        {/* Left Column: Multi-Step Forms */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* STEP 1: Address Selection */}
          {step === 1 && (
            <div className="p-4 sm:p-6 rounded-3xl bg-white border border-slate-100 shadow-card space-y-6 animate-fadeIn">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <h3 className="font-display font-black text-base sm:text-lg text-slate-900 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-brand-600" /> Select Delivery Address
                </h3>
                <button
                  type="button"
                  onClick={() => setShowNewAddressModal(true)}
                  className="px-3 py-2 bg-brand-50 hover:bg-brand-100 text-brand-700 text-[11px] sm:text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-4 h-4" /> Add New Address
                </button>
              </div>

              {/* Saved Addresses List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {addresses.map((addr) => (
                  <div
                    key={addr._id}
                    onClick={() => setSelectedAddressId(addr._id)}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                      selectedAddressId === addr._id
                        ? 'border-brand-600 bg-brand-50/40 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-xs text-slate-900">{addr.fullName}</span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-extrabold uppercase">
                        {addr.addressType || 'Home'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed mb-2">
                      {addr.address}, {addr.city}, {addr.state} - {addr.pincode}
                    </p>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Phone: {addr.phone}
                    </p>
                  </div>
                ))}
              </div>

              {addresses.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-xs text-slate-500 mb-3">No saved addresses found.</p>
                  <button
                    onClick={() => setShowNewAddressModal(true)}
                    className="px-5 py-2.5 bg-brand-600 text-white rounded-xl text-xs font-bold"
                  >
                    Add Address Now
                  </button>
                </div>
              )}

              {/* Step 1 Next button */}
              {addresses.length > 0 && (
                <div className="pt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    disabled={!selectedAddressId}
                    className="px-6 py-3 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-md transition-colors"
                  >
                    Continue to Delivery <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Delivery Options */}
          {step === 2 && (
            <div className="p-4 sm:p-6 rounded-3xl bg-white border border-slate-100 shadow-card space-y-6 animate-fadeIn">
              <div className="pb-3 border-b border-slate-100">
                <h3 className="font-display font-black text-lg text-slate-900 flex items-center gap-2">
                  <Truck className="w-5 h-5 text-brand-600" /> Choose Delivery Method
                </h3>
              </div>

              <div className="space-y-3">
                <div
                  onClick={() => setDeliveryOption('express')}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                    deliveryOption === 'express'
                      ? 'border-brand-600 bg-brand-50/40 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-100 text-brand-600 flex items-center justify-center shrink-0">
                      <Truck className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-900">
                        Express Delivery (Guaranteed 24-48 Hours)
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Dispatched immediately via BlueDart / Delhivery Priority Air.
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-extrabold text-emerald-600 uppercase">
                    Free
                  </span>
                </div>

                <div
                  onClick={() => setDeliveryOption('standard')}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                    deliveryOption === 'standard'
                      ? 'border-brand-600 bg-brand-50/40 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                      <Truck className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-900">
                        Standard Surface Delivery (3-5 Business Days)
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Standard surface road logistics shipping.
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-slate-700">
                    {cart.shipping === 0 ? 'Free' : formatPrice(cart.shipping)}
                  </span>
                </div>
              </div>

              <div className="pt-4 flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-1.5"
                >
                  <ChevronLeft className="w-4 h-4" /> Back to Address
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-md transition-colors"
                >
                  Continue to Payment <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Payment Method */}
          {step === 3 && (
            <div className="p-4 sm:p-6 rounded-3xl bg-white border border-slate-100 shadow-card space-y-6 animate-fadeIn">
              <div className="pb-3 border-b border-slate-100">
                <h3 className="font-display font-black text-lg text-slate-900 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-brand-600" /> Select Payment Option
                </h3>
              </div>

              <div className="space-y-3">
                {/* Razorpay Gateway */}
                <div
                  onClick={() => setPaymentMethod('Razorpay')}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-4 ${
                    paymentMethod === 'Razorpay'
                      ? 'border-brand-600 bg-brand-50/40 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center shrink-0">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-xs text-slate-900">
                        Online Payment (UPI, Cards, NetBanking, Wallets)
                      </h4>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-extrabold">
                        Recommended
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Instant secure verification powered by Razorpay India. Zero transaction fees.
                    </p>
                  </div>
                </div>

                {/* Cash on Delivery */}
                <div
                  onClick={() => setPaymentMethod('COD')}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-4 ${
                    paymentMethod === 'COD'
                      ? 'border-brand-600 bg-brand-50/40 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-800 text-white flex items-center justify-center shrink-0">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-xs text-slate-900">
                      Cash on Delivery (COD)
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Pay in cash or UPI QR scan at your doorstep upon order delivery.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex flex-wrap justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-1.5"
                >
                  <ChevronLeft className="w-4 h-4" /> Back to Delivery
                </button>

                <button
                  type="button"
                  onClick={handlePlaceOrder}
                  disabled={isProcessing}
                  className="px-4 sm:px-8 py-3.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-[11px] sm:text-xs font-black rounded-xl flex items-center gap-2 shadow-xl shadow-brand-500/25 transition-transform hover:scale-105"
                >
                  {isProcessing
                    ? 'Processing Order...'
                    : paymentMethod === 'COD'
                    ? 'Confirm Order with COD'
                    : `Pay ${formatPrice(grandTotal)} Now`}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Order Summary Preview */}
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-card space-y-4">
            <h3 className="font-display font-black text-base text-slate-900">
              Order Review ({cart.itemCount})
            </h3>

            {/* Items snippet */}
            <div className="space-y-3 max-h-56 overflow-y-auto pr-1 border-b border-slate-100 pb-4">
              {cart.items.map((item) => (
                <div key={item._id} className="flex items-center gap-3">
                  <img
                    src={item.product?.images?.[0]?.url}
                    alt=""
                    className="w-12 h-12 rounded-xl object-cover bg-slate-100 shrink-0 border"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">
                      {item.product?.name}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Qty: {item.quantity} {item.size && `• Size: ${item.size}`}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-slate-900 shrink-0">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            {/* Calculations */}
            <div className="space-y-2 text-xs text-slate-600 border-b border-slate-100 pb-3">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-bold text-slate-800">{formatPrice(cart.subtotal)}</span>
              </div>
              {cart.discount > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>Coupon ({cart.coupon?.code})</span>
                  <span>- {formatPrice(cart.discount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Shipping</span>
                <span className="font-bold text-slate-800">
                  {shippingCharge === 0 ? <span className="text-emerald-600">FREE</span> : formatPrice(shippingCharge)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Tax (5% GST)</span>
                <span className="font-bold text-slate-800">{formatPrice(cart.tax)}</span>
              </div>
            </div>

            <div className="flex justify-between items-baseline font-black">
              <span className="text-sm text-slate-900">Total Payable</span>
              <span className="text-2xl text-brand-600">{formatPrice(grandTotal)}</span>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>100% Secure Checkout with Razorpay</span>
            </div>
          </div>
        </div>
      </div>

      {/* Add New Address Modal */}
      {showNewAddressModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90dvh] overflow-y-auto p-4 sm:p-6 space-y-4 animate-slideUp shadow-2xl">
            <h3 className="font-display font-black text-lg text-slate-900">
              Add New Delivery Address
            </h3>
            <form onSubmit={handleAddNewAddress} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Recipient Name</label>
                  <input
                    type="text"
                    required
                    value={newAddress.fullName}
                    onChange={(e) => setNewAddress({ ...newAddress, fullName: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Phone Number</label>
                  <input
                    type="text"
                    required
                    value={newAddress.phone}
                    onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Street Address / House No.</label>
                <input
                  type="text"
                  required
                  value={newAddress.address}
                  onChange={(e) => setNewAddress({ ...newAddress, address: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={newAddress.city}
                    onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">State</label>
                  <input
                    type="text"
                    required
                    value={newAddress.state}
                    onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Pincode</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={newAddress.pincode}
                    onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowNewAddressModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-600 text-white rounded-xl text-xs font-bold shadow-md hover:bg-brand-700"
                >
                  Save Address
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckoutPage;
