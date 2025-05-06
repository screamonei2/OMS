<script lang="ts">
  import { initializeDatabase } from '$lib/db/init';
  import { onMount } from 'svelte';
  let status = 'Aguardando...';
  let error = '';

  async function handleInitialize() {
    try {
      status = 'Inicializando banco de dados...';
      await initializeDatabase();
      status = 'Banco de dados inicializado com sucesso!';
    } catch (e) {
      error = e.message;
      status = 'Erro ao inicializar banco de dados';
    }
  }

  onMount(() => {
    handleInitialize();
  });
</script>

<div class="container mx-auto p-4">
  <h1 class="text-2xl font-bold mb-4">Inicialização do Banco de Dados</h1>
  
  <div class="bg-white p-4 rounded-lg shadow">
    <p class="text-lg mb-2">Status: {status}</p>
    {#if error}
      <p class="text-red-500">{error}</p>
    {/if}
  </div>
</div>