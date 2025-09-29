<script setup lang="ts">
  import { useTheme } from 'vuetify'
  import ScrollToTop from '@core/components/ScrollToTop.vue'
  import initCore from '@core/initCore'
  import { initConfigStore, useConfigStore } from '@core/stores/config'
  import { hexToRgb } from '@core/utils/colorConverter'

  const { global } = useTheme()

  // ℹ️ Sync current theme with initial loader theme
  initCore()
  initConfigStore()

  const configStore = useConfigStore()
  const { isMobile } = useDevice()
  if (isMobile) configStore.appContentLayoutNav = 'vertical'
</script>

<template>
  <VLocaleProvider :rtl="configStore.isAppRTL">
    <VApp
      :style="`--v-global-theme-primary: ${hexToRgb(
        global.current.value.colors.primary
      )}`"
    >
      <NuxtLayout>
        <NuxtPage />
      </NuxtLayout>

      <ScrollToTop />
    </VApp>
  </VLocaleProvider>
</template>
