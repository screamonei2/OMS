/// <reference types="@sveltejs/kit" />

import type { SupabaseClient, Session } from '@supabase/supabase-js';

declare global {
    namespace App {
        interface Locals {
            supabase: SupabaseClient;
            getSession(): Promise<Session | null>;
        }

        interface PageData {
            session: Session | null;
            supabase: SupabaseClient;
        }

        // interface Error {}
        // interface Platform {}
    }
}

export {};
