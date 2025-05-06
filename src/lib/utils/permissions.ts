import type { User } from '@supabase/supabase-js';

export type Role = 'admin' | 'manager' | 'user';

export interface Permission {
    action: 'create' | 'read' | 'update' | 'delete';
    resource: 'orders' | 'products' | 'clients' | 'categories';
}

const rolePermissions: Record<Role, Permission[]> = {
    admin: [
        { action: 'create', resource: 'orders' },
        { action: 'read', resource: 'orders' },
        { action: 'update', resource: 'orders' },
        { action: 'delete', resource: 'orders' },
        { action: 'create', resource: 'products' },
        { action: 'read', resource: 'products' },
        { action: 'update', resource: 'products' },
        { action: 'delete', resource: 'products' },
        { action: 'create', resource: 'clients' },
        { action: 'read', resource: 'clients' },
        { action: 'update', resource: 'clients' },
        { action: 'delete', resource: 'clients' },
        { action: 'create', resource: 'categories' },
        { action: 'read', resource: 'categories' },
        { action: 'update', resource: 'categories' },
        { action: 'delete', resource: 'categories' }
    ],
    manager: [
        { action: 'create', resource: 'orders' },
        { action: 'read', resource: 'orders' },
        { action: 'update', resource: 'orders' },
        { action: 'read', resource: 'products' },
        { action: 'update', resource: 'products' },
        { action: 'read', resource: 'clients' },
        { action: 'update', resource: 'clients' },
        { action: 'read', resource: 'categories' },
        { action: 'update', resource: 'categories' }
    ],
    user: [
        { action: 'read', resource: 'orders' },
        { action: 'read', resource: 'products' },
        { action: 'read', resource: 'clients' },
        { action: 'read', resource: 'categories' }
    ]
};

export function getUserRole(user: User): Role {
    return (user.user_metadata.role as Role) || 'user';
}

export function hasPermission(user: User, permission: Permission): boolean {
    const role = getUserRole(user);
    return rolePermissions[role].some(
        p => p.action === permission.action && p.resource === permission.resource
    );
}

export function getResourcePermissions(user: User, resource: Permission['resource']): Permission['action'][] {
    const role = getUserRole(user);
    return rolePermissions[role]
        .filter(p => p.resource === resource)
        .map(p => p.action);
}

export function checkPermission(user: User, permission: Permission): void {
    if (!hasPermission(user, permission)) {
        throw new Error(`Acesso negado: Você não tem permissão para ${permission.action} em ${permission.resource}`);
    }
}