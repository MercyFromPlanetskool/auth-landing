// AuthModal/AuthModal.jsx
import React, { useRef } from 'react';
import 'react-phone-number-input/style.css';
import './styles/LoginRegister.css';

import { useResponsiveOverlay } from './hooks/useResponsiveOverlay';
import { useAuthFlow } from './hooks/useAuthFlow';

import SuccessDialog from './SuccessDialog';

// Steps
import StepSignInEmail from './steps/StepSignInEmail';
import StepSignInPassword from './steps/StepSignInPassword';
import StepForgotPassword from './steps/StepForgotPassword';
import StepCreateNameUsername from './steps/StepCreateNameUsername';
import StepCreateBirthdayGender from './steps/StepCreateBirthdayGender';
import StepCreateContact from './steps/StepCreateContact';
import StepCreatePassword from './steps/StepCreatePassword';

const AuthModal = ({ isVisible, onClose }) => {
  const overlayRef = useRef(null);

  // Ensure persisted registration data is cleared synchronously when the
  // modal is visible so the hook's initial state doesn't pick up stale data.
  if (isVisible) {
    try { sessionStorage.removeItem('planetskool-registration-data'); } catch {}
  }

  const {
    isMobile, isLandscape, viewportDimensions,
    handleTouchStart, handleTouchMove, handleTouchEnd,
    handleInputFocus, handleInputBlur,
  } = useResponsiveOverlay({ overlayRef, isVisible, onClose });

  const {
    currentFlow, currentStep,
    formData, errors,
    usernameAvailable, usernameSuggestions, isLoading,
    showSuccessDialog, successMessage,
    isUserUnder18,
    setFormData,
    handleInputChange,
    handleNext, handleBack, switchFlow,
    handleCloseSuccessDialog,
    computePasswordStrength,
  } = useAuthFlow({ onClose });

  const handleBackButtonClick = () => {
    // If we're deeper than the first step, go back inside the modal.
    if (currentStep > 1) {
      handleBack();
      return;
    }

    // If we're on the first step, reset the auth flow (clears persisted registration data)
    // and then close the modal / navigate back to landing page.
    // switchFlow('signin') calls resetForm() internally.
    switchFlow('signin');
    onClose?.();
  };

  const renderStep = () => {
    if (currentFlow === 'signin') {
      if (currentStep === 1) {
        return (
          <StepSignInEmail
            formData={formData}
            errors={errors}
            handleInputChange={handleInputChange}
            handleInputFocus={handleInputFocus}
            handleInputBlur={handleInputBlur}
            handleNext={handleNext}
            switchFlow={switchFlow}
            isMobile={isMobile}
          />
        );
      }
      if (currentStep === 2) {
        return (
          <StepSignInPassword
            formData={formData}
            errors={errors}
            handleInputChange={handleInputChange}
            handleInputFocus={handleInputFocus}
            handleInputBlur={handleInputBlur}
            handleNext={handleNext}
            handleBack={handleBack}
            switchFlow={switchFlow}
          />
        );
      }
    } else if (currentFlow === 'forgot') {
      return (
        <StepForgotPassword
          formData={formData}
          errors={errors}
          handleInputChange={handleInputChange}
          handleNext={handleNext}
          switchFlow={switchFlow}
        />
      );
    } else if (currentFlow === 'create') {
      if (currentStep === 1) {
        return (
          <StepCreateNameUsername
            formData={formData}
            errors={errors}
            handleInputChange={handleInputChange}
            handleNext={handleNext}
            switchFlow={switchFlow}
            isLoading={isLoading}
            usernameAvailable={usernameAvailable}
            usernameSuggestions={usernameSuggestions}
          />
        );
      }
      if (currentStep === 2) {
        return (
          <StepCreateBirthdayGender
            formData={formData}
            errors={errors}
            handleInputChange={handleInputChange}
            handleNext={handleNext}
            handleBack={handleBack}
            switchFlow={switchFlow}
          />
        );
      }
      // Step 3: parent contact for under-18, otherwise regular contact
      if (currentStep === 3) {
        return (
          <StepCreateContact
            formData={formData}
            errors={errors}
            setFormData={setFormData}
            handleInputFocus={handleInputFocus}
            handleInputBlur={handleInputBlur}
            handleNext={handleNext}
            handleBack={handleBack}
            switchFlow={switchFlow}
            isMobile={isMobile}
          />
        );
      }

      // Step 4: password for both flows
      if (currentStep === 4) {
        return (
          <StepCreatePassword
            formData={formData}
            errors={errors}
            handleInputChange={handleInputChange}
            handleInputFocus={handleInputFocus}
            handleInputBlur={handleInputBlur}
            handleNext={handleNext}
            handleBack={handleBack}
            switchFlow={switchFlow}
            computePasswordStrength={computePasswordStrength}
          />
        );
      }
    }
    return null;
  };

  const brandTitle = currentFlow === 'signin' ? 'Sign in' : currentFlow === 'forgot' ? 'Forgot Password' : 'Create your account';
  const brandSubtitle = currentFlow === 'signin' ? 'Use your account to continue' : currentFlow === 'forgot' ? 'Reset your password easily' : 'Join Planetskool today';

  return (
    <div
      ref={overlayRef}
      className={`login-register-overlay ${isVisible ? 'visible' : ''} ${isMobile ? 'mobile' : 'desktop'} ${isLandscape ? 'landscape-mode' : 'portrait-mode'}`}
      // Prevent clicks on the overlay from bubbling up and accidentally
      // closing the modal or navigating back to the landing page.
      onClick={(e) => { e.stopPropagation(); }}
      data-flow={currentFlow}
      data-step={currentStep}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ '--viewport-width': `${viewportDimensions.width}px`, '--viewport-height': `${viewportDimensions.height}px` }}
    >
      <div className="login-register-panel">
        <div className="auth-card">
          <div className="panel-header">
            <button
              className="back-btn"
              onClick={handleBackButtonClick}
              aria-label={isMobile ? 'Close login' : 'Back to main page'}
            >
              {isMobile ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : (
                <>
                  <svg width="35" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </>
              )}
            </button>
          </div>

          <div className="panel-content">
            <div className="brand-section">
              <h1 className="brand-title">{brandTitle}</h1>
              <p className="brand-subtitle">{brandSubtitle}</p>
            </div>

            <div className="form-container">
              {renderStep()}
            </div>
          </div>
        </div>
      </div>

      <SuccessDialog open={showSuccessDialog} message={successMessage} onClose={handleCloseSuccessDialog} />
    </div>
  );
};

export default AuthModal;
