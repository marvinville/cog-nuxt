<script setup lang="ts">
  const props = defineProps<{
    slotData: {
      date_from: string
      slot_name: string
      workers: string // JSON string
    }
    workers: {
      singersOptions: []
      musiciansOptions: []
    }
  }>()

  const emit = defineEmits<{
    (e: 'editSlot', payload: typeof props.slotData): void
    (e: 'deleteSlot', payload: typeof props.slotData): void
  }>()

  const { splitNames, toNames } = useSlotHelpers()
  const { $dayjs } = useNuxtApp()

  // ✅ Parse workers JSON string once
  const workers = JSON.parse(props.slotData.workers)
  const { worship_leader, musicians } = workers
  const { pianists, egs, ags, bassists, drummers } = musicians

  const allMusicians = props.workers.musiciansOptions || []
  const allSingers = props.workers.singersOptions || []

  // now apply to each instrument
  const musicianNames = {
    pianists: toNames(pianists, allMusicians),
    egs: toNames(egs, allMusicians),
    ags: toNames(ags, allMusicians),
    bassists: toNames(bassists, allMusicians),
    drummers: toNames(drummers, allMusicians),
  }

  const WLNames = toNames([worship_leader], allSingers)

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
        {{ splitNames(WLNames) }}
      </span>
    </h6>

    <h6 class="text-h6 my-1">
      Pianist:
      <span class="text-body-1 d-inline-block">
        {{ splitNames(musicianNames.pianists) }}
      </span>
    </h6>

    <h6 class="text-h6 my-1">
      EG:
      <span class="text-body-1 d-inline-block">
        {{ splitNames(musicianNames.egs) }}
      </span>
    </h6>

    <h6 class="text-h6 my-1">
      AG:
      <span class="text-body-1 d-inline-block">
        {{ splitNames(musicianNames.ags) }}
      </span>
    </h6>

    <h6 class="text-h6 my-1">
      Bassist:
      <span class="text-body-1 d-inline-block">
        {{ splitNames(musicianNames.bassists) }}
      </span>
    </h6>

    <h6 class="text-h6 my-1">
      Drummer:
      <span class="text-body-1 d-inline-block">
        {{ splitNames(musicianNames.drummers) }}
      </span>
    </h6>
  </VCardText>
  <template />
</template>
