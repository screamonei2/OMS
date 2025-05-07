<script lang="ts">
    import { onMount } from 'svelte';
    import { supabase } from '$lib/supabase';
    import OrderModal from "$lib/components/OrderModal.svelte";
    import ViewOrderModal from "$lib/components/ViewOrderModal.svelte";
    import ConfirmDeleteModal from "$lib/components/ConfirmDeleteModal.svelte";
    import { writable } from "svelte/store";

    let allOrders = [];
    let clients = [];
    let products = [];
    let loading = true;
    let searchTerm = "";
    let showOrderModal = false;
    let showConfirmDeleteModal = false;
    let showConfirmBulkDeleteModal = false;
    let showViewModal = false;
    let currentOrder: {
        id?: number;
        client_id: number;
        total: number;
        status: string;
        date: string;
    } | null = null;
    let selectedOrder = null;
    let orderToDeleteId: number | null = null;
    let selectedOrderIds = new Set<number>();

    async function fetchOrders() {
        const { data: ordersData, error: ordersError } = await supabase
            .from('orders')
            .select(`
                *,
                clients (
                    id,
                    name
                ),
                order_items (
                    id,
                    product_id,
                    quantity,
                    price,
                    products (
                        id,
                        name
                    )
                )
            `)
            .order('date', { ascending: false });
        
        if (ordersError) {
            console.error('Error fetching orders:', ordersError);
            return;
        }
        
        allOrders = ordersData;
        loading = false;
    }

    async function fetchClients() {
        const { data, error } = await supabase
            .from('clients')
            .select('id, name')
            .order('name');
        
        if (error) {
            console.error('Error fetching clients:', error);
            return;
        }
        
        clients = data;
    }

    async function fetchProducts() {
        const { data, error } = await supabase
            .from('products')
            .select('id, name, price')
            .order('name');
        
        if (error) {
            console.error('Error fetching products:', error);
            return;
        }
        
        products = data;
    }

    onMount(() => {
        fetchOrders();
        fetchClients();
        fetchProducts();

        // Subscribe to realtime changes
        const subscription = supabase
            .channel('orders_changes')
            .on('postgres_changes', 
                {
                    event: '*',
                    schema: 'public',
                    table: 'orders'
                },
                () => {
                    fetchOrders();
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    });

    $: orders = allOrders.filter((order) => {
        const clientName = order.clients?.name?.toLowerCase() || '';
        const orderStatus = order.status?.toLowerCase() || '';
        const searchLower = searchTerm.toLowerCase();
        return clientName.includes(searchLower) || orderStatus.includes(searchLower);
    });

    $: allVisibleSelected = orders.length > 0 && orders.every((o) => selectedOrderIds.has(o.id));
    $: someVisibleSelected = orders.some((o) => selectedOrderIds.has(o.id));
    $: isIndeterminate = someVisibleSelected && !allVisibleSelected;

    function handleSelectAllChange(event: Event) {
        const target = event.target as HTMLInputElement;
        if (target.checked) {
            orders.forEach((o) => selectedOrderIds.add(o.id));
        } else {
            orders.forEach((o) => selectedOrderIds.delete(o.id));
        }
        selectedOrderIds = selectedOrderIds;
    }

    function handleRowCheckboxChange(orderId: number, checked: boolean) {
        if (checked) {
            selectedOrderIds.add(orderId);
        } else {
            selectedOrderIds.delete(orderId);
        }
        selectedOrderIds = selectedOrderIds;
    }

    function openAddOrderModal() {
        currentOrder = null;
        showOrderModal = true;
    }

    function openEditOrderModal(order: any) {
        currentOrder = { ...order };
        showOrderModal = true;
    }

    function openConfirmDeleteModal(id: number) {
        orderToDeleteId = id;
        showConfirmDeleteModal = true;
    }

    function openConfirmBulkDeleteModal() {
        showConfirmBulkDeleteModal = true;
    }

    function handleRowClick(order) {
        selectedOrder = order;
        showViewModal = true;
    }

    async function handleSaveOrder(orderData: any) {
        try {
            if (orderData.id) {
                // Update existing order
                const { data: updatedOrder, error: orderError } = await supabase
                    .from('orders')
                    .update({
                        client_id: orderData.client_id,
                        total: orderData.total,
                        status: orderData.status,
                        date: orderData.date
                    })
                    .eq('id', orderData.id)
                    .select()
                    .single();

                if (orderError) throw orderError;

                // Delete existing order items
                const { error: deleteError } = await supabase
                    .from('order_items')
                    .delete()
                    .eq('order_id', orderData.id);

                if (deleteError) throw deleteError;
            } else {
                // Insert new order
                const { data: newOrder, error: orderError } = await supabase
                    .from('orders')
                    .insert([{
                        client_id: orderData.client_id,
                        total: orderData.total,
                        status: orderData.status,
                        date: orderData.date
                    }])
                    .select()
                    .single();

                if (orderError) throw orderError;
                orderData.id = newOrder.id;
            }

            // Insert order items
            if (orderData.order_items && orderData.order_items.length > 0) {
                const { error: itemsError } = await supabase
                    .from('order_items')
                    .insert(
                        orderData.order_items.map((item: any) => ({
                            order_id: orderData.id,
                            product_id: item.product_id,
                            quantity: item.quantity,
                            price: item.price
                        }))
                    );

                if (itemsError) throw itemsError;
            }

            showOrderModal = false;
            fetchOrders();  // Refresh orders list
        } catch (error) {
            console.error('Error saving order:', error);
        }
    }

    async function handleConfirmDelete() {
        if (orderToDeleteId) {
            try {
                // Delete order items first (foreign key constraint)
                const { error: itemsError } = await supabase
                    .from('order_items')
                    .delete()
                    .eq('order_id', orderToDeleteId);

                if (itemsError) throw itemsError;

                // Then delete the order
                const { error: orderError } = await supabase
                    .from('orders')
                    .delete()
                    .eq('id', orderToDeleteId);

                if (orderError) throw orderError;

                showConfirmDeleteModal = false;
                orderToDeleteId = null;
            } catch (error) {
                console.error('Error deleting order:', error);
            }
        }
    }

    async function handleConfirmBulkDelete() {
        try {
            // Delete order items first (foreign key constraint)
            const { error: itemsError } = await supabase
                .from('order_items')
                .delete()
                .in('order_id', Array.from(selectedOrderIds));

            if (itemsError) throw itemsError;

            // Then delete the orders
            const { error: ordersError } = await supabase
                .from('orders')
                .delete()
                .in('id', Array.from(selectedOrderIds));

            if (ordersError) throw ordersError;

            selectedOrderIds.clear();
            showConfirmBulkDeleteModal = false;
        } catch (error) {
            console.error('Error bulk deleting orders:', error);
        }
    }

    function getProductsSummary(orderItems: any[]): string {
        return orderItems
            ?.map(item => `${item.products?.name || 'Produto'} (${item.quantity}x)`)
            .join(', ') || '';
    }
</script>

<div class="card bg-base-100 card-border border-base-300">
    <div class="card-body">
        <div class="flex justify-between items-center mb-4">
            <!-- Search bar -->
            <div class="transition-all duration-300 ease-in-out w-64 focus-within:w-90">
                {#if selectedOrderIds.size === 0}
                    <label class="input input-bordered flex items-center gap-2 w-full">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="size-4">
                            <path fill-rule="evenodd" d="M9.965 11.026a5 5 0 1 1 1.06-1.06l2.755 2.754a.75.75 0 1 1-1.06 1.06l-2.755-2.754ZM10.5 7a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z" clip-rule="evenodd"/>
                        </svg>
                        <input
                            type="search"
                            class="grow"
                            placeholder="Buscar por cliente ou status..."
                            bind:value={searchTerm}
                        />
                    </label>
                {/if}
            </div>

            <!-- Action Buttons -->
            <div>
                {#if selectedOrderIds.size === 0}
                    <button class="btn btn-primary" on:click={openAddOrderModal}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-6">
                            <path fill-rule="evenodd" d="M12 3.75a.75.75 0 0 1 .75.75v6.75h6.75a.75.75 0 0 1 0 1.5h-6.75v6.75a.75.75 0 0 1-1.5 0v-6.75H4.5a.75.75 0 0 1 0-1.5h6.75V4.5a.75.75 0 0 1 .75-.75Z" clip-rule="evenodd"/>
                        </svg>
                        Novo Pedido
                    </button>
                {:else}
                    <button class="btn btn-error" on:click={openConfirmBulkDeleteModal}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-6">
                            <path fill-rule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 0 1 3.878.512.75.75 0 1 1-.256 1.478l-.209-.035-1.005 13.07a3 3 0 0 1-2.991 2.77H8.084a3 3 0 0 1-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 0 1-.256-1.478A48.567 48.567 0 0 1 7.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 0 1 3.369 0c1.603.051 2.815 1.387 2.815 2.951Zm-6.136-1.452a51.196 51.196 0 0 1 3.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 0 0-6 0v-.113c0-.794.609-1.428 1.364-1.452Zm-.355 5.945a.75.75 0 1 0-1.5.058l.347 9a.75.75 0 1 0 1.499-.058l-.346-9Zm5.48.058a.75.75 0 1 0-1.498-.058l-.347 9a.75.75 0 0 0 1.5.058l.345-9Z" clip-rule="evenodd"/>
                        </svg>
                        Excluir {selectedOrderIds.size} {selectedOrderIds.size === 1 ? "item" : "itens"} selecionados
                    </button>
                {/if}
            </div>
        </div>

        <div class="overflow-x-auto">
            <table class="table w-full">
                <thead>
                    <tr>
                        <th class="w-[4%]">
                            <label>
                                <input
                                    type="checkbox"
                                    class="checkbox rounded-sm"
                                    bind:checked={allVisibleSelected}
                                    bind:indeterminate={isIndeterminate}
                                    on:change={handleSelectAllChange}
                                />
                            </label>
                        </th>
                        <th class="w-[8%]">ID</th>
                        <th class="w-[20%]">Cliente</th>
                        <th class="w-[30%]">Produtos</th>
                        <th class="w-[12%]">Total</th>
                        <th class="w-[13%]">Status</th>
                        <th class="w-[13%] text-right"></th>
                    </tr>
                </thead>
                <tbody>
                    {#each orders as order (order.id)}
                        <tr class="group hover:bg-base-200 cursor-pointer" on:click={() => handleRowClick(order)}>
                            <td on:click|stopPropagation>
                                <label>
                                    <input
                                        type="checkbox"
                                        class="checkbox rounded-sm"
                                        checked={selectedOrderIds.has(order.id)}
                                        on:change={(e) => handleRowCheckboxChange(
                                            order.id,
                                            (e.target as HTMLInputElement).checked
                                        )}
                                    />
                                </label>
                            </td>
                            <td>{order.id}</td>
                            <td>{order.clients?.name || 'Cliente não encontrado'}</td>
                            <td>
                                <div class="flex flex-col">
                                    {#each order.order_items || [] as item}
                                        <span class="text-sm">
                                            {item.products?.name || 'Produto não encontrado'} ({item.quantity}x)
                                        </span>
                                    {/each}
                                </div>
                            </td>
                            <td>R$ {order.total.toFixed(2)}</td>
                            <td>
                                <div class="badge" class:badge-success={order.status === 'Entregue'}
                                    class:badge-warning={order.status === 'Pendente' || order.status === 'Em Processamento'}
                                    class:badge-error={order.status === 'Cancelado'}>
                                    {order.status}
                                </div>
                            </td>
                            <td class="text-right" on:click|stopPropagation>
                                <div class="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                    <button class="btn btn-sm" on:click={() => openEditOrderModal(order)}>
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-[1em]">
                                            <path d="M21.731 2.269a2.625 2.625 0 0 0-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 0 0 0-3.712ZM19.513 8.199l-3.712-3.712-8.4 8.4a5.25 5.25 0 0 0-1.32 2.214l-.8 2.685a.75.75 0 0 0 .933.933l2.685-.8a5.25 5.25 0 0 0 2.214-1.32l8.4-8.4Z"/>
                                            <path d="M5.25 5.25a3 3 0 0 0-3 3v10.5a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3V13.5a.75.75 0 0 0-1.5 0v5.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5V8.25a1.5 1.5 0 0 1 1.5-1.5h5.25a.75.75 0 0 0 0-1.5H5.25Z"/>
                                        </svg>
                                        Editar
                                    </button>
                                    <button class="btn btn-sm btn-error" on:click={() => openConfirmDeleteModal(order.id)}>
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-[1em]">
                                            <path fill-rule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 0 1 3.878.512.75.75 0 1 1-.256 1.478l-.209-.035-1.005 13.07a3 3 0 0 1-2.991 2.77H8.084a3 3 0 0 1-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 0 1-.256-1.478A48.567 48.567 0 0 1 7.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 0 1 3.369 0c1.603.051 2.815 1.387 2.815 2.951Zm-6.136-1.452a51.196 51.196 0 0 1 3.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 0 0-6 0v-.113c0-.794.609-1.428 1.364-1.452Zm-.355 5.945a.75.75 0 1 0-1.5.058l.347 9a.75.75 0 1 0 1.499-.058l-.346-9Zm5.48.058a.75.75 0 1 0-1.498-.058l-.347 9a.75.75 0 0 0 1.5.058l.345-9Z" clip-rule="evenodd"/>
                                        </svg>
                                        Excluir
                                    </button>
                                </div>
                            </td>
                        </tr>
                    {:else}
                        <tr>
                            <td colspan="7" class="text-center">Nenhum pedido encontrado.</td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
    </div>
</div>

<OrderModal
    bind:showModal={showOrderModal}
    order={currentOrder}
    {clients}
    {products}
    onSave={handleSaveOrder}
/>

<ConfirmDeleteModal
    bind:showModal={showConfirmDeleteModal}
    onConfirm={handleConfirmDelete}
    message={orderToDeleteId
        ? `Tem certeza que deseja excluir o pedido #${orderToDeleteId}? Esta ação não pode ser desfeita.`
        : ""}
/>

<ConfirmDeleteModal
    bind:showModal={showConfirmBulkDeleteModal}
    onConfirm={handleConfirmBulkDelete}
    message={`Tem certeza que deseja excluir os ${selectedOrderIds.size} pedidos selecionados? Esta ação não pode ser desfeita.`}
/>

<ViewOrderModal
    bind:showModal={showViewModal}
    order={selectedOrder}
/>