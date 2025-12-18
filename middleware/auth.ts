import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router'

export default defineNuxtRouteMiddleware((to: RouteLocationNormalized) => {
  if (process.client) {
    const { isLoggedIn, hasRole } = useUserData()

    // 1️⃣ Block if not logged in
    if (!isLoggedIn()) return navigateTo('/')

    // 2️⃣ Check role if meta.role exists
    const requiredRole = to.meta.role as string | undefined
    if (requiredRole && !hasRole(requiredRole)) {
      // Redirect unauthorized users
      return navigateTo('/not-authorized')
    }
  }
})
