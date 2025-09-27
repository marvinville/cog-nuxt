<script setup lang="ts">
  defineProps<{
    musicians: { id: number; name: string }[]
    bandLeaderId: number
  }>()
</script>

<template>
  <span class="text-body-1 d-inline-block">
    <template v-for="(m, idx) in musicians" :key="m.id">
      <span :class="{ 'text-h6 font-weight-medium': m.id === bandLeaderId }">
        {{ m.id === bandLeaderId ? '*' + m.name : m.name }}
      </span>
      <span v-if="idx < musicians.length - 1"> &amp; </span>
    </template>
  </span>
</template>
