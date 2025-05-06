<script lang="ts">
    import { onMount } from 'svelte';
    import { supabase } from '$lib/supabase';
    import ClientModal from "$lib/components/ClientModal.svelte";
    import ConfirmDeleteModal from "$lib/components/ConfirmDeleteModal.svelte";

    let allClients = [];
    let searchTerm = "";
    let showClientModal = false;
    let showConfirmDeleteModal = false;
    let showConfirmBulkDeleteModal = false;
    let loading = true;
    let currentClient: {
        id?: number;
        name: string;
        email: string;
        phone: string;
        status: string;
    } | null = null;
    let clientToDeleteId: number | null = null;
    let selectedClientIds = new Set<number>();

    async function fetchClients() {
        const { data, error } = await supabase
            .from('clients')
            .select('*')
            .order('name');
        
        if (error) {
            console.error('Error fetching clients:', error);
            return;
        }
        
        allClients = data;
        loading = false;
    }

    onMount(() => {
        fetchClients();

        // Subscribe to realtime changes
        const subscription = supabase
            .channel('clients_changes')
            .on('postgres_changes', 
                {
                    event: '*',
                    schema: 'public',
                    table: 'clients'
                },
                (payload) => {
                    fetchClients();
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
        if (clientData.id) {
            const { error } = await supabase
                .from('clients')
                .update({
                    name: clientData.name,
                    email: clientData.email,
                    phone: clientData.phone,
                    status: clientData.status
                })
                .eq('id', clientData.id);

            if (error) {
                console.error('Error updating client:', error);
                return;
            }
        } else {
            const { error } = await supabase
                .from('clients')
                .insert([{
                    name: clientData.name,
                    email: clientData.email,
                    phone: clientData.phone,
                    status: clientData.status || "Ativo"
                }]);

            if (error) {
                console.error('Error inserting client:', error);
                return;
            }
        }
        showClientModal = false;
    }

    async function handleConfirmDelete() {
        if (clientToDeleteId) {
            const { error } = await supabase
                .from('clients')
                .delete()
                .eq('id', clientToDeleteId);

            if (error) {
                console.error('Error deleting client:', error);
                return;
            }
        }
        showConfirmDeleteModal = false;
        clientToDeleteId = null;
    }

    async function handleConfirmBulkDelete() {
        const { error } = await supabase
            .from('clients')
            .delete()
            .in('id', Array.from(selectedClientIds));

        if (error) {
            console.error('Error bulk deleting clients:', error);
            return;
        }

        selectedClientIds.clear();
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
                        <th class="w-[25%]">Nome</th>
                        <th class="w-[15%]">Email</th>
                        <th class="w-[15%]">Telefone</th>
                        <th class="w-[20%]">Status</th>
                        <th class="w-[13%] text-right"></th>
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
                            <td>{client.status}</td>
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
    </div>
</div>

<ClientModal
    bind:showModal={showClientModal}
    client={currentClient}
    onSave={handleSaveClient}
/>
<ConfirmDeleteModal
    bind:showModal={showConfirmDeleteModal}
    onConfirm={handleConfirmDelete}
    clientName={clientToDeleteId
        ? allClients.find((p) => p.id === clientToDeleteId)?.name || ""
        : ""}
/>
<ConfirmDeleteModal
    bind:showModal={showConfirmBulkDeleteModal}
    onConfirm={handleConfirmBulkDelete}
    message={`Tem certeza que deseja excluir os ${selectedClientIds.size} clientes selecionados? Esta ação não pode ser desfeita.`}
/>
