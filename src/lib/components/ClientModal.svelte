<script lang="ts">
	export let showModal = false;

	export let clients: Array<{
		id: number;
		name: string;
		email: string;
		phone: string;
		status: string;
	}> = [];

	export let client: {
		id?: number;
		name: string;
		email: string;
		phone: string;
		status: string;
	} | null = null;

	export let isProcessing = false;
	export let onSave: (client: {
		id?: number;
		name: string;
		email: string;
		phone: string;
		status: string;
	}) => void;

	let localClient = {
		name: "",
		email: "",
		phone: "",
		status: "Ativo",
	};

	const statusOptions = ["Ativo", "Inativo", "Prospecto"];

	$: if (client) {
		localClient = { ...client };
	} else {
		localClient = {
			name: "",
			email: "",
			phone: "",
			status: "Ativo",
		};
	}

	function closeModal() {
		showModal = false;
		client = null;
	}

	function handleSave() {
		onSave(localClient);
	}
</script>

{#if !clients || clients.length === 0}
	<div class="flex flex-col items-center justify-center h-full">
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-[4em] text-gray-400">
			<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
		</svg>
		<p class="text-lg text-gray-500 mt-4">Nenhum cliente encontrado.</p>
	</div>
{/if}

{#if showModal}
	<dialog class="modal modal-open">
		<div class="modal-box max-w-2xl">
			<h3 class="font-bold text-lg mb-4">
				{client ? "Editar Cliente" : "Adicionar Cliente"}
			</h3>

			<form on:submit|preventDefault={handleSave}>
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div class="form-control">
						<label class="label" for="client-name">
							<span class="label-text">Nome</span>
						</label>
						<input
							id="client-name"
							type="text"
							class="input input-bordered w-full"
							placeholder="Ex: João Silva"
							bind:value={localClient.name}
							required
						/>
					</div>

					<div class="form-control">
						<label class="label" for="client-email">
							<span class="label-text">Email</span>
						</label>
						<input
							id="client-email"
							type="email"
							class="input input-bordered w-full"
							placeholder="Ex: joao@email.com"
							bind:value={localClient.email}
							required
						/>
					</div>

					<div class="form-control">
						<label class="label" for="client-phone">
							<span class="label-text">Telefone</span>
						</label>
						<input
							id="client-phone"
							type="tel"
							class="input input-bordered w-full"
							placeholder="Ex: (11) 91234-5678"
							bind:value={localClient.phone}
							required
						/>
					</div>

					<div class="form-control">
						<label class="label" for="client-status">
							<span class="label-text">Status</span>
						</label>
						<select
							id="client-status"
							class="select select-bordered w-full"
							bind:value={localClient.status}
							required
						>
							{#each statusOptions as option}
								<option value={option}>{option}</option>
							{/each}
						</select>
					</div>
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
					<button type="submit" class="btn btn-primary" disabled={isProcessing}>
						{#if isProcessing}
							<span class="loading loading-spinner"></span>
							Salvando...
						{:else}
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
						{/if}
					</button>
				</div>
			</form>
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
