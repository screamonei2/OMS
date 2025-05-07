<script lang="ts">
    export let showModal = false;
    export let clientName = "";
    export let onConfirm: () => void;
    export let message = "";

    function closeModal() {
        showModal = false;
    }

    function handleConfirm() {
        onConfirm();
        closeModal();
    }
</script>

{#if showModal}
    <dialog id="confirm_delete_modal" class="modal modal-open">
        <div class="modal-box">
            <h3 class="font-bold text-lg">Confirmar Exclusão</h3>
            <div class="py-4 space-y-2">
                <p>{message}</p>
            </div>
            <div class="modal-action">
                <button type="button" class="btn" on:click={closeModal}
                    ><svg
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
                    Não, cancelar</button
                >
                <button
                    type="button"
                    class="btn btn-error"
                    on:click={handleConfirm}
                    ><svg
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
                    Sim, excluir</button
                >
            </div>
        </div>
        <form
            method="dialog"
            class="modal-backdrop"
            on:submit|preventDefault={closeModal}
        >
            <button>close</button>
        </form>
    </dialog>
{/if}
