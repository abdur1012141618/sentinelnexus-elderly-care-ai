import { SignIn } from '@clerk/clerk-react';

export default function Login() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <SignIn signUpUrl="/sign-up" redirectUrl="/dashboard" />
    </div>
  );
}