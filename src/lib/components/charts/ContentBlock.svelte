<script lang="ts">
  //@ts-nocheck
  import { Icon } from "@onsvisual/svelte-components";

  let { data, title, indicator, source } = $props();

  let el = $state();
  let fullScreenMode = $state(false);

  function toggleFullScreen() {
    if (!fullScreenMode) {
      el?.requestFullscreen?.();
      fullScreenMode = true;
    } else {
      document?.exitFullscreen?.();
      fullScreenMode = false;
    }
  }
</script>

<div class="content-block-wrapper">
  <div class="content-block" bind:this={el}>
    {#if title}
      <span class="content-subhead">
        <h3>{title}</h3>
        <!-- {#if unit}
          <span>{unit ? `, ${unit}` : ""}</span>
        {/if} -->
        <!-- <span>{unit ? `, ${unit}` : ''}</span> -->
      </span>
    {/if}
    <button
      class="fullscreen-toggle"
      title="{fullScreenMode ? 'Exit' : 'Enter'} full screen mode"
      onclick={toggleFullScreen}
    >
      <Icon type={fullScreenMode ? "shrink" : "expand"} size="l" />
      <span class="ons-u-vh"
        >{fullScreenMode ? "Exit" : "Enter"} full screen mode</span
      >
    </button>
    <slot />
    {#if source.length > 0}
      <div class="source-notes-container">
        <p class="source-container">
          <span style="font-weight: bold">Source:</span>
          {#each source as s, i}
            <a href={s.href} target="_blank">{s.name}</a>{i < source.length - 1
              ? " and "
              : ""}
          {/each}
        </p>
      </div>
    {/if}
  </div>
</div>

<style>
  .content-block-wrapper {
    border: 1px solid #909090;
    margin-bottom: 1rem;
  }
  .content-block {
    position: relative;
    padding: 12px;
    background: var(--ons-color-page-light);
  }
  .fullscreen-toggle {
    position: absolute;
    cursor: pointer;
    top: 12px;
    right: 8px;
    color: var(--ons-color-text-link);
    background: none;
    border: none;
  }
  .fullscreen-toggle:hover {
    color: var(--ons-color-text-link-hover);
  }
  .fullscreen-toggle:hover :global(.ons-icon) {
    transform: scale(1.2);
  }
  .source-notes-container {
    padding: 8px 0 4px;
    font-size: 16px;
    display: flex;
    flex-direction: column;
    gap: 5px;
  }
  .source-container {
    padding: 0px;
    margin: 0px;
    line-height: 1.2;
  }
  .content-subhead {
    margin: 0;
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    align-items: baseline;
  }
  h3 {
    margin: 0px;
  }
</style>
