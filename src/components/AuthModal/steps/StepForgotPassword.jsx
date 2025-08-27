// steps/StepForgotPassword.jsx
import React from 'react';

const StepForgotPassword = ({
  formData, errors, handleInputChange,
  handleNext, switchFlow
}) => {
  return (
    <div className="step-content">
      <div className="step-main-content">
        <div className="forgot-header">
          <h3>Reset your password</h3>
          <p>Enter your email address and we'll send you a link to reset your password.</p>
        </div>

        <div className="form-group">
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="Enter your email address"
            className={`floating-input ${formData.email ? 'has-value' : ''} ${errors.email ? 'error' : ''}`}
            aria-label="Email address"
            autoComplete="email"
          />
          <label className="floating-label">Enter your email address</label>
          {errors.email && <span className="error-message" role="alert">{errors.email}</span>}
        </div>
      </div>

      <div className="step-actions">
        <div className="step-buttons">
          <button type="button" className="secondary-button" onClick={() => switchFlow('signin')}>Back to Sign in</button>
          <button type="button" className="primary-button" onClick={handleNext}>Send Reset Link</button>
        </div>
      </div>

      <div className="alternative-actions">
        <span>Don't have an account? </span>
        <button type="button" className="link-button" onClick={() => switchFlow('create')}>Sign up here</button>
      </div>
    </div>
  );
};

export default StepForgotPassword;
