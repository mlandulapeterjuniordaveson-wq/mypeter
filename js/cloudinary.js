/**
 * KUMSIKA — CLOUDINARY MODULE
 * ────────────────────────────────────────────────────────────
 * Cloudinary integration for image uploads and URL transformation.
 * O-Techy Company 2026
 *
 * HOW TO CONNECT:
 *  1. Create a free Cloudinary account at https://cloudinary.com
 *  2. Go to Dashboard → copy your Cloud Name
 *  3. Go to Settings → Upload → Add Upload Preset (unsigned mode)
 *  4. Replace the values below with your real credentials
 */

const CLOUDINARY_CONFIG = {
  cloudName    : 'dvyepcieu',          // ← REPLACE with your Cloudinary cloud name
  uploadPreset : 'Kumsika',          // ← REPLACE with your unsigned upload preset name
  baseUrl      : 'https://res.cloudinary.com',
};

// ── URL BUILDER ─────────────────────────────────────────────────
/**
 * Build a Cloudinary transformation URL.
 * @param {string} publicId     - e.g. "kumsika/products/abc123"
 * @param {object} transforms   - e.g. { w:400, h:400, c:'fill', f:'webp', q:'auto' }
 * @returns {string}            - full Cloudinary URL
 */
function cloudinaryUrl(publicId, transforms = {}) {
  if (!publicId) return '';
  const defaults = { f: 'auto', q: 'auto' };
  const opts = { ...defaults, ...transforms };
  const parts = Object.entries(opts).map(([k, v]) => `${k}_${v}`).join(',');
  return `${CLOUDINARY_CONFIG.baseUrl}/${CLOUDINARY_CONFIG.cloudName}/image/upload/${parts}/${publicId}`;
}

// ── PRESET TRANSFORMATIONS ───────────────────────────────────────
const CloudinaryPresets = {
  thumbnail  : (id) => cloudinaryUrl(id, { w: 200,  h: 200,  c: 'fill',    f: 'webp', q: 'auto' }),
  product    : (id) => cloudinaryUrl(id, { w: 600,  h: 600,  c: 'fill',    f: 'webp', q: 'auto' }),
  productHD  : (id) => cloudinaryUrl(id, { w: 1200, h: 1200, c: 'fill',    f: 'webp', q: 90 }),
  avatar     : (id) => cloudinaryUrl(id, { w: 200,  h: 200,  c: 'fill',    f: 'webp', q: 'auto', g: 'face' }),
  shopCover  : (id) => cloudinaryUrl(id, { w: 800,  h: 280,  c: 'fill',    f: 'webp', q: 'auto' }),
  shopLogo   : (id) => cloudinaryUrl(id, { w: 150,  h: 150,  c: 'fill',    f: 'webp', q: 'auto' }),
  proof      : (id) => cloudinaryUrl(id, { w: 1000, q: 'auto', f: 'webp' }),
};

// ── UPLOAD HELPER ────────────────────────────────────────────────
/**
 * Upload a File or Blob to Cloudinary.
 * @param {File|Blob} file  - The image file to upload
 * @param {object}    opts  - { folder, publicId, tags }
 * @returns {Promise<{secure_url, public_id, width, height}>}
 */
async function cloudinaryUpload(file, opts = {}) {
  const cfg = CLOUDINARY_CONFIG;

  if (cfg.cloudName === 'YOUR_CLOUD_NAME') {
    // Cloudinary not configured — return local base64 preview
    return { secure_url: await _fileToBase64(file), public_id: 'local_' + Date.now() };
  }

  // Compress image before upload
  const compressed = await _compressImage(file, 1200, 0.82);

  const fd = new FormData();
  fd.append('file',           compressed);
  fd.append('upload_preset',  cfg.uploadPreset);
  if (opts.folder)   fd.append('folder',    opts.folder);
  if (opts.publicId) fd.append('public_id', opts.publicId);
  if (opts.tags)     fd.append('tags',      opts.tags);

  const resp = await fetch(
    `https://api.cloudinary.com/v1_1/${cfg.cloudName}/image/upload`,
    { method: 'POST', body: fd }
  );

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Cloudinary upload failed');
  }

  return resp.json();
}

