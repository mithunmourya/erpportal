import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const { login } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const pathRef = useRef(null);
  const dotRef = useRef(null);

  useEffect(() => {
    const path = pathRef.current;
    const dot = dotRef.current;
    let animationFrameId;

    if (path && dot && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const len = path.getTotalLength();
      let t = 0;
      
      const step = () => {
        t += 0.0035; 
        if (t > 1) t = 0;
        const p = path.getPointAtLength(t * len);
        dot.setAttribute('cx', p.x); 
        dot.setAttribute('cy', p.y);
        animationFrameId = requestAnimationFrame(step);
      };
      
      step();
    }
    
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, []);

  const validateField = (field, value) => {
    let msg = '';
    if (!value) msg = 'This field is required';
    else if (field === 'email' && !/\S+@\S+\.\S+/.test(value)) msg = 'Invalid email address';
    
    setErrors(prev => ({ ...prev, [field]: msg }));
    return !msg;
  };

  const handleBlur = (field, value) => {
    validateField(field, value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const isEmailValid = validateField('email', email);
    const isPasswordValid = validateField('password', password);

    if (!isEmailValid || !isPasswordValid) {
      toast.error('Validation Error', 'Check the highlighted fields');
      return;
    }

    try {
      const role = await login(email, password);
      if (role) {
        toast.success('Login Successful', `Welcome back to the ${role} workspace`);
        if (role === 'Admin') navigate('/admin/dashboard');
        else if (role === 'Sales') navigate('/seller/dashboard');
        else if (role === 'Warehouse') navigate('/warehouse/dashboard');
        else if (role === 'Accounts') navigate('/accounts/dashboard');
      } else {
        toast.error('Login Failed', 'Invalid credentials');
      }
    } catch (err) {
      if (err.response && err.response.data) {
        toast.error('Login Failed', err.response.data.message || 'Login failed');
      } else {
        toast.error('Connection Error', 'Server connection failed');
      }
    }
  };

  const handleDemoClick = (demoEmail) => {
    setEmail(demoEmail);
    setPassword('password123');
    setErrors({});
  };

  return (
    <>
      <style>{`
        :root {
          --paper: #F6F4EE;
          --paper-raised: #FFFFFF;
          --ink: #1C2230;
          --ink-soft: #6B7280;
          --border: #E4E1D8;
          --brand: #1F8A6F;
          --brand-dark: #166352;
          --brand-soft: #E7F3EE;
        }
        .login-page * { box-sizing: border-box; }
        .login-page {
          min-height: 100vh;
          font-family: 'IBM Plex Sans', sans-serif;
          color: var(--ink); 
          background: var(--paper);
          display: flex; 
          overflow-x: hidden;
        }
        .login-page .topbar { position:fixed; top:0; left:0; right:0; height:4px; background:var(--ink); z-index:10; }

        .login-page .brand-panel {
          flex:1.15; position:relative; padding:64px 64px 48px;
          display:flex; flex-direction:column; justify-content:center;
          background-image: radial-gradient(var(--border) 1px, transparent 1px);
          background-size:22px 22px; overflow:hidden;
        }
        .login-page .mark {
          width:52px; height:52px; border-radius:14px; background:var(--brand);
          margin-bottom:34px; opacity:0; transform:scale(.6);
          animation:pop .5s cubic-bezier(.2,.9,.3,1.3) .15s forwards;
        }
        .login-page h1.headline {
          font-family:'Fraunces', serif; font-optical-sizing:auto; font-weight:600;
          font-size:clamp(38px, 4.6vw, 58px); line-height:1.04; margin:0 0 22px; overflow:hidden;
        }
        .login-page h1.headline span { display:block; transform:translateY(115%); animation:rise .7s cubic-bezier(.2,.8,.2,1) forwards; }
        .login-page h1.headline span:nth-child(1) { animation-delay:.28s; }
        .login-page h1.headline span:nth-child(2) { animation-delay:.4s; }
        .login-page .company { color:var(--ink-soft); font-size:16px; margin:0 0 36px; opacity:0; animation:fadeUp .6s ease .62s forwards; }
        .login-page .features { list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:16px; }
        .login-page .features li {
          display:flex; align-items:center; gap:12px; font-size:15px; font-weight:500;
          opacity:0; transform:translateY(8px); animation:fadeUp .5s ease forwards;
        }
        .login-page .features li:nth-child(1) { animation-delay:.74s; }
        .login-page .features li:nth-child(2) { animation-delay:.84s; }
        .login-page .features li:nth-child(3) { animation-delay:.94s; }
        .login-page .features li:nth-child(4) { animation-delay:1.04s; }
        .login-page .features li .dot { width:7px; height:7px; border-radius:50%; background:var(--brand); flex-shrink:0; }

        .login-page .route { position:absolute; left:64px; right:64px; bottom:70px; height:60px; opacity:0; animation:fadeUp .7s ease 1.2s forwards; }
        .login-page .route svg { width:100%; height:100%; overflow:visible; }
        .login-page .route path { fill:none; stroke:var(--border); stroke-width:2; stroke-dasharray:4 6; }
        .login-page .route circle { fill:var(--brand); }

        .login-page .auth-panel { flex:1; display:flex; align-items:center; justify-content:center; padding:40px; border-left:1px solid var(--border); }
        .login-page .card {
          width:100%; max-width:420px; background:var(--paper-raised); border:1px solid var(--border);
          border-radius:16px; padding:40px 38px 34px; box-shadow:0 30px 60px -25px rgba(28,34,48,.18);
          opacity:0; transform:translateY(18px); animation:fadeUp .6s cubic-bezier(.2,.8,.2,1) .3s forwards;
        }
        .login-page h2.title { font-family:'Fraunces', serif; font-weight:600; font-size:27px; margin:0 0 6px; }
        .login-page .subtitle { color:var(--ink-soft); font-size:14.5px; margin:0 0 28px; }
        .login-page .field { margin-bottom:18px; }
        .login-page .field label { display:block; font-size:13px; font-weight:500; color:var(--ink-soft); margin-bottom:7px; }
        .login-page .field input {
          width:100%; padding:12px 14px; font-size:14.5px; font-family:'IBM Plex Sans';
          border:1.5px solid var(--border); border-radius:9px; background:var(--paper); color:var(--ink);
          outline:none; transition:border-color .18s ease, box-shadow .18s ease, background .18s ease;
        }
        .login-page .field input:focus { border-color:var(--brand); background:var(--paper-raised); box-shadow:0 0 0 4px var(--brand-soft); }
        .login-page .signin {
          width:100%; margin-top:6px; padding:13px 0; border:none; border-radius:9px;
          background:var(--brand-dark); color:#fff; font-size:15px; font-weight:600;
          cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px;
          transition:transform .12s ease, background .18s ease;
          box-shadow:0 8px 20px -8px rgba(22,99,82,.55);
        }
        .login-page .signin:hover { background:var(--brand); transform:translateY(-1px); }
        .login-page .signin:active { transform:translateY(0) scale(.98); }
        .login-page .demo { margin-top:24px; padding-top:18px; border-top:1px dashed var(--border); }
        .login-page .demo p { margin:0 0 8px; font-size:11.5px; font-weight:600; letter-spacing:.03em; text-transform:uppercase; color:var(--ink-soft); }
        .login-page .demo-list { display:flex; flex-direction:column; gap:5px; }
        .login-page .demo-row {
          display:flex; align-items:center; justify-content:space-between; font-family:'IBM Plex Mono', monospace;
          font-size:12px; padding:6px 10px; border-radius:6px; background:var(--paper); border:1px solid var(--border);
          cursor:pointer; transition:border-color .15s ease, background .15s ease;
        }
        .login-page .demo-row:hover { border-color:var(--brand); background:var(--brand-soft); }
        .login-page .demo-row .role { color:var(--brand-dark); font-size:11px; font-weight:500; }

        @keyframes fadeUp { from{ opacity:0; transform:translateY(10px);} to{opacity:1; transform:translateY(0);} }
        @keyframes rise { to{ transform:translateY(0); } }
        @keyframes pop { to{ opacity:1; transform:scale(1); } }

        @media (max-width: 880px){
          .login-page { flex-direction:column; }
          .login-page .brand-panel { padding:44px 28px 34px; }
          .login-page .route { display:none; }
          .login-page .auth-panel { border-left:none; border-top:1px solid var(--border); }
        }
        @media (prefers-reduced-motion: reduce){
          .login-page * { animation-duration:.01ms !important; animation-delay:0s !important; transition-duration:.01ms !important; }
        }
      `}</style>
      <div className="login-page">
        <div className="topbar"></div>

        <section className="brand-panel">
          <div className="mark"></div>
          <h1 className="headline"><span>Operations ERP</span><span>Portal</span></h1>
          <p className="company">ABC Distributors Pvt. Ltd.</p>
          <ul className="features">
            <li><span className="dot"></span>CRM Management</li>
            <li><span className="dot"></span>Inventory Control</li>
            <li><span className="dot"></span>Sales Challans</li>
            <li><span className="dot"></span>Role-Based Access</li>
          </ul>
          <div className="route">
            <svg viewBox="0 0 600 60" preserveAspectRatio="none">
              <path ref={pathRef} d="M0,40 C150,10 300,55 600,20" />
              <circle ref={dotRef} id="pulseDot" r="5" />
            </svg>
          </div>
        </section>

        <section className="auth-panel">
          <div className="card">
            <h2 className="title">Welcome back</h2>
            <p className="subtitle">Sign in to your workspace</p>

            <form onSubmit={handleSubmit} noValidate>
              <div className="field">
                <label htmlFor="email">Email address</label>
                <input 
                  id="email" 
                  type="email" 
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) validateField('email', e.target.value);
                  }}
                  onBlur={(e) => handleBlur('email', e.target.value)}
                  className={`input-field ${errors.email ? 'has-error' : ''}`}
                />
                <div className={`field-error-container ${errors.email ? 'show' : ''}`}>
                  <div className="field-error-text">{errors.email}</div>
                </div>
              </div>
              <div className="field">
                <label htmlFor="pw">Password</label>
                <input 
                  id="pw" 
                  type="password" 
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) validateField('password', e.target.value);
                  }}
                  onBlur={(e) => handleBlur('password', e.target.value)}
                  className={`input-field ${errors.password ? 'has-error' : ''}`}
                />
                <div className={`field-error-container ${errors.password ? 'show' : ''}`}>
                  <div className="field-error-text">{errors.password}</div>
                </div>
              </div>
              <button className="signin" type="submit">Sign in <span>→</span></button>
            </form>

            <div className="demo">
              <p>Demo accounts · password123</p>
              <div className="demo-list">
                <div className="demo-row" onClick={() => handleDemoClick('admin@erp.com')}>
                  <span>admin@erp.com</span><span className="role">Admin</span>
                </div>
                <div className="demo-row" onClick={() => handleDemoClick('rahul@erp.com')}>
                  <span>rahul@erp.com</span><span className="role">Sales</span>
                </div>
                <div className="demo-row" onClick={() => handleDemoClick('ramesh@erp.com')}>
                  <span>ramesh@erp.com</span><span className="role">Warehouse</span>
                </div>
                <div className="demo-row" onClick={() => handleDemoClick('priya@erp.com')}>
                  <span>priya@erp.com</span><span className="role">Accounts</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default Login;
