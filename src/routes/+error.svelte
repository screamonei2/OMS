<script lang="ts">
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';
</script>

<div class="min-h-screen bg-base-200 flex items-center justify-center p-4">
    <div class="max-w-md w-full text-center space-y-6">
        <h1 class="text-4xl font-bold">
            {$page.status === 403 ? 'Acesso Negado' : 'Erro'}
        </h1>
        
        <p class="text-xl">
            {$page.error?.message || 'Ocorreu um erro inesperado'}
        </p>

        <div class="flex gap-4 justify-center">
            <button 
                class="btn btn-primary" 
                on:click={() => goto('/')}
            >
                Voltar para o início
            </button>
            
            {#if $page.status === 403}
                <button 
                    class="btn btn-outline" 
                    on:click={() => history.back()}
                >
                    Voltar
                </button>
            {/if}
        </div>
    </div>
</div>