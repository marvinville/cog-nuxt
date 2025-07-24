<script setup lang="ts">
  const props = defineProps<{
    slotData: {
      date_from: string
      slot_name: string
      workers: string // JSON string
    }
  }>()

  const emit = defineEmits<{
    (e: 'editSlot', payload: typeof props.slotData): void
    (e: 'deleteSlot', payload: typeof props.slotData): void
  }>()

  const { splitNames } = useSlotHelpers()
  const { $dayjs } = useNuxtApp()

  // ✅ Parse workers JSON string once
  const workers = JSON.parse(props.slotData.workers)
  const { worship_leader, musicians } = workers

  const { pianists, egs, ags, bassists, drummers } = musicians

  const formatSlotDate = (date: string) => $dayjs(date).format('MMM D')
</script>

<template>
  <VCardText>
    <slot name="title">
      <div class="d-flex align-center justify-space-between gap-2">
        <span class="text-h5 mb-2 font-weight-medium">{{
          `${formatSlotDate(slotData.date_from)} - ${slotData.slot_name}`
        }}</span>

        <!-- Action Icons -->
        <div class="d-flex align-center gap-1">
          <VBtn
            icon="tabler-eye"
            variant="text"
            color="primary"
            class="text-right"
            @click="emit('editSlot', slotData)"
          />

          <VBtn
            icon="tabler-trash"
            variant="text"
            color="primary"
            class="text-right"
            @click="emit('deleteSlot', slotData)"
          />
        </div>
      </div>
    </slot>

    <h6 class="text-h6 my-1">
      Worship Leader:
      <span class="text-body-1 d-inline-block">
        {{ worship_leader }}
      </span>
    </h6>

    <h6 class="text-h6 my-1">
      Pianist:
      <span class="text-body-1 d-inline-block">
        {{ splitNames(pianists) }}
      </span>
    </h6>

    <h6 class="text-h6 my-1">
      EG:
      <span class="text-body-1 d-inline-block">
        {{ splitNames(egs) }}
      </span>
    </h6>

    <h6 class="text-h6 my-1">
      AG:
      <span class="text-body-1 d-inline-block">
        {{ splitNames(ags) }}
      </span>
    </h6>

    <h6 class="text-h6 my-1">
      Bassist:
      <span class="text-body-1 d-inline-block">
        {{ splitNames(bassists) }}
      </span>
    </h6>

    <h6 class="text-h6 my-1">
      Drummer:
      <span class="text-body-1 d-inline-block">
        {{ splitNames(drummers) }}
      </span>
    </h6>
  </VCardText>
  <template />
</template>
