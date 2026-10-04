const request = require('supertest');
const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../../.env') });
dotenv.config();

const app = require('../app');
const { connectDatabase, disconnectDatabase } = require('../config/db');

let authToken = '';
let sampleProductId = '';

beforeAll(async () => {
  await connectDatabase();
});

afterAll(async () => {
  await disconnectDatabase();
});

describe('ShopNest Backend API Suite', () => {
  describe('Health Check', () => {
    it('should return 200 OK from health check', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('ShopNest');
    });
  });

  describe('Authentication Endpoints', () => {
    it('should login with seeded admin credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@shopnest.com',
          password: 'Admin@123',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.role).toBe('admin');
      authToken = res.body.token;
    });

    it('should login with seeded customer credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'john@example.com',
          password: 'Customer@123',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.role).toBe('customer');
    });

    it('should reject invalid password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@shopnest.com',
          password: 'WrongPassword123',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should fetch user profile using JWT token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.email).toBe('admin@shopnest.com');
    });
  });

  describe('Product & Category Endpoints', () => {
    it('should fetch all categories', async () => {
      const res = await request(app).get('/api/categories');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.categories)).toBe(true);
      expect(res.body.categories.length).toBeGreaterThan(0);
    });

    it('should fetch paginated products', async () => {
      const res = await request(app).get('/api/products?page=1&limit=10');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.products.length).toBeGreaterThan(0);
      expect(res.body.totalPages).toBeGreaterThanOrEqual(1);

      sampleProductId = res.body.products[0]._id;
    });

    it('should search products by keyword', async () => {
      const res = await request(app).get('/api/products?keyword=Sony');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.products.some((p) => p.brand.toLowerCase() === 'sony' || p.name.includes('Sony'))).toBe(true);
    });

    it('should fetch single product details', async () => {
      const res = await request(app).get(`/api/products/${sampleProductId}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.product._id).toBe(sampleProductId);
    });
  });

  describe('Cart & Checkout Flow', () => {
    it('should add product to customer cart', async () => {
      // Login as customer
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'john@example.com',
          password: 'Customer@123',
        });
      const custToken = loginRes.body.token;

      const cartRes = await request(app)
        .post('/api/cart')
        .set('Authorization', `Bearer ${custToken}`)
        .send({
          productId: sampleProductId,
          quantity: 2,
        });

      expect(cartRes.status).toBe(200);
      expect(cartRes.body.success).toBe(true);
      expect(cartRes.body.cart.items.length).toBeGreaterThan(0);
      expect(cartRes.body.cart.subtotal).toBeGreaterThan(0);
    });

    it('should create payment order', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'john@example.com',
          password: 'Customer@123',
        });
      const custToken = loginRes.body.token;

      const payRes = await request(app)
        .post('/api/payments/create')
        .set('Authorization', `Bearer ${custToken}`)
        .send({
          amount: 2500,
        });

      expect(payRes.status).toBe(200);
      expect(payRes.body.success).toBe(true);
      expect(payRes.body.order.id).toBeDefined();
    });
  });
});
