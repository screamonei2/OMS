<script lang="ts">
    import { onMount } from 'svelte';
    import { supabase } from '$lib/supabase';
    import OrderModal from "$lib/components/OrderModal.svelte";
    import ConfirmDeleteModal from "$lib/components/ConfirmDeleteModal.svelte";

    let allOrders: Array<{
        id: number;
        client_id: number;
        order_items: Array<{
            product_id: number;
            quantity: number;
            price: number;
        }>;
        total: number;
        status: string;
        date: string;
    }> = [];
    let searchTerm = "";
    let showOrderModal = false;
    let showConfirmDeleteModal = false;
    let showConfirmBulkDeleteModal = false;
    let loading = true;
    let isProcessingSave = false;
    let currentOrder: {
        id?: number;
        client_id: number;
        order_items: Array<{
            product_id: number;
            quantity: number;
            price: number;
        }>;
        total: number;
        status: string;
        date: string;
    } | null = null;
    let orderToDeleteId: number | null = null;
    let selectedOrderIds = new Set<number>();

    async function fetchOrders() {
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .order('date', { ascending: false });

        if (error) {
            console.error('Error fetching orders:', error);
            return;
        }

        allOrders = data;
        loading = false;
    }

    onMount(() => {
        fetchOrders();

        // Subscribe to realtime changes
        const subscription = supabase
            .channel('orders_changes')
            .on('postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'orders'
                },
                (payload) => {
                    console.log('Recebida atualização em tempo real para pedidos:', payload);
                    fetchOrders();
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    });

    $: orders = allOrders.filter((order) =>
        order.id.toString().includes(searchTerm) ||
        order.client_id.toString().includes(searchTerm) ||
        order.status.toLowerCase().includes(searchTerm.toLowerCase())
    );

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

    function openEditOrderModal(order: {
        id: number;
        client_id: number;
        order_items: Array<{
            product_id: number;
            quantity: number;
            price: number;
        }>;
        total: number;
        status: string;
        date: string;
    }) {
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

    async function handleSaveOrder(orderData: {
        id?: number;
        clientId: number;
        products: Array<{
            productId: number;
            quantity: number;
            price: number;
        }>;
        total: number;
        status: string;
        date: string;
    }) {
        isProcessingSave = true;
        try {
            if (orderData.id) {
                const { error } = await supabase
                    .from('orders')
                    .update({
                        client_id: orderData.clientId,
                        order_items: orderData.products,
                        total: orderData.total,
                        status: orderData.status,
                        date: orderData.date
                    })
                    .eq('id', orderData.id);

                if (error) {
                    console.error('Error updating order:', error);
                    return;
                }
            } else {
                const { error } = await supabase
                    .from('orders')
                    .insert([{
                        client_id: orderData.clientId,
                        order_items: orderData.products,
                        total: orderData.total,
                        status: orderData.status,
                        date: orderData.date
                    }]);

                if (error) {
                    console.error('Error inserting order:', error);
                    return;
                }
            }
            // Forçar atualização manual para garantir que os dados sejam atualizados
            await fetchOrders();
            showOrderModal = false;
        } finally {
            isProcessingSave = false;
        }
    }

    async function handleConfirmDelete() {
        if (orderToDeleteId) {
            const { error } = await supabase
                .from('orders')
                .delete()
                .eq('id', orderToDeleteId);

            if (error) {
                console.error('Error deleting order:', error);
                return;
            }

            // Forçar atualização manual para garantir que os dados sejam atualizados
            await fetchOrders();
        }
        showConfirmDeleteModal = false;
        orderToDeleteId = null;
    }

    async function handleConfirmBulkDelete() {
        const { error } = await supabase
            .from('orders')
            .delete()
            .in('id', Array.from(selectedOrderIds));

        if (error) {
            console.error('Error bulk deleting orders:', error);
            return;
        }

        selectedOrderIds.clear();
        showConfirmBulkDeleteModal = false;
    }
</script>

<div class="card bg-base-100 card-border border-base-300">
    <div class="card-body">
        <div class="flex justify-between items-center mb-4">
            <!-- Left side: Search bar or placeholder -->
            <div
                class="transition-all duration-300 ease-in-out w-64 focus-within:w-90"
            >
                {#if selectedOrderIds.size === 0}
                    <label
                        class="input input-bordered flex items-center gap-2 w-full"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 16 16"
                            fill="currentColor"
                            class="size-4"
                        >
                            <path
                                fill-rule="evenodd"
                                d="M9.965 11.026a5 5 0 1 1 1.06-1.06l2.755 2.754a.75.75 0 1 1-1.06 1.06l-2.755-2.754ZM10.5 7a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z"
                                clip-rule="evenodd"
                            ></path>
                        </svg>
                        <input
                            type="search"
                            class="grow"
                            placeholder="Encontrar pedidos..."
                            bind:value={searchTerm}
                        />
                    </label>
                {/if}
            </div>

            <!-- Right side: Action Buttons -->
            <div>
                {#if selectedOrderIds.size === 0}
                    <button
                        class="btn btn-primary"
                        on:click={openAddOrderModal}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            class="size-6"
                        >
                            <path
                                fill-rule="evenodd"
                                d="M12 3.75a.75.75 0 0 1 .75.75v6.75h6.75a.75.75 0 0 1 0 1.5h-6.75v6.75a.75.75 0 0 1-1.5 0v-6.75H4.5a.75.75 0 0 1 0-1.5h6.75V4.5a.75.75 0 0 1 .75-.75Z"
                                clip-rule="evenodd"
                            />
                        </svg>
                        Adicionar Pedido
                    </button>
                {:else}
                    <button
                        class="btn btn-error"
                        on:click={openConfirmBulkDeleteModal}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            class="size-6"
                        >
                            <path
                                fill-rule="evenodd"
                                d="M16.5 4.478v.227a48.816 48.816 0 0 1 3.878.512.75.75 0 1 1-.256 1.478l-.209-.035-1.005 13.07a3 3 0 0 1-2.991 2.77H8.084a3 3 0 0 1-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 0 1-.256-1.478A48.567 48.567 0 0 1 7.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 0 1 3.369 0c1.603.051 2.815 1.387 2.815 2.951Zm-6.136-1.452a51.196 51.196 0 0 1 3.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 0 0-6 0v-.113c0-.794.609-1.428 1.364-1.452Zm-.355 5.945a.75.75 0 1 0-1.5.058l.347 9a.75.75 0 1 0 1.499-.058l-.346-9Zm5.48.058a.75.75 0 1 0-1.498-.058l-.347 9a.75.75 0 0 0 1.5.058l.345-9Z"
                                clip-rule="evenodd"
                            />
                        </svg>
                        Excluir {selectedOrderIds.size}
                        {selectedOrderIds.size === 1 ? "item" : "itens"} selecionados
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
                        <th class="w-[20%]">Total</th>
                        <th class="w-[20%]">Status</th>
                        <th class="w-[20%]">Data</th>
                        <th class="w-[5%] text-right"></th>
                    </tr>
                </thead>
                <tbody>
                    {#each orders as order (order.id)}
                        <tr class="group hover:bg-base-200">
                            <td>
                                <label>
                                    <input
                                        type="checkbox"
                                        class="checkbox rounded-sm"
                                        checked={selectedOrderIds.has(
                                            order.id,
                                        )}
                                        on:change={(e) =>
                                            handleRowCheckboxChange(
                                                order.id,
                                                (e.target as HTMLInputElement)
                                                    .checked,
                                            )}
                                    />
                                </label>
                            </td>
                            <td>{order.id}</td>
                            <td>{order.client_id}</td>
                            <td>R$ {order.total.toFixed(2)}</td>
                            <td>{order.status}</td>
                            <td>{new Date(order.date).toLocaleDateString()}</td>
                            <td class="text-right">
                                <div
                                    class="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                >
                                    <button
                                        class="btn btn-sm"
                                        on:click={() =>
                                            openEditOrderModal(order)}
                                        ><svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 24 24"
                                            fill="currentColor"
                                            class="size-[1em]"
                                        >
                                            <path
                                                d="M21.731 2.269a2.625 2.625 0 0 0-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 0 0 0-3.712ZM19.513 8.199l-3.712-3.712-8.4 8.4a5.25 5.25 0 0 0-1.32 2.214l-.8 2.685a.75.75 0 0 0 .933.933l2.685-.8a5.25 5.25 0 0 0 2.214-1.32l8.4-8.4Z"
                                            />
                                            <path
                                                d="M5.25 5.25a3 3 0 0 0-3 3v10.5a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3V13.5a.75.75 0 0 0-1.5 0v5.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5V8.25a1.5 1.5 0 0 1 1.5-1.5h5.25a.75.75 0 0 0 0-1.5H5.25Z"
                                            />
                                        </svg>
                                        Editar</button
                                    >
                                    <button
                                        class="btn btn-sm btn-error"
                                        on:click={() =>
                                            openConfirmDeleteModal(order.id)}
                                        ><svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 24 24"
                                            fill="currentColor"
                                            class="size-[1em]"
                                        >
                                            <path
                                                fill-rule="evenodd"
                                                d="M16.5 4.478v.227a48.816 48.816 0 0 1 3.878.512.75.75 0 1 1-.256 1.478l-.209-.035-1.005 13.07a3 3 0 0 1-2.991 2.77H8.084a3 3 0 0 1-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 0 1-.256-1.478A48.567 48.567 0 0 1 7.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 0 1 3.369 0c1.603.051 2.815 1.387 2.815 2.951Zm-6.136-1.452a51.196 51.196 0 0 1 3.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 0 0-6 0v-.113c0-.794.609-1.428 1.364-1.452Zm-.355 5.945a.75.75 0 1 0-1.5.058l.347 9a.75.75 0 1 0 1.499-.058l-.346-9Zm5.48.058a.75.75 0 1 0-1.498-.058l-.347 9a.75.75 0 0 0 1.5.058l.345-9Z"
                                                clip-rule="evenodd"
                                            />
                                        </svg>
                                        Excluir</button
                                    >
                                </div>
                            </td>
                        </tr>
                    {:else}
                        <tr>
                            <td colspan="7" class="text-center"
                                >Nenhum pedido encontrado.</td
                            >
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
    </div>
</div>

<OrderModal
	isProcessing={isProcessingSave}
    bind:showModal={showOrderModal}
    orders={orders}
    order={currentOrder}
    onSave={handleSaveOrder}
/>
<ConfirmDeleteModal
    clientName={orderToDeleteId
        ? allOrders.find((o) => o.id === orderToDeleteId)?.id.toString() || ""
        : ""}
    bind:showModal={showConfirmDeleteModal}
    onConfirm={handleConfirmDelete}
/>
<ConfirmDeleteModal
    bind:showModal={showConfirmBulkDeleteModal}
    onConfirm={handleConfirmBulkDelete}
    message={`Tem certeza que deseja excluir os ${selectedOrderIds.size} pedidos selecionados? Esta ação não pode ser desfeita.`}
/>
