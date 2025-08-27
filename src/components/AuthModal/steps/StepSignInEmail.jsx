// steps/StepSignInEmail.jsx
import React from 'react';
import GoogleButton from '../pieces/GoogleButton';

const StepSignInEmail = ({
  formData, errors, handleInputChange,
  handleInputFocus, handleInputBlur,
  handleNext, switchFlow, isMobile
}) => {
  return (
    <div className="step-content">
      <div className="step-main-content">
        <div className="social-auth-section">
          <GoogleButton onSuccess={() => { /* optionally close or continue */ }} />
          <div className="divider"><span>or</span></div>
        </div>

        <div className="form-group">
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            placeholder="you@example.com"
            className={`floating-input ${formData.email ? 'has-value' : ''} ${errors.email ? 'error' : ''}`}
            aria-label="Email address"
            autoComplete="email"
            inputMode={isMobile ? 'email' : undefined}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck="false"
          />
          <label className="floating-label">Email address</label>
          {errors.email && <span className="error-message" role="alert">{errors.email}</span>}
        </div>
      </div>

      <div className="step-actions">
        <div className="step-buttons">
          <button type="button" className="primary-button" onClick={handleNext}>Next</button>
        </div>
        <div className="alternative-actions">
          <span>Don't have an account? </span>
          <button type="button" className="link-button" onClick={() => switchFlow('create')}>Sign up here</button>
        </div>
      </div>
    </div>
  );
};

export default StepSignInEmail;
