import { createServerClient } from '@supabase/ssr'
import { type Handle, redirect, error } from '@sveltejs/kit'
import { sequence } from '@sveltejs/kit/hooks'
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public'
import type { Permission } from '$lib/utils/permissions'
import { hasPermission } from '$lib/utils/permissions';

const supabase: Handle = async ({ event, resolve }) => {
    event.locals.supabase = createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
        cookies: {
            get: (key) => event.cookies.get(key),
            set: (key, value, options) => {
                event.cookies.set(key, value, { ...options, path: '/' })
            },
            remove: (key, options) => {
                event.cookies.delete(key, { ...options, path: '/' })
            },
        },
    })

    event.locals.getSession = async () => {
        const {
            data: { user },
            error: userError,
        } = await event.locals.supabase.auth.getUser()

        if (userError || !user) {
            return null
        }

        const session = {
            user,
            access_token: '', // Placeholder for access_token
            refresh_token: '', // Placeholder for refresh_token
            expires_in: 3600, // Assuming a 1-hour session for simplicity
            token_type: 'bearer', // Assuming token type is bearer
            expires_at: Date.now() / 1000 + 3600 // Assuming a 1-hour session for simplicity
        };

        return session
    }

    return resolve(event, {
        filterSerializedResponseHeaders(name) {
            return name === 'content-range'
        },
    })
}

// Mapeamento de rotas para permissões necessárias
const routePermissions: Record<string, Permission> = {
    '/orders': { action: 'read', resource: 'orders' },
    '/products': { action: 'read', resource: 'products' },
    '/clients': { action: 'read', resource: 'clients' },
    '/categories': { action: 'read', resource: 'categories' }
}

const authorization: Handle = async ({ event, resolve }) => {
    const session = await event.locals.getSession()
    const path = event.url.pathname
    
    // Rotas públicas que não precisam de autenticação
    const publicRoutes = ['/auth', '/auth/callback']
    const isPublicRoute = publicRoutes.some(route => path.startsWith(route))
    
    if (!session && !isPublicRoute) {
        throw redirect(303, `/auth?redirectTo=${encodeURIComponent(path)}`)
    }

    if (session && path === '/auth') {
        throw redirect(303, '/')
    }

    // Verificar permissões para rotas protegidas
    if (session?.user && routePermissions[path]) {
        const { data: userData } = await event.locals.supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', session.user.id)
            .single()

        const userRole = userData?.role || 'user'
        session.user.user_metadata = { ...session.user.user_metadata, role: userRole }

        // Atualizar os metadados do usuário se necessário
        if (!session.user.user_metadata.role) {
            await event.locals.supabase.auth.updateUser({
                data: { role: userRole }
            })
        }

        const requiredPermission = routePermissions[path]
        if (!hasPermission(session.user, requiredPermission)) {
            throw error(403, {
                message: `Acesso negado: Você não tem permissão para ${requiredPermission.action} em ${requiredPermission.resource}`
            })
        }
    }

    return resolve(event)
}

export const handle: Handle = sequence(supabase, authorization)
