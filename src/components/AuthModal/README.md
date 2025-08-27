# AuthModal (Refactored)

This is a refactor of your original `LoginRegister.jsx` into an industrial standards folder structure with modular React components, hooks, services, and utilities — preserving UI/UX, behavior, and your existing CSS.

## Structure

```
AuthModal/
  AuthModal.jsx
  SuccessDialog.jsx
  steps/
    StepSignInEmail.jsx
    StepSignInPassword.jsx
    StepForgotPassword.jsx
    StepCreateNameUsername.jsx
    StepCreateBirthdayGender.jsx
    StepCreateContact.jsx
    StepCreatePassword.jsx
    StepCreateParentContact.jsx   (comment-preserved, not wired by default)
  pieces/
    GoogleButton.jsx
    PasswordField.jsx
  hooks/
    useAuthFlow.js
    useResponsiveOverlay.js
  services/
    authService.js
  utils/
    validation.js
    sanitize.js
  styles/
    LoginRegister.css   (unchanged)
```

## Usage

```
import React, { useState } from 'react';
import AuthModal from './AuthModal/AuthModal';

export default function App() {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button onClick={() => setOpen(true)}>Open Auth</button>
      <AuthModal isVisible={open} onClose={() => setOpen(false)} />
    </div>
  );
}
```

> The mobile overlay behavior, swipe-to-close, orientation classes, username availability debounce, password strength, phone input, and all button click behaviors are preserved. To re-enable the under‑18 parent contact step, set `isUserUnder18` to `true` in `useAuthFlow` and keep step ordering as needed.
