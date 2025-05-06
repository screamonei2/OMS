<script lang="ts">
    import { onMount } from 'svelte';
    import { supabase } from '../supabase';

    let pendingOrdersCount = 0;

    async function fetchPendingOrdersCount() {
        const { data, error } = await supabase
            .from('orders')
            .select('id')
            .eq('status', 'Pendente');
        
        if (error) {
            console.error('Error fetching pending orders:', error);
            return;
        }
        
        pendingOrdersCount = data?.length || 0;
    }

    onMount(() => {
        fetchPendingOrdersCount();

        const subscription = supabase
            .channel('orders_changes')
            .on('postgres_changes', 
                {
                    event: '*',
                    schema: 'public',
                    table: 'orders'
                },
                () => {
                    fetchPendingOrdersCount();
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    });
</script>

<aside class="card bg-base-100 card-border border-base-300">
    <ul class="menu w-full">
        <li>
            <a href="/orders"
                ><svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke-width="1.5"
                    stroke="currentColor"
                    class="size-5 opacity-30"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                </svg>
                Pedidos {#if pendingOrdersCount > 0}<span class="badge justify-self-end">{pendingOrdersCount}</span>{/if}</a
            >
        </li>
        <li>
            <a href="/products"
                ><svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke-width="1.5"
                    stroke="currentColor"
                    class="size-5 opacity-30"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                    />
                </svg>
                Produtos</a
            >
        </li>
        <li>
            <a href="/clients"
                ><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-5 opacity-30">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Z" />
                </svg>
                Clientes</a
            >
        </li>
        <li>
            <a href="/categories"
                ><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-5 opacity-30">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.372l2.508-1.447a2.25 2.25 0 0 0 1.141-2.069V11.13c0-.597-.237-1.17-.659-1.591L9.568 3Z" />
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 6h.008v.008H6V6Z" />
                </svg>
                Categorias</a
            >
        </li>
    </ul>
</aside>
