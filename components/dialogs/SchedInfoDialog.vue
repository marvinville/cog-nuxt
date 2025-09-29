<script setup lang="ts">
  import fixedBands from '@/database/musicians/fixed-bands.json'
  import satellites from '@/database/satellites.json'
  import type { BasicPerson, Musician, Singer } from '@/types/Person' // adjust path based on your project

  const props = defineProps({
    formData: {
      type: Object,
      required: true,
      default: () => ({
        id: 0,
        satellite_id: 0,
        slot_uuid: '',
        slot_name: '',
        date_from: '',
        date_to: '',
        slot_date: '',
        worship_leader: 0,
        band_leader: 0,
        key_vox_leader: 0,
        key_vox: [],
        is_fixed_band: false,
        fixed_band_id: null,
        pianists: [],
        egs: [],
        ags: [],
        drummers: [],
        bassists: [],
        others: [],
        tech_head: 0,
        md: 0,
        devotion: [],
        remarks: '',
      }),
    },
    isDialogVisible: {
      type: Boolean,
      required: true,
    },
    selectedMonth: {
      required: true,
      type: Number,
    },
    selectedYear: {
      required: true,
      type: Number,
    },
    workers: {
      type: Array as PropType<BasicPerson[]>,
      required: true,
    },
    schedules: {
      type: Array,
    },
  })

  const api = useApi()

  const emit = defineEmits(['submit', 'update:isDialogVisible'])

  const {
    getDaysInMonth,
    prioritizeByPreferredSatelliteId,
    sortByName,
    checkWorkerConflicts,
  } = useSlotHelpers()

  const { $dayjs } = useNuxtApp()

  const selectedMonth = ref(props.selectedMonth)
  const selectedYear = ref(props.selectedYear)
  const localFormData = ref({ ...props.formData })
  const formRef = ref(null)

  const workers = props.workers || []
  const singers = workers.filter((elem) => elem.role === 'singer')

  const isMusician = (person: BasicPerson): person is Musician => {
    return person.role === 'musician'
  }

  const musicians = workers.filter(isMusician)
  const mds = workers.filter((elem) => elem.role === 'md')
  const ths = workers.filter((elem) => elem.role === 'tech_head')

  const openedPanels = ref<number[]>([0, 1, 2, 3])
  const search = reactive({
    pianists: '',
    egs: '',
    ags: '',
    bassists: '',
    drummers: '',
    others: '',
    key_vox: '',
  })

  const handleSearch = (field: keyof typeof search) => {
    search[field] = '' // clears typed input
  }

  const requiredValidator = (fieldName: string) => {
    return (v: any) => {
      const valid =
        v !== null &&
        v !== '' &&
        v !== undefined &&
        !(Array.isArray(v) && v.length === 0)

      if (!valid) {
        // console.warn(`Validation failed: ${fieldName} is required`)
        return 'Field is required'
      }
      return true
    }
  }

  const onFormSubmit = async () => {
    const validator = await formRef.value?.validate()

    if (!validator.valid) {
      console.log('Form errors:', validator.errors)
      return
    }

    if (!validator?.valid) {
      console.log('Please fill the required fields.')
      return false
    }
    emit('submit', localFormData.value)
    emit('update:isDialogVisible', false)
    resetForm()
  }

  const onFormReset = () => {
    resetForm()
  }

  const dialogModelValueUpdate = (val: boolean) => {
    // closing the modal should set the tab to default view
    if (!val) {
      openedPanels.value = [0, 1, 2, 3]
      // when the form is closed during add, reset the slot date options
      if (localFormData.value.id < 1) {
        slotDateOptions.value = []
      }
    }

    emit('update:isDialogVisible', val)
  }

  const baseFormData = {
    slot_uuid: '',
    slot_name: '',
    slot_date: null,
    satellite_id: null,
    worship_leader: null,
    band_leader: null,
    key_vox_leader: null,
    key_vox: [] as number[],
    is_fixed_band: false,
    fixed_band_id: null as number | null,
    pianists: [] as number[],
    egs: [] as number[],
    ags: [] as number[],
    drummers: [] as number[],
    bassists: [] as number[],
    others: [] as number[],
    tech_head: null as number | null,
    md: null as number | null,
    devotion: [] as string[],
    remarks: '',
  }

  const resetForm = () => {
    if (localFormData.value.id > 0) {
      // edit mode → keep id and maybe other values
      localFormData.value = {
        ...baseFormData,
        id: localFormData.value.id,
        satellite_id: props.formData.satellite_id,
        slot_uuid: localFormData.value.slot_uuid,
        slot_name: localFormData.value.slot_name,
        slot_date: localFormData.value.slot_date,
      }
    } else {
      // add mode → fresh reset
      localFormData.value = {
        ...baseFormData,
        id: 0,
        satellite_id: props.formData.satellite_id,
      }
    }

    // clear validation state
    formRef.value?.resetValidation()
  }

  const maxSelectionValidator = (max: number) => {
    return (value: any[]) => {
      return value.length <= max || `You can select up to ${max} items only`
    }
  }

  const minKeyVoxBySatellite = (satelliteId: number) => {
    switch (satelliteId) {
      case 1: // main should have atleast 5
        return 5
      default: // default atleast 3
        return 3
    }
  }

  const minSelectionValidator = (min: number) => {
    return (value: any[]) => {
      if (!Array.isArray(value)) return `Must select at least ${min} items`
      return value.length >= min || `You must select at least ${min} items`
    }
  }

  const minKeyVoxRule = (satelliteId: number) =>
    minSelectionValidator(minKeyVoxBySatellite(satelliteId))

  const checkScheduledNames = (ids: number[]) => {
    // Build a Set of scheduled ids for fast lookup
    const scheduledIds = new Set(compiledNames.value.map((el) => el.id))

    // Validate: all provided ids exist in compiledNames
    const isValid = ids.every((id) => scheduledIds.has(id))

    return isValid || 'One or more IDs are not scheduled'
  }

  const MDTHRules = computed(() =>
    props.formData?.satellite_id === 1 ? [requiredValidator] : []
  )

  // Flatten each band's members into a Set for easier comparison
  const findMatchingBand = (
    selectedMusicianIds: number[],
    fixedBands: any[]
  ): number => {
    // ✅ remove duplicates from selection
    const uniqueSelection = Array.from(new Set(selectedMusicianIds))

    for (const band of fixedBands) {
      const bandMemberIds = new Set<number>([
        ...band.pianists,
        ...band.egs,
        ...band.ags,
        ...band.bassists,
        ...band.drummers,
        ...band.others,
      ])

      // ✅ must be same size
      if (bandMemberIds.size !== uniqueSelection.length) continue

      // ✅ every selected id must exist in band
      const isExactMatch = uniqueSelection.every((id) => bandMemberIds.has(id))

      if (isExactMatch) {
        return band.id
      }
    }

    return 0
  }

  // check whether all musicians selected are fixed band
  const handleChangeMusicians = (value: string[]) => {
    const selectedMusicians = compiledNames.value.filter(
      (person) => person.role === 'musician'
    )

    const selectedMusicianIds = selectedMusicians.map((elem) => elem.id)

    const matchingBandId = findMatchingBand(selectedMusicianIds, fixedBands)

    localFormData.value.is_fixed_band = matchingBandId > 0 ? true : false
    localFormData.value.fixed_band_id = matchingBandId

    // if selected band leader is not in the list, reset value
    if (
      localFormData.value.band_leader &&
      selectedMusicianIds.includes(localFormData.value.band_leader) === false
    ) {
      localFormData.value.band_leader = null
    }
  }

  type CompiledName = {
    id: Number
    role: String
    name: String
  }

  const compiledNames = computed<CompiledName[]>(() => {
    const { pianists, egs, ags, bassists, drummers, others, key_vox } =
      localFormData.value

    // merge all musician ids in one array
    const selectedMusicians = [
      ...pianists,
      ...egs,
      ...ags,
      ...bassists,
      ...drummers,
      ...others,
    ]

    // build lookup maps
    const musicianMap = Object.fromEntries(musicians.map((m) => [m.id, m]))
    const singerMap = Object.fromEntries(singers.map((s) => [s.id, s]))

    // resolve musician details
    const musicianDetails: CompiledName[] = selectedMusicians.map((id) => ({
      ...musicianMap[id],
      role: 'musician',
    }))

    // resolve singer details
    const singerDetails: CompiledName[] = key_vox.map((id) => ({
      ...singerMap[id],
      role: 'singer',
    }))

    return [...musicianDetails, ...singerDetails]
  })

  const worshipLeaderOptions = computed(() => {
    const worshipLeaders = singers.filter((elem) => elem.is_worship_leader)

    return prioritizeByPreferredSatelliteId({
      data: sortByName(worshipLeaders),
      preferredId: props.formData.satellite_id,
    })
  })

  const isViewOnly = computed(() => {
    return false
    // return localFormData.value.id > 0
  })

  //
  const isReady = computed(() => {
    return localFormData.value.slot_date ? true : false
  })

  const isEditting = computed(() => {
    return localFormData.value.id > 0
  })

  const selectedSat = computed(() => {
    const satelliteId = props.formData.satellite_id
    const selectedSatellite = satellites.find((s) => s.id === satelliteId)

    return {
      name: selectedSatellite?.name ?? null,
      slots: selectedSatellite?.slots2 ?? [],
    }
  })

  const sortedFixedBands = computed(() => {
    const satId = props.formData?.satellite_id

    return [...fixedBands].sort((a, b) => {
      // 1️⃣ Prioritize bands matching the current satellite
      const aIsCurrent = a.preferred_satellite_id === satId
      const bIsCurrent = b.preferred_satellite_id === satId
      if (aIsCurrent && !bIsCurrent) return -1
      if (!aIsCurrent && bIsCurrent) return 1

      // 2️⃣ Sort by preferred_satellite_id
      if (a.preferred_satellite_id !== b.preferred_satellite_id) {
        return a.preferred_satellite_id - b.preferred_satellite_id
      }

      // 3️⃣ If same satellite, sort alphabetically by name
      return a.name.localeCompare(b.name)
    })
  })

  const slotDateOptions = ref<any[]>([])

  const onSlotChange = (selected: string) => {
    const selectedSlot = selectedSat.value.slots.find(
      (slot) => slot.uuid === selected
    )
    if (selectedSlot) {
      localFormData.value.slot_date = ''
      localFormData.value.remarks = selectedSlot.practice_details

      const { day_held } = selectedSlot

      // display all sunday in month
      if (day_held.toLowerCase() === 'sun') {
        slotDateOptions.value = getDaysInMonth({
          schedMonth: selectedMonth.value,
          schedYear: selectedYear.value,
          dayInWeek: 0,
        })
      } else if (day_held.toLowerCase() === 'tue') {
        slotDateOptions.value = getDaysInMonth({
          schedMonth: selectedMonth.value,
          schedYear: selectedYear.value,
          dayInWeek: 2,
        })
      }
      // remove taken slots
      const satId = props.formData?.satellite_id
      const takenScheds =
        props.schedules
          ?.filter(
            (sched: any) =>
              sched.satellite_id === satId &&
              sched.slot_uuid === selectedSlot.uuid
          )
          .map((el) => {
            return $dayjs(el.date_from).format('MMM D, YYYY')
          }) || []

      // tag taken date as disabled

      const trimmedSlots = slotDateOptions.value.map((elem) => {
        return {
          value: elem,
          text: elem,
          disabled: takenScheds.includes(elem),
        }
      })

      slotDateOptions.value = trimmedSlots
    }
  }

  const onFixedBandChange = (newValue: boolean) => {
    localFormData.value.fixed_band_id = null
    localFormData.value.band_leader = null
    Object.assign(localFormData.value, {
      pianists: [],
      egs: [],
      ags: [],
      bassists: [],
      drummers: [],
      others: [],
    })
  }

  const conflicts = ref([])

  const options = ref({
    pianists: [] as any[],
    egs: [] as any[],
    ags: [] as any[],
    bassists: [] as any[],
    drummers: [] as any[],
    others: [] as any[],
    wls: [] as any[],
    key_vocals: [] as any[],
  })

  const filterByInstrument = (musicians: Musician[], instrument: string) => {
    return musicians.filter((m) => m.instrument === instrument)
  }

  const handleConflicts = async (date: string) => {
    const exactDate = $dayjs(date).format('YYYY-MM-DD')
    try {
      // just attach ?date= param
      const response = await api(`/slots?date=${exactDate}`, {
        method: 'GET',
      })

      conflicts.value = response

      options.value.pianists = checkWorkerConflicts(
        filterByInstrument(musicians, 'keys'),
        conflicts.value
      )

      options.value.egs = checkWorkerConflicts(
        filterByInstrument(musicians, 'eg'),
        conflicts.value
      )

      options.value.ags = checkWorkerConflicts(
        filterByInstrument(musicians, 'ag'),
        conflicts.value
      )

      options.value.bassists = checkWorkerConflicts(
        filterByInstrument(musicians, 'bass'),
        conflicts.value
      )

      options.value.drummers = checkWorkerConflicts(
        filterByInstrument(musicians, 'drums'),
        conflicts.value
      )

      options.value.others = checkWorkerConflicts(
        filterByInstrument(musicians, 'others'),
        conflicts.value
      )

      options.value.wls = checkWorkerConflicts(
        worshipLeaderOptions.value,
        conflicts.value
      )

      options.value.key_vocals = checkWorkerConflicts(
        prioritizeByPreferredSatelliteId({
          data: sortByName(keyVox.value),
          preferredId: props.formData.satellite_id,
        }),
        conflicts.value
      )
    } catch (err) {
      console.error('Unexpected error while fetching slots:', err)
    }
  }

  const allSingers = ref<Singer[]>(singers)
  const keyVox = ref<Singer[]>(singers)
  const conflictMsg = ref({
    musicians: '' as string,
  })

  // make props into a reactive state
  watch(
    () => props.isDialogVisible,
    (isOpen) => {
      if (!isOpen) return

      const data = props.formData
      if (!data) return

      // Clone formData into local state
      localFormData.value = { ...data }
    }
  )

  // auto populate names of fixed band
  watch(
    () => localFormData.value.fixed_band_id,
    (newVal) => {
      // get conflicts of musicians on the same date
      const musicianConflicts = conflicts.value.flatMap((slot) => {
        const selectedWorkers = JSON.parse(slot.workers)

        const { ags, bassists, drummers, egs, others, pianists } =
          selectedWorkers.musicians

        return [
          ...ags,
          ...bassists,
          ...drummers,
          ...egs,
          ...others,
          ...pianists,
        ]
      })

      const band = fixedBands.find((item) => item.id === newVal)
      if (band) {
        const {
          pianists,
          egs,
          ags,
          bassists,
          drummers,
          others,
          band_leader_id,
        } = band

        const fixedBandMemberIds = [
          ...pianists,
          ...egs,
          ...ags,
          ...bassists,
          ...drummers,
          ...others,
        ]

        // check if any band member is in conflicts
        const hasConflict = fixedBandMemberIds.some((id) =>
          musicianConflicts.includes(id)
        )

        if (hasConflict) {
          conflictMsg.value.musicians =
            'A member of the selected band is already scheduled in other satellite.'
          return
        }

        Object.assign(localFormData.value, {
          pianists,
          egs,
          ags,
          bassists,
          drummers,
          others,
        })

        // set pianist as default band leader for fixed bands
        localFormData.value.band_leader = band_leader_id || band.pianists[0] // fallback to null if no pianists
      }
    }
  )

  watch(
    () => localFormData.value.satellite_id,
    (newVal, oldVal) => {
      if (newVal !== oldVal && localFormData.value.id === 0) {
        slotDateOptions.value = []
      }
    }
  )

  watch(
    () => localFormData.value.worship_leader,
    (newVal) => {
      if (!newVal) return

      // Update keyVox list by removing the worship leader
      keyVox.value = allSingers.value.filter((elem) => elem.id !== newVal)

      // Remove worship leader from selected key_vox if present (with defensive guard)
      localFormData.value.key_vox = (localFormData.value.key_vox || []).filter(
        (id) => id !== newVal
      )
    }
  )

  watch(
    () => props.selectedYear,
    (newVal) => {
      selectedYear.value = newVal
    }
  )
  watch(
    () => props.selectedMonth,
    (newVal) => {
      selectedMonth.value = newVal
    }
  )

  watch(
    compiledNames,
    (newList) => {
      const validIds = newList.map((person) => person.id)
      localFormData.value.devotion = localFormData.value.devotion.filter((id) =>
        validIds.includes(id)
      )
    },
    { deep: true }
  )

  // auto-populate value of slot_name
  watch(
    () => localFormData.value.slot_uuid,
    (newVal) => {
      const satelliteId = props.formData.satellite_id
      const satellite = satellites.find((elem) => elem.id === satelliteId)
      const satelliteSlots = satellite?.slots2 || []
      const found = satelliteSlots.find((elem) => elem.uuid === newVal)

      localFormData.value.slot_name = found?.title || ''
    }
  )
