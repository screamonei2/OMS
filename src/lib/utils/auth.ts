import type { RequestEvent } from '@sveltejs/kit';
import { redirect, error } from '@sveltejs/kit';
import type { ProtectedRouteData } from '../types';

export async function requireAuth(event: RequestEvent): Promise<ProtectedRouteData> {
    const { data: { user }, error } = await event.locals.supabase.auth.getUser();

if (error || !user) {
    throw redirect(303, '/auth');
}

const session = {
    user,
    access_token: '', // Placeholder for access_token
    refresh_token: '', // Placeholder for refresh_token
    expires_in: 3600, // Assuming a 1-hour session for simplicity
    token_type: 'bearer', // Assuming token type is bearer
    expires_at: Date.now() / 1000 + 3600 // Assuming a 1-hour session for simplicity
};
    
    if (!session || !session.user) {
        throw redirect(303, '/auth');
    }
    
    // Verificar se o token está próximo de expirar (30 minutos)
    const expirationTime = new Date(session.expires_at * 1000);
    const thirtyMinutesFromNow = new Date(Date.now() + 30 * 60 * 1000);
    
    if (expirationTime < thirtyMinutesFromNow) {
        // Token está próximo de expirar, tentar renovar
        const { data: { session: newSession }, error: refreshError } = 
            await event.locals.supabase.auth.refreshSession();
            
        if (refreshError || !newSession) {
            throw redirect(303, '/auth');
        }
        
        return {
            session: newSession,
            user: newSession.user
        };
    }
    
    return {
        session,
        user: session.user
    };
}

export function createProtectedLoader<T extends ProtectedRouteData>(
    loader: (event: RequestEvent, auth: T) => Promise<unknown>
) {
    return async (event: RequestEvent) => {
        const auth = await requireAuth(event);
        return loader(event, auth as T);
    };
}
