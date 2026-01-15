<script lang="ts">
  import { Button } from "@onsvisual/svelte-components";

  let { title, label, icon = null, children, onConfirm, onCancel } = $props();

  let id = $derived(title.toLowerCase().replaceAll(" ", "-"));
  let dialog = $state();
</script>

<Button variant="secondary" {icon} small on:click={() => dialog.showModal()}
  >{label}</Button
>

<dialog aria-labelledby={id} bind:this={dialog}>
  <h1 {id} tabindex="-1">{title}</h1>
  <div class="modal-contents">
    {@render children()}
  </div>
  <Button
    small
    on:click={() => {
      onConfirm();
      dialog.close();
    }}>Confirm changes</Button
  >
  <Button
    variant="secondary"
    small
    on:click={() => {
      dialog.close();
      onCancel();
    }}>Cancel</Button
  >
</dialog>

<style>
  dialog {
    width: 760px;
    max-width: calc(100% - 2rem);
    overflow: visible;
  }
  .modal-contents {
    margin-bottom: 2rem;
  }
</style>
