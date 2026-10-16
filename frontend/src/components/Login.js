import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from './AuthLayout';

function Login() {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    usertype: 'user'
  });

  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);

    try {
      const response = await fetch(
        'http://localhost:5000/api/auth/login',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            username: formData.username,
            password: formData.password
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || 'Invalid username or password');
        return;
      }

      // Save the token and actual user type returned by the backend
      localStorage.setItem('tok', data.token);
      localStorage.setItem('usertype', data.usertype);
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
        if (data.user._id) localStorage.setItem('userId', data.user._id);
        if (data.user.name) localStorage.setItem('name', data.user.name);
      }

      setMessage('Login successful!');

      // Redirect according to the role stored in the database
      if (data.usertype === 'admin') {
        window.location.href = '/admin.html';
      } else {
        window.location.href = '/user-dashboard.html';
      }
    } catch (error) {
      console.error('Login error:', error);
      setMessage(
        'Cannot connect to server. Please start the backend.'
      );
    } finally {
      setLoading(false);
    }
  };

  const isSuccess = /successful/i.test(message);

  return (
    <AuthLayout
      title="Login"
      subtitle="Sign in to manage your auditorium bookings"
      breadcrumb="Login"
    >
      <div className="auth-card">
        <h2 className="auth-heading">Welcome Back</h2>
        <p className="auth-lead">Auditorium Management System</p>

        <form onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="username">
              <i className="bi bi-person"></i> Username
            </label>
            <input
              id="username"
              className="auth-input"
              type="text"
              name="username"
              placeholder="Enter username"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </div>

          <div className="auth-field">
            <label htmlFor="password">
              <i className="bi bi-lock"></i> Password
            </label>
            <input
              id="password"
              className="auth-input"
              type="password"
              name="password"
              placeholder="Enter password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <div className="auth-field">
            <label htmlFor="usertype">
              <i className="bi bi-person-badge"></i> User Type
            </label>
            <select
              id="usertype"
              className="auth-input"
              name="usertype"
              value={formData.usertype}
              onChange={handleChange}
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {message && (
            <div
              role="status"
              className={`auth-alert ${
                isSuccess ? 'auth-alert--success' : 'auth-alert--error'
              }`}
            >
              {message}
            </div>
          )}

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="auth-switch">
          Not registered yet? <Link to="/registration">Register here</Link>
        </p>
      </div>
    </AuthLayout>
  );
}

export default Login;
