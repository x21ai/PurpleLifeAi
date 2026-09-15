// Auth middleware for server functions. Branches Supabase JWT vs Workers JWT.
import { createMiddleware } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'
import { getDataBackend } from '@/lib/cloudflare/data-backend'
import { getBindings, setRequestBindings } from '@/lib/cloudflare/bindings'
import { verifyJwt } from '@/lib/cloudflare/auth/jwt'
import { createCloudflareSupabaseShim } from '@/lib/cloudflare/supabase-shim'

type AuthMiddlewareContext = {
  supabase: ReturnType<typeof createClient<Database>>
  userId: string
  claims: { sub: string; email?: string; [key: string]: unknown }
}

async function resolveAuthContext(): Promise<AuthMiddlewareContext> {
  setRequestBindings(process.env)
  const request = getRequest()

  if (!request?.headers) {
    throw new Error('Unauthorized: No request headers available')
  }

  const authHeader = request.headers.get('authorization')
  if (!authHeader) {
    throw new Error('Unauthorized: No authorization header provided')
  }
  if (!authHeader.startsWith('Bearer ')) {
    throw new Error('Unauthorized: Only Bearer tokens are supported')
  }

  const token = authHeader.replace('Bearer ', '')
  if (!token) {
    throw new Error('Unauthorized: No token provided')
  }

  if (getDataBackend(getBindings()) === 'cloudflare') {
    const secret = getBindings().AUTH_JWT_SECRET ?? process.env.AUTH_JWT_SECRET
    if (!secret) throw new Error('AUTH_JWT_SECRET not configured')
    const claims = await verifyJwt(secret, token)
    if (!claims?.sub) throw new Error('Unauthorized: Invalid token')
    const supabase = createCloudflareSupabaseShim(claims.sub) as unknown as ReturnType<
      typeof createClient<Database>
    >
    return {
      supabase,
      userId: claims.sub,
      claims: { sub: claims.sub, email: claims.email, iss: claims.iss },
    }
  }

  const SUPABASE_URL = process.env.SUPABASE_URL
  const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    const missing = [
      ...(!SUPABASE_URL ? ['SUPABASE_URL'] : []),
      ...(!SUPABASE_PUBLISHABLE_KEY ? ['SUPABASE_PUBLISHABLE_KEY'] : []),
    ]
    const message = `Missing Supabase environment variable(s): ${missing.join(', ')}. Set them in the deployment environment.`
    console.error(`[Supabase] ${message}`)
    throw new Error(message)
  }

  const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: {
      storage: undefined,
      persistSession: false,
      autoRefreshToken: false,
    },
  })

  const { data, error } = await supabase.auth.getClaims(token)
  if (error || !data?.claims?.sub) {
    throw new Error('Unauthorized: Invalid token')
  }

  return {
    supabase,
    userId: data.claims.sub,
    claims: data.claims as AuthMiddlewareContext['claims'],
  }
}

export const requireSupabaseAuth = createMiddleware({ type: 'function' }).server(
  async ({ next }) => {
    const context = await resolveAuthContext()
    return next({ context })
  },
)
