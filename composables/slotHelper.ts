// composables/useSlotHelpers.ts
import satellites from '@/database/satellites.json'
import type { BasicPerson, Singer } from '@/types/Person' // adjust path based on your project
import type { SlotForm, SlotWorkers } from '@/types/Slot' // adjust path based on your project

export const useSlotHelpers = () => {
  const { $dayjs } = useNuxtApp()

  const getDaysInMonth = ({ schedMonth = 0, schedYear = 0, dayInWeek = 0 }) => {
    const date = new Date(schedYear, schedMonth - 1, 1) // JavaScript months are 0-based

    const slotDays: string[] = []

    while (date.getMonth() === schedMonth - 1) {
      if (date.getDay() === dayInWeek) {
        slotDays.push($dayjs(date).format('MMM D, YYYY'))
      }
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
      const workers = safeParseJSON(slot.workers) ?? {}

      // split out musicians from workers
      const { musicians = {}, ...restWorkers } = workers

      return {
        id: slot.id,
        date_from: slot.date_from,
        date_to: slot.date_to,
        week: getWeekOfMonth(slot.date_from),
        satellite_id: slot.satellite_id,
        satellite: findSatellite(slot.satellite_id)?.name || '',
        slot_name: slot.slot_name,
        remarks: slot.remarks,

        // all other worker-level keys (worship_leader, md, tech_head, etc.)
        ...restWorkers,

        // all musician-level keys (pianists, drummers, etc.)
        ...musicians,
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
    data: BasicPerson[]
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

  /**
   * Filters out items with a blank "name" and sorts the rest alphabetically.
   *
   * @param array - Array of objects with a "name" property.
   * @returns A new sorted array without blank names.
   */
  const sortByName = <T extends { name: string }>(array: T[]): T[] => {
    return array
      .filter((item) => item.name.trim() !== '') // remove blank names
      .sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
      )
  }

  const filterWorshipLeader = (data: Singer[]): Singer[] => {
    return data.filter((elem) => elem.is_worship_leader)
  }

  const buildWorkers = (slot: SlotForm): SlotWorkers => {
    return {
      worship_leader: slot.worship_leader,
      key_vox: slot.key_vox,
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
      band_leader: slot.band_leader,
      key_vox_leader: slot.key_vox_leader,
      fixed_band_id: slot.fixed_band_id,
    }
  }

  // helper to convert IDs → names
  const toNames = (
    ids: number[] = [],
    options: any[] = [],
    leaderId?: number
  ) =>
    ids.map((id) => {
      const name = options.find((elem) => elem.id === id)?.name ?? 'Unknown'

      if (leaderId && id === leaderId) {
        return `<b>*${name}</b>` // bold + asterisk if leader
      }
      return name
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
    sortByName,
    toNames,
  }
}
