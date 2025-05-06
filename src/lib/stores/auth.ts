import { writable, derived } from 'svelte/store';
import type { Session } from '@supabase/supabase-js';

function createAuthStore() {
    const { subscribe, set, update } = writable<{
        session: Session | null;
        isLoading: boolean;
    }>({
        session: null,
        isLoading: true
    });

    return {
        subscribe,
        setSession: (session: Session | null) => update(state => ({ ...state, session })),
        setLoading: (isLoading: boolean) => update(state => ({ ...state, isLoading })),
        reset: () => set({ session: null, isLoading: false })
    };
}

export const { subscribe, setSession, setLoading, reset } = createAuthStore();

// Exportar stores individuais para melhor composição
export const session = derived(createAuthStore(), ($auth) => $auth.session);

export const isLoading = derived(createAuthStore(), ($auth) => $auth.isLoading);
