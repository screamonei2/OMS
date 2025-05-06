<script lang="ts">
	export let showModal = false;

	export let category: {
		id?: number;
		name: string;
		description: string;
		status: string;
	} | null = null;

	export let onSave: (category: {
		id?: number;
		name: string;
		description: string;
		status: string;
	}) => void;

	let localCategory = {
		name: "",
		description: "",
		status: "Ativo",
	};

	const statusOptions = ["Ativo", "Inativo"];

	$: if (category) {
		localCategory = { ...category };
	} else {
		localCategory = {
			name: "",
			description: "",
			status: "Ativo",
		};
	}

	function closeModal() {
		showModal = false;
		category = null;
	}

	function handleSave() {
		onSave(localCategory);
		closeModal();
	}
</script>

{#if showModal}
	<dialog class="modal modal-open">
		<div class="modal-box max-w-2xl">
			<h3 class="font-bold text-lg mb-4">
				{category ? "Editar Categoria" : "Adicionar Categoria"}
			</h3>

			<form method="dialog" on:submit|preventDefault={handleSave}>
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div class="form-control md:col-span-2">
						<label class="label" for="category-name">
							<span class="label-text">Nome</span>
						</label>
						<input
							id="category-name"
							type="text"
							class="input input-bordered w-full"
							placeholder="Ex: Bebidas"
							bind:value={localCategory.name}
							required
						/>
					</div>

					<div class="form-control md:col-span-2">
						<label class="label" for="category-description">
							<span class="label-text">Descrição</span>
						</label>
						<textarea
							id="category-description"
							class="textarea textarea-bordered w-full"
							placeholder="Descrição breve da categoria"
							bind:value={localCategory.description}
							rows="3"
							required
						></textarea>
					</div>

					<div class="form-control md:col-span-2">
						<label class="label" for="category-status">
							<span class="label-text">Status</span>
						</label>
						<select
							id="category-status"
							class="select select-bordered w-full"
							bind:value={localCategory.status}
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
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-[1em]">
							<path
								fill-rule="evenodd"
								d="M5.47 5.47a.75.75 0 0 1 1.06 0L12 10.94l5.47-5.47a.75.75 0 1 1 1.06 1.06L13.06 12l5.47 5.47a.75.75 0 1 1-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 0 1 0-1.06Z"
								clip-rule="evenodd"
							/>
						</svg>
						Cancelar
					</button>
					<button type="submit" class="btn btn-primary">
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-[1em]">
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
			<button>close</button>
		</form>
	</dialog>
{/if}
