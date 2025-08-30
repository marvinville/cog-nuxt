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
  })

  const emit = defineEmits(['submit', 'update:isDialogVisible'])

  const { getDaysInMonth, prioritizeByPreferredSatelliteId, sortByName } =
    useSlotHelpers()

  const selectedMonth = ref(props.selectedMonth)
  const selectedYear = ref(props.selectedYear)
  const localFormData = ref({ ...props.formData })
  const formRef = ref(null)

  const workers = props.workers || []
  const singers = workers.filter((elem) => elem.role === 'singer')
  const musicians = workers.filter((elem) => elem.role === 'musician')
  const mds = workers.filter((elem) => elem.role === 'md')
  const ths = workers.filter((elem) => elem.role === 'tech_head')

  const openedPanels = ref<number[]>([0, 1, 2, 3])

  const requiredValidator = (v: any) =>
    (v !== null &&
      v !== '' &&
      v !== undefined &&
      !(Array.isArray(v) && v.length === 0)) ||
    'Field is required'

  const onFormSubmit = async () => {
    const { slot_name, ...rest } = localFormData.value

    const slots = selectedSat.value.slots
    const found = slots.find(({ uuid }) => uuid === slot_name) // slot_name is actually the uuid

    const validator = await formRef.value?.validate()

    console.log('Validation result:', validator)
    // result.valid -> true / false
    // result.errors -> details of which field failed

    if (!validator.valid) {
      console.log('Form errors:', validator.errors)
      return
    }

    if (!validator?.valid) {
      console.log('Please fill the required fields.')
      return false
    }
    emit('submit', { slot_name: found?.title, ...rest })
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

  const resetForm = () => {
    localFormData.value = {
      id: 0,
      satellite_id: props.formData.satellite_id,
      slot_name: '',
      date_from: '',
      date_to: '',
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
    }

    // 👇 Clear validation state so errors don’t show after successful submit
    formRef.value?.resetValidation()
  }

  const maxSelectionValidator = (max: number) => {
    return (value: any[]) => {
      return value.length <= max || `You can select up to ${max} items only`
    }
  }
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

  // check whether all musicians selected are fixed band
  const handleFixedBand = (value: string[]) => {
    const band = fixedBands.find(
      (b) => b.id === localFormData.value.fixed_band_id
    )

    if (!band) {
      localFormData.value.fixed_band_id = null
      localFormData.value.is_fixed_band = false
      return
    }

    const {
      pianists = [],
      ags = [],
      egs = [],
      bassists = [],
      drummers = [],
      others = [],
    } = band

    const fixedBandMembers = new Set([
      ...pianists,
      ...ags,
      ...egs,
      ...bassists,
      ...drummers,
      ...others,
    ])

    const selectedMusicians = compiledNames.value.filter(
      (person) => person.role === 'musician'
    )

    const selectedMusiciansNamesOnly = selectedMusicians.map(
      (elem) => elem.name
    )

    // if selected band leader is not in the list, reset value
    if (
      localFormData.value.band_leader &&
      !selectedMusiciansNamesOnly.includes(localFormData.value.band_leader)
    ) {
      localFormData.value.band_leader = null
    }

    if (selectedMusicians.length !== fixedBandMembers.size) {
      localFormData.value.is_fixed_band = false
      return
    }

    const isPartOfFixedBand = value.every((name) => fixedBandMembers.has(name))
    localFormData.value.is_fixed_band = isPartOfFixedBand
  }

  // watch selected keyvox
  const handleKeyVox = (value: string[]) => {
    // if selected leader is not in the list, reset value
    if (
      localFormData.value.key_vox_leader &&
      !value.includes(localFormData.value.key_vox_leader)
    ) {
      localFormData.value.key_vox_leader = null
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

  const selectedSlotTitle = computed(() => {
    // get the saved name if in edit view
    if (localFormData.value.id) {
      return localFormData.value.slot_name
    }

    const mergedSlots = satellites.flatMap((item) => item.slots2)

    const slotId = localFormData.value.slot_name ?? null

    if (slotId) {
      const selectedSlot = mergedSlots.find((elem) => elem.uuid === slotId)

      return selectedSlot?.title || ''
    }

    return ''
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

  const slotDateOptions = ref<string[]>([])

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
    }
  }

  const allSingers = ref<Singer[]>(singers)
  const keyVox = ref<Singer[]>(singers)

  watch(
    () => props.isDialogVisible,
    (isOpen) => {
      if (!isOpen) return

      const data = props.formData
      if (!data) return

      // Clone formData into local state
      localFormData.value = { ...data }

      // COMMENTED OUT IN THE MEANTIME
      // const { satellite_id, worship_leader } = localFormData.value

      // // Only set default worship leader if not already set
      // if (!worship_leader && satellite_id) {
      //   const defaultWL = singers.find(
      //     (singer) =>
      //       singer.preferred_satellite_id === satellite_id &&
      //       singer.is_worship_leader
      //   )

      //   if (defaultWL?.id) {
      //     localFormData.value.worship_leader = defaultWL.id
      //   }
      // }
    }
  )

  // watch(
  //   () => props.formData,
  //   (newFormData) => {
  //     // Clone props.formData into localFormData
  //     localFormData.value = { ...newFormData }
  //   },
  //   {
  //     deep: false, // ✅ shallow is sufficient if props.formData is fully replaced
  //     immediate: true,
  //   }
  // )

  watch(
    () => localFormData.value.fixed_band_id,
    (newVal) => {
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
    () => localFormData.value.is_fixed_band,
    (newVal, oldVal) => {
      if (isViewOnly) {
        return
      }

      // if from fixed band to non-fixed band, reset the band members
      if (oldVal === false && newVal === true) {
        localFormData.value.fixed_band_id = null
        Object.assign(localFormData.value, {
          pianists: [],
          egs: [],
          ags: [],
          bassists: [],
          drummers: [],
          others: [],
        })
      }
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
          {{ `${selectedSlotTitle} - ${localFormData.slot_date ?? ''}` }}
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
                      v-model="localFormData.slot_name"
                      label="Slot Name"
                      name="slot_name"
                      placeholder="Select Item"
                      :items="selectedSat.slots"
                      item-value="uuid"
                      item-title="title"
                      :rules="[requiredValidator]"
                      @update:modelValue="onSlotChange"
                    />
                  </VCol>
                  <VCol cols="12" md="6">
                    <AppSelect
                      v-model="localFormData.slot_date"
                      name="slot_date"
                      label="Slot Date"
                      placeholder="Select Item"
                      :items="slotDateOptions"
                      :rules="[requiredValidator]"
                    />
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
                <template #actions>
                  <!-- <VIcon size="18" icon="tabler-check" color="success" /> -->
                </template>
              </VExpansionPanelTitle>
              <VExpansionPanelText>
                <VRow class="mt-2">
                  <VCol cols="12" md="6">
                    <AppAutocomplete
                      v-model="localFormData.worship_leader"
                      label="Worship Leader"
                      name="worship_leader"
                      placeholder="Select Item"
                      :items="worshipLeaderOptions"
                      item-title="name"
                      item-value="id"
                      :rules="[requiredValidator]"
                    />
                  </VCol>
                  <VCol cols="12" md="6">
                    <AppAutocomplete
                      v-model="localFormData.key_vox"
                      label="Key Vox"
                      name="key_vox"
                      placeholder="Select Item"
                      :items="
                        prioritizeByPreferredSatelliteId({
                          data: sortByName(keyVox),
                          preferredId: props.formData.satellite_id,
                        })
                      "
                      item-title="name"
                      item-value="id"
                      :rules="[requiredValidator, maxSelectionValidator(6)]"
                      closable-chips
                      chips
                      multiple
                      clearable
                      @update:modelValue="handleKeyVox"
                    />
                  </VCol>

                  <VCol cols="12" md="6">
                    <AppAutocomplete
                      v-model="localFormData.key_vox_leader"
                      label="Key Vox Leader"
                      name="key_vox_leader"
                      :items="
                        compiledNames.filter(({ role }: { role: string }) => role === 'singer')
                      "
                      item-title="name"
                      item-value="id"
                      clearable
                      :rules="[requiredValidator]"
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
                <template #actions>
                  <!-- <VIcon size="18" icon="tabler-check" color="success" /> -->
                </template>
              </VExpansionPanelTitle>
              <VExpansionPanelText>
                <VRow class="mt-2">
                  <VCol cols="12" v-if="isViewOnly > 0">
                    Is Fixed Band?
                    {{ localFormData.is_fixed_band ? 'Yes' : 'No' }}
                  </VCol>

                  <VCol cols="12" v-else>
                    <VSwitch
                      v-model="localFormData.is_fixed_band"
                      density="compact"
                      label="Is Fixed Band?"
                      name="is_fixed_band"
                    />
                  </VCol>

                  <VCol v-if="localFormData.is_fixed_band" cols="12">
                    <AppAutocomplete
                      v-model="localFormData.fixed_band_id"
                      label="Band"
                      name="fixed_band_id"
                      :items="sortedFixedBands"
                      item-title="name"
                      item-value="id"
                    />
                  </VCol>

                  <VCol cols="12" md="6">
                    <AppAutocomplete
                      v-model="localFormData.pianists"
                      closable-chips
                      chips
                      multiple
                      label="Keyboardist"
                      name="keys"
                      :items="musicians.filter((m: Musician) => m.instrument === 'keys')"
                      item-title="name"
                      item-value="id"
                      :rules="[requiredValidator, maxSelectionValidator(2)]"
                      @update:modelValue="handleFixedBand"
                    />
                  </VCol>

                  <VCol cols="12" md="6">
                    <AppAutocomplete
                      v-model="localFormData.egs"
                      closable-chips
                      chips
                      multiple
                      label="EG"
                      name="egs"
                      :items="musicians.filter((m: Musician) => m.instrument === 'eg')"
                      item-title="name"
                      item-value="id"
                      :rules="[requiredValidator, maxSelectionValidator(2)]"
                      @update:modelValue="handleFixedBand"
                    />
                  </VCol>

                  <VCol cols="12" md="6">
                    <AppAutocomplete
                      v-model="localFormData.ags"
                      closable-chips
                      chips
                      multiple
                      label="AG"
                      name="ags"
                      :items="musicians.filter((m: Musician) => m.instrument === 'ag')"
                      item-title="name"
                      item-value="id"
                      :rules="[requiredValidator, maxSelectionValidator(2)]"
                      @update:modelValue="handleFixedBand"
                    />
                  </VCol>

                  <VCol cols="12" md="6">
                    <AppAutocomplete
                      v-model="localFormData.bassists"
                      closable-chips
                      chips
                      multiple
                      label="Bassist"
                      name="bassists"
                      :items="musicians.filter((m: Musician) => m.instrument === 'bass')"
                      item-title="name"
                      item-value="id"
                      :rules="[requiredValidator, maxSelectionValidator(2)]"
                      @update:modelValue="handleFixedBand"
                    />
                  </VCol>

                  <VCol cols="12" md="6">
                    <AppAutocomplete
                      v-model="localFormData.drummers"
                      closable-chips
                      chips
                      multiple
                      label="Drummer"
                      name="drummers"
                      :items="musicians.filter((m: Musician) => m.instrument === 'drums')"
                      item-title="name"
                      item-value="id"
                      :rules="[requiredValidator, maxSelectionValidator(2)]"
                      @update:modelValue="handleFixedBand"
                    />
                  </VCol>

                  <VCol cols="12" md="6">
                    <AppAutocomplete
                      v-model="localFormData.others"
                      closable-chips
                      chips
                      multiple
                      label="Others"
                      name="others"
                      :items="musicians.filter((m: Musician) => m.instrument === 'others')"
                      item-title="name"
                      item-value="id"
                      :rules="[maxSelectionValidator(2)]"
                      @update:modelValue="handleFixedBand"
                    />
                  </VCol>

                  <VCol cols="12" md="6">
                    <AppAutocomplete
                      v-model="localFormData.band_leader"
                      label="Band Leader"
                      :items="
                        compiledNames.filter(({ role }: { role: string }) => role === 'musician')
                      "
                      item-title="name"
                      item-value="id"
                      clearable
                      :rules="[requiredValidator]"
                    />
                  </VCol>
                </VRow>
              </VExpansionPanelText>
            </VExpansionPanel>
            <!-- END BAND -->

            <!-- LEADERS -->
            <VExpansionPanel>
              <VExpansionPanelTitle class="bold" disable-icon-rotate>
                MD/TH & Devotion
                <template #actions>
                  <!-- <VIcon size="18" icon="tabler-check" color="success" /> -->
                </template>
              </VExpansionPanelTitle>
              <VExpansionPanelText>
                <VRow class="mt-2">
                  <VCol cols="12" md="6">
                    <AppAutocomplete
                      v-model="localFormData.tech_head"
                      label="Tech Head"
                      name="ths"
                      :items="ths"
                      item-title="name"
                      item-value="id"
                      clearable
                      :rules="MDTHRules"
                    />
                  </VCol>

                  <VCol cols="12" md="6">
                    <AppAutocomplete
                      v-model="localFormData.md"
                      label="MD"
                      name="mds"
                      :items="mds"
                      item-title="name"
                      item-value="id"
                      clearable
                      :rules="MDTHRules"
                    />
                  </VCol>

                  <VCol cols="12" md="6">
                    <AppAutocomplete
                      v-model="localFormData.devotion"
                      closable-chips
                      chips
                      multiple
                      label="Devotion"
                      name="devo"
                      :items="compiledNames"
                      item-title="name"
                      item-value="id"
                      :rules="[
                        requiredValidator,
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
