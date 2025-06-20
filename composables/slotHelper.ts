// composables/useSlotHelpers.ts
import satellites from '@/database/satellites.json'

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
    return satellites.find(el => el.id == id)
  }

  const bandNamesCompiler = (fixedBands = []) => {
    return fixedBands.map(item => {
      const names = [
        ...item.pianists,
        ...item.ags,
        ...item.egs,
        ...item.drummers,
        ...item.bassists,
        ...item.others,
      ].join(', ')

      return { ...item, names }
    })
  }

  const splitMusicians = (musicians = []) =>
    musicians.length === 1
      ? musicians[0]
      : musicians.join(' & ')

  const mutateData = (schedules = []) => {
    return schedules.map(element => {
      const musiciansObj = JSON.parse(element.musicians || '{}')

      const {
        pianists = [],
        egs = [],
        ags = [],
        bassists = [],
        drummers = [],
        others = [],
      } = musiciansObj

      return {
        id: element.id,
        date_from: element.date_from,
        date_to: element.date_to,
        week: getWeekOfMonth(element.date_from),
        satellite_id: element.satellite_id,
        satellite: findSatellite(element.satellite_id)?.name || '',
        slot_name: element.slot_name,
        pianists,
        egs,
        ags,
        bassists,
        drummers,
        others,
      }
    })
  }

  return {
    getDaysInMonth,
    getWeekOfMonth,
    findSatellite,
    mutateData,
    splitMusicians,
    bandNamesCompiler,
  }
}
