/**
 * useAuth — v1은 전원 익명 (DECISIONS #4). 세션 없으면 signInAnonymously.
 * 대시보드에서 Anonymous sign-ins 를 켜야 한다 (supabase/README.md).
 */
import type { Session } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { supabase } from '../lib/supabase';

interface AuthState {
  session: Session | null;
  loading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthState>({ session: null, loading: true, error: null });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ session: null, loading: true, error: null });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getSession();
      let session = data.session;
      if (!session) {
        const { data: anon, error } = await supabase.auth.signInAnonymously();
        if (error) {
          if (!cancelled) setState({ session: null, loading: false, error: error.message });
          return;
        }
        session = anon.session;
      }
      if (!cancelled) setState({ session, loading: false, error: null });
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setState((s) => ({ ...s, session }));
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
