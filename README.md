# ShopNest

ShopNest is a full-stack e-commerce demo application. The React storefront uses a Vite development server, and the Express API reads and writes product, account, cart, wishlist, order, and other data in MongoDB.

## Technology

- **Frontend:** React 18, React Router, Vite, Tailwind CSS, Axios
- **Backend:** Node.js, Express, Mongoose
- **Database:** MongoDB
- **Optional services:** Razorpay for online payments, SMTP for email

## Requirements

Install these before starting:

1. **Node.js and npm** (Node.js 18 or newer recommended).
2. **MongoDB Community Server** running locally, or a MongoDB Atlas connection string.
3. Git, if you are cloning the repository.

## First-time setup

Run commands from the repository root.

### 1. Install dependencies

```bash
npm --prefix backend install
npm --prefix frontend install
```

The backend and frontend are separate npm projects; there is no root `package.json`.

### 2. Configure environment variables

Copy `.env.example` to `.env` in the repository root:

**PowerShell**

```powershell
Copy-Item .env.example .env
```

**macOS / Linux**

```bash
cp .env.example .env
```

Edit `.env` and set a private `JWT_SECRET` (at least 32 characters) and the database URI:

```dotenv
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
MONGODB_URI=mongodb://127.0.0.1:27017/shopnest
JWT_SECRET=replace_this_with_a_private_random_secret_of_at_least_32_characters
JWT_EXPIRE=7d
COOKIE_EXPIRE=7
```

The backend loads the repository-root `.env`. When `MONGODB_URI` is omitted, it defaults to `mongodb://127.0.0.1:27017/shopnest`.

For MongoDB Atlas, replace the local URI with your Atlas connection string and database name. Keep credentials private, URL-encode special characters in a username or password, and allow the machine running this app in the Atlas network access settings. Never commit `.env`.

Razorpay and SMTP variables are optional for local development. Use Razorpay test credentials to test real checkout payments. Without working gateway credentials, the backend's payment service can use its development simulation. Configure SMTP credentials if you want email delivery.

### 3. Start MongoDB

MongoDB must be running before starting the API. Choose the option matching your installation.

**MongoDB installed as a Windows service (run PowerShell as Administrator):**

```powershell
Start-Service MongoDB
Get-Service MongoDB
```

**Start a local MongoDB process (run in its own terminal):**

```powershell
New-Item -ItemType Directory -Force backend\data
mongod --dbpath .\backend\data --bind_ip 127.0.0.1 --port 27017
```

The `--dbpath` must be a MongoDB data directory. Do not point it at an unrelated or damaged data directory. For an existing installation, use the data path configured by that MongoDB installation.

**macOS / Linux service examples:**

```bash
# macOS with Homebrew
brew services start mongodb-community

# Linux with systemd
sudo systemctl start mongod
sudo systemctl status mongod
```

Confirm that MongoDB is accepting connections before continuing:

```bash
mongosh "mongodb://127.0.0.1:27017/shopnest" --eval "db.adminCommand({ ping: 1 })"
```

The response should include `ok: 1`.

### 4. (Optional) Add sample catalog and demo accounts

```bash
npm --prefix backend run seed
```

This seeds sample categories, products, accounts, coupons, reviews, addresses, and orders. **The seeder first deletes existing documents in these collections. Do not run it on a database whose data you need to keep.**

Demo accounts created by the seed:

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@shopnest.com` | `Admin@123` |
| Customer | `john@example.com` | `Customer@123` |

Change or remove demo credentials before exposing an instance beyond local development.

### 5. Start the backend API

Open a terminal at the repository root:

```bash
npm --prefix backend run dev
```

The API listens on port `5000` by default. Check its database-aware health endpoint:

```text
http://127.0.0.1:5000/api/health
```

A ready API returns HTTP `200` with `"database": "connected"`. If the database is disconnected, the endpoint returns HTTP `503`.

### 6. Start the frontend

Open a second terminal at the repository root:

```bash
npm --prefix frontend run dev
```

Open the Vite URL printed in the terminal (normally <http://localhost:5173>). Vite proxies `/api` and `/uploads` requests to `http://127.0.0.1:5000`.

The frontend uses this proxy by default. To use a different API origin, create `frontend/.env.local` and set:

```dotenv
VITE_API_URL=http://127.0.0.1:5000/api
```

Restart Vite after changing environment variables.

## Useful commands

Run from the repository root:

| Purpose | Command |
| --- | --- |
| Start backend in development mode | `npm --prefix backend run dev` |
| Start backend in production mode | `npm --prefix backend start` |
| Start frontend development server | `npm --prefix frontend run dev` |
| Build frontend for production | `npm --prefix frontend run build` |
| Preview the production frontend build | `npm --prefix frontend run preview` |
| Run backend API tests | `npm --prefix backend test` |
| Seed sample data (**clears existing seeded collections first**) | `npm --prefix backend run seed` |
| Destroy database collections (**destructive**) | `npm --prefix backend run seed:destroy` |

## Main features

- Home page with featured products and category collections
- Product catalog with search, categories, filtering, sorting, and pagination
- Product detail, images, available variants, and reviews
- Guest/local and signed-in carts, coupons, and wishlist
- Authentication, profile, saved addresses, and order history
- Checkout with Cash on Delivery and Razorpay integration/simulation
- Admin dashboard metrics and recent orders
- Responsive navigation, product cards, catalog, cart, and checkout layouts

## API overview

The backend mounts these API groups under `/api`:

| Group | Examples |
| --- | --- |
| Health | `GET /api/health` |
| Authentication | `/api/auth` |
| Products | `/api/products`, `/api/products/filters` |
| Categories | `/api/categories` |
| Cart and wishlist | `/api/cart`, `/api/wishlist` |
| Orders and payments | `/api/orders`, `/api/payments` |
| Reviews and coupons | `/api/reviews`, `/api/coupons` |
| User addresses and admin | `/api/users` |

Protected endpoints require the bearer token stored by the frontend after sign-in. Start with the route files in `backend/routes/` for the full endpoint list.

## Troubleshooting

- **`ECONNREFUSED 127.0.0.1:27017`:** Start MongoDB, confirm its port and data directory, then check `MONGODB_URI` in the root `.env`.
- **API health returns `503`:** The Express process is running but Mongoose has not connected. Check the backend terminal for the MongoDB connection error.
- **Frontend reports a proxy/network error:** Confirm the API is listening on port `5000`; restart Vite after changing proxy configuration.
- **No products appear:** Confirm MongoDB is connected and sample products exist. If this is a fresh local database, run the seeder only after reading its destructive-data warning.
- **Port already in use:** Stop the other process using port `5173` or `5000`, or change the relevant server configuration.
- **Razorpay checkout is unavailable:** Set valid Razorpay test credentials in `.env`. Local demo mode may use the backend payment simulation.

## Production notes

Set `NODE_ENV=production`, provide a strong private JWT secret, use a secured production MongoDB deployment, and configure real payment/email services as needed. Build the frontend with `npm --prefix frontend run build`; the Express app serves `frontend/dist` when running in production. Do not use the demo seed accounts, placeholder secrets, or development payment simulation in a public production deployment.
"# e-commerce" 
