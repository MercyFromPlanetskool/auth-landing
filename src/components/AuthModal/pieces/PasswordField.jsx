// pieces/PasswordField.jsx
import React, { useState } from 'react';

const EyeOpen = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const EyeOff = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

/**
 * Password input with floating label + visibility toggle.
 * Mirrors the behavior in the original component.
 */
export const PasswordField = ({
  name = 'password',
  value,
  onChange,
  onFocus,
  onBlur,
  placeholder = 'Password',
  label = 'Password',
  error,
  autoComplete = 'current-password',
}) => {
  const [show, setShow] = useState(false);
  return (
    <div className="password-input-container">
      <input
        type={show ? 'text' : 'password'}
        name={name}
        value={value}
        onChange={onChange}
        onFocus={onFocus}
        onBlur={onBlur}
        placeholder={placeholder}
        className={`floating-input ${value ? 'has-value' : ''} ${error ? 'error' : ''}`}
        aria-label={label}
        autoComplete={autoComplete}
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck="false"
      />
      <label className="floating-label">{label}</label>
      <button
        type="button"
        className="password-toggle-btn"
        onClick={() => setShow(!show)}
        aria-label={show ? 'Hide password' : 'Show password'}
      >
        {show ? <EyeOff /> : <EyeOpen />}
      </button>
      {error && <span className="error-message" role="alert">{error}</span>}
    </div>
  );
};

export default PasswordField;
