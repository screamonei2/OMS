<script lang="ts">
	export let showModal = false;
	export let product: {
		id?: number;
		name: string;
		price: number;
		stock: number;
		category: string;
	} | null = null;

	export let onSave: (product: {
		id?: number;
		name: string;
		price: number;
		stock: number;
		category: string;
	}) => void;

	let localProduct = { name: "", price: 0, stock: 0, category: "" };

	const categoryOptions = ["Roupas", "Acessórios", "Eletrônicos", "Alimentos", "Livros"];

	$: if (product) {
		localProduct = { ...product };
	} else {
		localProduct = { name: "", price: 0, stock: 0, category: "" };
	}

	function closeModal() {
		showModal = false;
		product = null;
	}

	function handleSave() {
		onSave(localProduct);
		closeModal();
	}
</script>

{#if showModal}
	<dialog class="modal modal-open">
		<div class="modal-box max-w-2xl">
			<h3 class="font-bold text-lg mb-4">
				{product ? "Editar Produto" : "Adicionar Produto"}
			</h3>

			<form method="dialog" on:submit|preventDefault={handleSave}>
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div class="form-control">
						<label class="label" for="product-name">
							<span class="label-text">Nome</span>
						</label>
						<input
							id="product-name"
							type="text"
							class="input input-bordered w-full"
							placeholder="Ex: Camiseta Básica"
							bind:value={localProduct.name}
							required
						/>
					</div>

					<div class="form-control">
						<label class="label" for="product-category">
							<span class="label-text">Categoria</span>
						</label>
						<select
							id="product-category"
							class="select select-bordered w-full"
							bind:value={localProduct.category}
							required
						>
							<option value="" disabled selected>Selecione uma categoria</option>
							{#each categoryOptions as option}
								<option value={option}>{option}</option>
							{/each}
						</select>
					</div>

					<div class="form-control">
						<label class="label" for="product-price">
							<span class="label-text">Preço</span>
						</label>
						<input
							id="product-price"
							type="number"
							step="0.01"
							placeholder="Ex: 49.90"
							class="input input-bordered w-full"
							bind:value={localProduct.price}
							required
						/>
					</div>

					<div class="form-control">
						<label class="label" for="product-stock">
							<span class="label-text">Estoque</span>
						</label>
						<input
							id="product-stock"
							type="number"
							placeholder="Ex: 20"
							class="input input-bordered w-full"
							bind:value={localProduct.stock}
							required
						/>
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

		<form method="dialog" class="modal-backdrop" on:submit|preventDefault={closeModal}>
			<button>close</button>
		</form>
	</dialog>
{/if}
