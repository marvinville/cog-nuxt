<script setup lang="ts">
import Slot from '@/components/slots/blocks/Slot.vue'

const { slotDate, slots } = defineProps({
  slotDate: {
    type: String,
    required: true,
  },
  slots: {
    type: Array,
    required: true,
  },
})
</script>

<template>
  <table class="outer-table" width="100%">
    <tbody>
      <tr>
        <td colspan="2" class="with-border">{{ slotDate }}</td>
      </tr>

      <tr v-if="slots.length === 0">
        <td class="with-border no-slot">&nbsp;</td>
      </tr>

      <tr v-else>
        <td v-for="(slot, key) in slots">
          <Slot :slot="slot" />
        </td>
      </tr>
    </tbody>
  </table>
</template>
