// SuccessDialog.jsx
import React from 'react';

const SuccessDialog = ({ open, message, onClose }) => {
  if (!open) return null;
  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog-content" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-header">
          <div className="dialog-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" fill="#10b981"/>
              <path d="m9 12 2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h3>Email Sent!</h3>
        </div>
        <div className="dialog-body">
          <p>{message}</p>
          <p className="dialog-subtitle">Please check your email and follow the instructions to reset your password.</p>
        </div>
        <div className="dialog-actions">
          <button type="button" className="primary-button" onClick={onClose}>
            Back to Sign In
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuccessDialog;
