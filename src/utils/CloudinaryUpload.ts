
// Cloudinary unsigned upload utility
export const uploadToCloudinary = async (file: File): Promise<string> => {
  try {
    const cloudName = 'dyp2q6oy1'; // Replace with your Cloudinary cloud name
    const uploadPreset = 'studentprofile'; // Replace with your unsigned upload preset
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);
    
    console.log('Starting Cloudinary upload for file:', file.name, 'size:', file.size);
    
    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Cloudinary upload failed:', errorText);
      throw new Error(`Upload failed: ${response.status} ${errorText}`);
    }
    
    const data = await response.json();
    console.log('Cloudinary upload successful, URL:', data.secure_url);
    return data.secure_url;
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw error;
  }
};
