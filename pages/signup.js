import { useEffect } from 'react';
import { useRouter } from 'next/router';

/**
 * Signup is disabled. Single-admin only — redirect to login.
 */
export default function Signup() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/login');
  }, [router]);
  return null;
}
