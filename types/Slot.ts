export type SlotForm = {
  id: number
  satellite_id: number
  worship_leader: number
  pianists: number[]
  egs: number[]
  ags: number[]
  drummers: number[]
  bassists: number[]
  others: number[]
  band_leader: number
  slot_date: string
  slot_name: string
  slot_uuid: string
  soprano: number
  alto: number
  tenor: number
  bass: number
  male_melody: number
  female_melody: number
  key_vox_leader: number
  tech_head: number
  md: number
  devotion: number[]
  remarks: string
  fixed_band_id: number | null
  created_by: number
}

// 👥 Workers inside the slot
export type SlotWorkers = {
  worship_leader: number
  key_vocals: {
    soprano: number
    alto: number
    tenor: number
    bass: number
    male_melody: number
    female_melody: number
  }
  tech_head: number
  md: number
  devotion: number[]
  musicians: {
    pianists: number[]
    egs: number[]
    ags: number[]
    bassists: number[]
    drummers: number[]
    others: number[]
  }
  band_leader: number
  key_vox_leader: number
  fixed_band_id: number | null
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
