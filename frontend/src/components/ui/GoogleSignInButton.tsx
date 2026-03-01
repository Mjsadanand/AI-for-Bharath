import { useState, useRef, useEffect } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

interface GoogleSignInButtonProps {
  mode?: 'login' | 'register';
  onError?: (message: string) => void;
}

export default function GoogleSignInButton({ mode = 'login', onError }: GoogleSignInButtonProps) {
  const [loading, setLoading] = useState(false);
  const [btnWidth, setBtnWidth] = useState(280);
  const containerRef = useRef<HTMLDivElement>(null);
  const { googleLogin } = useAuth();
  const navigate = useNavigate();

  // Check if Google Client ID is configured
  const isConfigured = !!import.meta.env.VITE_GOOGLE_CLIENT_ID;

  // Measure container width for responsive button sizing
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? 280;
      setBtnWidth(Math.min(Math.floor(w), 320));
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  if (!isConfigured) {
    return null;
  }

  return (
    <div ref={containerRef} className="w-full max-w-xs mx-auto">
      {loading ? (
        <div className="flex items-center justify-center gap-3 px-4 py-2.5 bg-white border border-slate-200 rounded-xl">
          <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
          <span className="text-sm text-slate-500">Signing in with Google...</span>
        </div>
      ) : (
        <div className="flex justify-center">
          <GoogleLogin
            onSuccess={async (credentialResponse) => {
              if (!credentialResponse.credential) {
                onError?.('No credential received from Google.');
                return;
              }
              setLoading(true);
              try {
                const result = await googleLogin(credentialResponse.credential);

                if (result.isNewUser || !result.isProfileComplete) {
                  navigate('/select-role');
                } else {
                  navigate('/dashboard');
                }
              } catch (err: unknown) {
                const error = err as { response?: { data?: { message?: string } } };
                const message = error.response?.data?.message || 'Google sign-in failed. Please try again.';
                onError?.(message);
              } finally {
                setLoading(false);
              }
            }}
            onError={() => {
              onError?.('Google sign-in was cancelled or failed.');
            }}
            text={mode === 'login' ? 'signin_with' : 'signup_with'}
            shape="pill"
            theme="outline"
            size="large"
            width={btnWidth}
            logo_alignment="left"
          />
        </div>
      )}
    </div>
  );
}
