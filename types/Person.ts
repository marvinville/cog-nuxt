// types.ts
export interface BasicPerson {
  id: number
  name: string
}

export interface Singer extends BasicPerson {
  preferred_satellite_id: number
  is_worship_leader: boolean
}

export interface Musician extends BasicPerson {
  instrument: string
}
