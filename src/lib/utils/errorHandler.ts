import { AuthError } from '@supabase/supabase-js';
import type { ApiError } from '$lib/types';

export function handleAuthError(error: unknown): ApiError {
    if (error instanceof AuthError) {
        switch (error.status) {
            case 400:
                return {
                    message: 'Dados de autenticação inválidos',
                    status: 400
                };
            case 401:
                return {
                    message: 'Não autorizado. Por favor, faça login novamente',
                    status: 401
                };
            case 422:
                return {
                    message: 'Dados inválidos. Verifique as informações fornecidas',
                    status: 422
                };
            default:
                return {
                    message: error.message,
                    status: error.status
                };
        }
    }

    if (error instanceof Error) {
        return {
            message: error.message,
            status: 500
        };
    }

    return {
        message: 'Ocorreu um erro inesperado',
        status: 500
    };
}