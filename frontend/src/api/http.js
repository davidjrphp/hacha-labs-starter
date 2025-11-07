import axios from 'axios';
const http = axios.create({ baseURL: '/api' });
http.defaults.withCredentials = true;
export default http;
