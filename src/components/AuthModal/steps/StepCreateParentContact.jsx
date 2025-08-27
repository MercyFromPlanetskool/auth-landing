// steps/StepCreateParentContact.jsx
/**
 * This component preserves the COMMENTED logic/UI from the original file
 * for users under 18 (parent/guardian consent & contact). It is not wired
 * into the flow by default (isUserUnder18 is set to false in useAuthFlow).
 * To enable, set isUserUnder18=true and route to this step after DOB.
 */
import React, { useEffect, useCallback } from 'react';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { useEmailValidation } from '../hooks/useEmailValidation';

const StepCreateParentContact = ({
  formData, errors, setFormData,
  handleNext, handleBack, handleInputFocus, handleInputBlur, isMobile
}) => {
  const {
    checkEmailAvailability,
    clearEmailStatus,
    getEmailError,
    getEmailClassName,
    isCheckingEmail,
    validateEmail
  } = useEmailValidation();

  // Debounced parent email check
  const handleParentEmailChange = useCallback((email) => {
    setFormData((prev) => ({ ...prev, parentEmail: email }));
    
    if (email && validateEmail(email)) {
      // Clear any previous timeout
      const timeoutId = setTimeout(() => {
        checkEmailAvailability(email, 'parentEmail');
      }, 500); // 500ms debounce
      
      return () => clearTimeout(timeoutId);
    } else {
      clearEmailStatus('parentEmail');
    }
  }, [setFormData, checkEmailAvailability, clearEmailStatus, validateEmail]);

  useEffect(() => {
    // Check parent email on mount if it exists and is valid
    if (formData.parentEmail && validateEmail(formData.parentEmail)) {
      checkEmailAvailability(formData.parentEmail, 'parentEmail');
    }
  }, []); // Only run on mount

  // Get dynamic error message (includes availability check results)
  const parentEmailError = getEmailError('parentEmail', formData.parentEmail, errors);
  const parentEmailClassName = getEmailClassName(
    'parentEmail', 
    formData.parentEmail, 
    `floating-input ${formData.parentEmail ? 'has-value' : ''}`,
    !!errors.parentEmail
  );

  return (
    <div className="step-content">
      <div className="step-main-content">
        <div className="parent-contact-section">
          <div className="info-note parent-info">
            <p>Since you're under 18, we need your parent or guardian's contact information.</p>
            <p>They will receive a verification email to approve your account.</p>
          </div>

          <label className="section-label">Parent/Guardian Information</label>

          <div className="form-row">
            <div className="form-group">
              <input
                type="text"
                name="parentFirstName"
                value={formData.parentFirstName}
                onChange={(e) => setFormData(prev => ({ ...prev, parentFirstName: e.target.value }))}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                placeholder="Parent's first name"
                className={`floating-input ${formData.parentFirstName ? 'has-value' : ''} ${errors.parentFirstName ? 'error' : ''}`}
                aria-label="Parent's first name"
                required
              />
              <label className="floating-label">Parent's first name</label>
              {errors.parentFirstName && <span className="error-message" role="alert">{errors.parentFirstName}</span>}
            </div>

            <div className="form-group">
              <input
                type="text"
                name="parentLastName"
                value={formData.parentLastName}
                onChange={(e) => setFormData(prev => ({ ...prev, parentLastName: e.target.value }))}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                placeholder="Parent's last name (optional)"
                className={`floating-input ${formData.parentLastName ? 'has-value' : ''} ${errors.parentLastName ? 'error' : ''}`}
                aria-label="Parent's last name (optional)"
              />
              <label className="floating-label">Parent's last name (optional)</label>
              {errors.parentLastName && <span className="error-message" role="alert">{errors.parentLastName}</span>}
            </div>
          </div>

          <div className="form-group">
            <input
              type="email"
              name="parentEmail"
              value={formData.parentEmail}
              onChange={(e) => handleParentEmailChange(e.target.value)}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              placeholder="Parent's email address"
              className={parentEmailClassName}
              aria-label="Parent's email address"
              autoComplete="email"
              inputMode={isMobile ? 'email' : undefined}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck="false"
              required
            />
            <label className="floating-label">Parent's email address</label>
            {parentEmailError && <span className="error-message" role="alert">{parentEmailError}</span>}
            {isCheckingEmail.parentEmail && <span className="info-message">Checking email availability...</span>}
          </div>

          <div className="form-group">
            <div className="phone-input-container">
              <PhoneInput
                placeholder=""
                value={formData.parentPhoneNumber}
                onChange={(value) => setFormData(prev => ({ ...prev, parentPhoneNumber: value || '' }))}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                className={`phone-input ${formData.parentPhoneNumber ? 'has-value' : ''} ${errors.parentPhoneNumber ? 'error' : ''}`}
                countrySelectProps={{ 'aria-label': "Parent's phone country" }}
                numberInputProps={{
                  'aria-label': "Parent's phone number",
                  placeholder: "Parent's phone number",
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
              <label className={`floating-label ${formData.parentPhoneNumber ? 'active' : ''}`}>
                Parent's phone number
              </label>
            </div>
            {errors.parentPhoneNumber && <span className="error-message" role="alert">{errors.parentPhoneNumber}</span>}
          </div>

          <div className="form-options">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.parentConsent}
                onChange={(e) => setFormData(prev => ({ ...prev, parentConsent: e.target.checked }))}
                required
              />
              <span className="checkmark"></span>
              I confirm that I have my parent/guardian's permission
            </label>
            {errors.parentConsent && <span className="error-message" role="alert">{errors.parentConsent}</span>}
          </div>
        </div>
      </div>

      <div className="step-actions">
        <div className="step-buttons">
          <button type="button" className="primary-button" onClick={handleNext}>Next</button>
        </div>
      </div>
    </div>
  );
};

export default StepCreateParentContact;
