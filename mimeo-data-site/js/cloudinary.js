/* ==========================================================
   cloudinary.js — unsigned direct-from-browser image upload.
   Free tier, no Blaze plan needed. Replaces Firebase Storage.
   Fill in your own values from cloudinary.com/console:
   ========================================================== */

const CLOUD_NAME = "tnc4xkn2";
const UPLOAD_PRESET = "mimeo_unsigned";

/** Uploads a File to Cloudinary and returns its secure_url. */
async function uploadToCloudinary(file) {
  const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;
  const form = new FormData();
  form.append('file', file);
  form.append('upload_preset', UPLOAD_PRESET);

  const res = await fetch(url, { method: 'POST', body: form });
  if (!res.ok) throw new Error(`Cloudinary upload failed: ${res.status}`);
  const data = await res.json();
  return data.secure_url;
}
