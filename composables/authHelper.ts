import { useApi } from '@/composables/useApi' // or wherever it's defined

export interface LoginForm {
  worker_id: string
  password: string
}

export interface LoggedInUser {
  id: number
  name: string
  email: string
  role: string
}

export const loginUser = async (
  credentials: LoginForm
): Promise<LoggedInUser | null> => {
  const api = useApi()

  try {
    const response = await api('/auth/login', {
      method: 'POST',
      body: credentials,
    })

    return response?.user ?? null
  } catch (err) {
    console.error('Login error:', err)
    return null
  }
}
