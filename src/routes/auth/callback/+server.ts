import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { EmailOtpType } from '@supabase/supabase-js';
import { supabase } from '$lib/supabase';

export const GET: RequestHandler = async ({ url }) => {
    const token_hash = url.searchParams.get('token_hash');
    const type = url.searchParams.get('type') as EmailOtpType | null;
    const next = url.searchParams.get('next') ?? '/';
    const error_description = url.searchParams.get('error_description');

    // Limpar a URL removendo os parâmetros de autenticação
    const redirectTo = new URL(url);
    redirectTo.pathname = next;
    redirectTo.searchParams.delete('token_hash');
    redirectTo.searchParams.delete('type');
    redirectTo.searchParams.delete('next');

    // Se houver erro na autenticação, redirecionar para página de login com mensagem
    if (error_description) {
        return redirect(303, `/auth?error=${encodeURIComponent(error_description)}`);
    }

    // Verificar token de autenticação
    if (token_hash && type) {
        const { error } = await supabase.auth.verifyOtp({
            type,
            token_hash,
        });

        if (!error) {
            // Autenticação bem sucedida, redirecionar para a página inicial
            return redirect(303, '/');
        }

        // Em caso de erro na verificação, redirecionar com mensagem de erro
        return redirect(303, `/auth?error=${encodeURIComponent('Falha na verificação do email. Por favor, tente novamente.')}`);
    }

    // Se não houver token ou tipo, algo está errado no processo
    return redirect(303, '/auth?error=Processo de autenticação inválido');
};