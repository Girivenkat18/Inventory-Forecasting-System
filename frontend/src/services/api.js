import axios from 'axios';

const API = axios.create({ baseURL: 'http://127.0.0.1:5001/api' });

export const fetchOverview = () => API.get('/data/overview');
export const fetchProducts = () => API.get('/data/products');
export const uploadProducts = (formData) => API.post('/upload/products', formData);
export const uploadSales = (formData) => API.post('/upload/sales', formData);
export const generateForecast = (data) => API.post('/forecast/generate', data);

