import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from './AuthLayout';

function Registration() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    address: '',
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
        'http://localhost:5000/api/auth/register',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formData)
        }
      );

      const contentType =
        response.headers.get('content-type') || '';

      if (!contentType.includes('application/json')) {
        const responseText = await response.text();
        console.error('Unexpected server response:', responseText);

        throw new Error(
          'Server returned an invalid response. Check your backend API route.'
        );
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      setMessage(data.message || 'Registration successful!');

      setFormData({
        name: '',
        email: '',
        phoneNumber: '',
        address: '',
        username: '',
        password: '',
        usertype: 'user'
      });
    } catch (error) {
      console.error('Registration error:', error);
      setMessage(error.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isSuccess =
    message.toLowerCase().includes('successful') ||
    message.toLowerCase().includes('registered');

  return (
    <AuthLayout
      title="Registration"
      subtitle="Create an account to start booking auditoriums"
      breadcrumb="Registration"
    >
      <div className="auth-card auth-card--wide">
        <h2 className="auth-heading">Create Your Account</h2>
        <p className="auth-lead">Auditorium Management System</p>

        <form onSubmit={handleSubmit}>
          <div className="auth-grid">
            <div className="auth-field">
              <label htmlFor="name">
                <i className="bi bi-person"></i> Full Name
              </label>
              <input
                id="name"
                className="auth-input"
                type="text"
                name="name"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="auth-field">
              <label htmlFor="email">
                <i className="bi bi-envelope"></i> Email
              </label>
              <input
                id="email"
                className="auth-input"
                type="email"
                name="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="auth-field">
              <label htmlFor="phoneNumber">
                <i className="bi bi-telephone"></i> Phone Number
              </label>
              <input
                id="phoneNumber"
                className="auth-input"
                type="tel"
                name="phoneNumber"
                placeholder="Enter your phone number"
                value={formData.phoneNumber}
                onChange={handleChange}
                required
              />
            </div>

            <div className="auth-field">
              <label htmlFor="username">
                <i className="bi bi-person-badge"></i> Username
              </label>
              <input
                id="username"
                className="auth-input"
                type="text"
                name="username"
                placeholder="Create a username"
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
                placeholder="Create a password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            <div className="auth-field auth-field--full">
              <label htmlFor="address">
                <i className="bi bi-geo-alt"></i> Address
              </label>
              <textarea
                id="address"
                className="auth-input"
                name="address"
                placeholder="Enter your address"
                value={formData.address}
                onChange={handleChange}
                required
              ></textarea>
            </div>
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
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Login here</Link>
        </p>
      </div>
    </AuthLayout>
  );
}

export default Registration;