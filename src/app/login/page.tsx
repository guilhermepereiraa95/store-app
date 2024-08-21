'use client'
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { auth } from '@/app/lib/firebase';
import { toast } from 'react-toastify';

export default function Login() {
  const router = useRouter();

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();

    try {
      await signInWithPopup(auth, provider);
      router.push('/');
    } catch (error) {
      toast.error('Error logging in with Google');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <form className="p-6 bg-white rounded shadow-md">
        <h2 className="text-2xl mb-4">Login</h2>
        <button
          type="button"
          onClick={handleGoogleLogin}
          className="w-full bg-red-500 text-white p-2 rounded"
        >
          Sign in with Google
        </button>
      </form>
    </div>
  );
}
