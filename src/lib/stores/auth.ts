import { writable, derived } from 'svelte/store';
import type { Session } from '@supabase/supabase-js';
import supabase from '$lib/supabaseClient';

function createAuthStore() {
    const { subscribe, set, update } = writable<{
        session: Session | null;
        isLoading: boolean;
    }>({
        session: null,
        isLoading: true
    });

async function logout() {
    const { error } = await supabase.auth.signOut();
    if (error) {
        console.error('Error logging out:', error.message);
    } else {
        reset();
        window.location.href = '/login';
    }
}

supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN') {
        setSession(session);
    } else if (event === 'SIGNED_OUT') {
        reset();
    }
});

    return {
        subscribe,
        setSession: (session: Session | null) => update(state => ({ ...state, session })),
        setLoading: (isLoading: boolean) => update(state => ({ ...state, isLoading })),
        reset: () => set({ session: null, isLoading: false }),
        logout
    };
}

export const { subscribe, setSession, setLoading, reset, logout } = createAuthStore();

// Exportar stores individuais para melhor composição
export const session = derived(createAuthStore(), ($auth) => $auth.session);

export const isLoading = derived(createAuthStore(), ($auth) => $auth.isLoading);
