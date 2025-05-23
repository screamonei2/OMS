<script lang="ts">
    import { onMount, tick } from 'svelte';
    import { supabase } from '$lib/supabase';
    import ClientModal from "$lib/components/ClientModal.svelte";
    import ConfirmDeleteModal from "$lib/components/ConfirmDeleteModal.svelte";
    import { error } from '@sveltejs/kit';

    let page = 1;
    let pageSize = 10;
    let totalClients = 0;
    let allClients: Array<{
	id: number;
	name: string;
	email: string;
	phone: string;
	status: string;
}> = [];
    let searchTerm = "";
    let showClientModal = false;
    let showConfirmDeleteModal = false;
    let showConfirmBulkDeleteModal = false;
    let loading = true;
    let isProcessingSave = false; // Added this line
    let currentClient: {
        id?: number;
        name: string;
        email: string;
        phone: string;
        status: string;
    } | null = null;
    let clientToDeleteId: number | null = null;
    let selectedClientIds = new Set<number>();

    function getStatusBadgeClass(status: string) {
        switch (status) {
            case 'Ativo':
                return 'badge-success';
            case 'Inativo':
                return 'badge-error';
            case 'Prospecto':
                return 'badge-info';
            default:
                return 'badge-ghost';
        }
    }

    async function fetchClients(currentPage = page) {
        try {
            const from = (currentPage - 1) * pageSize;
            const to = from + pageSize - 1;

            const { data, error: supabaseError, count } = await supabase
                .from('clients')
                .select('*', { count: 'exact' })
                .order('name')
                .range(from, to);

            if (supabaseError) {
                throw error(500, {
                    message: 'Não foi possível carregar os clientes. Por favor, tente novamente.'
                });
            }

            allClients = data;
            totalClients = count || 0;
            loading = false;
        } catch (e) {
            console.error('Error fetching clients:', e);
            throw error(500, {
                message: 'Erro ao buscar clientes. Por favor, atualize a página.'
            });
        }
    }

    function changePage(newPage: number) {
        page = newPage;
        fetchClients(page);
    }

    onMount(() => {
        fetchClients();

        // Subscribe to realtime changes
        const subscription = supabase
            .channel('clients_changes')
            .on('postgres_changes', 
                { event: 'INSERT', schema: 'public', table: 'clients' }, 
                (payload: { new: typeof allClients[0] }) => {
                    allClients = [payload.new, ...allClients].slice(0, pageSize);
                    totalClients += 1;
                }
            )
            .on('postgres_changes', 
                { event: 'UPDATE', schema: 'public', table: 'clients' }, 
                (payload: { new: typeof allClients[0] }) => {
                    allClients = allClients.map((c) => (c.id === payload.new.id ? payload.new : c));
                }
            )
            .on('postgres_changes', 
                { event: 'DELETE', schema: 'public', table: 'clients' }, 
                (payload: { old: typeof allClients[0] }) => {
                    allClients = allClients.filter((c) => c.id !== payload.old.id);
                    totalClients -= 1;
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    });

    $: clients = allClients.filter((client) =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    $: allVisibleSelected = clients.length > 0 && clients.every((c) => selectedClientIds.has(c.id));
    $: someVisibleSelected = clients.some((c) => selectedClientIds.has(c.id));
    $: isIndeterminate = someVisibleSelected && !allVisibleSelected;

    function handleSelectAllChange(event: Event) {
        const target = event.target as HTMLInputElement;
        if (target.checked) {
            clients.forEach((c) => selectedClientIds.add(c.id));
        } else {
            clients.forEach((c) => selectedClientIds.delete(c.id));
        }
        selectedClientIds = selectedClientIds;
    }

    function handleRowCheckboxChange(clientId: number, checked: boolean) {
        if (checked) {
            selectedClientIds.add(clientId);
        } else {
            selectedClientIds.delete(clientId);
        }
        selectedClientIds = selectedClientIds;
    }

    function openAddClientModal() {
        currentClient = null;
        showClientModal = true;
    }

    function openEditClientModal(client: {
        id: number;
        name: string;
        email: string;
        phone: string;
        status: string;
    }) {
        currentClient = { ...client };
        showClientModal = true;
    }

    function openConfirmDeleteModal(id: number) {
        clientToDeleteId = id;
        showConfirmDeleteModal = true;
    }

    function openConfirmBulkDeleteModal() {
        showConfirmBulkDeleteModal = true;
    }

    async function handleSaveClient(clientData: {
        id?: number;
        name: string;
        email: string;
        phone: string;
        status: string;
    }) {
        isProcessingSave = true;
        try {
            if (clientData.id) {
                const { error: updateError } = await supabase
                    .from('clients')
                    .update({
                        name: clientData.name,
                        email: clientData.email,
                        phone: clientData.phone,
                        status: clientData.status
                    })
                    .eq('id', clientData.id);

                if (updateError) {
                    throw error(500, {
                        message: 'Não foi possível atualizar o cliente. Por favor, tente novamente.'
                    });
                }
            } else {
                const { error: insertError } = await supabase
                    .from('clients')
                    .insert([{
                        name: clientData.name,
                        email: clientData.email,
                        phone: clientData.phone,
                        status: clientData.status || "Ativo"
                    }]);

                if (insertError) {
                    throw error(500, {
                        message: 'Não foi possível criar o cliente. Por favor, tente novamente.'
                    });
                }
            }

            await fetchClients();
            showClientModal = false;
        } catch (e) {
            console.error('Error saving client:', e);
            throw error(500, {
                message: 'Erro ao salvar cliente. Por favor, tente novamente.'
            });
        } finally {
            isProcessingSave = false;
        }
    }

    async function handleConfirmDelete() {
        try {
            const { error: deleteError } = await supabase
                .from('clients')
                .delete()
                .eq('id', clientToDeleteId);

            if (deleteError) {
                throw error(500, {
                    message: 'Não foi possível excluir o cliente. Por favor, tente novamente.'
                });
            }

            await fetchClients();
            showConfirmDeleteModal = false;
            clientToDeleteId = null;
        } catch (e) {
            console.error('Error deleting client:', e);
            throw error(500, {
                message: 'Erro ao excluir cliente. Por favor, tente novamente.'
            });
        }
    }

    async function handleConfirmBulkDelete() {
        try {
            const { error: deleteError } = await supabase
                .from('clients')
                .delete()
                .in('id', Array.from(selectedClientIds));

            if (deleteError) {
                throw error(500, {
                    message: 'Não foi possível excluir os clientes selecionados. Por favor, tente novamente.'
                });
            }

            selectedClientIds.clear();
            selectedClientIds = selectedClientIds;
            showConfirmBulkDeleteModal = false;
            await fetchClients();
        } catch (e) {
            console.error('Error bulk deleting clients:', e);
            throw error(500, {
                message: 'Erro ao excluir clientes. Por favor, tente novamente.'
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
                {#if selectedClientIds.size === 0}
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
                            placeholder="Encontrar clientes..."
                            bind:value={searchTerm}
                        />
                    </label>
                {/if}
            </div>

            <!-- Right side: Action Buttons -->
            <div>
                {#if selectedClientIds.size === 0}
                    <button
                        class="btn btn-primary"
                        on:click={openAddClientModal}
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
                        Adicionar Cliente
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
                        Excluir {selectedClientIds.size}
                        {selectedClientIds.size === 1 ? "item" : "itens"} selecionados
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
                        <th class="w-[30%]">Email</th>
                        <th class="w-[20%]">Telefone</th>
                        <th class="w-[15%]">Status</th>
                        <th class="w-[5%] text-right"></th>
                    </tr>
                </thead>
                <tbody>
                    {#each clients as client (client.id)}
                        <tr class="group hover:bg-base-200">
                            <td>
                                <label>
                                    <input
                                        type="checkbox"
                                        class="checkbox rounded-sm"
                                        checked={selectedClientIds.has(
                                            client.id,
                                        )}
                                        on:change={(e) =>
                                            handleRowCheckboxChange(
                                                client.id,
                                                (e.target as HTMLInputElement)
                                                    .checked,
                                            )}
                                    />
                                </label>
                            </td>
                            <td>{client.id}</td>
                            <td>{client.name}</td>
                            <td>{client.email}</td>
                            <td>{client.phone}</td>
                            <td><span class="badge {getStatusBadgeClass(client.status)}">{client.status}</span></td>
                            <td class="text-right">
                                <div
                                    class="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                >
                                    <button
                                        class="btn btn-sm"
                                        on:click={() =>
                                            openEditClientModal(client)}
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
                                            openConfirmDeleteModal(client.id)}
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
                                >Nenhum cliente encontrado.</td
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
                Página {page} de {Math.ceil(totalClients / pageSize)}
                {#if totalClients > 0}
                    · Mostrando {(page - 1) * pageSize + 1} a {Math.min(page * pageSize, totalClients)} de {totalClients}
                {/if}
            </span>
            <button
                class="btn"
                on:click={() => changePage(page + 1)}
                disabled={page * pageSize >= totalClients}
            >
                Próxima
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
            </button>
        </div>
    </div>
</div>

<ClientModal
    bind:showModal={showClientModal}
    clients={clients}
    client={currentClient}
    onSave={handleSaveClient}
    isProcessing={isProcessingSave}
/>
<ConfirmDeleteModal
	clientName={clientToDeleteId
		? allClients.find((p) => p.id === clientToDeleteId)?.name || ""
		: ""}
    bind:showModal={showConfirmDeleteModal}
    onConfirm={handleConfirmDelete}
/>
<ConfirmDeleteModal
    bind:showModal={showConfirmBulkDeleteModal}
    onConfirm={handleConfirmBulkDelete}
    message={`Tem certeza que deseja excluir os ${selectedClientIds.size} clientes selecionados? Esta ação não pode ser desfeita.`}
/>
