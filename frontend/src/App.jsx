import { BrowserRouter, Routes, Route } from "react-router-dom";
import NavbarX from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import Home from "./routes/Home.jsx";
import About from "./routes/About.jsx";
import Services from "./routes/Services.jsx";
import Service from "./routes/Service.jsx";
import Research from "./routes/Research.jsx";
import ResearchItem from "./routes/ResearchItem.jsx";
import Login from "./routes/Login.jsx";
import Register from "./routes/Register.jsx";
import Appointments from "./routes/Appointments.jsx";
import Messages from "./routes/Messages.jsx";
import Protected from "./components/Protected.jsx";
import { useState, useEffect } from "react";

export default function App(){
  const [theme,setTheme] = useState(localStorage.getItem('theme') || 'light');
  useEffect(()=>{ document.documentElement.dataset.theme = theme; localStorage.setItem('theme', theme);},[theme]);
  return (
    <BrowserRouter>
      <NavbarX theme={theme} setTheme={setTheme}/>
      <Routes>
        <Route path="/" element={<Home/>}/>
        <Route path="/about" element={<About/>}/>
        <Route path="/services" element={<Services/>}/>
        <Route path="/services/:slug" element={<Service/>}/>
        <Route path="/research" element={<Research/>}/>
        <Route path="/research/:slug" element={<ResearchItem/>}/>
        <Route path="/login" element={<Login/>}/>
        <Route path="/register" element={<Register/>}/>
        <Route path="/appointments" element={<Protected><Appointments/></Protected>}/>
        <Route path="/messages" element={<Protected><Messages/></Protected>}/>
      </Routes>
      <Footer/>
    </BrowserRouter>
  );
}
