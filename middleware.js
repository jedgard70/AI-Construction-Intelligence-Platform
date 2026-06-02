import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

// Rotas que NÃO precisam de login
const PUBLIC_PATHS = ['/', '/login', '/forgot-password', '/reset-password']
const OWNER_PROTECTED_PATHS = ['/owner-command']

function isOwnerProtectedPath(pathname) {
  return OWNER_PROTECTED_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))
}

export async function middleware(req) {
  const { pathname } = req.nextUrl

  // Ignorar static files, API routes e arquivos com extensão
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next()
  }

  const isPublic = PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))
  const isOwnerProtected = isOwnerProtectedPath(pathname)

  // Sem credenciais Supabase (dev local sem .env) → nao liberar Owner Command
  const url  = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key  = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
               process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) {
    if (isOwnerProtected) {
      const loginUrl = new URL('/login', req.url)
      loginUrl.searchParams.set('redirect', pathname)
      loginUrl.searchParams.set('reason', 'owner-auth-required')
      return NextResponse.redirect(loginUrl)
    }
    return NextResponse.next()
  }

  let res = NextResponse.next({ request: { headers: req.headers } })

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll()                  { return req.cookies.getAll() },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value))
        res = NextResponse.next({ request: req })
        cookiesToSet.forEach(({ name, value, options }) =>
          res.cookies.set(name, value, options))
      },
    },
  })

  const { data: { session } } = await supabase.auth.getSession()

  // Não logado tentando acessar rota protegida → redirecionar para /login
  if (!session && !isPublic) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('redirect', pathname)
    if (isOwnerProtected) {
      loginUrl.searchParams.set('reason', 'owner-auth-required')
    }
    return NextResponse.redirect(loginUrl)
  }

  // Já logado tentando acessar /login → redirecionar para destino pedido ou /dashboard
  if (session && pathname === '/login') {
    const redirect = req.nextUrl.searchParams.get('redirect')
    const target = redirect && redirect.startsWith('/') ? redirect : '/dashboard'
    return NextResponse.redirect(new URL(target, req.url))
  }

  return res
}

export const config = {
  // Executar em todas as rotas exceto arquivos estáticos
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
