import axios from 'axios';

const http = axios.create({
  baseURL: '/api',           
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default http;
