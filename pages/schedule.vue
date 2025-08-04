<script setup lang="ts">
  import { ref, watch } from 'vue'
  import Swal from 'sweetalert2'
  import SchedInfoDialog from '@/components/dialogs/SchedInfoDialog.vue'
  import YearSelect from '@/components/reusable/YearSelect.vue'
  import MonthSelect from '@/components/reusable/MonthSelect.vue'
  import SlotCard from '@/components/slots/SlotCard.vue'
  import type { SlotForm, ScheduleSlot } from '@/types/Slot'
  const { $dayjs } = useNuxtApp()

  const { buildWorkers } = useSlotHelpers()

  const schedules = ref<ScheduleSlot[]>([])
  const dataIsReady = ref(false)

  const selectedMonth = ref<number | null>(null)
  const selectedYear = ref<number | null>(null)

  const isSchedInfoDialogVisible = ref(false)

  const formDefault = {
    id: 0,
    satellite_id: 0,
    slot_name: '',
    slot_date: '',
    date_from: '',
    date_to: '',
    worship_leader: '',
    key_vox: [],
    is_fixed_band: false,
    fixed_band_id: null,
    pianists: [],
    egs: [],
    ags: [],
    drummers: [],
    bassists: [],
    others: [],
    tech_head: '',
    md: '',
    devotion: [],
    remarks: '',
  }

  let formData = reactive(formDefault)

  const api = useApi()

  const fetchData = async () => {
    if (!selectedMonth.value || !selectedYear.value) return

    dataIsReady.value = false
    try {
      const result = await api(
        `/slots?month=${selectedMonth.value}&year=${selectedYear.value}`
      )
      schedules.value = result
    } catch (err) {
      console.error('API fetch failed:', err)
    } finally {
      dataIsReady.value = true
    }
  }

  const preparePayload = (slot: SlotForm) => ({
    satellite_id: slot.satellite_id,
    slot_name: slot.slot_name,
    slot_date: slot.slot_date
      ? $dayjs(slot.slot_date).format('YYYY-MM-DD')
      : null,
    workers: JSON.stringify(buildWorkers(slot)),
    remarks: slot.remarks,
    created_by: 1,
  })

  const buildSlotRecord = (slot: SlotForm, id: number) => {
    return {
      id,
      slot_name: slot.slot_name,
      date_from: slot.slot_date,
      date_to: slot.slot_date,
      satellite_id: slot.satellite_id,
      workers: JSON.stringify(buildWorkers(slot)),
    }
  }

  const saveSlot = async (slot: SlotForm) => {
    try {
      const response = await api('/slots', {
        method: 'POST',
        body: preparePayload(slot),
      })

      return response?.id ?? 0
    } catch (err) {
      console.error('Unexpected error while saving slot:', err)
      return 0
    }
  }

  const handleSubmit = async (slot: SlotForm) => {
    dataIsReady.value = false

    const id = await saveSlot(slot)
    if (id > 0) {
      schedules.value.push(buildSlotRecord(slot, id) as any)
    }

    dataIsReady.value = true
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

  const handleEditSlot = async (slot: any) => {
    const {
      id,
      satellite_id,
      slot_name,
      date_from,
      date_to,
      workers,
      remarks,
    } = slot

    const {
      worship_leader,
      key_vox,
      musicians,
      md,
      tech_head,
      devotion,
      fixed_band_id,
    } = JSON.parse(workers || '{}')

    const {
      pianists = [],
      egs = [],
      ags = [],
      bassists = [],
      drummers = [],
      others = [],
    } = musicians

    formData = {
      id,
      satellite_id,
      slot_date: $dayjs(date_from).format('MMM D, YYYY'),
      slot_name,
      date_from,
      date_to,
      worship_leader,
      key_vox,
      is_fixed_band: false,
      pianists,
      egs,
      ags,
      drummers,
      bassists,
      others,
      fixed_band_id,
      tech_head,
      md,
      devotion,
      remarks,
    }

    isSchedInfoDialogVisible.value = true
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
    formData = { ...formDefault, satellite_id: satId }
    isSchedInfoDialogVisible.value = true
  }

  // Auto-fetch on mount
  onMounted(fetchData)

  // Refetch when month or year changes
  watch([selectedMonth, selectedYear], fetchData)
</script>

<template>
  <SchedInfoDialog
    v-model:is-dialog-visible="isSchedInfoDialogVisible"
    :form-data="formData"
    :sched-month="schedMonth"
    :selectedMonth="selectedMonth.value"
    :selectedYear="selectedYear.value"
    @submit="handleSubmit"
  />

  <VRow>
    <VCol cols="3">
      <YearSelect v-model="selectedYear" />
    </VCol>

    <VCol cols="3">
      <MonthSelect v-model="selectedMonth" />
    </VCol>
  </VRow>

  <VCol cols="12">
    <span class="text-h4">Praise and Worship Schedule</span>
  </VCol>

  <VCol>
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
          <SlotCard
            :slot-data="item"
            @delete-slot="handleDeleteSlot"
            @edit-slot="handleEditSlot"
          />
        </VCard>
      </VCol>
    </VCol>
  </VRow>
</template>
