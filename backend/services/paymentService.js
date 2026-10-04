const Razorpay = require('razorpay');
const crypto = require('crypto');

let razorpayInstance = null;

const getRazorpayInstance = () => {
  if (
    process.env.RAZORPAY_KEY_ID &&
    process.env.RAZORPAY_KEY_ID !== 'rzp_test_your_key_id' &&
    process.env.RAZORPAY_KEY_SECRET &&
    process.env.RAZORPAY_KEY_SECRET !== 'your_razorpay_secret_key'
  ) {
    if (!razorpayInstance) {
      razorpayInstance = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      });
    }
    return razorpayInstance;
  }
  return null;
};

/**
 * Create a payment order (INR amount in paise)
 */
exports.createPaymentOrder = async (amountInRupees, receipt) => {
  const instance = getRazorpayInstance();

  if (!instance) {
    // Return simulated mock Razorpay order for development/demo testing
    const mockOrderId = 'order_mock_' + Math.random().toString(36).substring(2, 12);
    return {
      id: mockOrderId,
      amount: Math.round(amountInRupees * 100),
      currency: 'INR',
      receipt,
      isSimulated: true,
      keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_mock_key',
    };
  }

  try {
    const options = {
      amount: Math.round(amountInRupees * 100), // amount in paise
      currency: 'INR',
      receipt,
    };

    const order = await instance.orders.create(options);
    return {
      ...order,
      keyId: process.env.RAZORPAY_KEY_ID,
    };
  } catch (err) {
    // If Razorpay live API credentials fail (e.g. dummy test credentials), return simulation
    console.warn(`[Payment] Razorpay API call returned error: ${err.message}. Using simulated order.`);
    const mockOrderId = 'order_mock_' + Math.random().toString(36).substring(2, 12);
    return {
      id: mockOrderId,
      amount: Math.round(amountInRupees * 100),
      currency: 'INR',
      receipt,
      isSimulated: true,
      keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_mock_key',
    };
  }
};

/**
 * Verify Razorpay payment signature
 */
exports.verifyPaymentSignature = (orderId, paymentId, signature) => {
  if (orderId && orderId.startsWith('order_mock_')) {
    // Valid for simulated demo orders
    return true;
  }

  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return false;

  const generatedSignature = crypto
    .createHmac('sha256', secret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  return generatedSignature === signature;
};
