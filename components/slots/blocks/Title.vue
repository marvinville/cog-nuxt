<script setup>
  const props = defineProps({
    satellite: {
      type: String,
      required: true,
    },
  })
</script>
<template>
  <table class="tbl-collapse" width="100%">
    <tbody>
      <tr>
        <td class="bold italic bg-yellow">{{ satellite }}</td>
      </tr>
      <tr>
        <td class="bold italic">WL</td>
      </tr>
      <tr>
        <td class="bold italic row-h60">KVox</td>
      </tr>
      <tr>
        <td class="bold italic">Keyboardist</td>
      </tr>

      <tr>
        <td class="bold italic">E.G</td>
      </tr>
      <tr>
        <td class="bold italic">A.G</td>
      </tr>
      <tr>
        <td class="bold italic">Bassist</td>
      </tr>
      <tr>
        <td class="bold italic">Drummer</td>
      </tr>
      <tr>
        <td class="bold italic">Tech Head</td>
      </tr>
      <tr>
        <td class="bold italic">M.D</td>
      </tr>
      <tr>
        <td class="bold italic">Devotion</td>
      </tr>
      <tr>
        <td class="bold italic">Practice</td>
      </tr>
    </tbody>
  </table>
</template>
