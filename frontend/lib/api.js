import axios from 'axios';

// Create Axios Instance pointing to either the deployed Python API or local
export const api = axios.create({
  baseURL: (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/$/, ''),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Upload media (YOLO detection via Python Backend)
export const uploadMedia = async (file) => {
  const formData = new FormData();
  formData.append('media', file);

  const { data } = await api.post('/detect/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  if (data.error) {
    throw new Error(data.error);
  }

  return data;
};