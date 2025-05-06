<script lang="ts">
    import '../style.css';
    import { setSession, setLoading } from '$lib/stores/auth';
    import { page } from '$app/stores';
    import Header from '$lib/components/Header.svelte';
    import Sidebar from '$lib/components/Sidebar.svelte';
    import { invalidate } from '$app/navigation';
    import { onMount } from 'svelte';

    export let data;

    $: {
        setSession(data.session);
        setLoading(false);
    }

    onMount(() => {
        const {
            data: { subscription },
        } = data.supabase.auth.onAuthStateChange((event, session) => {
            if (session?.expires_at !== data.session?.expires_at) {
                invalidate('supabase:auth');
            }
            setSession(session);
        });

        return () => subscription.unsubscribe();
    });

    async function signOut() {
        const { error } = await data.supabase.auth.signOut();
        if (error) console.error('Erro ao fazer logout:', error);
    };

    const routeTitles: { [key: string]: string } = {
        '/': 'Painel',
        '/products': 'Produtos',
        '/clients': 'Clientes',
        '/categories': 'Categorias',
        '/orders': 'Pedidos'
        // Adicione outras rotas e títulos aqui
    };

    $: title = routeTitles[$page.route.id ?? '/'] || ($page.route.id?.replace('/', '').replace(/^./, c => c.toUpperCase()) ?? 'Página');
</script>

{#if $page.url.pathname.startsWith('/auth')}
    <slot />
{:else}

    <div class="min-h-screen flex flex-col items-center p-10 box-border bg-base-200">
        <div class="container max-w-7xl px-4 flex flex-col flex-1">
            <Header {signOut} />
    
            <div class="flex flex-1 mt-4">
                <Sidebar />
                <main class="flex-1 pl-6 pb-6">
                    <h2 class="card-title text-5xl mb-2">{title}</h2>
                    <slot />
                </main>
            </div>
        </div>
    </div>
{/if}

<style>
   
</style>