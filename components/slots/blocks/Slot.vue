<script setup lang="ts">
  interface Slot {
    worship_leader: string
    key_vox: string[]
    pianists: string[]
    egs: string[]
    ags: string[]
    bassists: string[]
    drummers: string[]
    others: string[]
    tech_head: string
    md: string
    devotion: string[]
  }

  const props = defineProps<{ slot: Slot }>()

  const { slot } = props

  const { splitNames } = useSlotHelpers()

  // Split the array into chunks of 3 for the rows
  const chunkArray = (arr: string[], chunkSize: number): string[][] => {
    const result: string[][] = []
    for (let i = 0; i < arr.length; i += chunkSize) {
      result.push(arr.slice(i, i + chunkSize))
    }
    return result
  }

  const nameChunks = computed(() => chunkArray(slot.key_vox, 3))
</script>

<template>
  <table class="slot-table" width="100%">
    <tbody>
      <tr>
        <td class="bold">{{ slot.worship_leader }}</td>
      </tr>

      <tr>
        <td class="row-multi-block">
          <table width="100%" class="inner-table">
            <tbody>
              <tr v-for="(row, rowIndex) in nameChunks" :key="rowIndex">
                <td v-for="(name, colIndex) in row" :key="colIndex" width="33%">
                  {{ name || '\u00A0' }}
                </td>
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
        <td v-html="splitNames(slot.pianists) || '&nbsp;'"></td>
      </tr>
      <tr>
        <td v-html="splitNames(slot.egs) || '&nbsp;'"></td>
      </tr>
      <tr>
        <td v-html="splitNames(slot.ags) || '&nbsp;'"></td>
      </tr>
      <tr>
        <td v-html="splitNames(slot.bassists) || '&nbsp;'"></td>
      </tr>
      <tr>
        <td v-html="splitNames(slot.drummers) || '&nbsp;'"></td>
      </tr>

      <tr>
        <td v-html="slot.tech_head || '&nbsp;'"></td>
      </tr>
      <tr>
        <td v-html="slot.md || '&nbsp;'"></td>
      </tr>
      <tr>
        <td v-html="splitNames(slot.devotion) || '&nbsp;'"></td>
      </tr>

      <tr>
        <td class="italic font-blue practice">Thu 5PM-9PM at Main Sanc</td>
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

  .slot-table td {
    border: 1px solid #333 !important;
  }
</style>
