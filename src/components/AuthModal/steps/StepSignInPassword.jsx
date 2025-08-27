// steps/StepSignInPassword.jsx
import React from 'react';
import PasswordField from '../pieces/PasswordField';

const StepSignInPassword = ({
  formData, errors, handleInputChange, handleInputFocus, handleInputBlur,
  handleNext, handleBack, switchFlow
}) => {
  return (
    <div className="step-content">
      <div className="step-main-content">
        <div className="step-header">
          <div className="user-info">
            <div className="user-avatar">
              {formData.email ? formData.email.charAt(0).toUpperCase() : ''}
            </div>
            <div className="user-details">
              <div className="user-email">{formData.email}</div>
            </div>
          </div>
        </div>

        <div className="form-group">
          <PasswordField
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            placeholder="Enter your password"
            label="Enter your password"
            error={errors.password}
            autoComplete="current-password"
          />
        </div>

        <div className="password-options">
          <button type="button" className="link-button forgot-password" onClick={() => switchFlow('forgot')}>
            Forgot password?
          </button>
        </div>
      </div>

      <div className="step-actions">
        <div className="step-buttons">
          <button type="button" className="secondary-button" onClick={handleBack}>Back</button>
          <button type="button" className="primary-button" onClick={handleNext}>Login</button>
        </div>
      </div>
    </div>
  );
};

export default StepSignInPassword;
