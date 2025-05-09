import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { EmailOtpType } from '@supabase/supabase-js';
import { supabase } from '$lib/supabase';

export const GET: RequestHandler = async ({ url }) => {
    const token_hash = url.searchParams.get('token_hash');
    const type = url.searchParams.get('type') as EmailOtpType | null;
    const redirectTo = url.searchParams.get('redirectTo') ?? '/';
    const error_description = url.searchParams.get('error_description');

    // If there's an error in authentication, redirect to login with message
    if (error_description) {
        return redirect(303, `/auth?error=${encodeURIComponent(error_description)}`);
    }

    // Verify authentication token
    if (token_hash && type) {
        const { error } = await supabase.auth.verifyOtp({
            type,
            token_hash,
        });

        if (!error) {
            // Authentication successful, redirect to the originally requested page
            return redirect(303, redirectTo);
        }

        // If verification fails, redirect with error message
        return redirect(303, `/auth?error=${encodeURIComponent('Email verification failed. Please try again.')}`);
    }

    // If there's no token or type, something is wrong with the process
    return redirect(303, '/auth?error=Invalid authentication process');
};