</script>

<template>
  <VDialog
    :width="$vuetify.display.smAndDown ? 'auto' : 900"
    :model-value="props.isDialogVisible"
    @update:model-value="dialogModelValueUpdate"
    persistent
    :no-click-animation="true"
  >
    <DialogCloseBtn @click="dialogModelValueUpdate(false)" />

    <VCard class="pa-sm-10 pa-2">
      <VCardText>
        <h4 class="text-h4 text-center mb-2">
          {{ selectedSat.name }} - Schedule Information
        </h4>
        <p class="text-body-1 text-center mb-6">
          {{ `${localFormData.slot_name} - ${localFormData.slot_date ?? ''}` }}
        </p>

        <VForm
          ref="formRef"
          class="mt-6"
          @submit.prevent="onFormSubmit"
          :disabled="isViewOnly"
        >
          <VExpansionPanels
            v-model="openedPanels"
            multiple
            class="no-icon-rotate"
            variant="popout"
          >
            <!-- Slot Details -->
            <VExpansionPanel>
              <VExpansionPanelTitle class="bold" disable-icon-rotate>
                Slot Details (Rehearsal Venue & Date)
                <template #actions>
                  <!-- <VIcon size="18" icon="tabler-check" color="success" /> -->
                </template>
              </VExpansionPanelTitle>
              <VExpansionPanelText>
                <VRow class="mt-2">
                  <VCol cols="12" md="6">
                    <AppSelect
                      v-model="localFormData.slot_uuid"
                      label="Slot Name"
                      name="slot_uuid"
                      placeholder="Select Item"
                      :items="selectedSat.slots"
                      item-value="uuid"
                      item-title="title"
                      :rules="[requiredValidator('Slot Name')]"
                      @update:modelValue="onSlotChange"
                      :disabled="isEditting"
                    />
                  </VCol>
                  <VCol cols="12" md="6">
                    <AppSelect
                      v-model="localFormData.slot_date"
                      name="slot_date"
                      label="Slot Date"
                      placeholder="Select Item"
                      :items="slotDateOptions"
                      item-title="text"
                      item-value="value"
                      :disabled="isEditting"
                      @update:modelValue="handleConflicts"
                    >
                      <template #item="{ item, props }">
                        <VListItem
                          v-bind="props"
                          :title="undefined"
                          :disabled="item.raw.disabled"
                        >
                          <!-- display the text field -->
                          <VListItemTitle
                            >{{ item.raw.text }}
                            {{
                              item.raw.disabled ? '(Already in Draft)' : ''
                            }}</VListItemTitle
                          >
                        </VListItem>
                      </template>
                    </AppSelect>
                  </VCol>
                  <VCol cols="12" md="6">
                    <AppTextField
                      v-model="localFormData.remarks"
                      :rules="[
                        (v) => !!v || 'Required',
                        (v) => !v || v.length <= 25 || 'Max 25 characters',
                      ]"
                      counter
                      maxlength="25"
                      placeholder="Day & Time"
                      hint="This field uses maxlength attribute"
                      label="Rehearsal Details"
                      name="remarks"
                    />
                  </VCol>
                </VRow>
              </VExpansionPanelText>
            </VExpansionPanel>
            <!-- END Slot Details -->

            <!-- WL AND CHOIR -->
            <VExpansionPanel>
              <VExpansionPanelTitle class="bold" disable-icon-rotate>
                Worship Leader and Choir
                <span v-if="!isReady" class="ml-1 text-subtitle-2"
                  >- Please select a Slot Date first.</span
                >
                <template #actions>
                  <!-- <VIcon size="18" icon="tabler-check" color="success" /> -->
                </template>
              </VExpansionPanelTitle>
              <VExpansionPanelText>
                <VRow class="mt-2">
                  <VCol cols="12" md="6">
                    <AppSelect
                      v-model="localFormData.worship_leader"
                      id="ac-worship-leader"
                      label="Worship Leader"
                      name="worship_leader"
                      :items="options.wls"
                      item-title="name"
                      item-value="id"
                      :rules="[requiredValidator('Worship Leader')]"
                      :disabled="!isReady"
                    >
                      <template #item="{ item, props }">
                        <VListItem
                          v-bind="props"
                          :title="undefined"
                          :disabled="item.raw.disabled"
                        >
                          <VListItemTitle>
                            {{ item.raw.name }}
                            <span v-if="item.raw.disabled">
                              <!-- join multiple conflicts -->
                              ({{ item.raw.conflictText.join(', ') }})
                            </span>
                          </VListItemTitle>
                        </VListItem>
                      </template>
                    </AppSelect>
                  </VCol>
                  <VCol cols="12" md="6">
                    <AppSelect
                      v-model="localFormData.key_vox"
                      id="ac-key-vox"
                      v-model:search="search.key_vox"
                      label="Key Vocals"
                      name="key_vox"
                      placeholder="Select Item"
                      :disabled="!isReady"
                      :items="options.key_vocals"
                      item-title="name"
                      item-value="id"
                      :rules="[
                        requiredValidator('Key Vocals'),
                        maxSelectionValidator(6),
                        minKeyVoxRule(props.formData.satellite_id),
                      ]"
                      closable-chips
                      chips
                      multiple
                      @update:modelValue="
                        () => {
                          handleSearch('key_vox')
                        }
                      "
                    >
                      <template #item="{ item, props }">
                        <VListItem
                          v-bind="props"
                          :title="undefined"
                          :disabled="item.raw.disabled"
                        >
                          <VListItemTitle>
                            {{ item.raw.name }}
                            <span v-if="item.raw.disabled">
                              <!-- join multiple conflicts -->
                              ({{ item.raw.conflictText.join(', ') }})
                            </span>
                          </VListItemTitle>
                        </VListItem>
                      </template>
                    </AppSelect>
                  </VCol>

                  <VCol cols="12" md="6">
                    <AppAutocomplete
                      v-model="localFormData.key_vox_leader"
                      id="ac-kvl"
                      label="Key Vocals Leader"
                      name="key_vox_leader"
                      :disabled="!isReady"
                      :items="
                        compiledNames.filter(({ role }: { role: string }) => role === 'singer')
                      "
                      item-title="name"
                      item-value="id"
                      :rules="[requiredValidator('Key Vocals Leader')]"
                    />
                  </VCol>
                </VRow>
              </VExpansionPanelText>
            </VExpansionPanel>
            <!-- END WL AND CHOIR -->

            <!-- BAND -->
            <VExpansionPanel>
              <VExpansionPanelTitle class="bold" disable-icon-rotate>
                Band Setup
                <span v-if="!isReady" class="ml-1 text-subtitle-2"
                  >- Please select a Slot Date first.</span
                >
                <template #actions>
                  <!-- <VIcon size="18" icon="tabler-check" color="success" /> -->
                </template>
              </VExpansionPanelTitle>
              <VExpansionPanelText>
                <VRow class="mt-2">
                  <VCol cols="12" v-if="isViewOnly > 0">
                    Fixed Band
                    {{ localFormData.is_fixed_band ? 'Yes' : 'No' }}
                  </VCol>

                  <VCol cols="12" v-else>
                    <VSwitch
                      v-model="localFormData.is_fixed_band"
                      density="compact"
                      label="Is Fixed Band?"
                      name="is_fixed_band"
                      @update:model-value="onFixedBandChange"
                      :disabled="!isReady"
                    />
                  </VCol>

                  <VCol v-if="localFormData.is_fixed_band" cols="12">
                    <AppAutocomplete
                      v-model="localFormData.fixed_band_id"
                      id="ac-fixed-band-id"
                      label="Band"
                      name="fixed_band_id"
                      :items="sortedFixedBands"
                      item-title="name"
                      item-value="id"
                    />
                  </VCol>

                  <VCol cols="12">
                    <VAlert
                      v-if="conflictMsg.musicians"
                      variant="tonal"
                      color="error"
                      closable
                      close-label="Close Alert"
                    >
                      {{ conflictMsg.musicians }}
                    </VAlert>
                  </VCol>

                  <VCol cols="12" md="6">
                    <AppSelect
                      v-model="localFormData.pianists"
                      v-model:search="search.pianists"
                      id="ac-pianists"
                      closable-chips
                      chips
                      multiple
                      label="Keyboardist"
                      name="keys"
                      :disabled="!isReady"
                      :items="options.pianists"
                      item-title="name"
                      item-value="id"
                      :rules="[
                        requiredValidator('Pianists'),
                        maxSelectionValidator(2),
                      ]"
                      @update:modelValue="
                        () => {
                          handleChangeMusicians()
                          handleSearch('pianists')
                        }
                      "
                    >
                      <template #item="{ item, props }">
                        <VListItem
                          v-bind="props"
                          :title="undefined"
                          :disabled="item.raw.disabled"
                        >
                          <VListItemTitle>
                            {{ item.raw.name }}
                            <span v-if="item.raw.disabled">
                              <!-- join multiple conflicts -->
                              ({{ item.raw.conflictText.join(', ') }})
                            </span>
                          </VListItemTitle>
                        </VListItem>
                      </template>
                    </AppSelect>
                  </VCol>

                  <VCol cols="12" md="6">
                    <AppSelect
                      v-model="localFormData.egs"
                      v-model:search="search.egs"
                      id="ac-egs"
                      closable-chips
                      chips
                      multiple
                      label="EG"
                      name="egs"
                      :disabled="!isReady"
                      :items="options.egs"
                      item-title="name"
                      item-value="id"
                      :rules="[
                        requiredValidator('EGs'),
                        maxSelectionValidator(2),
                      ]"
                      @update:modelValue="
                        () => {
                          handleChangeMusicians()
                          handleSearch('egs')
                        }
                      "
                    >
                      <template #item="{ item, props }">
                        <VListItem
                          v-bind="props"
                          :title="undefined"
                          :disabled="item.raw.disabled"
                        >
                          <VListItemTitle>
                            {{ item.raw.name }}
                            <span v-if="item.raw.disabled">
                              <!-- join multiple conflicts -->
                              ({{ item.raw.conflictText.join(', ') }})
                            </span>
                          </VListItemTitle>
                        </VListItem>
                      </template>
                    </AppSelect>
                  </VCol>

                  <VCol cols="12" md="6">
                    <AppSelect
                      v-model="localFormData.ags"
                      v-model:search="search.ags"
                      id="ac-ags"
                      closable-chips
                      chips
                      multiple
                      label="AG"
                      name="ags"
                      :disabled="!isReady"
                      :items="options.ags"
                      item-title="name"
                      item-value="id"
                      :rules="[
                        requiredValidator('AGs'),
                        maxSelectionValidator(2),
                      ]"
                      @update:modelValue="
                        () => {
                          handleChangeMusicians()
                          handleSearch('ags')
                        }
                      "
                    >
                      <template #item="{ item, props }">
                        <VListItem
                          v-bind="props"
                          :title="undefined"
                          :disabled="item.raw.disabled"
                        >
                          <VListItemTitle>
                            {{ item.raw.name }}
                            <span v-if="item.raw.disabled">
                              <!-- join multiple conflicts -->
                              ({{ item.raw.conflictText.join(', ') }})
                            </span>
                          </VListItemTitle>
                        </VListItem>
                      </template>
                    </AppSelect>
                  </VCol>

                  <VCol cols="12" md="6">
                    <AppSelect
                      v-model="localFormData.bassists"
                      v-model:search="search.bassists"
                      id="ac-bassists"
                      closable-chips
                      chips
                      multiple
                      label="Bassist"
                      name="bassists"
                      :disabled="!isReady"
                      :items="options.bassists"
                      item-title="name"
                      item-value="id"
                      :rules="[
                        requiredValidator('Bassists'),
                        maxSelectionValidator(2),
                      ]"
                      @update:modelValue="
                        () => {
                          handleChangeMusicians()
                          handleSearch('bassists')
                        }
                      "
                    >
                      <template #item="{ item, props }">
                        <VListItem
                          v-bind="props"
                          :title="undefined"
                          :disabled="item.raw.disabled"
                        >
                          <VListItemTitle>
                            {{ item.raw.name }}
                            <span v-if="item.raw.disabled">
                              <!-- join multiple conflicts -->
                              ({{ item.raw.conflictText.join(', ') }})
                            </span>
                          </VListItemTitle>
                        </VListItem>
                      </template>
                    </AppSelect>
                  </VCol>

                  <VCol cols="12" md="6">
                    <AppSelect
                      v-model="localFormData.drummers"
                      v-model:search="search.drummers"
                      id="ac-drummers"
                      closable-chips
                      chips
                      multiple
                      label="Drummer"
                      name="drummers"
                      :disabled="!isReady"
                      :items="options.drummers"
                      item-title="name"
                      item-value="id"
                      :rules="[
                        requiredValidator('Drummers'),
                        maxSelectionValidator(2),
                      ]"
                      @update:modelValue="
                        () => {
                          handleChangeMusicians()
                          handleSearch('drummers')
                        }
                      "
                    >
                      <template #item="{ item, props }">
                        <VListItem
                          v-bind="props"
                          :title="undefined"
                          :disabled="item.raw.disabled"
                        >
                          <VListItemTitle>
                            {{ item.raw.name }}
                            <span v-if="item.raw.disabled">
                              <!-- join multiple conflicts -->
                              ({{ item.raw.conflictText.join(', ') }})
                            </span>
                          </VListItemTitle>
                        </VListItem>
                      </template>
                    </AppSelect>
                  </VCol>

                  <VCol cols="12" md="6">
                    <AppSelect
                      v-model="localFormData.others"
                      v-model:search="search.others"
                      id="ac-others"
                      closable-chips
                      chips
                      multiple
                      label="Others"
                      name="others"
                      :disabled="!isReady"
                      :items="options.others"
                      item-title="name"
                      item-value="id"
                      :rules="[maxSelectionValidator(1)]"
                      @update:modelValue="
                        () => {
                          handleChangeMusicians()
                          handleSearch('others')
                        }
                      "
                    >
                      <template #item="{ item, props }">
                        <VListItem
                          v-bind="props"
                          :title="undefined"
                          :disabled="item.raw.disabled"
                        >
                          <VListItemTitle>
                            {{ item.raw.name }}
                            <span v-if="item.raw.disabled">
                              <!-- join multiple conflicts -->
                              ({{ item.raw.conflictText.join(', ') }})
                            </span>
                          </VListItemTitle>
                        </VListItem>
                      </template>
                    </AppSelect>
                  </VCol>

                  <VCol cols="12" md="6">
                    <AppAutocomplete
                      v-model="localFormData.band_leader"
                      id="ac-bl"
                      label="Band Leader"
                      :disabled="!isReady"
                      :items="
                        compiledNames.filter(({ role }: { role: string }) => role === 'musician')
                      "
                      item-title="name"
                      item-value="id"
                      :rules="[requiredValidator('Band Leader')]"
                    />
                  </VCol>
                </VRow>
              </VExpansionPanelText>
            </VExpansionPanel>
            <!-- END BAND -->

            <!-- LEADERS -->
            <VExpansionPanel>
              <VExpansionPanelTitle class="bold" disable-icon-rotate>
                Music Director, Tech Head & Devotion
                <span v-if="!isReady" class="ml-1 text-subtitle-2"
                  >- Please select a Slot Date first.</span
                >
                <template #actions>
                  <!-- <VIcon size="18" icon="tabler-check" color="success" /> -->
                </template>
              </VExpansionPanelTitle>
              <VExpansionPanelText>
                <VRow class="mt-2">
                  <VCol cols="12" md="6">
                    <AppAutocomplete
                      v-model="localFormData.tech_head"
                      id="ac-th"
                      label="Tech Head"
                      name="ths"
                      :disabled="!isReady"
                      :items="ths"
                      item-title="name"
                      item-value="id"
                      :rules="MDTHRules"
                    />
                  </VCol>

                  <VCol cols="12" md="6">
                    <AppAutocomplete
                      v-model="localFormData.md"
                      id="ac-md"
                      label="Music Director"
                      name="mds"
                      :disabled="!isReady"
                      :items="mds"
                      item-title="name"
                      item-value="id"
                      :rules="MDTHRules"
                    />
                  </VCol>

                  <VCol cols="12" md="6">
                    <AppAutocomplete
                      v-model="localFormData.devotion"
                      id="ac-devotion"
                      closable-chips
                      chips
                      multiple
                      label="Devotion"
                      name="devo"
                      :disabled="!isReady"
                      :items="compiledNames"
                      item-title="name"
                      item-value="id"
                      :rules="[
                        requiredValidator('Devotion'),
                        maxSelectionValidator(2),
                        checkScheduledNames,
                      ]"
                    />
                  </VCol>
                </VRow>
              </VExpansionPanelText>
            </VExpansionPanel>
          </VExpansionPanels>

          <VCol
            cols="12"
            class="d-flex flex-wrap justify-center gap-4 mt-6"
            v-if="!isViewOnly"
          >
            <VBtn color="secondary" variant="tonal" @click="onFormReset">
              Clear
            </VBtn>
            <VBtn type="submit">Submit</VBtn>
          </VCol>
        </VForm>
      </VCardText>
    </VCard>
  </VDialog>
</template>
