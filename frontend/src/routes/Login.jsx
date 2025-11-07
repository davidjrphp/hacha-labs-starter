import { useState } from "react";
import http from "../api/http.js";
import { Link, useNavigate } from "react-router-dom";

export default function Login(){
  const nav = useNavigate();
  const [f,setF] = useState({email:'',password:''});
  const [err,setErr] = useState('');
  const submit = async e => {
    e.preventDefault();
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) return setErr('Enter a valid email');
    if(f.password.length<8) return setErr('Password must be 8+ chars');
    try{ await http.post('/auth/login', f); nav('/appointments'); }
    catch(e){ setErr(e.response?.data?.message || 'Login failed'); }
  };
  return (
    <div className="container py-5" style={{minHeight:'80vh'}}>
      <div className="mx-auto p-4 shadow rounded-4 bg-body" style={{maxWidth:520}}>
        <div className="btn-group w-100 mb-3">
          <button className="btn btn-primary">Login</button>
          <Link to="/register" className="btn btn-light">Register</Link>
        </div>
        <form onSubmit={submit}>
          <div className="mb-3">
            <input className="form-control form-control-lg" placeholder="Email"
              value={f.email} onChange={e=>setF({...f,email:e.target.value})}/>
          </div>
          <div className="mb-3">
            <input type="password" className="form-control form-control-lg" placeholder="Password"
              value={f.password} onChange={e=>setF({...f,password:e.target.value})}/>
          </div>
          {err && <div className="alert alert-danger py-2">{err}</div>}
          <button className="btn btn-primary w-100 btn-lg">Sign In</button>
        </form>
        <div className="text-end mt-3"><a href="#" className="link-success">Forgot password?</a></div>
      </div>
    </div>
  );
}
