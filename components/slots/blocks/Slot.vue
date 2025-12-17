<script setup lang="ts">
  import users from '@/database/users.json'

  interface Slot {
    worship_leader: number
    key_vocals: {
      soprano: number
      alto: number
      tenor: number
      bass: number
      male_melody: number
      female_melody: number
    }
    pianists: number[]
    egs: number[]
    ags: number[]
    bassists: number[]
    drummers: number[]
    others: number[]
    tech_head: number
    md: number
    devotion: number[]
    band_leader: number
    key_vox_leader: number
    remarks: string
  }

  const props = defineProps<{ slot: Slot }>()

  const { slot } = props

  const {
    pianists,
    egs,
    ags,
    bassists,
    drummers,
    others,
    tech_head,
    md,
    worship_leader,
    key_vocals,
    band_leader,
    key_vox_leader,
    devotion,
  } = slot

  const { soprano, alto, tenor, bass, male_melody, female_melody } = key_vocals

  const { splitNames, toNames } = useSlotHelpers()

  const selectedWorkerIds = [
    ...pianists,
    ...egs,
    ...ags,
    ...bassists,
    ...drummers,
    ...others,
    ...[soprano, alto, tenor, bass, male_melody, female_melody],
    ...[worship_leader],
    ...[tech_head],
    ...[md],
  ]

  const workersPool = selectedWorkerIds.map((id) => {
    const user = users.find((u) => u.id === id)
    return user
  })

  const slotNames = {
    pianists: toNames(pianists, workersPool, band_leader),
    egs: toNames(egs, workersPool, band_leader),
    ags: toNames(ags, workersPool, band_leader),
    bassists: toNames(bassists, workersPool, band_leader),
    drummers: toNames(drummers, workersPool, band_leader),
    others: toNames(others, workersPool, band_leader),
    wl: toNames([worship_leader], workersPool),
    th: toNames([tech_head], workersPool),
    md: toNames([md], workersPool),
    keyVox: toNames(
      [soprano, alto, tenor, bass, male_melody, female_melody],
      workersPool,
      key_vox_leader
    ),
    devotion: toNames(devotion, workersPool),
  }

  // Split the array into chunks of 3 for the rows
  const chunkArray = (arr: string[], chunkSize: number): string[][] => {
    const result: string[][] = []
    for (let i = 0; i < arr.length; i += chunkSize) {
      result.push(arr.slice(i, i + chunkSize))
    }
    return result
  }

  const nameChunks = computed(() => chunkArray(slotNames.keyVox, 3))
</script>

<template>
  <table class="slot-table" width="100%">
    <tbody>
      <tr>
        <td class="bold">{{ splitNames(slotNames.wl) }}</td>
      </tr>

      <tr>
        <td class="row-multi-block">
          <table width="100%" class="inner-table">
            <tbody>
              <tr v-for="(row, rowIndex) in nameChunks" :key="rowIndex">
                <td
                  v-for="(name, colIndex) in row"
                  :key="colIndex"
                  width="33%"
                  v-html="name || '&nbsp;'"
                ></td>
                <!-- Fill empty columns if row has less than 3 items -->
                <td v-for="n in 3 - row.length" :key="'empty-' + n" width="33%">
                  &nbsp;
                </td>
              </tr>
            </tbody>
          </table>
        </td>
      </tr>

      <tr>
        <td v-html="splitNames(slotNames.pianists) || '&nbsp;'"></td>
      </tr>
      <tr>
        <td v-html="splitNames(slotNames.egs) || '&nbsp;'"></td>
      </tr>
      <tr>
        <td v-html="splitNames(slotNames.ags) || '&nbsp;'"></td>
      </tr>
      <tr>
        <td v-html="splitNames(slotNames.bassists) || '&nbsp;'"></td>
      </tr>
      <tr>
        <td v-html="splitNames(slotNames.drummers) || '&nbsp;'"></td>
      </tr>

      <tr>
        <td v-html="splitNames(slotNames.others) || '&nbsp;'"></td>
      </tr>

      <tr>
        <td v-html="splitNames(slotNames.th) || '&nbsp;'"></td>
      </tr>
      <tr>
        <td v-html="slotNames.md || '&nbsp;'"></td>
      </tr>
      <tr>
        <td v-html="splitNames(slotNames.devotion) || '&nbsp;'"></td>
      </tr>

      <tr>
        <td class="italic font-blue practice">{{ slot.remarks }}</td>
      </tr>
    </tbody>
  </table>
</template>

<style lang="scss">
  .slot-table {
    border: none;
    block-size: 295px;
    border-collapse: collapse;
    font-size: small;
  }
</style>
