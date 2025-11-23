import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login(){
  const nav = useNavigate();
  const { login } = useAuth();
  const [f,setF] = useState({email:'',password:''});
  const [err,setErr] = useState('');
  const [loading,setLoading]=useState(false);

  const submit = async e => {
    e.preventDefault();
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) return setErr('Enter a valid email');
    if(f.password.length < 8) return setErr('Password must be 8+ characters');
    try{
      setLoading(true);
      const user = await login(f);
      if(user.role === 'admin') nav('/admin');
      else if(user.role === 'doctor') nav('/doctor');
      else nav('/appointments');
    }catch(e){
      setErr(e.response?.data?.message || 'Login failed');
    }finally{
      setLoading(false);
    }
  };

  return (
    <div className="container py-5" style={{minHeight:'80vh'}}>
      {/* Brand header */}
      <div className="text-center mb-4">
        {/* Slightly bigger than navbar logo */}
        <img
          src="/hacha-logo.png"
          alt="Hacha Labs"
          style={{height: '80px', width: 'auto'}}
        />
        <h5 className="mt-3 mb-0 fw-semibold" style={{color:'#003a70'}}>
          Welcome to Hacha Labs Portal
        </h5>
      </div>

      {/* Auth card */}
      <div className="mx-auto p-4 shadow rounded-4 bg-body" style={{maxWidth:520}}>
        <div className="btn-group w-100 mb-3" role="tablist" aria-label="Authentication tabs">
          <button className="btn btn-primary" type="button" aria-current="page">Login</button>
          <Link to="/register" className="btn btn-light">Register</Link>
        </div>

        <form onSubmit={submit} noValidate>
          <div className="mb-3">
            <input
              className="form-control form-control-lg"
              type="email"
              placeholder="Email"
              value={f.email}
              onChange={e=>setF({...f,email:e.target.value})}
              autoComplete="email"
              required
            />
          </div>
          <div className="mb-3">
            <input
              type="password"
              className="form-control form-control-lg"
              placeholder="Password"
              value={f.password}
              onChange={e=>setF({...f,password:e.target.value})}
              autoComplete="current-password"
              required
              minLength={8}
            />
          </div>

          {err && <div className="alert alert-danger py-2" role="alert">{err}</div>}

          <button className="btn btn-primary w-100 btn-lg" type="submit" disabled={loading}>
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="text-end mt-3">
          <a href="#" className="link-success">Forgot password?</a>
        </div>
      </div>
    </div>
  );
}
