// steps/StepCreatePassword.jsx
import React from 'react';
import PasswordField from '../pieces/PasswordField';

const StepCreatePassword = ({
  formData, errors, handleInputChange,
  handleInputFocus, handleInputBlur, handleNext, handleBack, switchFlow,
  computePasswordStrength
}) => {
  const strength = formData.password ? computePasswordStrength(formData.password) : { class: '', text: '' };

  return (
    <div className="step-content">
      <div className="step-main-content">
        <div className="form-group">
          <PasswordField
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            placeholder="Password"
            label="Password"
            error={errors.password}
            autoComplete="new-password"
            required
          />

          {formData.password && (
            <div className="password-strength">
              <div className="strength-bar">
                <div className={`strength-fill ${strength.class}`}></div>
              </div>
              <span className={`strength-text ${strength.class}`}>{strength.text}</span>
            </div>
          )}
        </div>

        <div className="form-group">
          <PasswordField
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            placeholder="Confirm"
            label="Confirm"
            error={errors.confirmPassword}
            autoComplete="new-password"
            required
          />
        </div>

        <div className="password-hint">
          Use 8 or more characters with a mix of letters, numbers & symbols
        </div>
      </div>

      <div className="step-actions">
        <div className="step-buttons">
          <button type="button" className="primary-button" onClick={handleNext}>Create Account</button>
        </div>
        <div className="alternative-actions">
          <span>Already have an account? </span>
          <button type="button" className="link-button" onClick={() => switchFlow('signin')}>Sign in here</button>
        </div>
      </div>
    </div>
  );
};

export default StepCreatePassword;
