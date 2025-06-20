import dayjs from 'dayjs'

// Optional: import plugins you want to use
import localizedFormat from 'dayjs/plugin/localizedFormat'
import relativeTime from 'dayjs/plugin/relativeTime'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'

// Load the plugins
dayjs.extend(relativeTime)
dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(localizedFormat)

// Optional: Set default timezone
dayjs.tz.setDefault('Asia/Manila')

export default defineNuxtPlugin(() => {
  // Inject dayjs globally
  return {
    provide: {
      dayjs,
    },
  }
})
