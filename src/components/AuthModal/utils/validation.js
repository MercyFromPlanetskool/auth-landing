// utils/validation.js
export const validateName = (name, fieldName, isOptional = false) => {
  if (!name || !name.trim()) return isOptional ? '' : `${fieldName} is required`;
  if (name.trim().length < 2) return `${fieldName} must be at least 2 characters`;
  if (name.trim().length > 50) return `${fieldName} must be less than 50 characters`;
  if (!/^[a-zA-Z\s'-]+$/.test(name.trim())) return `${fieldName} can only contain letters, spaces, hyphens and apostrophes`;
  return '';
};

export const validateEmail = (email) => {
  if (!email || !email.trim()) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

export const validatePhone = (phone) => {
  if (!phone || !phone.trim()) return false;
  const phoneRegex = /^[\+]?[\d\s\-\(\)]{10,}$/;
  const cleanPhone = phone.replace(/\D/g, '');
  return phoneRegex.test(phone) && cleanPhone.length >= 10 && cleanPhone.length <= 15;
};

export const validateUsername = (username) => {
  if (!username || !username.trim()) return 'Username is required';
  if (username.length < 3) return 'Username must be at least 3 characters';
  if (username.length > 30) return 'Username must be less than 30 characters';
  if (!/^[a-zA-Z0-9._-]+$/.test(username)) return 'Username can only contain letters, numbers, dots, underscores and hyphens';
  if (username.startsWith('.') || username.endsWith('.')) return 'Username cannot start or end with a dot';
  if (username.includes('..')) return 'Username cannot contain consecutive dots';
  return '';
};

export const validateAge = (birthYear, birthMonth, birthDay) => {
  if (!birthYear || !birthMonth || !birthDay) return 'Complete date of birth is required';

  const today = new Date();
  const by = parseInt(birthYear, 10);
  const bm = parseInt(birthMonth, 10) - 1;
  const bd = parseInt(birthDay, 10);

  // Construct Date and ensure the components match the inputs. This prevents
  // JS Date auto-normalization (e.g. Feb 29 -> Mar 1) from being treated as
  // a valid date when the provided combination is invalid for the year.
  const birthDate = new Date(by, bm, bd);
  if (isNaN(birthDate.getTime()) || birthDate.getFullYear() !== by || birthDate.getMonth() !== bm || birthDate.getDate() !== bd) {
    return 'Please enter a valid birth date';
  }

  if (birthDate > today) return 'Date of birth cannot be in the future';
  if (birthDate.getFullYear() < today.getFullYear() - 120) return 'Please enter a valid birth date';

  return '';
};

export const validatePassword = (password) => {
  if (!password) return { isValid: false, message: 'Password is required' };
  if (password.length < 8) return { isValid: false, message: 'Password must be at least 8 characters long' };
  if (password.length > 128) return { isValid: false, message: 'Password must be less than 128 characters' };

  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  const missingTypes = [];
  if (!hasLower) missingTypes.push('lowercase letter');
  if (!hasUpper) missingTypes.push('uppercase letter');
  if (!hasNumber) missingTypes.push('number');
  if (!hasSpecial) missingTypes.push('special character');

  const typeCount = [hasLower, hasUpper, hasNumber, hasSpecial].filter(Boolean).length;
  if (typeCount < 3) {
    return {
      isValid: false,
      message: `Password must include at least 3 of: ${missingTypes.join(', ')}`
    };
  }

  const weakPatterns = [
    /(.)\1{2,}/,
    /123|abc|qwe/i,
    /password|123456|qwerty/i
  ];

  if (weakPatterns.some((p) => p.test(password))) {
    return {
      isValid: false,
      message: 'Password contains common patterns. Please choose a stronger password.'
    };
  }

  return { isValid: true, message: 'Password is strong' };
};

export const getPasswordStrength = (password) => {
  if (!password) return { strength: 0, text: '', class: '' };

  let strength = 0;
  const checks = {
    length: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  strength = Object.values(checks).filter(Boolean).length;

  if (strength <= 2) return { strength, text: 'Weak', class: 'weak' };
  if (strength === 3) return { strength, text: 'Fair', class: 'fair' };
  if (strength === 4) return { strength, text: 'Good', class: 'good' };
  return { strength, text: 'Strong', class: 'strong' };
};
