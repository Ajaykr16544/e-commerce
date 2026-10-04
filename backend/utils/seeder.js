const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../../.env') });
dotenv.config();

const { connectDatabase, disconnectDatabase } = require('../config/db');
const User = require('../models/User');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Review = require('../models/Review');
const Coupon = require('../models/Coupon');
const Address = require('../models/Address');
const Order = require('../models/Order');
const Cart = require('../models/Cart');

const { categoriesData, couponsData, sampleProducts } = require('./seedData');

const seedDatabase = async () => {
  try {
    console.log('[Seeder] Connecting to database...');
    await connectDatabase();

    console.log('[Seeder] Cleaning existing collections...');
    await Promise.all([
      User.deleteMany(),
      Category.deleteMany(),
      Product.deleteMany(),
      Review.deleteMany(),
      Coupon.deleteMany(),
      Address.deleteMany(),
      Order.deleteMany(),
      Cart.deleteMany(),
    ]);

    console.log('[Seeder] Inserting Users...');
    // Create Admin User
    const adminUser = await User.create({
      name: 'ShopNest Administrator',
      email: 'admin@shopnest.com',
      password: 'Admin@123',
      role: 'admin',
      phone: '+91 98765 43210',
      isVerified: true,
      avatar: {
        public_id: 'admin_avatar',
        url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      },
    });

    // Create Demo Customer 1
    const customerUser = await User.create({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'Customer@123',
      role: 'customer',
      phone: '+91 98111 22334',
      isVerified: true,
      avatar: {
        public_id: 'customer_avatar',
        url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
      },
    });

    // Create Demo Customer 2
    const customerUser2 = await User.create({
      name: 'Jane Smith',
      email: 'jane@example.com',
      password: 'Customer@123',
      role: 'customer',
      phone: '+91 98222 33445',
      isVerified: true,
      avatar: {
        public_id: 'customer_avatar_2',
        url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
      },
    });

    console.log('[Seeder] Inserting Categories...');
    const slugify = require('slugify');
    const categoriesWithSlugs = categoriesData.map((cat) => ({
      ...cat,
      slug: slugify(cat.name, { lower: true, strict: true }),
    }));
    const insertedCategories = await Category.insertMany(categoriesWithSlugs);
    const categoryMap = {};
    insertedCategories.forEach((cat) => {
      categoryMap[cat.name] = cat._id;
    });

    console.log('[Seeder] Inserting Coupons...');
    await Coupon.insertMany(couponsData);

    console.log('[Seeder] Inserting Products...');
    const productDocs = sampleProducts.map((p) => {
      const { categoryName, ...rest } = p;
      return {
        ...rest,
        category: categoryMap[categoryName] || insertedCategories[0]._id,
        createdBy: adminUser._id,
      };
    });

    const insertedProducts = await Product.create(productDocs);
    console.log(`[Seeder] Inserted ${insertedProducts.length} products.`);

    console.log('[Seeder] Inserting Sample Reviews...');
    const sampleReviews = [
      {
        product: insertedProducts[0]._id, // Sony Headphones
        user: customerUser._id,
        rating: 5,
        title: 'Best headphones I have ever owned!',
        comment: 'The noise cancellation is magical on flights. Battery lasts well over 30 hours, and the microphone for Zoom calls is crisp and clear.',
        isVerifiedPurchase: true,
      },
      {
        product: insertedProducts[0]._id,
        user: customerUser2._id,
        rating: 4,
        title: 'Superb sound quality',
        comment: 'Extremely comfortable for long listening sessions. Bass is punchy without distorting vocals. Highly recommended.',
        isVerifiedPurchase: true,
      },
      {
        product: insertedProducts[1]._id, // iPhone 15 Pro Max
        user: customerUser._id,
        rating: 5,
        title: 'Titanium build feels incredible',
        comment: 'Much lighter than previous generations. The 5x optical telephoto lens captures stunning portraits and video.',
        isVerifiedPurchase: true,
      },
      {
        product: insertedProducts[5]._id, // Air Jordan 1
        user: customerUser._id,
        rating: 5,
        title: 'Grail sneaker, 10/10 quality',
        comment: 'Leather quality is top tier. Fits true to size and looks phenomenal with any streetwear fit.',
        isVerifiedPurchase: true,
      },
    ];

    await Review.insertMany(sampleReviews);

    // Update ratings on those products
    for (const rev of sampleReviews) {
      await Review.calcAverageRating(rev.product);
    }

    console.log('[Seeder] Inserting User Addresses...');
    const customerAddress = await Address.create({
      user: customerUser._id,
      fullName: 'John Doe',
      phone: '+91 98111 22334',
      address: 'Flat 402, Lotus Grandeur, Linking Road',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400050',
      country: 'India',
      addressType: 'Home',
      isDefault: true,
    });

    await Address.create({
      user: customerUser._id,
      fullName: 'John Doe (Office)',
      phone: '+91 98111 22334',
      address: '8th Floor, Tech Hub Tower, BKC',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400051',
      country: 'India',
      addressType: 'Work',
      isDefault: false,
    });

    console.log('[Seeder] Inserting Sample Orders for Dashboard Analytics...');
    // Order 1: Delivered
    await Order.create({
      orderId: 'SN-849201-4412',
      user: customerUser._id,
      items: [
        {
          product: insertedProducts[0]._id,
          name: insertedProducts[0].name,
          image: insertedProducts[0].images[0].url,
          price: insertedProducts[0].discountPrice,
          quantity: 1,
          color: 'Midnight Black',
        },
      ],
      shippingAddress: {
        fullName: customerAddress.fullName,
        phone: customerAddress.phone,
        address: customerAddress.address,
        city: customerAddress.city,
        state: customerAddress.state,
        pincode: customerAddress.pincode,
        country: customerAddress.country,
      },
      paymentMethod: 'Razorpay',
      paymentStatus: 'Paid',
      paymentDetails: {
        razorpayOrderId: 'order_mock_99348123',
        razorpayPaymentId: 'pay_mock_11234857',
        paidAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
      orderStatus: 'Delivered',
      trackingNumber: 'TRK-982348102',
      courierPartner: 'BlueDart Express',
      itemsPrice: insertedProducts[0].discountPrice,
      discountAmount: 500,
      couponCode: 'WELCOME50',
      shippingPrice: 0,
      taxPrice: Math.round(insertedProducts[0].discountPrice * 0.05),
      totalPrice: insertedProducts[0].discountPrice - 500 + Math.round(insertedProducts[0].discountPrice * 0.05),
      deliveredAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      statusHistory: [
        { status: 'Confirmed', timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), note: 'Payment verified' },
        { status: 'Processing', timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), note: 'Packed at warehouse' },
        { status: 'Shipped', timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), note: 'Dispatched via BlueDart' },
        { status: 'Out for Delivery', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), note: 'Out with delivery agent' },
        { status: 'Delivered', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), note: 'Delivered to customer' },
      ],
    });

    // Order 2: Processing
    await Order.create({
      orderId: 'SN-910283-8821',
      user: customerUser2._id,
      items: [
        {
          product: insertedProducts[5]._id, // Nike Jordan
          name: insertedProducts[5].name,
          image: insertedProducts[5].images[0].url,
          price: insertedProducts[5].discountPrice,
          quantity: 1,
          size: 'UK 9',
        },
      ],
      shippingAddress: {
        fullName: 'Jane Smith',
        phone: '+91 98222 33445',
        address: '12 Green Meadows, Indiranagar',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560038',
        country: 'India',
      },
      paymentMethod: 'COD',
      paymentStatus: 'Pending',
      orderStatus: 'Processing',
      trackingNumber: 'TRK-554433221',
      courierPartner: 'Delhivery',
      itemsPrice: insertedProducts[5].discountPrice,
      discountAmount: 0,
      shippingPrice: 0,
      taxPrice: Math.round(insertedProducts[5].discountPrice * 0.05),
      totalPrice: insertedProducts[5].discountPrice + Math.round(insertedProducts[5].discountPrice * 0.05),
      statusHistory: [
        { status: 'Pending', timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), note: 'Order placed' },
        { status: 'Confirmed', timestamp: new Date(Date.now() - 18 * 60 * 60 * 1000), note: 'Order verified by merchant' },
        { status: 'Processing', timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), note: 'Processing at hub' },
      ],
    });

    console.log('\n========================================================');
    console.log('✅ DATABASE SEEDING COMPLETED SUCCESSFULLY!');
    console.log('========================================================');
    console.log('👑 Admin Credentials:');
    console.log('   Email:    admin@shopnest.com');
    console.log('   Password: Admin@123');
    console.log('   Role:     admin\n');
    console.log('👤 Customer Demo Credentials:');
    console.log('   Email:    john@example.com');
    console.log('   Password: Customer@123');
    console.log('   Role:     customer\n');
    console.log('🛍️  Catalog:');
    console.log(`   Categories: ${insertedCategories.length}`);
    console.log(`   Products:   ${insertedProducts.length}`);
    console.log(`   Coupons:    ${couponsData.length}`);
    console.log('========================================================\n');

    await disconnectDatabase();
    process.exit(0);
  } catch (error) {
    console.error(`[Seeder Error]: ${error.message}`);
    await disconnectDatabase();
    process.exit(1);
  }
};

const destroyData = async () => {
  try {
    await connectDatabase();
    await Promise.all([
      User.deleteMany(),
      Category.deleteMany(),
      Product.deleteMany(),
      Review.deleteMany(),
      Coupon.deleteMany(),
      Address.deleteMany(),
      Order.deleteMany(),
      Cart.deleteMany(),
    ]);
    console.log('💥 All database data destroyed successfully!');
    await disconnectDatabase();
    process.exit(0);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

if (process.argv[2] === '-d') {
  destroyData();
} else {
  seedDatabase();
}
