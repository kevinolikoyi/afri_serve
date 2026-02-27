import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname

  // Protéger les routes dashboard uniquement
  if (path.startsWith('/dashboard') && !user) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // Ne jamais bloquer l'accès à login/register
  // même si une session est active
  return response
}

export const config = {
  matcher: ['/dashboard/:path*', '/auth/login', '/auth/register'],
}