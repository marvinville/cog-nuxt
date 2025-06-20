<script setup lang="ts">
const { slotData } = defineProps({
  slotData: {
    type: Object,
    required: true,
    default: () => ({
      id: 0,
      date_from: '',
      date_to: '',
      slot_name: '',
      pianists: [],
      egs: [],
      ags: [],
      bassists: [],
      drummers: [],
      others: [],
      satellite_id: 0,
      satellite: '',
    }),
  },
})

const emit = defineEmits(['deleteSlot'])

const { splitMusicians } = useSlotHelpers()

const { $dayjs } = useNuxtApp()

const localData = ref({ ...slotData })

const setSlotDate = slotDate => {
  return $dayjs(slotDate).format('MMM D')
}
</script>

<template>
  <VCardText>
    <slot name="title">
      <div class="d-flex flex-wrap align-center justify-space-between gap-2">
        <span class="text-h4 mb-2 font-weight-medium">{{
          `${setSlotDate(slotData.date_to)} - ${slotData.slot_name}`
        }}</span>

        <!-- Action Icons -->
        <div class="d-flex align-center gap-1">
          <!--
            <VBtn
            icon="tabler-edit"
            variant="text"
            color="primary"
            class="text-right"
            />
          -->

          <VBtn
            icon="tabler-trash"
            variant="text"
            color="primary"
            class="text-right"
            @click="emit('deleteSlot', localData)"
          />
        </div>
      </div>
    </slot>
    <!--
      <h6 class="text-h6 my-1">
      Worship Leader:
      <span class="text-body-1 d-inline-block">Cess </span>
      </h6>
    -->

    <h6 class="text-h6 my-1">
      Pianist:
      <span class="text-body-1 d-inline-block">
        {{ splitMusicians(slotData.pianists) }}
      </span>
    </h6>

    <h6 class="text-h6 my-1">
      EG:
      <span class="text-body-1 d-inline-block">
        {{ splitMusicians(slotData.egs) }}
      </span>
    </h6>

    <h6 class="text-h6 my-1">
      AG:
      <span class="text-body-1 d-inline-block">
        {{ splitMusicians(slotData.ags) }}
      </span>
    </h6>

    <h6 class="text-h6 my-1">
      Bassist:
      <span class="text-body-1 d-inline-block">
        {{ splitMusicians(slotData.bassists) }}
      </span>
    </h6>

    <h6 class="text-h6 my-1">
      Drummer:
      <span class="text-body-1 d-inline-block">
        {{ splitMusicians(slotData.drummers) }}
      </span>
    </h6>
  </VCardText>
  <template />
</template>
