# KUMSIKA — Malawi's #1 Marketplace
### Powered by O-Techy Company 🇲🇼

---

## Quick Start

### 1. Connect Supabase

Open **`js/supabase.js`** and replace:
```js
const SUPABASE_URL      = 'https://YOUR_PROJECT.supabase.co';  // ← your URL
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY';                      // ← your anon key
```

Then run the database schema:
1. Go to your Supabase dashboard → SQL Editor
2. Copy & paste the entire contents of **`supabase/schema.sql`**
3. Click Run

### 2. Connect Cloudinary

Open **`js/cloudinary.js`** and replace:
```js
const CLOUDINARY_CONFIG = {
  cloudName    : 'YOUR_CLOUD_NAME',     // ← your cloud name
  uploadPreset : 'kumsika_unsigned',    // ← create this preset in Cloudinary
};
```

**How to create the upload preset:**
1. Cloudinary Dashboard → Settings → Upload
2. Click "Add upload preset"
3. Name it exactly `kumsika_unsigned`
4. Set Signing Mode to **Unsigned**
5. Save

### 3. Deploy

Upload all files to any static host:
- **Netlify** (recommended — drag & drop the /kumsika folder)
- **Vercel**
- **GitHub Pages**
- **Firebase Hosting**

For PWA to work, the site must be served over **HTTPS**.

---

## Folder Structure

```
/kumsika
    index.html              ← Main app (single-page)
    manifest.json           ← PWA manifest
    service-worker.js       ← Offline caching
    offline.html            ← Offline fallback page
    README.md

    /assets
        /logo
            kumsika-logo.svg
        /icons              ← Add PNG icons (72,96,128,192,512px)
        /images

    /css
        styles.css          ← All UI styles (Malawi-themed)

    /js
        app.js              ← Boot & initialization
        auth.js             ← Login, signup, logout, validation
        cloudinary.js       ← Image upload & URL generation
        supabase.js         ← Database operations
        ui.js               ← Navigation, theme, i18n, admin
        products.js         ← Product rendering, search, sell
        shop.js             ← Shops, creation, payment

    /supabase
        schema.sql          ← Full PostgreSQL schema for Supabase
```

---

## Supabase Tables (auto-created by schema.sql)

| Table             | Purpose                          |
|-------------------|----------------------------------|
| `profiles`        | User profiles (extends auth.users) |
| `shops`           | Seller shops                     |
| `products`        | Product listings                 |
| `payment_requests`| Subscription proof submissions   |
| `saved_products`  | User favorites                   |
| `shelves`         | Product collections              |
| `shelf_products`  | Items within shelves             |
| `conversations`   | Chat threads                     |
| `messages`        | Individual messages              |
| `notifications`   | User notification feed           |
| `bug_reports`     | Submitted bug reports            |

---

## Admin Access

The admin dashboard is available to the email defined as `ADMIN_EMAIL` in `js/supabase.js`:
```js
const ADMIN_EMAIL = 'mlandulapeter7@gmail.com';
```
Change this to your own email address.

---

## Cloudinary Folders

Images are organized automatically:
- `kumsika/avatars/` — User profile photos
- `kumsika/products/{seller_id}/` — Product photos
- `kumsika/shops/logos/` — Shop logos
- `kumsika/shops/covers/` — Shop cover images
- `kumsika/payment_proofs/` — Payment screenshots

---

## PWA Icons

Add these PNG icon files to `/assets/icons/`:
- `icon-72.png`
- `icon-96.png`
- `icon-128.png`
- `icon-192.png` (used as apple-touch-icon)
- `icon-512.png`

You can generate them from the SVG logo at: https://realfavicongenerator.net

---

## Theme Colors

| Variable | Value   | Usage        |
|----------|---------|--------------|
| `--R`    | #CE1126 | Malawi Red   |
| `--G`    | #339E35 | Malawi Green |
| `--BK`   | #000000 | Malawi Black |

---

## Contact & Support

- **Developer:** O-Techy Company
- **WhatsApp:** +265 888 258 180
- **Email:** info@otechy.mw
- **Website:** https://otechy.tiiny.site

---

*Built with ❤️ in Malawi 🇲🇼 — Kumsika v7.0.0*
