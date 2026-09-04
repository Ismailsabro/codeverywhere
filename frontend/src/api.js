import axios from 'axios';

// En local: http://localhost:5000/api
// Sur Render: mets l'URL de ton backend déployé dans les variables d'environnement (REACT_APP_API_URL)
const instance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api'
});

instance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default instance;
