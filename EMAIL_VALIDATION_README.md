# Email Validation Implementation

## Overview
Added real-time email availability checking to both `StepCreateContact.jsx` and `StepCreateParentContact.jsx` components using the `/api/v1/users/check_username/` API endpoint pattern.

## Files Modified

### 1. `authService.js`
- Added `checkEmailAvailability` function that calls POST `/api/v1/users/check_email/`
- Includes fallback for network errors with stub behavior
- Returns `{ available: boolean, email: string, error?: string }`

### 2. `useEmailValidation.js` (New Hook)
- Manages email validation state and API calls
- Provides debounced email checking (500ms delay)
- Handles loading states and error messages
- Supports multiple email fields with unique field names
- Includes email regex validation
- Cancels previous requests when new ones are made

### 3. `StepCreateContact.jsx`
- Integrated `useEmailValidation` hook
- Added real-time email availability checking with debouncing
- Visual feedback for checking, available, and unavailable states
- Displays appropriate error messages

### 4. `StepCreateParentContact.jsx`
- Added email validation for parent email field
- Uses separate field name `'parentEmail'` for independent validation
- Same visual feedback and error handling as contact step

### 5. `LoginRegister.css`
- Added `.floating-input.success` style for available emails
- Added `.floating-input.checking` style for loading state
- Added `.info-message` class for "Checking availability..." text

## API Integration

The implementation expects the following API endpoint:

```
POST /api/v1/users/check_email/
Content-Type: application/json

Request Body:
{
  "email": "user@example.com"
}

Success Response (200):
{
  "email": "user@example.com",
  "available": true
}

Error Response (400):
{
  "error": "Email is required"
}
```

## Features

1. **Real-time Validation**: Checks email availability as user types (with debouncing)
2. **Visual Feedback**: Different border colors and backgrounds for different states
3. **Error Handling**: Displays appropriate error messages
4. **Loading States**: Shows "Checking availability..." message during API calls
5. **Network Resilience**: Falls back to stub validation if API is unavailable
6. **Request Cancellation**: Cancels previous requests when user continues typing

## Usage

The email validation is automatically active on both:
- User email field in contact step
- Parent email field in parent contact step

No additional configuration is required.

## Fallback Behavior

If the API is unavailable, the system falls back to checking against a predefined list of unavailable emails for testing purposes:
- `admin@planetskool.com`
- `test@example.com` 
- `user@test.com`
