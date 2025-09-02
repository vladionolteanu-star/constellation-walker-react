// src/components/SupabaseStatus.tsx
import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase'; // ajustează calea relativă dacă ai altă structură

export default function SupabaseStatus() {
  const [status, setStatus] = useState<'unknown' | 'ok' | 'error'>('unknown');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    supabase.from('users').select('id').limit(1).then(({ error }) => {
      if (error) {
        setStatus('error');
        setErrorMsg(error.message);
      } else {
        setStatus('ok');
      }
    });
  }, []);

  if (status === 'unknown') return <span>Verific conexiunea la Supabase...</span>;
  if (status === 'ok') return <span style={{ color: 'green', fontWeight: 'bold' }}>Conexiune SUPABASE OK ✅</span>;
  if (status === 'error') return (
    <span style={{ color: 'red', fontWeight: 'bold' }}>
      ❌ Conexiune SUPABASE EȘUATĂ: {errorMsg}
    </span>
  );
}
