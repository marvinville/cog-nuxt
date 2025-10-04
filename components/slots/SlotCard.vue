<script setup lang="ts">
  import type { Musician } from '@/types/Person'
  import SlotCardName from './SlotCardName.vue'
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

  const { splitNames, toNames, getMusiciansByInstrument } = useSlotHelpers()
  const { $dayjs } = useNuxtApp()

  // ✅ Parse workers JSON string once
  const workers = JSON.parse(props.slotData.workers)
  const { worship_leader, musicians } = workers
  const { pianists, egs, ags, bassists, drummers, others } = musicians
  const bandLeaderId = workers.band_leader || 0

  const allMusicians = props.workers.musiciansOptions || []
  const allSingers = props.workers.singersOptions || []

  const selectedMusicianIds = [
    ...pianists,
    ...egs,
    ...ags,
    ...bassists,
    ...drummers,
    ...others,
  ]

  const selectedMusicians = selectedMusicianIds
    .map((id) => allMusicians.find((elem: Musician) => elem.id === id))
    .filter((m): m is any => m !== undefined) // ✅ remove any nulls if id not found

  // Tip: avoid calling the function twice in template — use a computed property instead:
  const keysMusicians = computed(() =>
    getMusiciansByInstrument(selectedMusicians, 'keys')
  )

  const egMusicians = computed(() =>
    getMusiciansByInstrument(selectedMusicians, 'eg')
  )

  const agMusicians = computed(() =>
    getMusiciansByInstrument(selectedMusicians, 'ag')
  )
  const bassMusicians = computed(() =>
    getMusiciansByInstrument(selectedMusicians, 'bass')
  )

  const drumsMusicians = computed(() =>
    getMusiciansByInstrument(selectedMusicians, 'drums')
  )

  const othersMusicians = computed(() =>
    getMusiciansByInstrument(selectedMusicians, 'others')
  )

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
            icon="tabler-edit"
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
      <SlotCardName :musicians="keysMusicians" :bandLeaderId />
    </h6>

    <h6 class="text-h6 my-1">
      EG:
      <SlotCardName :musicians="egMusicians" :bandLeaderId />
    </h6>

    <h6 class="text-h6 my-1">
      AG:
      <SlotCardName :musicians="agMusicians" :bandLeaderId />
    </h6>

    <h6 class="text-h6 my-1">
      Bassist:
      <SlotCardName :musicians="bassMusicians" :bandLeaderId />
    </h6>

    <h6 class="text-h6 my-1">
      Drummer:
      <SlotCardName :musicians="drumsMusicians" :bandLeaderId />
    </h6>

    <h6 class="text-h6 my-1">
      Others:
      <SlotCardName :musicians="othersMusicians" :bandLeaderId />
    </h6>
  </VCardText>
  <template />
</template>
