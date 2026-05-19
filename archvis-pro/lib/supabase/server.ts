import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * If using Fluid compute: Don't put this client in a global variable. Always create a new client within each
 * function when using it.
 */
export async function createClient() {
  const cookieStore = await cookies()
  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "https://ktersmmmaaxdgesqomup.supabase.co");
  const supabaseKey = (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_wF2iQvaJ8ydwLiFpqgJyLg_RsqmQOXL")?.trim();

  if (!supabaseUrl || !supabaseUrl.startsWith('http') || !supabaseKey) {
    // Return a mock similar to the client mock
    return new Proxy({} as any, {
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
  }

  return createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: any }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}
