<script lang="ts" setup>
  import { ref, watch, defineEmits } from 'vue'

  const emit = defineEmits<{
    (e: 'update:modelValue', value: number): void
  }>()

  const months = [
    { label: 'Jan', value: 1 },
    { label: 'Feb', value: 2 },
    { label: 'Mar', value: 3 },
    { label: 'Apr', value: 4 },
    { label: 'May', value: 5 },
    { label: 'Jun', value: 6 },
    { label: 'Jul', value: 7 },
    { label: 'Aug', value: 8 },
    { label: 'Sep', value: 9 },
    { label: 'Oct', value: 10 },
    { label: 'Nov', value: 11 },
    { label: 'Dec', value: 12 },
  ]

  const currentMonthIndex = new Date().getMonth() // returns 0–11
  const selectedMonth = ref(months[currentMonthIndex])

  // Emit only the value when selection changes
  watch(
    selectedMonth,
    (newVal) => {
      emit('update:modelValue', newVal.value)
    },
    { immediate: true }
  ) // <-- this emits the default value immediately on mount
</script>

<template>
  <AppSelect
    v-model="selectedMonth"
    :items="months"
    item-title="label"
    item-value="value"
    label="Select Month"
    return-object
    single-line
    placeholder="Choose Month"
  />
</template>
