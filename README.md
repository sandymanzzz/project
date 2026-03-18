# FORGE3D — Premium 3D Asset eCommerce Platform

A full-stack eCommerce platform for selling 3D models and digital/physical products.
Built with Node.js, Express, MongoDB, and vanilla JavaScript with Three.js.

---

## Project Structure

```
/project
  /frontend         — Customer-facing storefront
    index.html      — Main SPA shell
    style.css       — All styles
    app.js          — Frontend logic (auth, cart, 3D viewer, etc.)
    /assets
      placeholder.svg

  /backend          — Express API server
    server.js       — Entry point
    /models
      User.js
      Product.js
      Order.js
      Settings.js
    /routes
      auth.js       — Login, signup, Google OAuth
      products.js   — CRUD for products
      orders.js     — Orders + Razorpay payment
      settings.js   — Site title CMS
      users.js      — User management
    /middleware
      auth.js       — JWT protect + adminOnly
    package.json

  /admin            — Admin panel SPA
    admin.html
    admin.js

  .env.example      — Environment variable template
  README.md
```

---

## Local Development Setup

### Prerequisites

- Node.js v18+
- MongoDB (local or Atlas)
- npm

### Step 1 — Install dependencies

```bash
cd backend
npm install
```

### Step 2 — Configure environment

```bash
cp .env.example .env
# Edit .env with your values
```

Minimum required for local dev:
```
MONGO_URI=mongodb://localhost:27017/forge3d
JWT_SECRET=any_long_random_string
```

### Step 3 — Start the server

```bash
cd backend
npm run dev      # development with nodemon
# or
npm start        # production
```

### Step 4 — Open in browser

- Storefront: http://localhost:5000
- Admin Panel: http://localhost:5000/admin/admin.html

### Default Admin Credentials

```
Email:    admin@forge3d.com
Password: admin123
```

Change these via the ADMIN_EMAIL and ADMIN_PASSWORD env vars before first run,
or update the password through MongoDB directly after seeding.

---

## Features

### Storefront
- Animated particle hero section
- Product grid with category filtering and price sorting
- Three.js 3D model viewer (GLB/GLTF) with orbit controls
- Cart sidebar with persistent localStorage
- Checkout with Razorpay payment
- JWT-based auth (signup / login / Google OAuth)
- Order history page

### Admin Panel
- Dashboard with stats (products, orders, revenue, users)
- Product management (add / edit / delete)
- Order management with status updates
- Site title CMS setting

---

## Razorpay Integration

1. Create account at https://razorpay.com
2. Go to Settings > API Keys
3. Generate Test Mode keys
4. Add to .env:
   ```
   RAZORPAY_KEY_ID=rzp_test_xxxx
   RAZORPAY_KEY_SECRET=xxxx
   ```
5. For live payments, switch to Live Mode keys and update .env

Note: If Razorpay keys are not configured, the checkout will show a demo flow.

---

## Google OAuth Integration

1. Go to https://console.cloud.google.com
2. Create a new project
3. Navigate to APIs & Services > Credentials
4. Create OAuth 2.0 Client ID (Web application)
5. Add Authorized redirect URI:
   - Local: http://localhost:5000/api/auth/google/callback
   - Production: https://yourdomain.com/api/auth/google/callback
6. Add to .env:
   ```
   GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=xxxx
   GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/google/callback
   ```

---

## Deployment

### Free Tier — Render + MongoDB Atlas

**Backend on Render:**

1. Push /backend to a GitHub repository
2. Go to https://render.com and create a new Web Service
3. Connect your GitHub repo
4. Set Build Command: `npm install`
5. Set Start Command: `node server.js`
6. Add environment variables from .env (all of them)
7. Deploy

**Frontend on Vercel (optional static hosting):**

If you separate the frontend, update the API constant in app.js and admin.js
to point to your Render backend URL.

If serving frontend from the same Express server (default), just deploy the
entire project including /frontend and /admin folders with the backend.

**MongoDB Atlas:**

1. Go to https://cloud.mongodb.com
2. Create a free M0 cluster
3. Create a database user
4. Whitelist IP: 0.0.0.0/0 (for Render)
5. Get the connection string and set as MONGO_URI

### VPS / AWS Deployment

1. SSH into your server
2. Install Node.js 18+ and MongoDB (or use Atlas)
3. Clone your repository
4. Copy .env.example to .env and configure
5. Install PM2: `npm install -g pm2`
6. Start: `pm2 start backend/server.js --name forge3d`
7. Configure Nginx reverse proxy to port 5000
8. Enable HTTPS with Let's Encrypt (certbot)

Example Nginx config:
```nginx
server {
    server_name yourdomain.com www.yourdomain.com;
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## Adding Your First Products

1. Open the admin panel: /admin/admin.html
2. Sign in with admin credentials
3. Go to Products > Add Product
4. Fill in:
   - Name and price
   - Category (3D Models / Textures / Physical / Bundles)
   - Image URL (hosted image, e.g. Cloudinary, Imgur)
   - 3D Model URL (hosted GLB file for interactive viewer)
5. Save

For 3D model hosting, use services like:
- AWS S3 + CloudFront
- Cloudinary (supports GLB)
- Uploadcare
- Your own VPS /public folder

---

## Tech Stack

| Layer     | Technology                        |
|-----------|-----------------------------------|
| Frontend  | HTML, CSS, Vanilla JS             |
| 3D Viewer | Three.js r128 + GLTFLoader        |
| Backend   | Node.js + Express                 |
| Database  | MongoDB + Mongoose                |
| Auth      | JWT + bcryptjs + Google OAuth 2.0 |
| Payments  | Razorpay                          |
| Fonts     | Syne + DM Sans (Google Fonts)     |

---

## Environment Variables Reference

| Variable              | Required | Description                              |
|-----------------------|----------|------------------------------------------|
| PORT                  | No       | Server port (default: 5000)              |
| MONGO_URI             | Yes      | MongoDB connection string                |
| JWT_SECRET            | Yes      | Secret for signing JWT tokens            |
| ADMIN_EMAIL           | No       | Initial admin email (seed)               |
| ADMIN_PASSWORD        | No       | Initial admin password (seed)            |
| BACKEND_URL           | No       | Public backend URL for OAuth callbacks   |
| FRONTEND_URL          | No       | Frontend URL for CORS                    |
| RAZORPAY_KEY_ID       | No       | Razorpay key ID                          |
| RAZORPAY_KEY_SECRET   | No       | Razorpay key secret                      |
| GOOGLE_CLIENT_ID      | No       | Google OAuth client ID                   |
| GOOGLE_CLIENT_SECRET  | No       | Google OAuth client secret               |
| GOOGLE_REDIRECT_URI   | No       | Google OAuth callback URL                |

---

## License

MIT License — free to use for personal and commercial projects.
