import axios from 'axios';

const http = axios.create({
  baseURL: '/api',           // Always relative to the same host
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default http;
