export type SlotForm = {
  id: number
  satellite_id: number | string
  worship_leader: string
  pianists: any[]
  egs: any[]
  ags: any[]
  drummers: any[]
  bassists: any[]
  others: any[]
  slot_date: string
  slot_name: string
  key_vox: string[]
  tech_head: string
  md: string
  devotion: string[]
  remarks: string
  fixed_band_id: number | null
}

// 👥 Workers inside the slot
export type SlotWorkers = {
  worship_leader: string | undefined
  key_vox: string[]
  tech_head: string
  md: string
  devotion: string[]
  musicians: {
    pianists: any[]
    egs: any[]
    ags: any[]
    bassists: any[]
    drummers: any[]
    others: any[]
  }
  fixed_band_id: number | null
  remarks: string
}

// 📅 Main schedule slot item
export type ScheduleSlot = {
  id: number
  satellite_id: number
  slot_name: string
  date_from: string
  date_to: string
  is_sunday_slot: number
  remarks: string
  created_by: number
  created_at: string
  updated_by: number | null
  updated_at: string | null
  deleted_at: string | null
  workers: string // 👈 originally a JSON string from backend
}

// 👨‍💻 Optional: Parsed version
export type ScheduleSlotParsed = Omit<ScheduleSlot, 'workers'> & {
  workers: SlotWorkers
}
