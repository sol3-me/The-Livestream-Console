'use client';
import { signIn } from 'next-auth/react';

export default function LoginButton() {
  return (
    <button
      onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
      className="bg-green-600 text-white px-8 py-3 rounded-md text-base font-medium hover:bg-green-700 transition-colors"
    >
      Log In With Google
    </button>
  );
}
