<script setup lang="ts">
  import ags from '@/database/musicians/ags.json'
  import bassists from '@/database/musicians/bassists.json'
  import drummers from '@/database/musicians/drummers.json'
  import egs from '@/database/musicians/egs.json'
  import fixedBands from '@/database/musicians/fixed-bands.json'
  import pianists from '@/database/musicians/pianists.json'
  import others from '@/database/musicians/others.json'
  import singers from '@/database/singers.json'
  import ths from '@/database/tech-heads.json'
  import mds from '@/database/mds.json'
  import satellites from '@/database/satellites.json'
  import type { Singer } from '@/types/Person' // adjust path based on your project

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
      }),
    },
    isDialogVisible: {
      type: Boolean,
      required: true,
    },
    schedMonth: {
      required: true,
    },
  })

  const emit = defineEmits(['submit', 'update:isDialogVisible'])

  const {
    bandNamesCompiler,
    getDaysInMonth,
    prioritizeByPreferredSatelliteId,
  } = useSlotHelpers()

  const schedMonth = ref(props.schedMonth)
  const localFormData = ref({ ...props.formData })
  const formRef = ref(null)

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
    emit('update:isDialogVisible', val)
  }

  const resetForm = () => {
    localFormData.value = {
      id: 0,
      satellite_id: props.formData.satellite_id,
      slot_name: '',
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
  }

  const maxSelectionValidator = (max: number) => {
    return (value: any[]) => {
      return value.length <= max || `You can select up to ${max} items only`
    }
  }

  const checkScheduledNames = (value: string[]) => {
    const scheduledNames = new Set(compiledNames.value.map((el) => el.name))

    const isValid = value.every((name) => scheduledNames.has(name))

    return isValid || 'One or more names are not scheduled'
  }

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

    if (selectedMusicians.length !== fixedBandMembers.size) {
      localFormData.value.is_fixed_band = false
      return
    }

    const isPartOfFixedBand = value.every((name) => fixedBandMembers.has(name))
    localFormData.value.is_fixed_band = isPartOfFixedBand
  }

  const compiledNames = computed(() => {
    const selectedPianists = [...localFormData.value.pianists]
    const selectedEgs = [...localFormData.value.egs]
    const selectedAgs = [...localFormData.value.ags]
    const selectedBassists = [...localFormData.value.bassists]
    const selectedDrummers = [...localFormData.value.drummers]
    const selectedOthers = [...localFormData.value.others]
    const arrKeyVox = [...localFormData.value.key_vox]

    const singers = keyVox.value
      .filter((elem: Singer) => {
        return arrKeyVox.includes(elem.id)
      })
      .map((elem) => {
        return {
          role: 'singer',
          name: elem.name,
        }
      })

    const musicians = [
      ...selectedPianists,
      ...selectedEgs,
      ...selectedAgs,
      ...selectedBassists,
      ...selectedDrummers,
      ...selectedOthers,
    ].map((elem) => {
      return {
        role: 'musician',
        name: elem,
      }
    })

    return [...singers, ...musicians]
  })

  const worshipLeaderOptions = computed(() => {
    return prioritizeByPreferredSatelliteId({
      data: singers.filter((elem) => elem.is_worship_leader),
      preferredId: props.formData.satellite_id,
    })
  })

  // const keyVoxLeaderOptions = computed(() => {
  //   return compiledNames.value.filter(({ role }) => role === 'singer')
  // })

  // const bandLeaderOptions = computed(() => {
  //   return compiledNames.value.filter(({ role }) => role === 'musician')
  // })

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

  const slotDateOptions = ref<string[]>([])

  const onSlotChange = (selected: string) => {
    const selectedSlot = selectedSat.value.slots.find(
      (slot) => slot.uuid === selected
    )
    if (selectedSlot) {
      localFormData.value.slot_date = ''
      localFormData.value.remarks = selectedSlot.practice_details

      const { day_held } = selectedSlot
      const selectedMonth = schedMonth.value

      // display all sunday in month
      if (day_held.toLowerCase() === 'sun') {
        slotDateOptions.value = getDaysInMonth({
          schedMonth: selectedMonth,
          dayInWeek: 0,
        })
      } else if (day_held.toLowerCase() === 'tue') {
        slotDateOptions.value = getDaysInMonth({
          schedMonth: selectedMonth,
          dayInWeek: 2,
        })
      }
    }
  }

  const allSingers = ref<Singer[]>(singers)
  const keyVox = ref<Singer[]>(singers)

  watch(
    () => props.formData,
    (newFormData) => {
      // Clone props.formData into localFormData
      localFormData.value = { ...newFormData }

      const { satellite_id, worship_leader } = localFormData.value

      // Only assign default worship leader if not already selected
      if (!worship_leader && satellite_id) {
        const defaultWL = singers.find(
          (singer) => singer.preferred_satellite_id === satellite_id
        )

        if (defaultWL) {
          localFormData.value.worship_leader = defaultWL.id
        }
      }
    },
    {
      deep: false, // ✅ shallow is sufficient if props.formData is fully replaced
      immediate: true,
    }
  )

  watch(
    () => localFormData.value.fixed_band_id,
    (newVal) => {
      const band = fixedBands.find((item) => item.id === newVal)
      if (band) {
        const { pianists, egs, ags, bassists, drummers, others } = band
        Object.assign(localFormData.value, {
          pianists,
          egs,
          ags,
          bassists,
          drummers,
          others,
        })
      }
    }
  )

  watch(
    () => localFormData.value.satellite_id,
    (newVal, oldVal) => {
      if (newVal !== oldVal && localFormData.value.id === 0) {
        slotDateOptions.value = []
        localFormData.value.worship_leader = ''
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
</script>

<template>
  <VDialog
    :width="$vuetify.display.smAndDown ? 'auto' : 900"
    :model-value="props.isDialogVisible"
    @update:model-value="dialogModelValueUpdate"
  >
    <!-- Dialog close btn -->
    <DialogCloseBtn @click="dialogModelValueUpdate(false)" />

    <VCard class="pa-sm-10 pa-2">
      <VCardText>
        <!-- 👉 Title -->
        <h4 class="text-h4 text-center mb-2">
          {{ selectedSat.name }} - Schedule Information
        </h4>
        <p class="text-body-1 text-center mb-6">Edit worship slot schedule.</p>
        <!-- 👉 Form -->
        <VForm
          ref="formRef"
          class="mt-6"
          @submit.prevent="onFormSubmit"
          :disabled="isViewOnly"
        >
          <VRow>
            <!-- 👉 Slot Name -->
            <VCol cols="12" md="6">
              <AppSelect
                v-model="localFormData.slot_name"
                label="Slot Name"
                placeholder="Select Item"
                :items="selectedSat.slots"
                item-value="uuid"
                item-title="title"
                :rules="[requiredValidator]"
                @update:modelValue="onSlotChange"
              />
            </VCol>

            <!-- 👉 Slot Date -->
            <VCol cols="12" md="6">
              <AppSelect
                v-model="localFormData.slot_date"
                label="Slot Date"
                placeholder="Select Item"
                :items="slotDateOptions"
                :rules="[requiredValidator]"
              />
            </VCol>

            <!-- 👉 Worship Leader -->
            <VCol cols="12" md="6">
              <AppAutocomplete
                v-model="localFormData.worship_leader"
                label="Worship Leader"
                placeholder="Select Item"
                :items="worshipLeaderOptions"
                item-title="name"
                item-value="id"
                :rules="[requiredValidator]"
              />
            </VCol>

            <!-- 👉 Key Vox -->
            <VCol cols="12" md="6">
              <AppAutocomplete
                v-model="localFormData.key_vox"
                label="Key Vox"
                placeholder="Select Item"
                :items="keyVox"
                item-title="name"
                item-value="id"
                :rules="[requiredValidator, maxSelectionValidator(6)]"
                closable-chips
                chips
                multiple
                clearable
              />
            </VCol>

            <!-- Display only on create -->
            <template v-if="!isViewOnly">
              <!-- 👉 Switch -->
              <VCol cols="12" md="12">
                <VSwitch
                  v-model="localFormData.is_fixed_band"
                  density="compact"
                  label="Is Fixed Band?"
                />
              </VCol>

              <!-- 👉 Fixed Bands -->
              <VCol v-if="localFormData.is_fixed_band" cols="12" md="12">
                <AppAutocomplete
                  v-model="localFormData.fixed_band_id"
                  label="Band"
                  :items="bandNamesCompiler(fixedBands)"
                  item-title="names"
                  item-value="id"
                />
              </VCol>
            </template>

            <!-- 👉 Keyboardist -->
            <VCol cols="12" md="6">
              <AppAutocomplete
                v-model="localFormData.pianists"
                closable-chips
                chips
                multiple
                label="Keyboardist"
                :items="pianists"
                item-title="name"
                item-value="name"
                :rules="[requiredValidator, maxSelectionValidator(2)]"
                @update:modelValue="handleFixedBand"
              />
            </VCol>

            <!-- 👉 E. Guitarist -->
            <VCol cols="12" md="6">
              <AppAutocomplete
                v-model="localFormData.egs"
                closable-chips
                chips
                multiple
                label="EG"
                :items="egs"
                item-title="name"
                item-value="name"
                :rules="[requiredValidator, maxSelectionValidator(2)]"
                @update:modelValue="handleFixedBand"
              />
            </VCol>

            <!-- 👉 A. Guitarist -->
            <VCol cols="12" md="6">
              <AppAutocomplete
                v-model="localFormData.ags"
                closable-chips
                chips
                multiple
                label="AG"
                :items="ags"
                item-title="name"
                item-value="name"
                :rules="[requiredValidator, maxSelectionValidator(2)]"
                @update:modelValue="handleFixedBand"
              />
            </VCol>

            <!-- 👉 Bassist -->
            <VCol cols="12" md="6">
              <AppAutocomplete
                v-model="localFormData.bassists"
                closable-chips
                chips
                multiple
                label="Bassist"
                :items="bassists"
                item-title="name"
                item-value="name"
                :rules="[requiredValidator, maxSelectionValidator(2)]"
                @update:modelValue="handleFixedBand"
              />
            </VCol>

            <!-- 👉 Drummer -->
            <VCol cols="12" md="6">
              <AppAutocomplete
                v-model="localFormData.drummers"
                closable-chips
                chips
                multiple
                label="Drummer"
                :items="drummers"
                item-title="name"
                item-value="name"
                :rules="[requiredValidator, maxSelectionValidator(2)]"
                @update:modelValue="handleFixedBand"
              />
            </VCol>

            <!-- 👉 Others -->
            <VCol cols="12" md="6">
              <AppAutocomplete
                v-model="localFormData.others"
                closable-chips
                chips
                multiple
                label="Others"
                :items="others"
                item-title="name"
                item-value="name"
                :rules="[maxSelectionValidator(2)]"
                @update:modelValue="handleFixedBand"
              />
            </VCol>

            <!-- 👉 Tech Head -->
            <VCol cols="12" md="6">
              <AppAutocomplete
                v-model="localFormData.tech_head"
                label="Tech Head"
                :items="ths"
                item-title="name"
                item-value="name"
                clearable
              />
            </VCol>

            <!-- 👉 MD -->
            <VCol cols="12" md="6">
              <AppAutocomplete
                v-model="localFormData.md"
                label="MD"
                :items="mds"
                item-title="name"
                item-value="name"
                clearable
              />
            </VCol>

            <!-- 👉 Devotion -->
            <VCol cols="12" md="6">
              <AppAutocomplete
                v-model="localFormData.devotion"
                closable-chips
                chips
                multiple
                label="Devotion"
                :items="compiledNames"
                item-title="name"
                item-value="name"
                :rules="[
                  requiredValidator,
                  maxSelectionValidator(2),
                  checkScheduledNames,
                ]"
              />
            </VCol>

            <!-- 👉 Practice Details -->
            <VCol cols="12" md="6">
              <AppTextField
                v-model="localFormData.remarks"
                :rules="[
                  (v) => !!v || 'Required',
                  (v) => !v || v.length <= 25 || 'Max 25 characters',
                ]"
                counter
                maxlength="25"
                placeholder="Thu 5-9PM"
                hint="This field uses maxlength attribute"
                label="Practice Details"
              />
            </VCol>

            <!-- 👉 Submit and Cancel -->
            <VCol
              cols="12"
              class="d-flex flex-wrap justify-center gap-4"
              v-if="!isViewOnly"
            >
              <VBtn color="secondary" variant="tonal" @click="onFormReset"
                >Clear</VBtn
              >
              <VBtn type="submit">Submit</VBtn>
            </VCol>
          </VRow>
        </VForm>
      </VCardText>
    </VCard>
  </VDialog>
</template>
