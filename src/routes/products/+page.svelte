<script lang="ts">
    import { onMount } from 'svelte';
    import { supabase } from '$lib/supabase';
    import ProductModal from "$lib/components/ProductModal.svelte";
    import ConfirmDeleteModal from "$lib/components/ConfirmDeleteModal.svelte";
    import { writable } from "svelte/store";

    let allProducts = [];
    let searchTerm = "";
    let showProductModal = false;
    let showConfirmDeleteModal = false;
    let showConfirmBulkDeleteModal = false;
    let currentProduct: {
        id?: number;
        name: string;
        price: number;
        stock: number;
        category: string;
    } | null = null;
    let productToDeleteId: number | null = null;
    let selectedProductIds = new Set<number>();
    let loading = true;

    async function fetchProducts() {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .order('id');
        
        if (error) {
            console.error('Error fetching products:', error);
            return;
        }
        
        allProducts = data;
        loading = false;
    }

    onMount(() => {
        fetchProducts();

        // Subscribe to realtime changes
        const subscription = supabase
            .channel('products_changes')
            .on('postgres_changes', 
                {
                    event: '*',
                    schema: 'public',
                    table: 'products'
                },
                (payload) => {
                    fetchProducts();
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    });

    $: products = allProducts.filter((product) =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    $: allVisibleSelected = products.length > 0 && products.every((p) => selectedProductIds.has(p.id));
    $: someVisibleSelected = products.some((p) => selectedProductIds.has(p.id));
    $: isIndeterminate = someVisibleSelected && !allVisibleSelected;

    function handleSelectAllChange(event: Event) {
        const target = event.target as HTMLInputElement;
        if (target.checked) {
            products.forEach((p) => selectedProductIds.add(p.id));
        } else {
            products.forEach((p) => selectedProductIds.delete(p.id));
        }
        selectedProductIds = selectedProductIds; // Trigger reactivity
    }

    function handleRowCheckboxChange(productId: number, checked: boolean) {
        if (checked) {
            selectedProductIds.add(productId);
        } else {
            selectedProductIds.delete(productId);
        }
        selectedProductIds = selectedProductIds; // Trigger reactivity
    }

    function openAddProductModal() {
        currentProduct = null; // Clear current product for adding
        showProductModal = true;
    }

    function openEditProductModal(product: {
        id: number;
        name: string;
        price: number;
        stock: number;
        category: string;
    }) {
        currentProduct = { ...product }; // Set current product for editing
        showProductModal = true;
    }

    function openConfirmDeleteModal(id: number) {
        productToDeleteId = id;
        showConfirmDeleteModal = true;
    }

    function openConfirmBulkDeleteModal() {
        showConfirmBulkDeleteModal = true;
    }

    async function handleSaveProduct(productData: {
        id?: number;
        name: string;
        price: number;
        stock: number;
        category: string;
    }) {
        if (productData.id) {
            // Update existing product
            const { error } = await supabase
                .from('products')
                .update({
                    name: productData.name,
                    price: productData.price,
                    stock: productData.stock,
                    category: productData.category
                })
                .eq('id', productData.id);

            if (error) {
                console.error('Error updating product:', error);
                return;
            }
        } else {
            // Add new product
            const { error } = await supabase
                .from('products')
                .insert([{
                    name: productData.name,
                    price: productData.price,
                    stock: productData.stock,
                    category: productData.category || "Sem Categoria"
                }]);

            if (error) {
                console.error('Error inserting product:', error);
                return;
            }
        }
        showProductModal = false;
    }

    async function handleConfirmDelete() {
        if (productToDeleteId) {
            const { error } = await supabase
                .from('products')
                .delete()
                .eq('id', productToDeleteId);

            if (error) {
                console.error('Error deleting product:', error);
                return;
            }
        }
        showConfirmDeleteModal = false;
        productToDeleteId = null;
    }

    async function handleConfirmBulkDelete() {
        const { error } = await supabase
            .from('products')
            .delete()
            .in('id', Array.from(selectedProductIds));

        if (error) {
            console.error('Error bulk deleting products:', error);
            return;
        }

        selectedProductIds.clear();
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
                {#if selectedProductIds.size === 0}
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
                            placeholder="Encontrar produtos..."
                            bind:value={searchTerm}
                        />
                    </label>
                {/if}
            </div>

            <!-- Right side: Action Buttons -->
            <div>
                {#if selectedProductIds.size === 0}
                    <button
                        class="btn btn-primary"
                        on:click={openAddProductModal}
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
                        Adicionar Produto
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
                        Excluir {selectedProductIds.size}
                        {selectedProductIds.size === 1 ? "item" : "itens"} selecionados
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
                        <th class="w-[25%]">Nome</th>
                        <th class="w-[15%]">Preço</th>
                        <th class="w-[15%]">Estoque</th>
                        <th class="w-[20%]">Categoria</th>
                        <th class="w-[13%] text-right"></th>
                    </tr>
                </thead>
                <tbody>
                    {#each products as product (product.id)}
                        <tr class="group hover:bg-base-200">
                            <td>
                                <label>
                                    <input
                                        type="checkbox"
                                        class="checkbox rounded-sm"
                                        checked={selectedProductIds.has(
                                            product.id,
                                        )}
                                        on:change={(e) =>
                                            handleRowCheckboxChange(
                                                product.id,
                                                (e.target as HTMLInputElement)
                                                    .checked,
                                            )}
                                    />
                                </label>
                            </td>
                            <td>{product.id}</td>
                            <td>{product.name}</td>
                            <td>R$ {product.price.toFixed(2)}</td>
                            <td>{product.stock}</td>
                            <td>{product.category}</td>
                            <td class="text-right">
                                <div
                                    class="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                >
                                    <button
                                        class="btn btn-sm"
                                        on:click={() =>
                                            openEditProductModal(product)}
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
                                            openConfirmDeleteModal(product.id)}
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
                                >Nenhum produto encontrado.</td
                            >
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
    </div>
</div>

<ProductModal
    bind:showModal={showProductModal}
    product={currentProduct}
    onSave={handleSaveProduct}
/>
<ConfirmDeleteModal
    bind:showModal={showConfirmDeleteModal}
    onConfirm={handleConfirmDelete}
    productName={productToDeleteId
        ? allProducts.find((p) => p.id === productToDeleteId)?.name || ""
        : ""}
/>
<ConfirmDeleteModal
    bind:showModal={showConfirmBulkDeleteModal}
    onConfirm={handleConfirmBulkDelete}
    message={`Tem certeza que deseja excluir os ${selectedProductIds.size} produtos selecionados? Esta ação não pode ser desfeita.`}
/>
