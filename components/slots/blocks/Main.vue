<script setup lang="ts">
  import Slot from '@/components/slots/blocks/Slot.vue'

  const { slotDate, slots, isTws } = defineProps({
    slotDate: {
      type: String,
      required: true,
    },
    slots: {
      type: Array,
      required: true,
    },
    isTws: {
      type: Boolean,
      required: false,
    },
  })

  const { $dayjs } = useNuxtApp()

  const shortDay = $dayjs(slotDate).format('ddd').toLowerCase() // returns "sun"

  let slotColorClass

  switch (shortDay) {
    case 'tue':
      slotColorClass = 'bg-orange'
      break
    case 'sat':
      slotColorClass = 'bg-blue'
      break
    default:
      slotColorClass = 'bg-none'
  }
</script>

<template>
  <table class="outer-table" width="100%">
    <tbody>
      <tr>
        <td colspan="2" :class="`with-border slot-date ${slotColorClass}`">
          {{ slotDate }}
        </td>
      </tr>

      <tr v-if="slots.length === 0">
        <td class="with-border no-slot">&nbsp;</td>
      </tr>

      <tr v-else>
        <td v-for="(slot, key) in slots" class="slot-table-holder">
          <Slot :slot="slot" />
        </td>
      </tr>
    </tbody>
  </table>
</template>
