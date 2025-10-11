export const useUserData = () => {
  const user = ref<any>(null)

  // Load user from localStorage (client-side)
  if (process.client) {
    const storedUser = localStorage.getItem('userData')
    if (storedUser) user.value = JSON.parse(storedUser)
  }

  const setUser = (data: any) => {
    if (process.client) {
      localStorage.setItem('userData', JSON.stringify(data))
      user.value = data
    }
  }

  const clearUser = () => {
    if (process.client) {
      localStorage.removeItem('userData')
      user.value = null
    }
  }

  return { user, setUser, clearUser }
}
