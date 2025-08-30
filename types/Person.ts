// types.ts
export interface BasicPerson {
  id: number
  name: string
  preferred_satellite_id: number
  role: 'singer' | 'tech_head' | 'md' | 'musician'
}

export interface Singer extends BasicPerson {
  is_worship_leader: boolean
}

export interface Musician extends BasicPerson {
  instrument: string
}
