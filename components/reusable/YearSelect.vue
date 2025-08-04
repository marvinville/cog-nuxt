<script lang="ts" setup>
  import { ref, watch, defineEmits } from 'vue'

  const emit = defineEmits<{
    (e: 'update:modelValue', value: number): void
  }>()

  const currentYear = new Date().getFullYear()

  const years = [
    { label: `${currentYear}`, value: currentYear },
    { label: `${currentYear + 1}`, value: currentYear + 1 },
  ]

  const selectedYear = ref(years[0])

  // Emit the value (number) immediately on mount
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
    label="Select Year"
    placeholder="Choose Year"
    return-object
  />
</template>
