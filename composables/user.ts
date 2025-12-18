export const useUserData = () => {
  const user = ref<any>(null)

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

  const isLoggedIn = () => !!user.value

  const hasRole = (role: string) => user.value?.role === role

  // ✅ Ability check based on role
  const can = (action?: string, subject?: string) => {
    if (!user.value) return false

    // super_user can do everything
    if (user.value.role === 'super_user') return true

    // admin can do everything except manage Workers
    if (user.value.role === 'admin') {
      if (action === 'manage' && subject === 'Workers') return false
      return true
    }

    // default deny
    return false
  }

  return { user, setUser, clearUser, isLoggedIn, hasRole, can }
}
