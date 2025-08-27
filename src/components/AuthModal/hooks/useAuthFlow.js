// hooks/useAuthFlow.js
import { useState, useRef, useMemo } from 'react';
import { isValidPhoneNumber } from 'react-phone-number-input';
import { authService } from '../services/authService';
import { sanitizeInput } from '../utils/sanitize';
import { 
  validateName, validateEmail, validateUsername, validateAge, validatePassword, getPasswordStrength 
} from '../utils/validation';

/**
 * Centralized state machine + validators for the multi-step Auth flow.
 * Ported from the original single-file component without losing behavior.
 */
const INITIAL_FORM_DATA = {
  password: '',
  firstName: '',
  lastName: '',
  username: '',
  confirmPassword: '',
  email: '',
  phoneNumber: '',
  // recoveryEmail removed; reuse `email` for recovery/forgot flows
  birthDay: '',
  birthMonth: '',
  birthYear: '',
  gender: '',
  // forgotEmail removed; reuse `email` for forgot-password flow
};

export const useAuthFlow = ({ onClose }) => {
  const [currentFlow, setCurrentFlow] = useState('signin'); // 'signin' | 'create' | 'forgot'
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState(() => {
    try {
      const saved = sessionStorage.getItem('planetskool-registration-data');
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...INITIAL_FORM_DATA, ...parsed, password: '', confirmPassword: '' };
      }
      return { ...INITIAL_FORM_DATA };
    } catch {
      return { ...INITIAL_FORM_DATA };
    }
  });

  const [errors, setErrors] = useState({});
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const [usernameSuggestions, setUsernameSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Under-18/parent flow removed: always treat as adult in registration flow.
  const isUserUnder18 = false;

  // Persist a sanitized subset on every change while in 'create'
  const persist = useMemo(() => (data) => {
    try {
      if (currentFlow === 'create') {
        const safeCopy = { ...data };
        delete safeCopy.password;
        delete safeCopy.confirmPassword;
        sessionStorage.setItem('planetskool-registration-data', JSON.stringify(safeCopy));
      }
    } catch {/* ignore */}
  }, [currentFlow]);

  // Keep timers around for debounced username API
  const usernameCheckTimerRef = useRef(null);
  const activeUsernameRequestRef = useRef(null);
  // Keep a ref to the latest formData so async callbacks can check for staleness
  const formDataRef = useRef(formData);
  // Frontend-only forbidden usernames and helpers
  const FORBIDDEN = ['admin', 'root', 'planetskool'];
  const normalize = (u) => String(u || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const isForbidden = (u) => {
    if (!u) return false;
    const n = normalize(u);
    return FORBIDDEN.some(f => n === normalize(f));
  };
  const generatePostfixSuggestions = (base, count = 3) => {
    const seedBase = String(base || 'user').toLowerCase().replace(/[^a-z0-9_.]/g, '');
    const year = new Date().getFullYear();
    const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
    const randLetters = (n) => {
      const letters = 'abcdefghijklmnopqrstuvwxyz';
      let out = '';
      for (let i = 0; i < n; i++) out += letters.charAt(randInt(0, letters.length - 1));
      return out;
    };
    const methods = [
      () => `${seedBase}${randInt(10, 999)}`,
      () => `${seedBase}_${randLetters(2)}`,
      () => `${seedBase}.${randLetters(2)}`,
      () => `${seedBase}${year}`,
      () => `${seedBase}${String(randInt(1, 99)).padStart(2, '0')}`,
    ];
    const out = new Set();
    let attempts = 0;
    while (out.size < count && attempts < 30) {
      attempts += 1;
      const gen = methods[Math.floor(Math.random() * methods.length)];
      const candidate = gen();
      if (candidate && candidate !== seedBase && !isForbidden(candidate)) out.add(candidate);
    }
    return Array.from(out).slice(0, count);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let sanitizedValue = value;
    if (name === 'firstName' || name === 'lastName') sanitizedValue = sanitizeInput(value, 'name');
    else if (name === 'username') sanitizedValue = sanitizeInput(value, 'username');
  else if (name === 'email') sanitizedValue = sanitizeInput(value, 'email');

  const updated = { ...formData, [name]: sanitizedValue };
  setFormData(updated);
  // keep ref in sync for async checks
  try { formDataRef.current = updated; } catch {}
    persist(updated);

    // If the user changed birthMonth or birthYear, ensure the selected
    // birthDay is still valid for the new month/year (handles Feb/29).
    if (name === 'birthMonth' || name === 'birthYear') {
      const newYear = parseInt(updated.birthYear || formData.birthYear || 2000, 10);
      const newMonth = parseInt(updated.birthMonth || formData.birthMonth || 1, 10);
      // daysInMonth: using day 0 of next month
      const daysInMonth = new Date(newYear, newMonth, 0).getDate();
      if (updated.birthDay) {
        const bd = parseInt(updated.birthDay, 10);
        if (isNaN(bd) || bd < 1 || bd > daysInMonth) {
          // Clear invalid day and surface an error so the user must reselect
          const monthName = new Date(newYear, newMonth - 1).toLocaleString('default', { month: 'long' });
          const errMsg = `${monthName} has only ${daysInMonth} days`;
          const cleared = { ...updated, birthDay: '' };
          setFormData(cleared);
          try { formDataRef.current = cleared; } catch {}
          persist(cleared);
          setErrors(prev => ({ ...prev, birthDay: errMsg }));
        } else {
          // Valid day for new month/year; clear any stale birthDay error
          setErrors(prev => {
            if (!prev || !prev.birthDay) return prev;
            const copy = { ...prev };
            delete copy.birthDay;
            return copy;
          });
        }
      }
    }

    // Clear error for edited field
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));

    // Real-time validations
    const newErrors = { ...errors };
    switch (name) {
      case 'firstName': {
        if (value) {
          const err = validateName(value, 'First name');
          if (err) newErrors[name] = err; else delete newErrors[name];
        } else newErrors[name] = 'First name is required';
        break;
      }
      case 'lastName': {
        // Last name is optional; validate only when provided
        if (value && value.trim()) {
          const err = validateName(value, 'Last name');
          if (err) newErrors[name] = err; else delete newErrors[name];
        } else {
          delete newErrors[name];
        }
        break;
      }
      case 'email': {
        if (!value || !value.trim()) {
          newErrors[name] = 'Email address is required';
        } else if (!validateEmail(value.trim())) {
          newErrors[name] = 'Please enter a valid email address';
        } else {
          delete newErrors[name];
        }
        break;
      }
      case 'phoneNumber': {
        if (!value) {
          newErrors[name] = 'Phone number is required';
        } else if (!isValidPhoneNumber(value)) {
          newErrors[name] = 'Please enter a valid phone number';
        } else {
          delete newErrors[name];
        }
        break;
      }
      case 'birthMonth': {
        if (!value) newErrors[name] = 'Birth month is required';
        else delete newErrors[name];
        break;
      }
      case 'birthYear': {
        if (!value) newErrors[name] = 'Birth year is required';
        else delete newErrors[name];
        break;
      }
  // forgotEmail removed; forgot-password reuses the shared `email` field
      case 'username': {
        // Disallow usernames that start with a number (frontend guard)
        if (/^[0-9]/.test(value)) {
          clearTimeout(usernameCheckTimerRef.current);
          try {
            if (activeUsernameRequestRef.current) {
              try { activeUsernameRequestRef.current.abort(); } catch {}
              activeUsernameRequestRef.current = null;
            }
          } catch {}
          setIsLoading(false);
          setUsernameAvailable(null);
          setUsernameSuggestions([]);
          newErrors[name] = 'Username cannot start with a number';
          break;
        }
        // Handle empty value first
        if (!value || value.length <= 4) {
          clearTimeout(usernameCheckTimerRef.current);
          try {
            if (activeUsernameRequestRef.current) {
              try { activeUsernameRequestRef.current.abort(); } catch {}
              activeUsernameRequestRef.current = null;
            }
          } catch {}
          setIsLoading(false);
          setUsernameAvailable(null);
          setUsernameSuggestions([]);
          newErrors[name] = 'Username is required';
        // Enforce forbidden usernames regardless of length (so 'root' is blocked)
        } else if (isForbidden(value)) {
          clearTimeout(usernameCheckTimerRef.current);
          try {
            if (activeUsernameRequestRef.current) {
              try { activeUsernameRequestRef.current.abort(); } catch {}
              activeUsernameRequestRef.current = null;
            }
          } catch {}
          setIsLoading(false);
          setUsernameAvailable(false);
          setUsernameSuggestions(generatePostfixSuggestions(value, 3));
          // leave errors[name] unset so UI shows availability-based message
          delete newErrors[name];
        // Too short to check against server; clear availability but don't mark required
        } else if (value.length <= 2) {
          clearTimeout(usernameCheckTimerRef.current);
          try {
            if (activeUsernameRequestRef.current) {
              try { activeUsernameRequestRef.current.abort(); } catch {}
              activeUsernameRequestRef.current = null;
            }
          } catch {}
          setIsLoading(false);
          setUsernameAvailable(null);
          setUsernameSuggestions([]);
        } else {
          const err = validateUsername(value);
          if (err) {
            // validation error -> clear availability state
            newErrors[name] = err;
            clearTimeout(usernameCheckTimerRef.current);
            try {
              if (activeUsernameRequestRef.current) {
                try { activeUsernameRequestRef.current.abort(); } catch {}
                activeUsernameRequestRef.current = null;
              }
            } catch {}
            setIsLoading(false);
            setUsernameAvailable(null);
            setUsernameSuggestions([]);
          } else {
            delete newErrors[name];
            if (value.length > 2) {
              clearTimeout(usernameCheckTimerRef.current);
              usernameCheckTimerRef.current = setTimeout(async () => {
                setIsLoading(true);

                // Abort previous in-flight username request if any
                try {
                  if (activeUsernameRequestRef.current) {
                    try { activeUsernameRequestRef.current.abort(); } catch {}
                    activeUsernameRequestRef.current = null;
                  }

                  const controller = new AbortController();
                  activeUsernameRequestRef.current = controller;

                  const res = await authService.checkUsernameAvailability(value, controller.signal);

                  // If the service reported an abort, do not update state
                  if (res && res.aborted) {
                    setIsLoading(false);
                    return;
                  }

                  // If the username has changed since we started the request,
                  // ignore these results to avoid showing stale availability messages.
                  if (!formDataRef.current || formDataRef.current.username !== value) {
                    setIsLoading(false);
                    return;
                  }

                  setUsernameAvailable(res.available);
                  setUsernameSuggestions(res.suggestions || []);
                } catch (err) {
                  // ignore network errors here but ensure loading flag is cleared
                } finally {
                  setIsLoading(false);
                  // clear active controller after completion
                  activeUsernameRequestRef.current = null;
                }
              }, 400);
            }
          }
        }
        break;
      }
      case 'password': {
        if (value) {
          const res = validatePassword(value);
          if (!res.isValid) newErrors[name] = res.message; else delete newErrors[name];
          if (formData.confirmPassword && formData.confirmPassword !== value) {
            newErrors.confirmPassword = 'Passwords do not match';
          } else if (formData.confirmPassword && formData.confirmPassword === value) {
            delete newErrors.confirmPassword;
          }
        }
        break;
      }
      case 'confirmPassword': {
        if (value && formData.password) {
          if (value !== formData.password) newErrors[name] = 'Passwords do not match';
          else delete newErrors[name];
        }
        break;
      }
      case 'birthDay': {
        if (value) {
          const day = parseInt(value, 10);
          if (day < 1 || day > 31) newErrors[name] = 'Please enter a valid day (1-31)';
          else if (formData.birthMonth) {
            const year = formData.birthYear || 2000;
            const daysInMonth = new Date(year, formData.birthMonth, 0).getDate();
            if (day > daysInMonth) newErrors[name] = `${new Date(year, formData.birthMonth - 1).toLocaleString('default', { month: 'long' })} has only ${daysInMonth} days`;
            else delete newErrors[name];
          } else delete newErrors[name];
        }
        break;
      }
      case 'gender': {
        if (!value) newErrors[name] = 'Gender selection is required';
        else if (!['male', 'female', 'other', 'prefer-not-to-say'].includes(value)) newErrors[name] = 'Please select a valid gender option';
        else delete newErrors[name];
        break;
      }
  // parent fields removed as under-18 flow is disabled
      default:
        break;
    }
    setErrors(newErrors);
  };

  // Build a normalized payload for registration
  const buildRegisterPayload = (data) => {
    const {
      password, firstName, lastName, username, email, phoneNumber,
      birthYear, birthMonth, birthDay, gender,
    } = data;

    // Create ISO date if possible
    let birthDate = null;
    if (birthYear && birthMonth && birthDay) {
      const y = String(birthYear).padStart(4, '0');
      const m = String(birthMonth).padStart(2, '0');
      const d = String(birthDay).padStart(2, '0');
      birthDate = `${y}-${m}-${d}`;
    }

    const payload = {
      firstName: firstName?.trim() || '',
      lastName: lastName?.trim() || '',
      username: username?.trim() || '',
      email: email?.trim().toLowerCase() || '',
      phoneNumber: phoneNumber || '',
      password: password || '',
      birthDate,
      gender: gender || ''
    };

  // under-18 parent payload removed

    return payload;
  };

  // Required by StepCreatePassword
  const computePasswordStrength = (pwd) => getPasswordStrength(pwd);

  const resetForm = () => {
    setFormData({ ...INITIAL_FORM_DATA });
    setErrors({});
    setCurrentStep(1);
    setUsernameAvailable(null);
    setUsernameSuggestions([]);
    setShowSuccessDialog(false);
    setSuccessMessage('');
    try { sessionStorage.removeItem('planetskool-registration-data'); } catch {}
  };

  const switchFlow = (flow) => {
    setCurrentFlow(flow);
    resetForm();
  };

  const validateCurrentStep = () => {
    const newErrors = {};
    if (currentFlow === 'signin') {
      if (currentStep === 1) {
        if (!formData.email || !formData.email.trim()) newErrors.email = 'Email address is required';
        else if (!validateEmail(formData.email.trim())) newErrors.email = 'Please enter a valid email address';
      }
    } else if (currentFlow === 'create') {
      if (currentStep === 1) {
        const e1 = validateName(formData.firstName, 'First name');
        if (e1) newErrors.firstName = e1;
        // lastName is optional; only validate if present
        if (formData.lastName && formData.lastName.trim()) {
          const e2 = validateName(formData.lastName, 'Last name');
          if (e2) newErrors.lastName = e2;
        } else {
          delete newErrors.lastName;
        }
        // Disallow usernames that start with a number
        if (formData.username && /^[0-9]/.test(formData.username)) {
          newErrors.username = 'Username cannot start with a number';
        } else {
          const e3 = validateUsername(formData.username);
          if (e3) newErrors.username = e3;
        }
      } else if (currentStep === 2) {
        if (!formData.birthMonth) newErrors.birthMonth = 'Birth month is required';
        if (!formData.birthDay) newErrors.birthDay = 'Birth day is required';
        if (!formData.birthYear) newErrors.birthYear = 'Birth year is required';
        if (formData.birthYear && formData.birthMonth && formData.birthDay) {
          const ageErr = validateAge(formData.birthYear, formData.birthMonth, formData.birthDay);
          if (ageErr) newErrors.birthYear = ageErr;
        }
        if (!formData.gender) newErrors.gender = 'Gender selection is required';
        else if (!['male', 'female', 'other', 'prefer-not-to-say'].includes(formData.gender)) {
          newErrors.gender = 'Please select a valid gender option';
        }
      } else if (currentStep === 3) {
        // Contact information for account (email + phone) — parent flow removed
        if (!formData.email) newErrors.email = 'Email address is required';
        else if (!validateEmail(formData.email)) newErrors.email = 'Please enter a valid email address';
        if (!formData.phoneNumber) newErrors.phoneNumber = 'Phone number is required';
        else if (!isValidPhoneNumber(formData.phoneNumber)) newErrors.phoneNumber = 'Please enter a valid phone number';
      } else if (currentStep === 4) {
        const res = validatePassword(formData.password);
        if (!res.isValid) newErrors.password = res.message;
        if (!formData.confirmPassword) newErrors.confirmPassword = 'Please confirm your password';
        else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';

        if (formData.password && formData.password.length >= 8) {
          let issues = [];
          if (!/[a-z]/.test(formData.password)) issues.push('lowercase letter');
          if (!/[A-Z]/.test(formData.password)) issues.push('uppercase letter');
          if (!/[0-9]/.test(formData.password)) issues.push('number');
          if (!/[!@#$%^&*(),.?":{}|<>]/.test(formData.password)) issues.push('special character');
          if (issues.length) newErrors.password = `Password should include: ${issues.join(', ')}`;
        }
      }
    } else if (currentFlow === 'forgot') {
      // use shared `email` field for forgot-password
      if (!formData.email || !formData.email.trim()) newErrors.email = 'Email address is required';
      else if (!validateEmail(formData.email.trim())) newErrors.email = 'Please enter a valid email address';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (currentFlow === 'signin') {
      const res = await authService.login(formData.email, formData.password);
      if (res.ok) {
        // persist tokens if present
        if (res.access_token) try { localStorage.setItem('access_token', res.access_token); } catch {}
        if (res.refresh_token) try { localStorage.setItem('refresh_token', res.refresh_token); } catch {}
        // Optionally persist user profile
        if (res.user) try { localStorage.setItem('user_profile', JSON.stringify(res.user)); } catch {}
  // redirect to dashboard
  try { window.location.href = '/dashboard'; } catch { onClose?.(); }
      } else {
        const backendErrors = res.errors || {};
        const mapped = { ...errors };
        const mapKey = (key) => {
          if (!key) return key;
          if (key.startsWith('user_')) return key.replace('user_', '');
          if (key.includes('.')) return key.split('.').map((part, idx) => idx === 0 ? part : part[0].toUpperCase() + part.slice(1)).join('');
          if (key.includes('_')) return key.split('_').map((part, idx) => idx === 0 ? part : part[0].toUpperCase() + part.slice(1)).join('');
          return key;
        };
        Object.keys(backendErrors).forEach((k) => {
          const val = backendErrors[k];
          const fk = mapKey(k);
          mapped[fk] = Array.isArray(val) ? val.join(' ') : String(val);
        });
        if (backendErrors.non_field_errors) mapped._form = Array.isArray(backendErrors.non_field_errors) ? backendErrors.non_field_errors.join(' ') : String(backendErrors.non_field_errors);
        if (backendErrors.detail && !mapped._form) mapped._form = String(backendErrors.detail);
        setErrors(mapped);
      }
    } else if (currentFlow === 'create') {
      const payload = buildRegisterPayload(formData);
      const res = await authService.register(payload);
      if (res.ok) {
        setSuccessMessage(res.message || 'User registered successfully. Please check your email for verification.');
        setShowSuccessDialog(true);
        // Clear persisted form but keep formData in UI until user closes success dialog
        try { sessionStorage.removeItem('planetskool-registration-data'); } catch {}
      } else {
        // Map backend errors into errors state for display
        const backendErrors = res.errors || {};
        const mapped = { ...errors };

        const mapKey = (key) => {
          if (!key) return key;
          // user_email -> email
          if (key.startsWith('user_')) return key.replace('user_', '');
          // parent.email -> parentEmail
          if (key.includes('.')) {
            return key.split('.').map((part, idx) => idx === 0 ? part : part[0].toUpperCase() + part.slice(1)).join('');
          }
          // snake_case -> camelCase
          if (key.includes('_')) {
            return key.split('_').map((part, idx) => idx === 0 ? part : part[0].toUpperCase() + part.slice(1)).join('');
          }
          return key;
        };

        Object.keys(backendErrors).forEach((k) => {
          const val = backendErrors[k];
          const fk = mapKey(k);
          mapped[fk] = Array.isArray(val) ? val.join(' ') : String(val);
        });
  // map top-level non_field_errors or detail
  if (backendErrors.non_field_errors) mapped._form = Array.isArray(backendErrors.non_field_errors) ? backendErrors.non_field_errors.join(' ') : String(backendErrors.non_field_errors);
  if (backendErrors.detail && !mapped._form) mapped._form = String(backendErrors.detail);
  setErrors(mapped);
      }
    }
  };

  const handleForgotPasswordSubmit = async () => {
    await authService.forgotPassword(formData.email);
    setSuccessMessage(`Password reset link sent to ${formData.email}`);
    setShowSuccessDialog(true);
  };

  const handleCloseSuccessDialog = () => {
    setShowSuccessDialog(false);
    setSuccessMessage('');
    switchFlow('signin');
  };

  const handleNext = () => {
    // Run the standard validation for the current step first.
    if (!validateCurrentStep()) return;

    // For the create-flow's first step (name + username) we must ensure there
    // are no warnings for the first page fields and the username availability
    // check has completed and is available before advancing.
    if (currentFlow === 'create' && currentStep === 1) {
      // If any field on the first page currently has a warning/error, block.
      const firstStepFields = ['firstName', 'lastName', 'username'];
      const firstStepHasWarnings = firstStepFields.some((f) => {
        const v = errors[f];
        return v === true || (typeof v === 'string' && String(v).trim() !== '');
      });
      if (firstStepHasWarnings) {
        // keep existing errors visible; do not advance
        return;
      }

      // If availability check still running, prevent navigation until complete.
      if (isLoading) {
        setErrors(prev => ({ ...prev, username: 'Checking username availability...' }));
        return;
      }

      // If the username was found to be unavailable or not explicitly marked
      // available, prevent advancing and show a clear message.
      if (usernameAvailable !== true) {
        // If explicitly unavailable
        if (usernameAvailable === false) {
          setErrors(prev => ({ ...prev, username: 'Username is not available' }));
        } else {
          // usernameAvailable === null or undefined -> require user to pick/confirm
          setErrors(prev => ({ ...prev, username: 'Please choose a username' }));
        }
        return;
      }
    }
  // Determine the last step for the create flow. We now keep password as step 4
  // for both adult and under-18 flows (under-18 shows parent at step 3).
  const createLastStep = 4;

    if (currentFlow === 'signin' && currentStep === 2) {
      handleSubmit();
    } else if (currentFlow === 'create' && currentStep === createLastStep) {
      handleSubmit();
    } else if (currentFlow === 'forgot') {
      handleForgotPasswordSubmit();
    } else {
      if (currentFlow === 'create') {
        if (currentStep === 2) {
          // after DOB, go to parent-contact if under 18, otherwise contact
          setCurrentStep(3);
        } else {
          setCurrentStep((s) => s + 1);
        }
      } else {
        setCurrentStep((s) => s + 1);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((s) => s - 1);
    } else if (currentFlow === 'create') {
      switchFlow('signin');
    }
  };

  return {
    // state
    currentFlow, currentStep,
    formData, errors,
    usernameAvailable, usernameSuggestions, isLoading,
    showSuccessDialog, successMessage,
    isUserUnder18,

    // actions
    setFormData,
    handleInputChange,
    handleNext,
    handleBack,
    switchFlow,
    handleCloseSuccessDialog,
    computePasswordStrength,
  };
};
