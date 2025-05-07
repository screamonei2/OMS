<script lang="ts">
export let showModal = false;
export let isProcessing = false;

export let orders: Array<{
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

export let order: {
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

export let clients: Array<{
    id: number;
    name: string;
}> = [];

export let products: Array<{
    id: number;
    name: string;
    price: number;
}> = [];

import { onMount } from 'svelte';
import { supabase } from '$lib/supabase';

onMount(async () => {
    const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('id, name, price');

    if (productsError) {
        console.error('Error fetching products:', productsError);
    } else {
        products = productsData;
    }

    const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('id, name');

    if (clientsError) {
        console.error('Error fetching clients:', clientsError);
    } else {
        clients = clientsData;
    }
});

export let onSave: (order: {
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
}) => void;

const statusOptions = ["Pendente", "Em Processamento", "Enviado", "Entregue", "Cancelado"];

let localOrder: {
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
} = {
    clientId: 0,
    products: [{
        productId: 0,
        quantity: 1,
        price: 0
    }],
    total: 0,
    status: "Pendente",
    date: new Date().toISOString().split('T')[0]
};

$: if (order) {
    localOrder = {
        id: order.id,
        clientId: order.client_id || 0,
        products: order.order_items?.map(item => ({
            productId: item.product_id || 0,
            quantity: item.quantity || 1,
            price: item.price || 0
        })) || [{
            productId: 0,
            quantity: 1,
            price: 0
        }],
        total: order.total || 0,
        status: order.status || "Pendente",
        date: order.date || new Date().toISOString().split('T')[0]
    };
} else {
    localOrder = {
        clientId: 0,
        products: [{
            productId: 0,
            quantity: 1,
            price: 0
        }],
        total: 0,
        status: "Pendente",
        date: new Date().toISOString().split('T')[0]
    };
}

function addProduct() {
    if (!localOrder.products || !Array.isArray(localOrder.products)) {
        localOrder.products = [];
    }
    localOrder.products = [...localOrder.products, {
        productId: 0,
        quantity: 1,
        price: 0
    }];
}

function removeProduct(index: number) {
    localOrder.products = localOrder.products.filter((_, i) => i !== index);
}

function updateProductPrice(index: number, productId: number) {
    const product = products.find(p => p.id === productId);
    if (product) {
        localOrder.products[index].price = product.price;
        calculateTotal();
    }
}

function calculateTotal() {
    localOrder.total = localOrder.products.reduce((sum, item) =>
        sum + (item.price * item.quantity), 0);
}

$: {
    calculateTotal();
}

function closeModal() {
    showModal = false;
    order = null;
}

import { saveOrder } from '$lib/utils/fetcher';

async function handleSave() {
    const orderToSave = {
        client_id: localOrder.clientId,
        order_items: localOrder.products.map(item => ({
            product_id: item.productId,
            quantity: item.quantity,
            price: item.price
        })),
        total: localOrder.total,
        status: localOrder.status,
        date: localOrder.date
    };

    const result = await saveOrder(orderToSave);

    if (result) {
        onSave(localOrder);
        closeModal();
    } else {
        console.error('Failed to save order');
    }
}
</script>

{#if !orders || orders.length === 0}
    <div class="flex flex-col items-center justify-center h-full">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-[4em] text-gray-400">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
        </svg>
        <p class="text-lg text-gray-500 mt-4">Nenhum pedido encontrado.</p>
    </div>
{/if}

{#if showModal}
    <dialog class="modal modal-open">
        <div class="modal-box max-w-4xl">
            <h3 class="font-bold text-lg mb-4">
                {order ? "Editar Pedido" : "Novo Pedido"}
            </h3>

            <form method="dialog" on:submit|preventDefault={handleSave}>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="form-control">
                        <label class="label" for="order-client">
                            <span class="label-text">Cliente</span>
                        </label>
                        <select
                            id="order-client"
                            class="select select-bordered w-full"
                            bind:value={localOrder.clientId}
                            required
                        >
                            <option value={0} disabled>Selecione um cliente</option>
                            {#each clients as client}
                                <option value={client.id}>{client.name}</option>
                            {/each}
                        </select>
                    </div>

                    <div class="form-control">
                        <label class="label" for="order-status">
                            <span class="label-text">Status</span>
                        </label>
                        <select
                            id="order-status"
                            class="select select-bordered w-full"
                            bind:value={localOrder.status}
                            required
                        >
                            {#each statusOptions as status}
                                <option value={status}>{status}</option>
                            {/each}
                        </select>
                    </div>

                    <div class="form-control">
                        <label class="label" for="order-date">
                            <span class="label-text">Data</span>
                        </label>
                        <input
                            id="order-date"
                            type="date"
                            class="input input-bordered w-full"
                            bind:value={localOrder.date}
                            required
                        />
                    </div>
                </div>

                <div class="divider">Produtos</div>

                <div class="space-y-4">
                    {#each localOrder.products as item, index}
                        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                            <div class="form-control md:col-span-2">
                                <label class="label" for="order-product-{index}">
                                    <span class="label-text">Produto</span>
                                </label>
                                <select
                                    id="order-product-{index}"
                                    class="select select-bordered w-full"
                                    bind:value={item.productId}
                                    on:change={() => updateProductPrice(index, item.productId)}
                                    required
                                >
                                    <option value={0} disabled>Selecione um produto</option>
                                    {#each products as product}
                                        <option value={product.id}>{product.name}</option>
                                    {/each}
                                </select>
                            </div>

                            <div class="form-control">
                                <label class="label" for="order-quantity-{index}">
                                    <span class="label-text">Quantidade</span>
                                </label>
                                <input
                                    id="order-quantity-{index}"
                                    type="number"
                                    min="1"
                                    class="input input-bordered w-full"
                                    bind:value={item.quantity}
                                    on:input={calculateTotal}
                                    required
                                />
                            </div>

                            <div class="flex items-center gap-2">
                                <div class="form-control flex-1">
                                    <label class="label" for="order-price-{index}">
                                        <span class="label-text">Preço</span>
                                    </label>
                                    <input
                                        id="order-price-{index}"
                                        type="number"
                                        step="0.01"
                                        class="input input-bordered w-full"
                                        bind:value={item.price}
                                        on:input={calculateTotal}
                                        required
                                    />
                                </div>
                                {#if localOrder.products.length > 1}
                                    <button
                                        type="button"
                                        class="btn btn-square btn-error"
                                        on:click={() => removeProduct(index)}
                                        aria-label="Remover produto"
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            class="h-6 w-6"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                stroke-linecap="round"
                                                stroke-linejoin="round"
                                                stroke-width="2"
                                                d="M6 18L18 6M6 6l12 12"
                                            />
                                        </svg>
                                    </button>
                                {/if}
                            </div>
                        </div>
                    {/each}

                    <button
                        type="button"
                        class="btn btn-outline btn-block"
                        on:click={addProduct}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            class="h-6 w-6"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M12 4v16m8-8H4"
                            />
                        </svg>
                        Adicionar Produto
                    </button>
                </div>

                <div class="divider"></div>

                <div class="text-right">
                    <p class="text-lg font-bold">
                        Total: R$ {localOrder.total.toFixed(2)}
                    </p>
                </div>

                <div class="modal-action mt-6">
                    <button type="button" class="btn" on:click={closeModal}>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            class="size-[1em]"
                        >
                            <path
                                fill-rule="evenodd"
                                d="M5.47 5.47a.75.75 0 0 1 1.06 0L12 10.94l5.47-5.47a.75.75 0 1 1 1.06 1.06L13.06 12l5.47 5.47a.75.75 0 1 1-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 0 1 0-1.06Z"
                                clip-rule="evenodd"
                            />
                        </svg>
                        Cancelar
                    </button>
                    <button type="submit" class="btn btn-primary">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            class="size-[1em]"
                        >
                            <path
                                fill-rule="evenodd"
                                d="M19.916 4.626a.75.75 0 0 1 .208 1.04l-9 13.5a.75.75 0 0 1-1.154.114l-6-6a.75.75 0 0 1 1.06-1.06l5.353 5.353 8.493-12.74a.75.75 0 0 1 1.04-.207Z"
                                clip-rule="evenodd"
                            />
                        </svg>
                        Salvar
                    </button>
                </div>
            </form>
        </div>

        <form
            method="dialog"
            class="modal-backdrop"
            on:submit|preventDefault={closeModal}
        >
            <button aria-label="Fechar modal">close</button>
        </form>
    </dialog>
{/if}
