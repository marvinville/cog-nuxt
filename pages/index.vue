<script setup lang="ts">
  import AuthProvider from '@/views/pages/authentication/AuthProvider.vue'
  import authV1BottomShape from '@images/svg/auth-v1-bottom-shape.svg?raw'
  import authV1TopShape from '@images/svg/auth-v1-top-shape.svg?raw'
  import { VNodeRenderer } from '@layouts/components/VNodeRenderer'
  import { themeConfig } from '@themeConfig'
  import { useRouter } from 'vue-router'
  import { loginUser } from '@/composables/authHelper'

  const router = useRouter()

  definePageMeta({
    layout: 'blank',
    public: true,
  })

  const form = ref({
    username: 'super-user',
    password: 'super123456',
    remember: false,
  })

  const isPasswordVisible = ref(false)

  const errorMessage = ref('')

  const login = async () => {
    try {
      // Fetch the local JSON file
      const response = await fetch('/temp-login.json')
      const users = await response.json()
      const { username, password } = form.value

      // Find the user
      const user = users.find(
        (u: any) => u.username === username && u.password === password
      )

      if (!user) {
        errorMessage.value = 'Invalid username or password.'
        return
      }

      // Save user info in localStorage
      localStorage.setItem('userData', JSON.stringify(user))

      // Redirect to home
      router.push({ name: 'home' })
    } catch (err) {
      console.error(err)
      errorMessage.value = 'Invalid username or password.'
    }
  }

  const requiredValidator = (val: string) => !!val || 'This field is required'
  const minLengthValidator = (val: string) =>
    val.length >= 6 || 'Password must be at least 6 characters'

  const passwordRules = [requiredValidator, minLengthValidator]
</script>

<template>
  <div class="auth-wrapper d-flex align-center justify-center pa-4">
    <div class="position-relative my-sm-16">
      <!-- 👉 Top shape -->
      <VNodeRenderer
        :nodes="h('div', { innerHTML: authV1TopShape })"
        class="text-primary auth-v1-top-shape d-none d-sm-block"
      />

      <!-- 👉 Bottom shape -->
      <VNodeRenderer
        :nodes="h('div', { innerHTML: authV1BottomShape })"
        class="text-primary auth-v1-bottom-shape d-none d-sm-block"
      />

      <!-- 👉 Auth Card -->
      <VCard
        class="auth-card"
        max-width="460"
        :class="$vuetify.display.smAndUp ? 'pa-6' : 'pa-0'"
      >
        <VCardItem class="justify-center">
          <VCardTitle>
            <NuxtLink to="/">
              <div class="app-logo">
                <VNodeRenderer :nodes="themeConfig.app.logo" />
                <h1 class="app-logo-title">
                  {{ themeConfig.app.title }}
                </h1>
              </div>
            </NuxtLink>
          </VCardTitle>
        </VCardItem>

        <VCardText>
          <h4 class="text-h4 mb-1">
            Welcome 👋🏻
            <!-- <span class="text-capitalize">{{ themeConfig.app.title }}</span>! 👋🏻 -->
          </h4>
          <p class="mb-0">
            Please sign-in to your account and start the adventure
          </p>
        </VCardText>

        <VCardText>
          <VForm @submit.prevent="() => {}">
            <VRow>
              <!-- Error Message -->
              <VCol cols="12" v-if="errorMessage">
                <VAlert
                  variant="tonal"
                  color="error"
                  closable
                  close-label="Close Alert"
                >
                  {{ errorMessage }}
                </VAlert>
              </VCol>

              <!-- worker id -->
              <VCol cols="12">
                <AppTextField
                  v-model="form.username"
                  autofocus
                  label="Username"
                  type="text"
                  placeholder="Please type your username"
                  :rules="[requiredValidator]"
                />
              </VCol>

              <!-- password -->
              <VCol cols="12">
                <AppTextField
                  v-model="form.password"
                  label="Password"
                  placeholder="············"
                  :type="isPasswordVisible ? 'text' : 'password'"
                  autocomplete="password"
                  :append-inner-icon="
                    isPasswordVisible ? 'tabler-eye-off' : 'tabler-eye'
                  "
                  @click:append-inner="isPasswordVisible = !isPasswordVisible"
                  :rules="passwordRules"
                />

                <!-- remember me checkbox -->
                <div
                  class="d-flex align-center justify-space-between flex-wrap my-6"
                >
                  <VCheckbox
                    :id="useId()"
                    v-model="form.remember"
                    label="Remember me"
                  />

                  <!-- <NuxtLink
                    class="text-primary"
                    :to="{ name: 'pages-authentication-forgot-password-v1' }"
                  >
                    Forgot Password?
                  </NuxtLink> -->
                </div>

                <!-- login button -->
                <VBtn block type="submit" @click="login"> Login </VBtn>
              </VCol>

              <!-- create account -->
              <!-- <VCol cols="12" class="text-body-1 text-center">
                <span class="d-inline-block"> New on our platform? </span>
                <NuxtLink
                  class="text-primary ms-1 d-inline-block text-body-1"
                  :to="{ name: 'pages-authentication-register-v1' }"
                >
                  Create an account
                </NuxtLink>
              </VCol>

              <VCol cols="12" class="d-flex align-center">
                <VDivider />
                <span class="mx-4 text-high-emphasis">or</span>
                <VDivider />
              </VCol> -->

              <!-- auth providers -->
              <!-- <VCol cols="12" class="text-center">
                <AuthProvider />
              </VCol> -->
            </VRow>
          </VForm>
        </VCardText>
      </VCard>
    </div>
  </div>
</template>

<style lang="scss">
  @use '@core/scss/template/pages/page-auth';
</style>
