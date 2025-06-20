<script setup lang="ts">
import Swal from 'sweetalert2'
import SchedInfoDialog from '@/components/dialogs/SchedInfoDialog.vue'
import SlotCard from '@/components/slots/SlotCard.vue'

const { mutateData } = useSlotHelpers()
const { $dayjs } = useNuxtApp()

const schedules = ref([])
const dataIsReady = ref(false)

const schedMonth = $dayjs().add(1, 'month')
const schedMonthTitle = schedMonth.format('MMM YYYY')

const isSchedInfoDialogVisible = ref(false)

const formData = reactive({
  satellite_id: 0,
  slot_name: '',
  date_from: '',
  date_to: '',
  is_fixed_band: false,
  pianists: [],
  egs: [],
  ags: [],
  drummers: [],
  bassists: [],
  others: [],
})

const api = useApi()

const fetchData = async () => {
  dataIsReady.value = false

  try {
    const result = await api('/slots')

    schedules.value = mutateData(result)
  }
  catch (err) {
    console.error('API fetch failed:', err)
  }
  finally {
    dataIsReady.value = true
  }
}

const saveSlot = async (formVal: typeof formData) => {
  const {
    satellite_id,
    pianists,
    egs,
    ags,
    drummers,
    bassists,
    others,
    slot_date,
    slot_name,
  } = formVal

  const { data, error } = await useApi('/slots', {
    method: 'POST',
    body: {
      satellite_id,
      slot_name,
      slot_date: slot_date ? $dayjs(slot_date).format('YYYY-MM-DD') : null,
      musicians: JSON.stringify({ pianists, egs, ags, drummers, bassists, others }),
    },
  })

  if (error.value) {
    console.error('Save failed:', error.value)

    return 0
  }

  return data.value?.id ?? 0
}

const handleDeleteSlot = async (slot: any) => {
  const slotDate = $dayjs(slot.date_from).format('MMM DD')
  const deleteTitle = `${slotDate} - ${slot.slot_name}`

  const confirm = await Swal.fire({
    title: `Are you sure you want to delete ${deleteTitle}?`,
    text: 'You won’t be able to revert this!',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes, delete it!',
    cancelButtonText: 'No, keep it',
  })

  if (!confirm.value)
    return false

  const { error } = await useApi(`/slots/${slot.id}`, { method: 'DELETE' })

  if (error.value) {
    console.error('Delete failed:', error.value)

    return false
  }

  schedules.value = schedules.value.filter(item => item.id !== slot.id)

  return true
}

const filterBySatellite = ({ satelliteId, data }: { satelliteId: number; data: any[] }) => {
  return data.filter(item => Number(item.satellite_id) === satelliteId)
}

const addSchedule = (satId: number) => {
  formData.satellite_id = satId
  isSchedInfoDialogVisible.value = true
}

const handleSubmit = async (data: typeof formData) => {
  dataIsReady.value = false

  const isSaved = await saveSlot(data)

  if (isSaved > 0) {
    const newSlot = mutateData([
      {
        id: isSaved,
        musicians: JSON.stringify({
          pianists: data.pianists,
          egs: data.egs,
          ags: data.ags,
          drummers: data.drummers,
          bassists: data.bassists,
          others: data.others,
        }),
        slot_name: data.slot_name,
        date_from: data.slot_date,
        date_to: data.slot_date,
        satellite_id: data.satellite_id,
      },
    ])[0]

    schedules.value = [...schedules.value, newSlot]
  }

  dataIsReady.value = true
}

onMounted(fetchData)
</script>

<template>
  <SchedInfoDialog
    v-model:is-dialog-visible="isSchedInfoDialogVisible"
    :form-data="formData"
    :sched-month="schedMonth"
    @submit="handleSubmit"
  />

  <VCol cols="12">
    <h2 class="text-h2">
      {{ schedMonthTitle }}
    </h2>
    <span>Praise and Worship Schedule</span>
  </VCol>

  <VCol class="py-0">
    <RouterLink to="/export">
      <VBtn>
        Export
        <VIcon
          end
          icon="tabler-cloud-download"
        />
      </VBtn>
    </RouterLink>
  </VCol>

  <VRow v-if="dataIsReady">
    <VCol
      v-for="id in [1, 2, 3, 4]"
      :key="id"
      cols="12"
      sm="6"
      md="3"
    >
      <VCol
        cols="12"
        class="text-center"
      >
        <div class="d-flex flex-wrap align-center gap-2 justify-center">
          <h3 class="text-h3">
            {{ ['Main', 'Jabez', 'Silang', 'Trece'][id - 1] }}
          </h3>
          <VBtn
            icon="tabler-plus"
            variant="text"
            color="primary"
            class="text-right"
            @click="addSchedule(id)"
          />
        </div>
      </VCol>

      <VCol
        cols="12"
        lg="12"
        md="12"
      >
        <VCard
          v-for="item in filterBySatellite({ satelliteId: id, data: schedules })"
          :key="item.index"
          class="mb-2"
        >
          <SlotCard
            :slot-data="item"
            @delete-slot="handleDeleteSlot"
          />
        </VCard>
      </VCol>
    </VCol>
  </VRow>
</template>
