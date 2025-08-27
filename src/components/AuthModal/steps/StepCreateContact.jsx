// steps/StepCreateContact.jsx
import React, { useEffect, useCallback } from 'react';
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { useEmailValidation } from '../hooks/useEmailValidation';

const StepCreateContact = ({
  formData, errors, setFormData,
  handleInputFocus, handleInputBlur,
  handleNext, handleBack, switchFlow, isMobile
}) => {
  const {
    checkEmailAvailability,
    clearEmailStatus,
    getEmailError,
    getEmailClassName,
    isCheckingEmail,
    validateEmail
  } = useEmailValidation();

  // Debounced email check
  const handleEmailChange = useCallback((email) => {
    setFormData((prev) => ({ ...prev, email }));
    
    if (email && validateEmail(email)) {
      // Clear any previous timeout
      const timeoutId = setTimeout(() => {
        checkEmailAvailability(email, 'email');
      }, 500); // 500ms debounce
      
      return () => clearTimeout(timeoutId);
    } else {
      clearEmailStatus('email');
    }
  }, [setFormData, checkEmailAvailability, clearEmailStatus, validateEmail]);

  useEffect(() => {
    // Check email on mount if email exists and is valid
    if (formData.email && validateEmail(formData.email)) {
      checkEmailAvailability(formData.email, 'email');
    }
  }, []); // Only run on mount

  // Get dynamic error message (includes availability check results)
  const emailError = getEmailError('email', formData.email, errors);
  const emailClassName = getEmailClassName(
    'email', 
    formData.email, 
    `floating-input ${formData.email ? 'has-value' : ''}`,
    !!errors.email
  );

  return (
    <div className="step-content">
      <div className="step-main-content">
        <div className="contact-section">
          <label className="section-label">Contact Information</label>

          <div className="form-group">
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={(e) => handleEmailChange(e.target.value)}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              placeholder="Email address"
              className={emailClassName}
              aria-label="Email address"
              autoComplete="email"
              inputMode={isMobile ? 'email' : undefined}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck="false"
            />
            <label className="floating-label">Email address</label>
            {emailError && <span className="error-message" role="alert">{emailError}</span>}
            {isCheckingEmail.email && <span className="info-message">Checking email availability...</span>}
          </div>

          <div className="form-group">
            <div className="phone-input-container">
              <PhoneInput
                placeholder=""
                value={formData.phoneNumber}
                onChange={(value) => setFormData((prev) => ({ ...prev, phoneNumber: value || '' }))}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                className={`phone-input ${formData.phoneNumber ? 'has-value' : ''} ${errors.phoneNumber ? 'error' : ''}`}
                countrySelectProps={{ 'aria-label': 'Country' }}
                numberInputProps={{
                  'aria-label': 'Phone number',
                  autoComplete: 'tel',
                  inputMode: isMobile ? 'tel' : undefined,
                  autoCapitalize: 'none',
                  autoCorrect: 'off',
                  spellCheck: 'false',
                }}
                defaultCountry="IN"
                international
                countryCallingCodeEditable={true}
              />
              <label className={`floating-label ${formData.phoneNumber ? 'active' : ''}`}>Phone number</label>
            </div>
            {errors.phoneNumber && <span className="error-message" role="alert">{errors.phoneNumber}</span>}
          </div>
        </div>
      </div>

      <div className="step-actions">
        <div className="step-buttons">
          <button type="button" className="primary-button" onClick={handleNext}>Next</button>
        </div>
        <div className="alternative-actions">
          <span>Already have an account? </span>
          <button type="button" className="link-button" onClick={() => switchFlow('signin')}>Sign in here</button>
        </div>
      </div>
    </div>
  );
};

export default StepCreateContact;