// ── PRODUCT IMAGE UPLOAD (with preview) ─────────────────────────
/**
 * Handle product image input change event.
 * Shows preview, then uploads on form submit.
 * @param {HTMLInputElement} input   - File input element
 * @param {HTMLElement}      preview - <img> or container to preview
 * @param {Function}         onReady - called with { localUrl, file } when preview is ready
 */
async function handleProductImageSelect(input, preview, onReady) {
  const file = input?.files?.[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) { showToast('Please select an image file', 'r'); return; }
  if (file.size > 10 * 1024 * 1024) { showToast('Image must be under 10MB', 'r'); return; }

  const localUrl = await _fileToBase64(file);
  if (preview) {
    if (preview.tagName === 'IMG') preview.src = localUrl;
    else preview.style.backgroundImage = `url(${localUrl})`;
  }
  if (onReady) onReady({ localUrl, file });
}

/**
 * Upload product images.
 * @param {File[]}  files    - Array of image files
 * @param {string}  sellerId - Seller user ID for folder organization
 * @returns {Promise<string[]>} - Array of Cloudinary secure_urls
 */
async function uploadProductImages(files, sellerId) {
  const folder = `kumsika/products/${sellerId || 'anon'}`;
  const results = await Promise.all(
    files.map(f => cloudinaryUpload(f, { folder }))
  );
  return results.map(r => r.secure_url);
}

/**
 * Upload a user avatar.
 * @param {File}   file   - Image file
 * @param {string} userId - User ID
 * @returns {Promise<string>} - Cloudinary secure_url
 */
async function uploadAvatar(file, userId) {
  const res = await cloudinaryUpload(file, {
    folder   : 'kumsika/avatars',
    publicId : `user_${userId}`,
    tags     : 'avatar',
  });
  return res.secure_url;
}

/**
 * Upload a shop logo.
 * @param {File}   file   - Image file
 * @param {string} shopId - Shop ID
 * @returns {Promise<string>} - Cloudinary secure_url
 */
async function uploadShopLogo(file, shopId) {
  const res = await cloudinaryUpload(file, {
    folder   : 'kumsika/shops/logos',
    publicId : `shop_logo_${shopId}`,
    tags     : 'shop,logo',
  });
  return res.secure_url;
}

/**
 * Upload a shop cover image.
 * @param {File}   file   - Image file
 * @param {string} shopId - Shop ID
 * @returns {Promise<string>} - Cloudinary secure_url
 */
async function uploadShopCover(file, shopId) {
  const res = await cloudinaryUpload(file, {
    folder   : 'kumsika/shops/covers',
    publicId : `shop_cover_${shopId}`,
    tags     : 'shop,cover',
  });
  return res.secure_url;
}

/**
 * Upload a payment proof screenshot.
 * @param {string|File} fileOrB64 - Base64 string or File
 * @param {string}      userId    - User ID
 * @returns {Promise<string>} - Cloudinary secure_url
 */
async function uploadPaymentProof(fileOrB64, userId) {
  let file = fileOrB64;
  if (typeof fileOrB64 === 'string' && fileOrB64.startsWith('data:')) {
    const resp = await fetch(fileOrB64);
    file = await resp.blob();
  }
  const res = await cloudinaryUpload(file, {
    folder : 'kumsika/payment_proofs',
    tags   : `proof,user_${userId}`,
  });
  return res.secure_url;
}

// ── HELPERS ──────────────────────────────────────────────────────
function _fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = e => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function _compressImage(file, maxPx = 1200, quality = 0.82) {
  if (!file.type.startsWith('image/')) return file;
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let { width, height } = img;
      if (width > maxPx || height > maxPx) {
        if (width > height) { height = Math.round(height * maxPx / width); width = maxPx; }
        else                { width = Math.round(width * maxPx / height);  height = maxPx; }
      }
      canvas.width  = width;
      canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      canvas.toBlob(blob => resolve(blob || file), 'image/webp', quality);
    };
    img.onerror = () => resolve(file);
    img.src = URL.createObjectURL(file);
  });
}

// ── EXPORTS (for module usage) ────────────────────────────────────
// If using ES modules, uncomment:
// export { cloudinaryUrl, CloudinaryPresets, cloudinaryUpload, handleProductImageSelect,
//          uploadProductImages, uploadAvatar, uploadShopLogo, uploadShopCover, uploadPaymentProof };
