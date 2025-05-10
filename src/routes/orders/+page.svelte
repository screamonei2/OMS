<script lang="ts">
    import { onMount } from 'svelte';
    import { supabase } from '$lib/supabase';
    import OrderModal from "$lib/components/OrderModal.svelte";
    import ConfirmDeleteModal from "$lib/components/ConfirmDeleteModal.svelte";
    import { error } from '@sveltejs/kit';

    let page = 1;
    let pageSize = 10;
    let totalOrders = 0;
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

    async function fetchOrders(currentPage = page) {
        try {
            const from = (currentPage - 1) * pageSize;
            const to = from + pageSize - 1;

            const { data, error: supabaseError, count } = await supabase
                .from('orders')
                .select('*', { count: 'exact' })
                .order('date', { ascending: false })
                .range(from, to);

            if (supabaseError) {
                throw error(500, {
                    message: 'Não foi possível carregar os pedidos. Por favor, tente novamente.'
                });
            }

            allOrders = data;
            totalOrders = count || 0;
            loading = false;
        } catch (e) {
            console.error('Error fetching orders:', e);
            throw error(500, {
                message: 'Erro ao buscar pedidos. Por favor, atualize a página.'
            });
        }
    }

    function changePage(newPage: number) {
        page = newPage;
        fetchOrders(page);
    }

    onMount(() => {
        fetchOrders();

        // Subscribe to realtime changes
        const subscription = supabase
            .channel('orders_changes')
            .on('postgres_changes', 
                { event: 'INSERT', schema: 'public', table: 'orders' }, 
                (payload) => {
                    allOrders = [payload.new, ...allOrders].slice(0, pageSize);
                    totalOrders += 1;
                }
            )
            .on('postgres_changes', 
                { event: 'UPDATE', schema: 'public', table: 'orders' }, 
                (payload) => {
                    allOrders = allOrders.map((o) => (o.id === payload.new.id ? payload.new : o));
                }
            )
            .on('postgres_changes', 
                { event: 'DELETE', schema: 'public', table: 'orders' }, 
                (payload) => {
                    allOrders = allOrders.filter((o) => o.id !== payload.old.id);
                    totalOrders -= 1;
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
                const { error: updateError } = await supabase
                    .from('orders')
                    .update({
                        client_id: orderData.clientId,
                        total: orderData.total,
                        status: orderData.status,
                        date: orderData.date
                    })
                    .eq('id', orderData.id);

                if (updateError) {
                    throw error(500, {
                        message: 'Não foi possível atualizar o pedido. Por favor, tente novamente.'
                    });
                }

                // Update order items
                const { error: deleteItemsError } = await supabase
                    .from('order_items')
                    .delete()
                    .eq('order_id', orderData.id);

                if (deleteItemsError) {
                    throw error(500, {
                        message: 'Erro ao atualizar itens do pedido. Por favor, tente novamente.'
                    });
                }

                const { error: insertItemsError } = await supabase
                    .from('order_items')
                    .insert(orderData.products.map(product => ({
                        order_id: orderData.id,
                        product_id: product.productId,
                        quantity: product.quantity,
                        price: product.price
                    })));

                if (insertItemsError) {
                    throw error(500, {
                        message: 'Erro ao atualizar itens do pedido. Por favor, tente novamente.'
                    });
                }
            } else {
                const { data: orderResult, error: insertError } = await supabase
                    .from('orders')
                    .insert([{
                        client_id: orderData.clientId,
                        total: orderData.total,
                        status: orderData.status,
                        date: orderData.date
                    }])
                    .select()
                    .single();

                if (insertError || !orderResult) {
                    throw error(500, {
                        message: 'Não foi possível criar o pedido. Por favor, tente novamente.'
                    });
                }

                const { error: insertItemsError } = await supabase
                    .from('order_items')
                    .insert(orderData.products.map(product => ({
                        order_id: orderResult.id,
                        product_id: product.productId,
                        quantity: product.quantity,
                        price: product.price
                    })));

                if (insertItemsError) {
                    throw error(500, {
                        message: 'Erro ao adicionar itens ao pedido. Por favor, tente novamente.'
                    });
                }
            }

            await fetchOrders();
            showOrderModal = false;
        } catch (e) {
            console.error('Error saving order:', e);
            throw error(500, {
                message: 'Erro ao salvar pedido. Por favor, tente novamente.'
            });
        } finally {
            isProcessingSave = false;
        }
    }

    async function handleConfirmDelete() {
        try {
            // First delete order items
            const { error: deleteItemsError } = await supabase
                .from('order_items')
                .delete()
                .eq('order_id', orderToDeleteId);

            if (deleteItemsError) {
                throw error(500, {
                    message: 'Erro ao excluir itens do pedido. Por favor, tente novamente.'
                });
            }

            // Then delete the order
            const { error: deleteError } = await supabase
                .from('orders')
                .delete()
                .eq('id', orderToDeleteId);

            if (deleteError) {
                throw error(500, {
                    message: 'Não foi possível excluir o pedido. Por favor, tente novamente.'
                });
            }

            await fetchOrders();
            showConfirmDeleteModal = false;
            orderToDeleteId = null;
        } catch (e) {
            console.error('Error deleting order:', e);
            throw error(500, {
                message: 'Erro ao excluir pedido. Por favor, tente novamente.'
            });
        }
    }

    async function handleConfirmBulkDelete() {
        try {
            // First delete all order items for selected orders
            const { error: deleteItemsError } = await supabase
                .from('order_items')
                .delete()
                .in('order_id', Array.from(selectedOrderIds));

            if (deleteItemsError) {
                throw error(500, {
                    message: 'Erro ao excluir itens dos pedidos. Por favor, tente novamente.'
                });
            }

            // Then delete the orders
            const { error: deleteError } = await supabase
                .from('orders')
                .delete()
                .in('id', Array.from(selectedOrderIds));

            if (deleteError) {
                throw error(500, {
                    message: 'Não foi possível excluir os pedidos selecionados. Por favor, tente novamente.'
                });
            }

            selectedOrderIds.clear();
            selectedOrderIds = selectedOrderIds;
            showConfirmBulkDeleteModal = false;
            await fetchOrders();
        } catch (e) {
            console.error('Error bulk deleting orders:', e);
            throw error(500, {
                message: 'Erro ao excluir pedidos. Por favor, tente novamente.'
            });
        }
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

        <!-- Pagination Controls -->
        <div class="flex justify-between items-center mt-4">
            <button
                class="btn"
                on:click={() => changePage(page - 1)}
                disabled={page === 1}
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
                Anterior
            </button>
            <span class="text-sm">
                Página {page} de {Math.ceil(totalOrders / pageSize)}
                {#if totalOrders > 0}
                    · Mostrando {(page - 1) * pageSize + 1} a {Math.min(page * pageSize, totalOrders)} de {totalOrders}
                {/if}
            </span>
            <button
                class="btn"
                on:click={() => changePage(page + 1)}
                disabled={page * pageSize >= totalOrders}
            >
                Próxima
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
            </button>
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
