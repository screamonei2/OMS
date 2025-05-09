<script lang="ts">
    import Auth from '$lib/components/Auth.svelte';
    import { page } from '$app/stores';
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';

    export let data;

    let error = $page.url.searchParams.get('error');
    let redirectTo = $page.url.searchParams.get('redirectTo') || '/';

    onMount(() => {
        // Se já estiver autenticado, redirecionar
        if (data.session) {
            goto(redirectTo);
        }
    });
</script>

<div class="min-h-screen bg-base-200 flex flex-col items-center justify-center p-4">
    {#if error}
        <div class="alert alert-error max-w-md mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{decodeURIComponent(error)}</span>
        </div>
    {/if}
    
    <Auth />
</div>