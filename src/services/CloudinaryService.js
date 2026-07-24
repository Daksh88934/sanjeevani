export const uploadToCloudinary = async (base64Image, patientId = 'Anonymous') => {
  try {
    // These will be configured by the user in Vercel / .env
    const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

    if (!CLOUD_NAME || !UPLOAD_PRESET) {
      throw new Error("Cloudinary configuration missing. Please add VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET to your environment variables.");
    }

    const formData = new FormData();
    formData.append('file', base64Image);
    formData.append('upload_preset', UPLOAD_PRESET);
    // Link the image explicitly to the patient via tags for professional systematic management
    formData.append('tags', `patient_${patientId},sanjeevani_ehr`);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || "Failed to upload image to Cloudinary");
    }

    const data = await response.json();
    return data.secure_url; 
  } catch (error) {
    console.error("Cloudinary Upload Error:", error);
    throw error;
  }
};
