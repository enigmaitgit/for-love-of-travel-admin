# Authentication Integration

This document describes the integration of authentication functionality into the admin panel frontend.

## Overview

The admin signin frontend has been successfully merged into the admin panel frontend, providing a unified authentication system.

## Features Integrated

### Authentication Components
- **LoginForm** (`/components/auth/LoginForm.jsx`) - User login with email/password
- **SignupForm** (`/components/auth/SignupForm.jsx`) - User registration
- **ForgotPasswordForm** (`/components/auth/ForgotPasswordForm.jsx`) - Password reset request
- **ResetPasswordForm** (`/components/auth/ResetPasswordForm.jsx`) - Password reset with token

### Authentication Pages
- `/login` - Login page
- `/signup` - Registration page  
- `/forgotpassword` - Forgot password page
- `/resetpassword` - Reset password page (with token)

### Middleware Protection
- **Middleware** (`/middleware.ts`) - Protects admin routes and redirects unauthenticated users
- Public routes: `/login`, `/signup`, `/forgotpassword`, `/resetpassword`
- Protected routes: All other routes require authentication

## Environment Variables

Add these environment variables to your `.env.local` file:

```env
# Authentication API URL (for auth endpoints)
NEXT_PUBLIC_API_URL=http://localhost:5000

# Redirect URLs after authentication
NEXT_PUBLIC_REDIRECT_AFTER_LOGIN=/layout-1/blog/dashboard
NEXT_PUBLIC_REDIRECT_AFTER_FORGOT_PASSWORD=/login
NEXT_PUBLIC_REDIRECT_AFTER_RESET_PASSWORD=/login
```

## Authentication Flow

1. **Unauthenticated users** are redirected to `/login`
2. **Login** redirects to dashboard on success
3. **Logout** clears session and redirects to login
4. **Protected routes** require valid authentication token

## Backend Integration

The authentication system expects the following backend endpoints:

- `POST /auth/login` - User login
- `POST /auth/signup` - User registration  
- `POST /auth/forgot-password-test` - Password reset request
- `POST /auth/reset-password` - Password reset with token
- `POST /api/v1/authorization/logout` - User logout

## Usage

1. Start the admin panel frontend: `npm run dev`
2. Navigate to any protected route - you'll be redirected to `/login`
3. Use the login form to authenticate
4. Access the admin dashboard after successful login
5. Use the user dropdown menu to logout

## Security Features

- JWT tokens stored in httpOnly cookies
- Automatic token validation on protected routes
- Secure password reset flow with tokens
- CSRF protection through SameSite cookie settings

## File Structure

```
Admin-panel-frontend/
├── components/auth/           # Authentication components
│   ├── LoginForm.jsx
│   ├── SignupForm.jsx
│   ├── ForgotPasswordForm.jsx
│   └── ResetPasswordForm.jsx
├── app/                       # Authentication pages
│   ├── login/page.tsx
│   ├── signup/page.tsx
│   ├── forgotpassword/page.tsx
│   └── resetpassword/page.tsx
├── middleware.ts              # Route protection
└── AUTH_INTEGRATION.md        # This documentation
```

## Notes

- The main page (`/`) now redirects to `/login` instead of the dashboard
- Existing logout functionality has been updated to redirect to the integrated login page
- All authentication forms use the same styling and UX patterns as the admin panel
- The system is fully integrated with the existing admin panel infrastructure



