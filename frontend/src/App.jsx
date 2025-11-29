import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import { AuthProvider } from "./context/AuthContext.jsx";
import AdminPortal from "./routes/AdminPortal.jsx";
import DoctorPortal from "./routes/DoctorPortal.jsx";
import DoctorSchedule from "./routes/DoctorSchedule.jsx";
import PublicShell from "./components/PublicShell.jsx";
import NewsDetail from "./routes/NewsDetail.jsx";

export default function App(){
  const [theme,setTheme] = useState(localStorage.getItem('theme') || 'light');
  useEffect(()=>{ document.documentElement.dataset.theme = theme; localStorage.setItem('theme', theme);},[theme]);
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<PublicShell theme={theme} setTheme={setTheme}/>}>
            <Route path="/" element={<Home/>}/>
            <Route path="/about" element={<About/>}/>
            <Route path="/services" element={<Services/>}/>
            <Route path="/services/:slug" element={<Service/>}/>
            <Route path="/research" element={<Research/>}/>
            <Route path="/research/:slug" element={<ResearchItem/>}/>
            <Route path="/news/:id" element={<NewsDetail/>}/>
            <Route path="/login" element={<Login/>}/>
            <Route path="/register" element={<Register/>}/>
          </Route>
          <Route path="/appointments" element={<Protected roles={['patient']}><Appointments/></Protected>}/>
          <Route path="/messages" element={<Protected roles={['patient']}><Messages/></Protected>}/>
          <Route path="/admin" element={<Protected roles={['admin']}><AdminPortal/></Protected>}/>
          <Route path="/doctor" element={<Protected roles={['doctor']}><DoctorPortal/></Protected>}/>
          <Route path="/doctor/schedule" element={<Protected roles={['doctor']}><DoctorSchedule/></Protected>}/>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
