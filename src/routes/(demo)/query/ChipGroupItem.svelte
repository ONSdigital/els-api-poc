<script>
  let {
    id = "",
    label = "",
    idKey = "id",
    labelKey = "label",
    item = { [idKey]: id, [labelKey]: label },
    name = "",
    group = $bindable([]),
  } = $props();

  let el = $state();

  function update() {
    if (el.checked) group.push(item[idKey]);
    else group = group.filter((val) => val !== item[idKey]);
  }
</script>

<div class="button-container">
  <input
    id={item[idKey]}
    type="checkbox"
    {name}
    value={item[idKey]}
    class="radio-input"
    onchange={update}
    checked={group.includes(item[idKey])}
    bind:this={el}
  />
  <label for={item[idKey]} class="button">
    {item[labelKey] || item[idKey]}
  </label>
</div>

<style>
  .button-container {
    display: flex;
  }

  .radio-input {
    position: absolute;
    opacity: 0;
    width: 0;
    height: 0;
  }

  .button {
    flex-grow: 0;
    padding: 4px 8px;
    border: none;
    background: transparent;
    font-size: 14px;
    cursor: pointer;
    border-radius: 6px;
    transition:
      background 0.2s ease,
      color 0.2s ease;
    color: #707071;
    text-align: center;
  }

  .button:hover {
    background-color: #e8e8e8;
  }

  input:focus + .button {
    box-shadow: orange 0 0 0 2px;
  }

  input[type="checkbox"]:checked + .button {
    background: white;
    font-weight: bold;
    color: #206095;
    box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.2);
  }
</style>
