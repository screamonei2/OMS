import type { Session, User } from '@supabase/supabase-js';

export interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
}

// Tipos para o estado de autenticação
export interface AuthState {
    session: Session | null;
    isLoading: boolean;
}

// Tipos para as respostas da API
export interface ApiError {
    message: string;
    status: number;
}

// Tipos para o contexto do usuário
export interface UserContext {
    user: User | null;
    session: Session | null;
}

// Tipos para eventos de autenticação
export type AuthEvent = 
    | { type: 'SIGNED_IN'; session: Session }
    | { type: 'SIGNED_OUT' }
    | { type: 'USER_UPDATED'; user: User }
    | { type: 'TOKEN_REFRESHED'; session: Session };

// Tipos para as rotas protegidas
export interface ProtectedRouteData {
    user: User;
    session: Session;
}