<script lang="ts" setup>
  import { ref, watch } from 'vue'

  const emit = defineEmits<{
    (e: 'update:modelValue', value: number): void
  }>()

  const now = new Date()
  const currentYear = now.getFullYear()
  const isDecember = now.getMonth() === 11

  const years = [
    { label: `${currentYear}`, value: currentYear },
    { label: `${currentYear + 1}`, value: currentYear + 1 },
  ]

  const selectedYear = ref(isDecember ? years[1] : years[0])

  watch(
    selectedYear,
    (newVal) => {
      emit('update:modelValue', newVal.value)
    },
    { immediate: true }
  )
</script>

<template>
  <AppSelect
    v-model="selectedYear"
    :items="years"
    item-title="label"
    item-value="value"
    label="Year"
    placeholder="Choose Year"
    return-object
  />
</template>
