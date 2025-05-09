<script lang="ts">
  import { notifications } from '$lib/stores/notifications';
  import { fly } from 'svelte/transition';

  function getAlertClass(type: string) {
    switch (type) {
      case 'success':
        return 'alert-success';
      case 'error':
        return 'alert-error';
      case 'warning':
        return 'alert-warning';
      default:
        return 'alert-info';
    }
  }
</script>

<div class="toast toast-end">
  {#each $notifications as notification (notification.id)}
    <div
      class="alert {getAlertClass(notification.type)}"
      transition:fly={{ x: 100, duration: 300 }}
    >
      <button
        class="btn btn-circle btn-xs absolute right-2 top-2"
        on:click={() => notifications.remove(notification.id)}
      >
        ✕
      </button>
      <span>{notification.message}</span>
    </div>
  {/each}
</div>