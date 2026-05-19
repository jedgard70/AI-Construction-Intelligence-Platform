import { createBrowserClient } from '@supabase/ssr'

// Mock for build time when env vars might be missing
const mockSupabase = new Proxy({} as any, {
  get: (target, prop) => {
    if (prop === 'auth') {
      return {
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signInWithPassword: async () => ({ data: {}, error: new Error('Supabase not configured') }),
        signOut: async () => ({ error: null }),
        getUser: async () => ({ data: { user: null }, error: null }),
        getSession: async () => ({ data: { session: null }, error: null }),
      };
    }
    const fn = () => mockObject;
    const mockObject: any = {
      select: () => mockObject,
      from: () => mockObject,
      order: () => mockObject,
      limit: () => mockObject,
      eq: () => mockObject,
      single: () => Promise.resolve({ data: null, error: null }),
      then: (resolve: any) => resolve({ data: [], error: null }),
    };
    Object.assign(fn, mockObject);
    return fn;
  }
});

let client: any = null;

export function createClient() {
  if (client) return client;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const supabaseKey = (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)?.trim();

  if (!supabaseUrl || !supabaseUrl.startsWith('http') || !supabaseKey) {
    return mockSupabase;
  }

  client = createBrowserClient(supabaseUrl, supabaseKey);
  return client;
}
