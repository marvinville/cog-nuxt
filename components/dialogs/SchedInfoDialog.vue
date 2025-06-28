<script setup lang="ts">
import ags from '@/database/musicians/ags.json'
import bassists from '@/database/musicians/bassists.json'
import drummers from '@/database/musicians/drummers.json'
import egs from '@/database/musicians/egs.json'
import fixedBands from '@/database/musicians/fixed-bands.json'
import pianists from '@/database/musicians/pianists.json'
import singers from '@/database/singers.json'
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
      pianists: [],
      egs: [],
      ags: [],
      drummers: [],
      bassists: [],
      others: [],
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
  findSatellite,
  getDaysInMonth,
  prioritizeByPreferredSatelliteId,
} = useSlotHelpers()

const schedMonth = ref(props.schedMonth)
const localFormData = ref({ ...props.formData })
const fixedBand = ref()
const formRef = ref(null)

const requiredValidator = (v: any) =>
  (v !== null &&
    v !== '' &&
    v !== undefined &&
    !(Array.isArray(v) && v.length === 0)) ||
  'Field is required'

const onFormSubmit = async () => {
  const validator = await formRef.value?.validate()
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
  emit('update:isDialogVisible', false)
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
    pianists: [],
    egs: [],
    ags: [],
    drummers: [],
    bassists: [],
    others: [],
  }
  fixedBand.value = null
}

const maxSelectionValidator = (value: any[]) => {
  return value.length <= 6 || 'You can select up to 6 items only'
}

const allSingers = ref<Singer[]>(singers)
const keyVox = ref<Singer[]>(singers)

watch(
  () => props.formData,
  (newVal) => {
    localFormData.value = { ...newVal }

    const { satellite_id } = localFormData.value

    // Only set default if no worship leader selected yet
    if (!localFormData.value.worship_leader && satellite_id) {
      const defaultWL = singers.find(
        (s) => s.preferred_satellite_id === satellite_id,
      )

      if (defaultWL) {
        localFormData.value.worship_leader = defaultWL.id
      }
    }
  },
  { deep: true, immediate: true },
)

watch(fixedBand, (newVal) => {
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
})

watch(
  () => localFormData.value.slot_name,
  (newVal, oldVal) => {
    const mainSlots = ['AM', 'PM', 'Main Slot', 'Mid Slot']
    if (
      (mainSlots.includes(oldVal) && newVal === 'TWS') ||
      (oldVal === 'TWS' && mainSlots.includes(newVal))
    ) {
      localFormData.value.slot_date = ''
    }
  },
)

watch(
  () => localFormData.value.worship_leader,
  (newVal) => {
    keyVox.value = allSingers.value.filter((elem) => elem.id !== newVal)
  },
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
          {{ findSatellite(localFormData.satellite_id)?.name }} - Schedule
          Information
        </h4>
        <p class="text-body-1 text-center mb-6">Edit worship slot schedule.</p>

        <!-- 👉 Form -->
        <VForm ref="formRef" class="mt-6" @submit.prevent="onFormSubmit">
          <VRow>
            <!-- 👉 Slot Name -->
            <VCol cols="12" md="6">
              <AppSelect
                v-model="localFormData.slot_name"
                label="Slot Name"
                placeholder="Select Item"
                :items="findSatellite(localFormData.satellite_id)?.slots"
                :rules="[requiredValidator]"
              />
            </VCol>

            <!-- 👉 Slot Date -->
            <VCol cols="12" md="6">
              <AppSelect
                v-model="localFormData.slot_date"
                label="Slot Date"
                placeholder="Select Item"
                :items="
                  localFormData.slot_name === 'TWS'
                    ? getDaysInMonth({
                        schedMonth,
                        dayInWeek: 2,
                      })
                    : getDaysInMonth({
                        schedMonth,
                        dayInWeek: 0,
                      })
                "
                :rules="[requiredValidator]"
              />
            </VCol>

                        <!-- 👉 Worship Leader -->
            <VCol cols="12" md="6">
              <AppSelect
                v-model="localFormData.worship_leader"
                label="Worship Leader"
                placeholder="Select Item"
                :items="
                  prioritizeByPreferredSatelliteId({
                    data: singers.filter((elem) => elem.is_worship_leader),
                    preferredId: localFormData.satellite_id,
                  })
                "
                item-title="name"
                item-value="id"
                :rules="[requiredValidator]"
              />
            </VCol>

            <!-- 👉 Key Vox -->
            <VCol cols="12" md="6">
              <AppSelect
                v-model="localFormData.key_vox"
                label="Key Vox"
                placeholder="Select Item"
                :items="keyVox"
                item-title="name"
                item-value="id"
                :rules="[requiredValidator, maxSelectionValidator]"
                closable-chips
                chips
                multiple
              />
            </VCol>

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
              <AppSelect
                v-model="fixedBand"
                label="Band"
                :items="bandNamesCompiler(fixedBands)"
                item-title="names"
                item-value="id"
              />
            </VCol>

            <!-- 👉 Keyboardist -->
            <VCol cols="12" md="6">
              <AppSelect
                v-model="localFormData.pianists"
                closable-chips
                chips
                multiple
                label="Keyboardist"
                :items="pianists"
                item-title="name"
                item-value="name"
              />
            </VCol>

            <!-- 👉 E. Guitarist -->
            <VCol cols="12" md="6">
              <AppSelect
                v-model="localFormData.egs"
                closable-chips
                chips
                multiple
                label="EG"
                :items="egs"
                item-title="name"
                item-value="name"
              />
            </VCol>

            <!-- 👉 A. Guitarist -->
            <VCol cols="12" md="6">
              <AppSelect
                v-model="localFormData.ags"
                closable-chips
                chips
                multiple
                label="AG"
                :items="ags"
                item-title="name"
                item-value="name"
              />
            </VCol>

            <!-- 👉 Bassist -->
            <VCol cols="12" md="6">
              <AppSelect
                v-model="localFormData.bassists"
                closable-chips
                chips
                multiple
                label="Bassist"
                :items="bassists"
                item-title="name"
                item-value="name"
              />
            </VCol>

            <!-- 👉 Drummer -->
            <VCol cols="12" md="6">
              <AppSelect
                v-model="localFormData.drummers"
                closable-chips
                chips
                multiple
                label="Drummer"
                :items="drummers"
                item-title="name"
                item-value="name"
              />
            </VCol>

            <!-- 👉 Others -->
            <!--
              <VCol cols="12" md="6">
              <AppSelect
              closable-chips
              chips
              multiple
              label="Others"
              :items="others"
              item-title="name"
              item-value="name"
              v-model="localFormData.others"
              />
              </VCol>
            -->

            <!-- 👉 Submit and Cancel -->
            <VCol cols="12" class="d-flex flex-wrap justify-center gap-4">
              <VBtn color="secondary" variant="tonal" @click="onFormReset"
                >Cancel</VBtn
              >
              <VBtn type="submit">Submit</VBtn>
            </VCol>
          </VRow>
        </VForm>
      </VCardText>
    </VCard>
  </VDialog>
</template>
