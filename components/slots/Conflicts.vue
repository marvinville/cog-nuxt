<script setup lang="ts">
  import { defineProps } from 'vue'

  // 🧩 Props definition
  const props = defineProps<{
    items: {
      name: string
      satelliteName: string
      slotName: string
      role: string
    }[]
  }>()
</script>

<template>
  <div v-if="items.length">
    <h5 class="text-error mb-2">Conflicts Found</h5>

    <VList density="compact">
      <VListItem v-for="(item, index) in items" :key="index" class="py-1">
        <VListItemTitle>
          {{ item.name }} – already in
          <strong>{{ item.satelliteName }}</strong> – {{ item.slotName }} ({{
            item.role
          }})
        </VListItemTitle>
      </VListItem>
    </VList>
  </div>
</template>

<style scoped>
  .text-error {
    color: var(--v-theme-error); /* Vuetify color token */
  }
</style>
