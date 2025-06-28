<script setup lang="ts">
import Swal from 'sweetalert2'
import SchedInfoDialog from '@/components/dialogs/SchedInfoDialog.vue'
import SlotCard from '@/components/slots/SlotCard.vue'
import type { SlotForm } from '@/types/SlotForm'
import singers from '@/database/singers.json'
const { mutateData } = useSlotHelpers()
const { $dayjs } = useNuxtApp()

const schedules = ref([])
const dataIsReady = ref(false)

const schedMonth = $dayjs().add(1, 'month')
const schedMonthTitle = schedMonth.format('MMM YYYY')

const isSchedInfoDialogVisible = ref(false)

const formData = reactive({
  id: 0,
  satellite_id: 0,
  slot_name: '',
  date_from: '',
  date_to: '',
  worship_leader: '',
  key_vox: [],
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
  } catch (err) {
    console.error('API fetch failed:', err)
  } finally {
    dataIsReady.value = true
  }
}

const saveSlot = async (slot: SlotForm) => {
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
  } = slot

  try {
    const response = await api('/slots', {
      method: 'POST',
      body: {
        satellite_id,
        slot_name,
        slot_date: slot_date ? $dayjs(slot_date).format('YYYY-MM-DD') : null,
        musicians: JSON.stringify({
          pianists,
          egs,
          ags,
          drummers,
          bassists,
          others,
        }),
      },
    })

    return response?.id
  } catch (err) {
    console.error('Unexpected error while saving slot:', err)
    return 0
  }
}

const saveSlot2 = async (slot) => {
  const {worship_leader, key_vox} = slot

  const keyVox = selectValues(singers, key_vox)

  console.log(slot)

  

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

  if (!confirm.value) return false

  try {
    const response = await api(`/slots/${slot.id}`, { method: 'DELETE' })

    if (response) {
      schedules.value = schedules.value.filter((item) => item.id !== slot.id)
    }

    return true
  } catch (err) {
    console.error('Failed to delete slot:', err)
    return false
  }
}

const filterBySatellite = ({
  satelliteId,
  data,
}: {
  satelliteId: number
  data: any[]
}) => {
  return data.filter((item) => Number(item.satellite_id) === satelliteId)
}

const addSchedule = (satId: number) => {
  formData.satellite_id = satId
  isSchedInfoDialogVisible.value = true
}

const selectValues = (haystack = [], needles = []) => {

  const selected = []

  haystack.forEach(elem => {
    if(needles.includes(elem.id)){
      selected.push(elem)
    }
  })

  return selected
}

const handleSubmit = async (slot: SlotForm) => {
  dataIsReady.value = false

  const isSaved = await saveSlot2(slot)

  return false

  if (isSaved > 0) {
    const newSlot = mutateData([
      {
        id: isSaved,
        musicians: JSON.stringify({
          pianists: slot.pianists,
          egs: slot.egs,
          ags: slot.ags,
          drummers: slot.drummers,
          bassists: slot.bassists,
          others: slot.others,
        }),
        slot_name: slot.slot_name,
        date_from: slot.slot_date,
        date_to: slot.slot_date,
        satellite_id: slot.satellite_id,
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
        <VIcon end icon="tabler-cloud-download" />
      </VBtn>
    </RouterLink>
  </VCol>

  <VRow v-if="dataIsReady">
    <VCol v-for="id in [1, 2, 3, 4]" :key="id" cols="12" sm="6" md="3">
      <VCol cols="12" class="text-center">
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

      <VCol cols="12" lg="12" md="12">
        <VCard
          v-for="item in filterBySatellite({
            satelliteId: id,
            data: schedules,
          })"
          :key="item.index"
          class="mb-2"
        >
          <SlotCard :slot-data="item" @delete-slot="handleDeleteSlot" />
        </VCard>
      </VCol>
    </VCol>
  </VRow>
</template>
