// steps/StepCreateBirthdayGender.jsx
import React from 'react';

const StepCreateBirthdayGender = ({
  formData, errors, handleInputChange,
  handleNext, handleBack, switchFlow
}) => {
  const generateYears = () => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 101 }).map((_, i) => currentYear - i);
  };

  const months = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December'
  ];

  return (
    <div className="step-content">
      <div className="step-main-content">
        <div className="birthday-section">
          <label className="section-label">Birthday</label>
          <div className="birthday-inputs">
            <select
              name="birthMonth"
              value={formData.birthMonth}
              onChange={handleInputChange}
              className={`select-input ${errors.birthMonth ? 'error' : ''}`}
              required
              aria-label="Birth month"
            >
              <option value="">Month</option>
              {months.map((m, idx) => (
                <option key={idx} value={idx + 1}>{m}</option>
              ))}
            </select>

            <select
              name="birthDay"
              value={formData.birthDay}
              onChange={handleInputChange}
              className={`select-input ${errors.birthDay ? 'error' : ''}`}
              required
              aria-label="Birth day"
            >
              <option value="">Day</option>
              {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>

            <select
              name="birthYear"
              value={formData.birthYear}
              onChange={handleInputChange}
              className={`select-input ${errors.birthYear ? 'error' : ''}`}
              required
              aria-label="Birth year"
            >
              <option value="">Year</option>
              {generateYears().map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          {(errors.birthMonth || errors.birthDay || errors.birthYear) && (
            <div className="birthday-errors">
              {errors.birthMonth && <span className="error-message" role="alert">{errors.birthMonth}</span>}
              {errors.birthDay && <span className="error-message" role="alert">{errors.birthDay}</span>}
              {errors.birthYear && <span className="error-message" role="alert">{errors.birthYear}</span>}
            </div>
          )}
        </div>

        <div className="form-group">
          <select
            name="gender"
            value={formData.gender}
            onChange={handleInputChange}
            className="select-input"
            aria-label="Gender"
            required
          >
            <option value="">Select Gender</option>
            <option value="female">Female</option>
            <option value="male">Male</option>
            <option value="other">Other</option>
            <option value="prefer-not-to-say">Prefer not to say</option>
          </select>
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

export default StepCreateBirthdayGender;
