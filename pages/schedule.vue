<script setup lang="ts">
  import { ref, watch } from 'vue'
  import Swal from 'sweetalert2'
  import SchedInfoDialog from '@/components/dialogs/SchedInfoDialog.vue'
  import YearSelect from '@/components/reusable/YearSelect.vue'
  import MonthSelect from '@/components/reusable/MonthSelect.vue'
  import SlotCard from '@/components/slots/SlotCard.vue'
  import type { SlotForm, ScheduleSlot } from '@/types/Slot'
  import singers from '@/database/singers.json'
  import ths from '@/database/tech-heads.json'
  import mds from '@/database/mds.json'
  import musicians from '@/database/musicians.json'
  import users from '@/database/users.json'

  import { useRouter } from 'vue-router'

  const router = useRouter() // add this at the top

  const { sortSlots } = useSlotHelpers()

  // musicians
  const musiciansPool = musicians.map((elem) => {
    const user = users.find((u) => u.id === elem.id)
    return {
      ...elem,
      id: user?.id,
      name: user?.name,
      role: 'musician',
    }
  })

  // singers
  const singersPool = singers.map((elem) => {
    const user = users.find((u) => u.id === elem.id)
    return {
      ...elem,
      id: user?.id,
      name: user?.name,
      role: 'singer',
    }
  })

  // tech heads
  const thPool = ths.map((elem) => {
    const user = users.find((u) => u.id === elem.id)
    return {
      ...elem,
      id: user?.id,
      name: user?.name,
      role: 'tech_head',
    }
  })

  // MDs
  const mdPool = mds.map((elem) => {
    const user = users.find((u) => u.id === elem.id)
    return {
      ...elem,
      id: user?.id,
      name: user?.name,
      role: 'md',
    }
  })

  // You might want to tag them with a role so you know their origin
  const workers = [...singersPool, ...thPool, ...mdPool, ...musiciansPool]

  const { $dayjs } = useNuxtApp()

  const { buildWorkers } = useSlotHelpers()

  const schedules = ref<ScheduleSlot[]>([])
  const dataIsReady = ref(false)

  // Get current date
  const now = $dayjs()

  // Initialize refs with current month (1–12) and year
  const selectedMonth = ref<number>(now.month() + 1) // month() is 0-based
  const selectedYear = ref<number>(now.year())

  const isSchedInfoDialogVisible = ref(false)

  const formDefault = {
    id: 0,
    satellite_id: 0,
    slot_uuid: '',
    slot_name: '',
    slot_date: '',
    date_from: '',
    date_to: '',
    worship_leader: '',
    soprano: '',
    alto: '',
    tenor: '',
    bass: '',
    male_melody: '',
    female_melody: '',
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

    const delay = (ms: number) =>
      new Promise((resolve) => setTimeout(resolve, ms))

    try {
      // Start both API and delay at the same time
      const [result] = await Promise.all([
        api(`/slots?month=${selectedMonth.value}&year=${selectedYear.value}`),
        delay(500), // minimum 500ms delay for better UX
      ])

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
    slot_uuid: slot.slot_uuid,
    slot_date: slot.slot_date
      ? $dayjs(slot.slot_date).format('YYYY-MM-DD')
      : null,
    workers: JSON.stringify(buildWorkers(slot)),
    remarks: slot.remarks,
    created_by: 1,
  })

  const buildSlotRecord = (slot: SlotForm, id: number): any => {
    const dateFrom = `${slot.slot_date} 00:00:00`
    const dateTo = `${slot.slot_date} 23:59:59`
    const isSundaySlot = slot.slot_name.toUpperCase() === 'TWS' ? 0 : 1

    return {
      id,
      slot_name: slot.slot_name,
      slot_uuid: slot.slot_uuid,
      date_from: dateFrom,
      date_to: dateTo,
      remarks: slot.remarks,
      satellite_id: slot.satellite_id,
      workers: JSON.stringify(buildWorkers(slot)),
      is_sunday_slot: isSundaySlot,
      created_by: slot.created_by ?? 0,
      created_at: new Date().toISOString(),
      updated_by: null,
      updated_at: null,
      deleted_at: null,
    }
  }

  const saveSlot = async (slot: SlotForm) => {
    try {
      const response = await api('/slots', {
        method: 'POST',
        body: preparePayload(slot),
      })
      return response?.id ?? 0 // backend insert returns the new id
    } catch (err) {
      console.error('Unexpected error while saving slot:', err)
      return 0
    }
  }

  // api helper is assumed to JSON.stringify + set headers
  const updateSlot = async (slot: SlotForm) => {
    try {
      const response = await api(`/slots/${slot.id}`, {
        method: 'PUT',
        body: preparePayload(slot),
      })
      // backend doesn't send id back, so just return the existing id
      return slot.id
    } catch (err) {
      console.error('Unexpected error while updating slot:', err)
      return 0
    }
  }

  const handleSubmit = async (slot: SlotForm) => {
    dataIsReady.value = false

    let editId = slot.id || 0

    if (editId > 0) {
      editId = await updateSlot(slot)

      // ✅ Replace the existing slot in the list instead of pushing a new one
      const index = schedules.value.findIndex((s) => s.id === editId)
      if (index !== -1) {
        console.log(`update ran`)
        schedules.value[index] = buildSlotRecord(slot, editId)
      }
    } else {
      editId = await saveSlot(slot)
      schedules.value.push(buildSlotRecord(slot, editId) as any)
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

  const handleEditSlot = (slot: any) => {
    const {
      id,
      satellite_id,
      slot_uuid,
      slot_name,
      date_from,
      date_to,
      workers,
      remarks,
    } = slot

    const {
      worship_leader,
      musicians,
      key_vocals,
      md,
      tech_head,
      devotion,
      fixed_band_id,
      key_vox_leader,
      band_leader,
    } = JSON.parse(workers || '{}')

    const {
      pianists = [],
      egs = [],
      ags = [],
      bassists = [],
      drummers = [],
      others = [],
    } = musicians

    const { soprano, alto, tenor, bass, male_melody, female_melody } =
      key_vocals

    formData = {
      id,
      satellite_id,
      slot_date: $dayjs(date_from).format('MMM D, YYYY'),
      slot_uuid,
      slot_name,
      date_from,
      date_to,
      worship_leader,
      soprano,
      alto,
      tenor,
      bass,
      male_melody,
      female_melody,
      is_fixed_band: fixed_band_id > 0,
      pianists,
      egs,
      ags,
      drummers,
      bassists,
      others,
      fixed_band_id,
      band_leader,
      key_vox_leader,
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

  // const openInNewTab = () => {
  //   const url = router.resolve({
  //     path: '/export',
  //     query: { year: selectedYear.value, month: selectedMonth.value },
  //   }).href
  //   window.open(url, '_blank')
  // }

  const openInNewTab = () => {
    router.push({
      path: '/export',
      query: { year: selectedYear.value, month: selectedMonth.value },
    })
  }

  // Refetch when month or year changes
  watch([selectedMonth, selectedYear], fetchData)
</script>

<template>
  <!-- Filters Card -->
  <VCol cols="12" md="12">
    <div class="d-flex align-center flex-wrap justify-space-between mb-6 gap-2">
      <span class="text-h4">Praise and Worship Schedule</span>

      <VBtn @click="openInNewTab">
        Export
        <VIcon end icon="tabler-cloud-download" />
      </VBtn>
    </div>
    <VCard class="pa-4">
      <VCardTitle class="pb-2">Filter by</VCardTitle>
      <VCardText>
        <VRow>
          <VCol class="pl-0" cols="12" md="3" sm="12">
            <YearSelect v-model="selectedYear" />
          </VCol>
          <VCol class="pl-0" cols="12" md="3" sm="12">
            <MonthSelect v-model="selectedMonth" />
          </VCol>
        </VRow>
      </VCardText>
    </VCard>
  </VCol>

  <!-- Show spinner when loading -->
  <VRow
    v-if="!dataIsReady"
    align="center"
    justify="center"
    style="min-height: 200px"
  >
    <VProgressCircular indeterminate color="primary" size="50" width="5" />
  </VRow>

  <div v-else>
    <SchedInfoDialog
      v-model:is-dialog-visible="isSchedInfoDialogVisible"
      :selectedMonth="selectedMonth"
      :selectedYear="selectedYear"
      :form-data="formData"
      :workers="workers"
      :schedules="schedules"
      @submit="handleSubmit"
    />

    <VRow v-for="id in [1, 2, 3, 4]" :key="id" cols="12" class="mt-2">
      <VCol cols="12" class="text-center">
        <div class="d-flex flex-wrap align-center gap-2">
          <h3 class="ml-3 text-h3">
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

      <VCol lg="12">
        <div class="align-start gap-3 flexContainer">
          <VCard
            v-for="item in filterBySatellite({
              satelliteId: id,
              data: sortSlots(schedules),
            })"
            :key="item.index"
            class="mb-2 w-100"
          >
            <SlotCard
              :slot-data="item"
              @delete-slot="handleDeleteSlot"
              @edit-slot="handleEditSlot"
              :workers="{
                singersOptions: singersPool,
                musiciansOptions: musiciansPool,
              }"
            />
          </VCard>
        </div>
      </VCol>
    </VRow>
  </div>
</template>

<style lang="scss" scoped>
  .max-4 {
    flex: 1 1 calc(25% - 1rem); /* 4 items per row max */
    max-width: 20%;
    margin: 0.5rem; /* optional gap */
  }
  .flexContainer {
    display: grid;
    grid-template-columns: 24% 24% 24% 24%;
    &.fiveCols {
      grid-template-columns: 19% 19% 19% 19% 19%;
      @media (max-width: 1023px) {
        grid-template-columns: 32% 32% 32%;
      }
      @media (max-width: 767px) {
        grid-template-columns: 49% 49%;
      }
      @media (max-width: 400px) {
        grid-template-columns: 100%;
      }
    }
    @media (max-width: 1023px) {
      grid-template-columns: 32% 32% 32%;
    }
    @media (max-width: 767px) {
      grid-template-columns: 49% 49%;
    }
    @media (max-width: 400px) {
      grid-template-columns: 100%;
    }
  }
</style>
