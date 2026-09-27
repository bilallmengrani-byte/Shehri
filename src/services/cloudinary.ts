/**
 * Cloudinary Unsigned Image Upload Service
 * 
 * Replaces Firebase Cloud Storage with Cloudinary unsigned direct client upload.
 * Uses environment variables:
 * - VITE_CLOUDINARY_CLOUD_NAME
 * - VITE_CLOUDINARY_UPLOAD_PRESET
 */

export interface CloudinaryUploadOptions {
  folder?: string;
  maxSizeBytes?: number;
}

const DEFAULT_MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

/**
 * Upload an image (File object or Data URL string) to Cloudinary via unsigned upload preset.
 * Falls back to the original base64 data URL if Cloudinary is not configured or network fails.
 */
export async function uploadToCloudinary(
  imageInput: File | string,
  options?: CloudinaryUploadOptions
): Promise<string> {
  if (!imageInput) {
    throw new Error('No image provided for upload.');
  }

  // If input is already a remote HTTP/HTTPS URL, return it directly
  if (typeof imageInput === 'string' && (imageInput.startsWith('http://') || imageInput.startsWith('https://'))) {
    return imageInput;
  }

  // Client-side file validation for File objects
  if (imageInput instanceof File) {
    if (!imageInput.type.startsWith('image/')) {
      throw new Error('Invalid file type. Only image files are allowed.');
    }
    const maxSize = options?.maxSizeBytes || DEFAULT_MAX_SIZE_BYTES;
    if (imageInput.size > maxSize) {
      throw new Error(`File size exceeds maximum allowed size of ${Math.round(maxSize / (1024 * 1024))}MB.`);
    }
  }

  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  // Fallback: If Cloudinary env vars are missing, return data URL directly
  if (!cloudName || !uploadPreset) {
    console.warn('Cloudinary env vars (VITE_CLOUDINARY_CLOUD_NAME / VITE_CLOUDINARY_UPLOAD_PRESET) not set. Using local data URL fallback.');
    if (typeof imageInput === 'string') {
      return imageInput;
    }
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(imageInput);
    });
  }

  try {
    const formData = new FormData();
    formData.append('file', imageInput);
    formData.append('upload_preset', uploadPreset);
    if (options?.folder) {
      formData.append('folder', options.folder);
    }

    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      console.warn('Cloudinary upload failed:', errJson);
      throw new Error(errJson?.error?.message || `Cloudinary upload failed with status ${response.status}`);
    }

    const data = await response.json();
    if (!data.secure_url) {
      throw new Error('Cloudinary response did not contain secure_url');
    }

    return data.secure_url;
  } catch (err) {
    console.warn('Cloudinary upload error, falling back to data URL:', err);
    if (typeof imageInput === 'string') {
      return imageInput;
    }
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = () => resolve('');
      reader.readAsDataURL(imageInput);
    });
  }
}
