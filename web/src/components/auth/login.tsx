import { useLogin, usePrivy } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useUserStore } from '@/stores/userStore';

export default function Login() {
    const { ready, authenticated, logout: privyLogout } = usePrivy();
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const { login: setLoggedIn, logout: setLoggedOut } = useUserStore();

    const { login } = useLogin({
        onComplete: ({ user, isNewUser, loginMethod }) => {
            console.log('User logged in successfully', user);
            console.log('Is new user:', isNewUser);
            console.log('Login method:', loginMethod);
            
            // Update Zustand store
            setLoggedIn({ 
                id: user.id,
                email: user.email?.address
            });
            
            router.push('/users');
        },
        onError: (error) => {
            console.error('Login failed', error);
            setError('Login failed. Please try again.');
        }
    });

    const disableLogin = !ready || (ready && authenticated);

    const handleLogin = () => {
        setError(null);
        login();
    };

    const handleLogout = () => {
        setError(null);
        setLoggedOut();
        privyLogout();
        router.push('/');
    };

    return (
        <div className="flex flex-col items-center gap-2">
            {authenticated ? (
                <button
                    onClick={handleLogout}
                    className="px-4 py-2 bg-red-500 text-white rounded min-w-3xs"
                >
                    Log out
                </button>
            ) : (
                <button
                    disabled={disableLogin}
                    onClick={handleLogin}
                    className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50 min-w-3xs"
                >
                    Log in
                </button>
            )}
            {error && (
                <p className="text-red-500 text-sm">{error}</p>
            )}
        </div>
    );
}
