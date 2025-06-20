import { defu } from 'defu'

export const useApi = () => {
  const config = useRuntimeConfig()
  const accessToken = useCookie('accessToken')

  return async <T = any>(
    url: string,
    options: Partial<FetchOptions<'json'>> = {},
  ): Promise<T> => {
    const defaults: FetchOptions<'json'> = {
      baseURL: config.public.apiBaseUrl,
      headers: accessToken.value
        ? { Authorization: `Bearer ${accessToken.value}` }
        : {},
    }

    const mergedOptions = defu(options, defaults)

    return await $fetch<T>(url, mergedOptions)
  }
}
