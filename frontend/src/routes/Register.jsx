import { useState } from "react";
import http from "../api/http.js";
import { Link, useNavigate } from "react-router-dom";

export default function Register(){
  const nav = useNavigate();
  const [f,setF]=useState({full_name:'',email:'',password:'',confirm:''});
  const [err,setErr]=useState('');
  const submit = async e=>{
    e.preventDefault();
    if(f.password!==f.confirm) return setErr('Passwords do not match');
    try{ await http.post('/auth/register', {full_name:f.full_name,email:f.email,password:f.password}); nav('/login'); }
    catch(e){ setErr(e.response?.data?.message || 'Registration failed'); }
  };
  return (
    <div className="container py-5" style={{minHeight:'80vh'}}>
      <div className="mx-auto p-4 shadow rounded-4 bg-body" style={{maxWidth:520}}>
        <div className="btn-group w-100 mb-3">
          <Link to="/login" className="btn btn-light">Login</Link>
          <button className="btn btn-primary">Register</button>
        </div>
        <form onSubmit={submit}>
          <input className="form-control form-control-lg mb-3" placeholder="Full Name"
            value={f.full_name} onChange={e=>setF({...f,full_name:e.target.value})}/>
          <input className="form-control form-control-lg mb-3" placeholder="Email"
            value={f.email} onChange={e=>setF({...f,email:e.target.value})}/>
          <input type="password" className="form-control form-control-lg mb-3" placeholder="Password"
            value={f.password} onChange={e=>setF({...f,password:e.target.value})}/>
          <input type="password" className="form-control form-control-lg mb-3" placeholder="Confirm Password"
            value={f.confirm} onChange={e=>setF({...f,confirm:e.target.value})}/>
          {err && <div className="alert alert-danger py-2">{err}</div>}
          <button className="btn btn-primary w-100 btn-lg">Create Account</button>
        </form>
      </div>
    </div>
  );
}
