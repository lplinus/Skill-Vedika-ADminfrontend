/**
 * Converts an image file to WebP format
 */
async function convertToWebP(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    // Check if file is an image
    if (!file.type.startsWith("image/")) {
      // If not an image, return as-is (though this shouldn't happen for image uploads)
      resolve(file);
      return;
    }

    // If already WebP, return as-is
    if (file.type === "image/webp") {
      resolve(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Create canvas
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;

        // Draw image on canvas
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Could not get canvas context"));
          return;
        }
        ctx.drawImage(img, 0, 0);

        // Convert to WebP blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Failed to convert image to WebP"));
              return;
            }

            // Create a new File object with WebP extension
            const webpFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".webp", {
              type: "image/webp",
              lastModified: Date.now(),
            });
            resolve(webpFile);
          },
          "image/webp",
          0.9 // Quality: 0.9 (90%) - good balance between quality and file size
        );
      };
      img.onerror = () => {
        reject(new Error("Failed to load image"));
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };
    reader.readAsDataURL(file);
  });
}

export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
}

export async function uploadToCloudinary(file: File): Promise<CloudinaryUploadResult> {
  const CLOUD_NAME = "dvq4f3k7q";
  const UPLOAD_PRESET = "skillvedika";

  try {
    // Validate file
    if (!(file instanceof File)) {
      throw new Error("Invalid image file");
    }

    if (!file.type || !file.type.startsWith("image/")) {
      throw new Error("Only image files are allowed");
    }

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      throw new Error("File size exceeds 10MB limit");
    }

    // Convert image to WebP format before uploading
    let webpFile: File;
    try {
      webpFile = await convertToWebP(file);
    } catch (conversionError: any) {
      console.error("WebP conversion error:", conversionError);
      // If conversion fails, try uploading the original file
      console.warn("WebP conversion failed, uploading original file format");
      webpFile = file;
    }

    const formData = new FormData();
    formData.append("file", webpFile);
    formData.append("upload_preset", UPLOAD_PRESET);

    // Add timeout to fetch request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        {
          method: "POST",
          body: formData,
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorMessage = "Cloudinary upload failed";
        try {
          const data = await response.json();
          console.error("Cloudinary error response:", data);
          errorMessage = data.error?.message || data.message || errorMessage;
        } catch (parseError) {
          console.error("Failed to parse error response:", parseError);
          errorMessage = `Upload failed with status ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      if (!data.public_id) {
        console.error("Cloudinary response missing public_id:", data);
        throw new Error("Upload succeeded but no public_id returned");
      }

      // Return object with both public_id and secure_url for backward compatibility
      return {
        public_id: data.public_id,
        secure_url: data.secure_url,
      };
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        throw new Error("Upload timeout: The request took too long. Please check your internet connection and try again.");
      }
      
      if (fetchError.message) {
        throw fetchError;
      }
      
      // Handle network errors
      if (fetchError instanceof TypeError && fetchError.message.includes('fetch')) {
        throw new Error("Network error: Failed to connect to Cloudinary. Please check your internet connection and try again.");
      }
      
      throw new Error(`Upload failed: ${fetchError.message || 'Unknown error'}`);
    }
  } catch (error: any) {
    console.error("Upload error:", error);
    
    // Re-throw with better error message if it's already an Error
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error(`Image upload failed: ${error?.message || 'Unknown error'}`);
  }
}




