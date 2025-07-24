// composables/useSlotHelpers.ts
import satellites from '@/database/satellites.json'
import singers from '@/database/singers.json'
import type { Singer } from '@/types/Person' // adjust path based on your project
import type { SlotForm, SlotWorkers } from '@/types/Slot' // adjust path based on your project

export const useSlotHelpers = () => {
  const { $dayjs } = useNuxtApp()

  const getDaysInMonth = ({ schedMonth, dayInWeek = 0 }) => {
    const month = $dayjs(schedMonth).format('MM')
    const year = $dayjs(schedMonth).format('YYYY')
    const date = new Date(Number(year), Number(month) - 1, 1)

    const slotDays: string[] = []
    while (date.getMonth() === Number(month) - 1) {
      if (date.getDay() === dayInWeek)
        slotDays.push($dayjs(date).format('MMM D, YYYY'))
      date.setDate(date.getDate() + 1)
    }

    return slotDays
  }

  const getWeekOfMonth = (date: string | Date, startOfWeek = 0) => {
    const d = $dayjs(date)
    const firstDay = d.startOf('month')
    const offset = (firstDay.day() - startOfWeek + 7) % 7
    const adjustedDate = d.date() + offset

    return Math.ceil(adjustedDate / 7)
  }

  const findSatellite = (id: number) => {
    return satellites.find((el) => Number(el.id) === id)
  }

  const bandNamesCompiler = (fixedBands = []) => {
    return fixedBands.map((item) => {
      const names = [
        ...item.pianists,
        ...item.ags,
        ...item.egs,
        ...item.bassists,
        ...item.drummers,
        ...item.others,
      ]
        .filter((name) => name?.trim()) // ✅ Remove empty/null/undefined/whitespace
        .join(', ')

      return { ...item, names }
    })
  }

  const splitNames = (names = []) =>
    names.length === 1 ? names[0] : names.join(' & ')

  const safeParseJSON = (json: string | null): any => {
    try {
      return JSON.parse(json || '{}')
    } catch (error) {
      console.error('Invalid JSON in workers field:', error)
      return {}
    }
  }

  const mutateData = (schedules: any[] = []) => {
    return schedules.map((slot) => {
      const workers = safeParseJSON(slot.workers)

      const {
        worship_leader,
        key_vox,
        md,
        tech_head,
        devotion,
        musicians = {},
      } = workers

      const {
        pianists = [],
        egs = [],
        ags = [],
        bassists = [],
        drummers = [],
        others = [],
      } = musicians

      return {
        id: slot.id,
        date_from: slot.date_from,
        date_to: slot.date_to,
        week: getWeekOfMonth(slot.date_from),
        satellite_id: slot.satellite_id,
        satellite: findSatellite(slot.satellite_id)?.name || '',
        slot_name: slot.slot_name,
        worship_leader,
        key_vox,
        pianists,
        egs,
        ags,
        bassists,
        drummers,
        others,
        md,
        tech_head,
        devotion,
        remarks: slot.remarks,
      }
    })
  }

  /**
   * Reorders an array so items with the matching preferred_satellite_id come first.
   *
   * @param {Array} data – Array of objects with `preferred_satellite_id` field.
   * @param {number} preferredId – The ID to prioritize.
   * @returns {Array} – New array with matching items first.
   */
  const prioritizeByPreferredSatelliteId = ({
    data,
    preferredId,
  }: {
    data: Singer
    preferredId: number
  }) => {
    const prioritized = []
    const others = []

    for (const item of data) {
      if (item.preferred_satellite_id === preferredId) {
        prioritized.push(item)
      } else {
        others.push(item)
      }
    }

    return [...prioritized, ...others]
  }

  const filterWorshipLeader = (data: Singer[]): Singer[] => {
    return data.filter((elem) => elem.is_worship_leader)
  }

  const findWL = (id) => {
    return singers.find((elem) => elem.id === id)
  }

  const selectValues = (data = [], ids = []) => {
    const selected: number[] = []

    data.forEach((elem) => {
      if (ids.includes(elem.id)) {
        selected.push(elem)
      }
    })

    return selected
  }

  const buildWorkers = (slot: SlotForm): SlotWorkers => ({
    worship_leader: findWL(slot.worship_leader)?.name,
    key_vox: selectValues(singers, slot.key_vox).map((s) => s.name),
    tech_head: slot.tech_head,
    md: slot.md,
    devotion: slot.devotion,
    musicians: {
      pianists: slot.pianists,
      egs: slot.egs,
      ags: slot.ags,
      bassists: slot.bassists,
      drummers: slot.drummers,
      others: slot.others,
    },
    fixed_band_id: slot.fixed_band_id,
    remarks: slot.remarks,
  })

  return {
    getDaysInMonth,
    getWeekOfMonth,
    findSatellite,
    mutateData,
    splitNames,
    bandNamesCompiler,
    prioritizeByPreferredSatelliteId,
    filterWorshipLeader,
    buildWorkers,
  }
}
