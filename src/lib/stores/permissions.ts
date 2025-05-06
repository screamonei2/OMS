import { derived } from 'svelte/store';
import { session } from './auth';
import { hasPermission, getResourcePermissions, type Permission } from '../utils/permissions';

export const permissions = derived(session, ($session) => {
    if (!$session?.user) {
        return {
            can: () => false,
            getPermissionsFor: () => []
        };
    }

    return {
        can: (permission: Permission) => hasPermission($session.user, permission),
        getPermissionsFor: (resource: Permission['resource']) => 
            getResourcePermissions($session.user, resource)
    };
});