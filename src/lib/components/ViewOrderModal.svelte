<script lang="ts">
    import { createEventDispatcher } from 'svelte';

    export let showModal: boolean = false;
    export let order: any = null;

    const dispatch = createEventDispatcher();

    function closeModal() {
        showModal = false;
    }

    function handlePrint() {
        window.print();
    }

    async function handleSavePDF() {
        // Use browser's print functionality with PDF option
        window.print();
    }

    $: formattedDate = order?.date ? new Date(order.date).toLocaleDateString('pt-BR') : '';
</script>

<dialog class="modal modal-bottom sm:modal-middle print:modal-none" class:modal-open={showModal}>
    <div class="modal-box w-11/12 max-w-5xl print:w-full print:max-w-none print:m-0 print:p-0 print:shadow-none">
        <!-- Print-only header -->
        <div class="hidden print:block mb-8">
            <h2 class="text-2xl font-bold">Detalhes do Pedido #{order?.id}</h2>
            <p class="text-sm text-gray-500">Impresso em {new Date().toLocaleString('pt-BR')}</p>
        </div>

        <div class="print:hidden">
            <h3 class="font-bold text-lg mb-4">Detalhes do Pedido #{order?.id}</h3>
            <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" on:click={closeModal}>✕</button>
        </div>

        <!-- Order Details -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
                <h4 class="font-semibold mb-2">Informações do Cliente</h4>
                <p>Nome: {order?.clients?.name}</p>
                <p>Data do Pedido: {formattedDate}</p>
            </div>
            <div>
                <h4 class="font-semibold mb-2">Status do Pedido</h4>
                <div class="badge" 
                    class:badge-success={order?.status === 'Entregue'}
                    class:badge-warning={order?.status === 'Pendente' || order?.status === 'Em Processamento'}
                    class:badge-error={order?.status === 'Cancelado'}>
                    {order?.status}
                </div>
            </div>
        </div>

        <!-- Products Table -->
        <div class="overflow-x-auto">
            <table class="table w-full">
                <thead>
                    <tr>
                        <th>Produto</th>
                        <th class="text-right">Quantidade</th>
                        <th class="text-right">Preço Unit.</th>
                        <th class="text-right">Subtotal</th>
                    </tr>
                </thead>
                <tbody>
                    {#if order?.order_items}
                        {#each order.order_items as item}
                            <tr>
                                <td>{item.products?.name}</td>
                                <td class="text-right">{item.quantity}</td>
                                <td class="text-right">R$ {item.price.toFixed(2)}</td>
                                <td class="text-right">R$ {(item.quantity * item.price).toFixed(2)}</td>
                            </tr>
                        {/each}
                    {/if}
                </tbody>
                <tfoot>
                    <tr>
                        <td colspan="3" class="text-right font-bold">Total:</td>
                        <td class="text-right font-bold">R$ {order?.total?.toFixed(2)}</td>
                    </tr>
                </tfoot>
            </table>
        </div>

        <!-- Actions -->
        <div class="modal-action print:hidden">
            <button class="btn btn-outline" on:click={handlePrint}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 mr-2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 0 1 1.913-.247m10.5 0a48.536 48.536 0 0 0-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5Zm-3 0h.008v.008H15V10.5Z" />
                </svg>
                Imprimir
            </button>
            <button class="btn" on:click={handleSavePDF}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 mr-2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m.75 12 3 3m0 0 3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                </svg>
                Salvar PDF
            </button>
            <button class="btn btn-ghost" on:click={closeModal}>Fechar</button>
        </div>
    </div>
    <form method="dialog" class="modal-backdrop">
        <button on:click={closeModal}>close</button>
    </form>
</dialog>

<style>
    @media print {
        /* Hide all other elements when printing */
        :global(body > *:not(.modal)) {
            display: none !important;
        }
        
        :global(.modal) {
            position: static !important;
            display: block !important;
        }

        :global(.print\:*) {
            display: block !important;
        }
    }
</style>