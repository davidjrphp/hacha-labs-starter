import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/theme.css';
import './styles/portal.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

import AOS from 'aos';
import 'aos/dist/aos.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

AOS.init({ duration: 600, easing: 'ease-out', offset: 60, once: true });

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
