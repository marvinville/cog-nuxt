// composables/useSlotHelpers.ts
import satellites from '@/database/satellites.json'
import type { BasicPerson, Singer, Musician } from '@/types/Person' // adjust path based on your project
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
      key_vocals: {
        soprano: slot.soprano,
      },
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

  const getMusiciansByInstrument = (
    musicians: Musician[],
    instrument: string
  ): Musician[] => musicians.filter((m) => m.instrument === instrument)

  /**
   * Sort slot objects by `date_from`.
   *
   * @param {Array} slots - The array of slot objects.
   * @param {string} order - 'asc' for ascending, 'desc' for descending.
   * @returns {Array} Sorted array of slot objects.
   */
  const sortSlots = (slots: any[], order: 'asc' | 'desc' = 'asc') => {
    return [...slots].sort((a, b) => {
      const dateA = new Date(a.date_from).getTime()
      const dateB = new Date(b.date_from).getTime()

      return order === 'desc' ? dateB - dateA : dateA - dateB
    })
  }

  const compileWorkersWithConflicts = (conflicts: []) => {
    return conflicts.flatMap((slot) => {
      const selectedWorkers = JSON.parse(slot.workers)

      const { worship_leader, key_vox, md, tech_head } = selectedWorkers
      const { ags, bassists, drummers, egs, others, pianists } =
        selectedWorkers.musicians

      const allIds = [
        ...ags,
        ...bassists,
        ...drummers,
        ...egs,
        ...others,
        ...pianists,
        ...(Array.isArray(key_vox) ? key_vox : [key_vox]),
        worship_leader,
        md,
        tech_head,
      ].filter(Boolean) // remove null/empty

      const satellite = satellites.find((elem) => elem.id === slot.satellite_id)

      return allIds.map((id) => ({
        workerId: id,
        slotName: slot.slot_name,
        satelliteName: satellite?.name || '',
      }))
    })
  }

  const checkWorkerConflicts = (workers, conflicts) => {
    // flatten out conflicts to an array of { workerId, ...slot }
    const conflictEntries = compileWorkersWithConflicts(conflicts)

    return workers.map((elem) => {
      const { id, name, ...rest } = elem

      // find all conflicts for this worker
      const conflictsForWorker = conflictEntries.filter(
        (c) => c.workerId === id
      )

      return {
        id,
        name,
        title: name,
        ...rest,
        disabled: conflictsForWorker.length > 0,
        conflictText: conflictsForWorker.map(
          (c) => `Already in ${c.satelliteName} - ${c.slotName}`
        ),
      }
    })
  }

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
    getMusiciansByInstrument,
    sortSlots,
    compileWorkersWithConflicts,
    checkWorkerConflicts,
  }
}
