<script lang="ts">
  //@ts-nocheck
  let { data, title, indicator, source } = $props();
  let el;
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
    border-top-left-radius: 4px;
    border-top-right-radius: 4px;
  }
  .border-rounded {
    border-radius: 4px;
  }
  .content-block {
    padding: 12px;
  }
  .hide-actions {
    border-bottom-left-radius: 4px;
    border-bottom-right-radius: 4px;
  }
  h3.content-subhead {
    font-size: 1.222em;
    margin: 0;
  }
  h3.content-subhead > span {
    font-size: 16px;
    font-weight: normal;
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
