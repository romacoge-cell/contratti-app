import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Questo comando dice al sito: "Appena carichi la home, vai subito al login"
    router.push('/login');
  }, []);

  return null;
}