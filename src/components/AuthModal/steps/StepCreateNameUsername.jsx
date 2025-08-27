// steps/StepCreateNameUsername.jsx
import React from 'react';
import GoogleButton from '../pieces/GoogleButton';

const StepCreateNameUsername = ({
  formData, errors, handleInputChange,
  handleNext, switchFlow, isLoading, usernameAvailable, usernameSuggestions
}) => {
  return (
    <div className="step-content">
      <div className="step-main-content">
        <div className="social-auth-section">
          <GoogleButton onSuccess={() => { /* maybe continue */ }} />
          <div className="divider"><span>or</span></div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              placeholder="First name"
              required
              className={`floating-input ${formData.firstName ? 'has-value' : ''} ${errors.firstName ? 'error' : ''}`}
              aria-label="First name"
              autoComplete="given-name"
            />
            <label className="floating-label">First name</label>
            {errors.firstName && <span className="error-message" role="alert">{errors.firstName}</span>}
          </div>

          <div className="form-group">
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              placeholder="Last name (optional)"
              className={`floating-input ${formData.lastName ? 'has-value' : ''} ${errors.lastName ? 'error' : ''}`}
              aria-label="Last name (optional)"
              autoComplete="family-name"
            />
            <label className="floating-label">Last name (optional)</label>
            {errors.lastName && <span className="error-message" role="alert">{errors.lastName}</span>}
          </div>
        </div>

        <div className="form-group">
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleInputChange}
            placeholder="Username"
            required
            className={`floating-input ${formData.username ? 'has-value' : ''} ${errors.username ? 'error' : ''}`}
            aria-label="Username"
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck="false"
          />
          <label className="floating-label">Username</label>
          {/* Priority: show explicit validation string error first */}
          {typeof errors.username === 'string' && <span className="error-message" role="alert">{errors.username}</span>}
          {/* If username is taken (from availability check) show a single warning */}
          {usernameAvailable === false && !isLoading && typeof errors.username !== 'string' && (
            <span className="error-message" role="alert">That username is already taken</span>
          )}
          {/* Show loading/available messages only when there's no explicit validation string error */}
          {isLoading && typeof errors.username !== 'string' && <span className="loading-indicator">Checking availability...</span>}
          {usernameAvailable === true && typeof errors.username !== 'string' && <span className="success-message">✓ Username is available</span>}
        </div>

        {usernameSuggestions?.length > 0 && (
          <div className="suggestions" aria-live="polite">
            <p className="suggestions-label">{usernameAvailable === false ? 'Try these instead:' : 'Suggested usernames:'}</p>
            <div className="suggestion-pills">
              {usernameSuggestions.map((sug, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="suggestion-pill"
                  onClick={() => handleInputChange({ target: { name: 'username', value: sug } })}
                >
                  {sug}
                </button>
              ))}
            </div>
          </div>
        )}
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

export default StepCreateNameUsername;
