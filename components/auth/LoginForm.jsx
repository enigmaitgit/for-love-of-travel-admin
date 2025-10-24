"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Cookie helper functions
  const setCookie = (name, value, days = 1) => {
    const expires = new Date();
    expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
  };

  const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return decodeURIComponent(parts.pop().split(';').shift());
    return null;
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('API URL:', process.env.NEXT_PUBLIC_API_URL);
      console.log('Login data:', form);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
        credentials: "include",
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (response.ok) {
        const data = await response.json();
        console.log('Login success data:', data);
        
        // Backend sets JWT token in httpOnly cookie automatically
        // No need to store token in frontend - backend handles it
        console.log('Login successful - JWT token set by backend in httpOnly cookie');
        
        alert("Logged in successfully!");
        const redirectUrl = process.env.NEXT_PUBLIC_REDIRECT_AFTER_LOGIN || "/layout-1/blog/dashboard";
        // Check if it's an external URL
        if (redirectUrl.startsWith('http')) {
          window.location.href = redirectUrl;
        } else {
          router.push(redirectUrl);
        }
      } else {
        const errorData = await response.json();
        console.error('Backend error:', errorData);
        alert(`Backend Error: ${errorData.message || `Status ${response.status}`}`);
      }
    } catch (error) {
      console.error("Frontend/Network error:", error);
      alert(`Frontend Error: ${error.message}. Check if backend is running on ${process.env.NEXT_PUBLIC_API_URL}`);
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      padding: '2rem 1rem',
      width: '100%'
    }}>
      {/* Background Pattern */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: `url("data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%239C92AC%22%20fill-opacity%3D%220.05%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        opacity: 0.4,
        pointerEvents: 'none'
      }}></div>

      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: '32rem',
        margin: '0 auto',
        display: 'flex',
        justifyContent: 'center'
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '1rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          border: '1px solid #e2e8f0',
          overflow: 'hidden'
        }}>
          <form onSubmit={handleSubmit} style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ marginBottom: '1rem' }}>
                <div style={{
                  width: '3.5rem',
                  height: '3.5rem',
                  margin: '0 auto',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                  borderRadius: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '0.75rem'
                }}>
                  <svg
                    style={{ width: '1.75rem', height: '1.75rem', color: 'white' }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                <h1 style={{
                  fontSize: '1.25rem',
                  fontWeight: 'bold',
                  color: '#0f172a',
                  marginBottom: '0.25rem'
                }}>
                  Welcome Back
                </h1>
                <p style={{
                  color: '#64748b',
                  fontSize: '0.875rem'
                }}>
                  Sign in to your account to continue
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.875rem' }}>
                <span style={{ color: '#64748b', marginRight: '0.5rem' }}>
                  Don't have an account?
                </span>
                <a
                  href="/signup"
                  style={{
                    color: '#2563eb',
                    textDecoration: 'none',
                    fontWeight: '500',
                    transition: 'color 0.2s ease-in-out'
                  }}
                  onMouseEnter={(e) => e.target.style.color = '#1d4ed8'}
                  onMouseLeave={(e) => e.target.style.color = '#2563eb'}
                >
                  Sign up
                </a>
              </div>
            </div>

            {/* Social Login Buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
              <button
                type="button"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0.75rem 1rem',
                  border: '1px solid #cbd5e1',
                  borderRadius: '0.5rem',
                  backgroundColor: 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease-in-out'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#f8fafc';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'white';
                }}
              >
                {/* Google Icon */}
                <svg style={{ width: '1.25rem', height: '1.25rem', marginRight: '0.5rem' }} viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span style={{ color: '#374151', fontSize: '0.875rem', fontWeight: '500' }}>
                  Google
                </span>
              </button>

              <button
                type="button"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0.75rem 1rem',
                  border: '1px solid #cbd5e1',
                  borderRadius: '0.5rem',
                  backgroundColor: 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease-in-out'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#f8fafc';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'white';
                }}
              >
                {/* Apple Icon */}
                <svg style={{ width: '1.25rem', height: '1.25rem', marginRight: '0.5rem' }} viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.96-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.03-3.11z"/>
                </svg>
                <span style={{ color: '#374151', fontSize: '0.875rem', fontWeight: '500' }}>
                  Apple
                </span>
              </button>
            </div>

            {/* Divider */}
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1px', backgroundColor: '#cbd5e1' }}></div>
              <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
                <span style={{
                  padding: '0 0.5rem',
                  backgroundColor: 'white',
                  color: '#64748b',
                  fontSize: '0.75rem',
                  fontWeight: '500',
                  textTransform: 'uppercase'
                }}>
                  Or continue with
                </span>
              </div>
            </div>

            {/* Form Fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Email */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#374151'
                }}>
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '0.75rem 1rem',
                    border: '1px solid #cbd5e1',
                    borderRadius: '0.5rem',
                    backgroundColor: 'white',
                    color: '#111827',
                    fontSize: '1rem',
                    outline: 'none',
                    transition: 'all 0.2s ease-in-out'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#3b82f6';
                    e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#cbd5e1';
                    e.target.style.boxShadow = 'none';
                  }}
                  placeholder="Enter your email"
                />
              </div>

              {/* Password */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#374151'
                  }}>
                    Password
                  </label>
                  <a 
                    href="/forgotpassword" 
                    style={{
                      fontSize: '0.875rem',
                      color: '#2563eb',
                      textDecoration: 'none',
                      fontWeight: '500',
                      transition: 'color 0.2s ease-in-out'
                    }}
                    onMouseEnter={(e) => e.target.style.color = '#1d4ed8'}
                    onMouseLeave={(e) => e.target.style.color = '#2563eb'}
                  >
                    Forgot password?
                  </a>
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    required
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '0.75rem 1rem',
                      border: '1px solid #cbd5e1',
                      borderRadius: '0.5rem',
                      backgroundColor: 'white',
                      color: '#111827',
                      fontSize: '1rem',
                      outline: 'none',
                      transition: 'all 0.2s ease-in-out'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#3b82f6';
                      e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#cbd5e1';
                      e.target.style.boxShadow = 'none';
                    }}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    style={{
                      position: 'absolute',
                      top: '50%',
                      right: '0.75rem',
                      transform: 'translateY(-50%)',
                      display: 'flex',
                      alignItems: 'center',
                      backgroundColor: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '0.25rem',
                      color: '#6b7280',
                      fontSize: '0.875rem',
                      fontWeight: '500'
                    }}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
                padding: '0.75rem 1rem',
                border: 'none',
                borderRadius: '0.5rem',
                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: 'white',
                background: 'linear-gradient(135deg, #2563eb 0%, #8b5cf6 100%)',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.5 : 1,
                transition: 'all 0.2s ease-in-out',
                transform: 'scale(1)',
                outline: 'none'
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.target.style.background = 'linear-gradient(135deg, #1d4ed8 0%, #7c3aed 100%)';
                  e.target.style.transform = 'scale(1.02)';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.target.style.background = 'linear-gradient(135deg, #2563eb 0%, #8b5cf6 100%)';
                  e.target.style.transform = 'scale(1)';
                }
              }}
              onFocus={(e) => {
                e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)';
              }}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}


