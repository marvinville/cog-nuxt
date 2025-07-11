<script setup lang="ts">
  import MainBlock from '@/components/slots/blocks/Main.vue'
  import TitleBlock from '@/components/slots/blocks/Title.vue'

  const { range, schedules } = defineProps({
    range: {
      type: String,
      required: true,
    },
    schedules: {
      type: Array,
      required: true,
    },
  })

  const { getDaysInMonth } = useSlotHelpers()

  const { $dayjs } = useNuxtApp()

  const schedMonth = new Date(`${range}-01`)
  const monthDisplay = $dayjs(schedMonth).format('MMM YYYY')

  const sundaysInMonth = getDaysInMonth({
    schedMonth,
    dayInWeek: 0,
  })

  let colWidth = '22.5%'
  let colNum = '9'

  if (sundaysInMonth.length === 5) {
    colWidth = '18%'
    colNum = '11'
  }

  const findSlots = (sunday, satId) => {
    return schedules.filter((element) => {
      const { date_from, satellite_id } = element
      if (
        $dayjs(date_from).format('YYYY-MM-DD') ===
          $dayjs(sunday).format('YYYY-MM-DD') &&
        satId === satellite_id
      )
        return element
    })
  }
</script>

<template>
  <table width="100%" class="pnw-table">
    <thead>
      <tr class="banner font-white">
        <th :colspan="colNum" width="100%">
          CHURCH OF GOD WORLD MISSIONS PHILIPPINES - DASMARINAS <br />PRAISE AND
          WORSHIP SCHEDULE FOR
          {{ monthDisplay.toUpperCase() }}
        </th>
      </tr>
    </thead>
    <tbody>
      <!-- MAIN ROW -->
      <tr>
        <td width="10%" valign="top">
          <TitleBlock satellite="Main" />
        </td>

        <td
          v-for="(sunday, index) in sundaysInMonth"
          :key="index"
          colspan="2"
          class="mainTd"
          :width="colWidth"
          valign="top"
        >
          <MainBlock :slots="findSlots(sunday, 1)" :slot-date="sunday" />
        </td>
      </tr>

      <!-- JABEZ ROW -->
      <tr>
        <td width="10%" valign="top">
          <TitleBlock satellite="Jabez" />
        </td>

        <td
          v-for="(sunday, index) in sundaysInMonth"
          :key="index"
          colspan="2"
          class="mainTd"
          :width="colWidth"
          valign="top"
        >
          <MainBlock :slots="findSlots(sunday, 2)" :slot-date="sunday" />
        </td>
      </tr>

      <!-- SILANG ROW -->
      <tr>
        <td width="10%" valign="top">
          <TitleBlock satellite="Silang" />
        </td>

        <td
          v-for="(sunday, index) in sundaysInMonth"
          :key="index"
          colspan="2"
          class="mainTd"
          :width="colWidth"
          valign="top"
        >
          <MainBlock :slots="findSlots(sunday, 3)" :slot-date="sunday" />
        </td>
      </tr>

      <!-- TRECE ROW -->
      <tr>
        <td width="10%" valign="top">
          <TitleBlock satellite="Trece" />
        </td>

        <td
          v-for="(sunday, index) in sundaysInMonth"
          :key="index"
          colspan="2"
          class="mainTd"
          :width="colWidth"
          valign="top"
        >
          <MainBlock :slots="findSlots(sunday, 4)" :slot-date="sunday" />
        </td>
      </tr>
    </tbody>
    <tfoot>
      <tr>
        <td class="italic font-white" :colspan="colNum">
          NOTE: Please coordinate the altar call song with the preacher and
          confirm your band and singers for their slots. If you are unable to
          make it to your slot, please inform the Worship Leader, KVL/BL, and
          the schedulers in advance. The schedulers will provide you with a list
          of potential replacements you can reach out to. Thank you. :)
        </td>
      </tr>
    </tfoot>
  </table>
</template>
