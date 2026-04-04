import axios from 'axios';

const api = axios.create({
  baseURL: '/api/',          // ending with slash ensures safe relative appends
  headers: { 'Content-Type': 'application/json' },
});

export default api;
