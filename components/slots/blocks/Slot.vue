<script setup lang="ts">
const { slot } = defineProps({
  slot: {
    type: Object,
    required: true,
    default: () => ({
      pianists: [],
      egs: [],
      ags: [],
      bassists: [],
      drummers: [],
      others: [],
    }),
  },
})

const { splitMusicians } = useSlotHelpers()
</script>

<template>
  <table
    class="slot-table"
    width="100%"
  >
    <tbody>
      <tr>
        <td class="bold">
          WL
        </td>
      </tr>
      <tr>
        <td class="row-h60">
          <table
            width="100%"
            class="inner-table"
          >
            <tbody>
              <tr>
                <td width="33%">
&nbsp;
                </td>
                <td width="33%">
&nbsp;
                </td>
                <td width="33%">
&nbsp;
                </td>
              </tr>
              <tr>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
              </tr>
            </tbody>
          </table>
        </td>
      </tr>
      <tr>
        <td>{{ splitMusicians(slot.pianists) || '&nbsp;' }}</td>
      </tr>
      <tr>
        <td>{{ splitMusicians(slot.egs) || '&nbsp;' }}</td>
      </tr>
      <tr>
        <td>{{ splitMusicians(slot.ags) || '&nbsp;' }}</td>
      </tr>
      <tr>
        <td>{{ splitMusicians(slot.bassists) || '&nbsp;' }}</td>
      </tr>
      <tr>
        <td>{{ splitMusicians(slot.drummers) || '&nbsp;' }}</td>
      </tr>
      <tr>
        <td>&nbsp;</td>
      </tr>
      <tr>
        <td>&nbsp;</td>
      </tr>
      <tr>
        <td>&nbsp;</td>
      </tr>
      <tr>
        <td class="italic font-blue practice">
          Thu 5PM-9PM at Main Sanc
        </td>
      </tr>
    </tbody>
  </table>
</template>

<style lang="scss">
.slot-table {
  border: none;
  block-size: 295px;
  border-collapse: collapse;
}

.slot-table td {
  border: 1px solid #333 !important;
}
</style>
