<script lang="ts">
    import { onMount } from 'svelte';
    import { supabase } from '$lib/supabase';
    import CategoryModal from "$lib/components/CategoryModal.svelte";
    import ConfirmDeleteModal from "$lib/components/ConfirmDeleteModal.svelte";

    let allCategories: Array<{
        id: number;
        name: string;
        description: string;
        status: string;
    }> = [];
    let searchTerm = "";
    let showCategoryModal = false;
    let showConfirmDeleteModal = false;
    let showConfirmBulkDeleteModal = false;
    let loading = true;
    let isProcessingSave = false;
    let currentCategory: {
        id?: number;
        name: string;
        description: string;
        status: string;
    } | null = null;
    let categoryToDeleteId: number | null = null;
    let selectedCategoryIds = new Set<number>();

    function getStatusBadgeClass(status: string) {
        switch (status) {
            case 'Ativo':
                return 'badge-success';
            case 'Inativo':
                return 'badge-error';
            default:
                return 'badge-ghost';
        }
    }

    async function fetchCategories() {
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .order('name');

        if (error) {
            console.error('Error fetching categories:', error);
            return;
        }

        allCategories = data;
        loading = false;
    }

    onMount(() => {
        fetchCategories();

        // Subscribe to realtime changes
        const subscription = supabase
            .channel('categories_changes')
            .on('postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'categories'
                },
                (payload) => {
                    console.log('Recebida atualização em tempo real para categorias:', payload);
                    fetchCategories();
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    });

    $: categories = allCategories.filter((category) =>
        category.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    $: allVisibleSelected = categories.length > 0 && categories.every((c) => selectedCategoryIds.has(c.id));
    $: someVisibleSelected = categories.some((c) => selectedCategoryIds.has(c.id));
    $: isIndeterminate = someVisibleSelected && !allVisibleSelected;

    function handleSelectAllChange(event: Event) {
        const target = event.target as HTMLInputElement;
        if (target.checked) {
            categories.forEach((c) => selectedCategoryIds.add(c.id));
        } else {
            categories.forEach((c) => selectedCategoryIds.delete(c.id));
        }
        selectedCategoryIds = selectedCategoryIds;
    }

    function handleRowCheckboxChange(categoryId: number, checked: boolean) {
        if (checked) {
            selectedCategoryIds.add(categoryId);
        } else {
            selectedCategoryIds.delete(categoryId);
        }
        selectedCategoryIds = selectedCategoryIds;
    }

    function openAddCategoryModal() {
        currentCategory = null;
        showCategoryModal = true;
    }

    function openEditCategoryModal(category: {
        id: number;
        name: string;
        description: string;
        status: string;
    }) {
        currentCategory = { ...category };
        showCategoryModal = true;
    }

    function openConfirmDeleteModal(id: number) {
        categoryToDeleteId = id;
        showConfirmDeleteModal = true;
    }

    function openConfirmBulkDeleteModal() {
        showConfirmBulkDeleteModal = true;
    }

    async function handleSaveCategory(categoryData: {
        id?: number;
        name: string;
        description: string;
        status: string;
    }) {
        isProcessingSave = true;
        try {
            if (categoryData.id) {
                const { error } = await supabase
                    .from('categories')
                    .update({
                        name: categoryData.name,
                        description: categoryData.description,
                        status: categoryData.status
                    })
                    .eq('id', categoryData.id);

                if (error) {
                    console.error('Error updating category:', error);
                    return;
                }
            } else {
                const { error } = await supabase
                    .from('categories')
                    .insert([{
                        name: categoryData.name,
                        description: categoryData.description,
                        status: categoryData.status || "Ativo"
                    }]);

                if (error) {
                    console.error('Error inserting category:', error);
                    return;
                }
            }
            // Forçar atualização manual para garantir que os dados sejam atualizados
            await fetchCategories();
            showCategoryModal = false;
        } finally {
            isProcessingSave = false;
        }
    }

    async function handleConfirmDelete() {
        if (categoryToDeleteId) {
            const { error } = await supabase
                .from('categories')
                .delete()
                .eq('id', categoryToDeleteId);

            if (error) {
                console.error('Error deleting category:', error);
                return;
            }

            // Forçar atualização manual para garantir que os dados sejam atualizados
            await fetchCategories();
        }
        showConfirmDeleteModal = false;
        categoryToDeleteId = null;
    }

    async function handleConfirmBulkDelete() {
        const { error } = await supabase
            .from('categories')
            .delete()
            .in('id', Array.from(selectedCategoryIds));

        if (error) {
            console.error('Error bulk deleting categories:', error);
            return;
        }

        selectedCategoryIds.clear();
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
                {#if selectedCategoryIds.size === 0}
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
                            placeholder="Encontrar categorias..."
                            bind:value={searchTerm}
                        />
                    </label>
                {/if}
            </div>

            <!-- Right side: Action Buttons -->
            <div>
                {#if selectedCategoryIds.size === 0}
                    <button
                        class="btn btn-primary"
                        on:click={openAddCategoryModal}
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
                        Adicionar Categoria
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
                        Excluir {selectedCategoryIds.size}
                        {selectedCategoryIds.size === 1 ? "item" : "itens"} selecionados
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
                        <th class="w-[30%]">Nome</th>
                        <th class="w-[50%]">Descrição</th>
                        <th class="w-[15%]">Status</th>
                        <th class="w-[5%] text-right"></th>
                    </tr>
                </thead>
                <tbody>
                    {#each categories as category (category.id)}
                        <tr class="group hover:bg-base-200">
                            <td>
                                <label>
                                    <input
                                        type="checkbox"
                                        class="checkbox rounded-sm"
                                        checked={selectedCategoryIds.has(
                                            category.id,
                                        )}
                                        on:change={(e) =>
                                            handleRowCheckboxChange(
                                                category.id,
                                                (e.target as HTMLInputElement)
                                                    .checked,
                                            )}
                                    />
                                </label>
                            </td>
                            <td>{category.id}</td>
                            <td>{category.name}</td>
                            <td>{category.description}</td>
                            <td><span class="badge {getStatusBadgeClass(category.status)}">{category.status}</span></td>
                            <td class="text-right">
                                <div
                                    class="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                >
                                    <button
                                        class="btn btn-sm"
                                        on:click={() =>
                                            openEditCategoryModal(category)}
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
                                            openConfirmDeleteModal(category.id)}
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
                            <td colspan="6" class="text-center"
                                >Nenhuma categoria encontrada.</td
                            >
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
    </div>
</div>

<CategoryModal
    bind:showModal={showCategoryModal}
    categories={categories}
    category={currentCategory}
    onSave={handleSaveCategory}
/>
<ConfirmDeleteModal
    clientName={categoryToDeleteId
        ? allCategories.find((p) => p.id === categoryToDeleteId)?.name || ""
        : ""}
    bind:showModal={showConfirmDeleteModal}
    onConfirm={handleConfirmDelete}
/>
<ConfirmDeleteModal
    bind:showModal={showConfirmBulkDeleteModal}
    onConfirm={handleConfirmBulkDelete}
    message={`Tem certeza que deseja excluir os ${selectedCategoryIds.size} categorias selecionadas? Esta ação não pode ser desfeita.`}
/>
