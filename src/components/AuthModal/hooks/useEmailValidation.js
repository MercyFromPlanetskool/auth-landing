// hooks/useEmailValidation.js
import { useState, useCallback, useRef } from 'react';
import { authService } from '../services/authService';

export const useEmailValidation = () => {
  const [emailStatus, setEmailStatus] = useState({});
  const [isCheckingEmail, setIsCheckingEmail] = useState({});
  const abortControllerRef = useRef({});

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const checkEmailAvailability = useCallback(async (email, fieldName = 'email') => {
    if (!email || !validateEmail(email)) {
      setEmailStatus(prev => ({ ...prev, [fieldName]: null }));
      return;
    }

    // Cancel previous request if exists
    if (abortControllerRef.current[fieldName]) {
      abortControllerRef.current[fieldName].abort();
    }

    const abortController = new AbortController();
    abortControllerRef.current[fieldName] = abortController;

    setIsCheckingEmail(prev => ({ ...prev, [fieldName]: true }));

    try {
      const result = await authService.checkEmailAvailability(email, abortController.signal);
      
      if (result.aborted) {
        return;
      }

      setEmailStatus(prev => ({
        ...prev,
        [fieldName]: {
          email,
          available: result.available,
          error: result.error,
          checked: true
        }
      }));
    } catch (error) {
      if (error.name !== 'AbortError') {
        setEmailStatus(prev => ({
          ...prev,
          [fieldName]: {
            email,
            available: false,
            error: 'Failed to check email availability',
            checked: true
          }
        }));
      }
    } finally {
      setIsCheckingEmail(prev => ({ ...prev, [fieldName]: false }));
      delete abortControllerRef.current[fieldName];
    }
  }, []);

  const clearEmailStatus = useCallback((fieldName = 'email') => {
    if (abortControllerRef.current[fieldName]) {
      abortControllerRef.current[fieldName].abort();
      delete abortControllerRef.current[fieldName];
    }
    setEmailStatus(prev => ({ ...prev, [fieldName]: null }));
    setIsCheckingEmail(prev => ({ ...prev, [fieldName]: false }));
  }, []);

  const getEmailError = useCallback((fieldName = 'email', currentEmail = '', originalErrors = {}) => {
    const status = emailStatus[fieldName];
    
    // Return original validation errors first
    if (originalErrors[fieldName]) {
      return originalErrors[fieldName];
    }

    // If we have a status and the email matches what we checked
    if (status && status.email === currentEmail && status.checked) {
      if (status.error) {
        return status.error;
      }
      if (!status.available) {
        return 'This email is already registered';
      }
    }

    return null;
  }, [emailStatus]);

  const getEmailClassName = useCallback((fieldName = 'email', currentEmail = '', baseClassName = '', hasOriginalError = false) => {
    const status = emailStatus[fieldName];
    const isChecking = isCheckingEmail[fieldName];
    
    let className = baseClassName;
    
    if (hasOriginalError) {
      className += ' error';
    } else if (status && status.email === currentEmail && status.checked) {
      if (status.available && !status.error) {
        className += ' success';
      } else {
        className += ' error';
      }
    }
    
    if (isChecking) {
      className += ' checking';
    }
    
    return className;
  }, [emailStatus, isCheckingEmail]);

  return {
    emailStatus,
    isCheckingEmail,
    checkEmailAvailability,
    clearEmailStatus,
    getEmailError,
    getEmailClassName,
    validateEmail
  };
};
