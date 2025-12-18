<script setup lang="ts">
  import { ref, onMounted } from 'vue'
  import { useUserData } from '@/composables/user'
  import roles from '@/database/roles.json'

  definePageMeta({
    middleware: 'auth',
    role: 'super_user',
  })

  const { user } = useUserData()

  const search = ref('')

  const { $dayjs } = useNuxtApp()

  const api = useApi()

  interface Data {
    id: number
    first_name: string
    last_name: string
    worker_id: string
    password: string
    fullName: string
    email: string
    phone: string
    birthdate: string
    age: string
    role_id: number
    status: number
    action?: string
  }

  const userList = ref<Data[]>([])
  const editDialog = ref(false)
  const deleteDialog = ref(false)

  const defaultItem = ref<Data>({
    id: -1,
    first_name: '',
    last_name: '',
    worker_id: '',
    password: '',
    fullName: '',
    email: '',
    phone: '',
    birthdate: '',
    age: '',
    role_id: 0,
    status: 1,
    action: '',
  })

  const editedItem = ref<Data>({ ...defaultItem.value })
  const editedIndex = ref(-1)

  const selectedOptions = [
    { text: 'Active', value: 1 },
    { text: 'Inactive', value: 0 },
  ]

  const headers = [
    { title: 'NAME', key: 'fullName', sortable: true },
    { title: 'WORKER ID', key: 'worker_id', sortable: true },
    { title: 'PHONE', key: 'phone', sortable: false },
    { title: 'BIRTHDATE', key: 'birthdate', sortable: true },
    { title: 'AGE', key: 'age', sortable: true },
    { title: 'STATUS', key: 'status', sortable: false },
    { title: 'ACTIONS', key: 'actions', sortable: false },
  ]

  const resolveStatusVariant = (status: number) => {
    if (status === 1) return { color: 'success', text: 'Active' }
    else return { color: 'error', text: 'Inactive' }
  }

  // ✅ Fetch users from backend
  const fetchUsers = async () => {
    try {
      const response = await api('/users') // or '/users' if mounted directly

      userList.value = response.map((user) => {
        const { password, ...rest } = user // exclude password

        return {
          ...rest,
          fullName: `${user.first_name} ${user.last_name}`,
          worker_id: user.worker_id
            ? String(user.worker_id).padStart(4, '0')
            : '',
          phone: user.phone || '',
          birthdate: user.birthdate
            ? $dayjs(user.birthdate).format('YYYY-MM-DD')
            : '',
          age: user.birthdate ? $dayjs().diff(user.birthdate, 'year') : null,
          status: user.status,
        }
      })
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  // Auto compute age from birthdate
  const updateAge = () => {
    if (!editedItem.value.birthdate) {
      editedItem.value.age = ''
      return
    }
    const [year, month, day] = editedItem.value.birthdate.split('-').map(Number)
    if (!year || !month || !day) return
    const today = new Date()
    let age = today.getFullYear() - year
    if (
      today.getMonth() + 1 < month ||
      (today.getMonth() + 1 === month && today.getDate() < day)
    ) {
      age--
    }
    editedItem.value.age = age.toString()
  }

  // Email validation rule
  const validateEmail = (value: string) => {
    if (!value) return 'Email is required'
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return regex.test(value) ? true : 'Invalid email address'
  }

  const validateBirthdate = (value: string) => {
    if (!value || value.trim() === '') return true // empty is allowed
    const regex = /^\d{4}-\d{2}-\d{2}$/
    return regex.test(value) ? true : 'Birthdate must be in YYYY-MM-DD format'
  }

  const requiredValidator = (value: string) => {
    return value ? true : 'This field is required'
  }

  // Password visibility toggles
  const showPassword = ref(false)
  const showConfirmPassword = ref(false)

  const minLengthValidator = (v: string) =>
    !v || v.length >= 6 || 'Password must be at least 6 characters'
  const matchPasswordValidator = (v: string) =>
    v === editedItem.value?.password || 'Passwords do not match'

  // Edit Password
  const editPassword = (item: Data) => {
    editedIndex.value = userList.value.indexOf(item)
    editedItem.value = { ...item, action: 'password' }
    console.log(editedItem.value)
    editDialog.value = true
  }

  // Edit / Delete
  const editItem = (item: Data) => {
    editedIndex.value = userList.value.indexOf(item)
    editedItem.value = { ...item, action: 'edit' }
    editDialog.value = true
  }

  const deleteItem = (item: Data) => {
    editedIndex.value = userList.value.indexOf(item)
    editedItem.value = { ...item, action: 'delete' }
    deleteDialog.value = true
  }

  const close = () => {
    // Restore editedItem to the original data
    if (editedIndex.value !== -1) {
      editedItem.value = { ...userList.value[editedIndex.value] }
    } else {
      editedItem.value = { ...defaultItem.value } // fallback for new item
    }

    // Reset the form validation so errors disappear
    editForm.value?.resetValidation()

    // Close dialog and reset index
    editDialog.value = false
    editedIndex.value = -1
  }

  const closeDelete = () => {
    deleteDialog.value = false
    editedIndex.value = -1
    editedItem.value = { ...defaultItem.value }
  }

  const editForm = ref(null)
  const save = async () => {
    const validator = await editForm.value?.validate()

    if (!validator.valid) {
      console.log('Form has errors')
      return
    }

    try {
      // Check if we are editing password/role
      if (editedItem.value.action === 'password') {
        const trimmedWorkerId = String(Number(editedItem.value.worker_id)) // "0029" -> "29"

        await api('/auth/update', {
          method: 'PUT',
          body: {
            worker_id: trimmedWorkerId,
            password: editedItem.value.password,
            role_id: editedItem.value.role_id,
          },
        })
        // Optionally update local user list
        const index = userList.value.findIndex(
          (u) => u.worker_id === editedItem.value.worker_id
        )
        if (index > -1) {
          userList.value[index] = {
            ...userList.value[index],
            role_id: editedItem.value.role_id,
          }
        }
      } else if (editedItem.value.action === 'edit') {
        // Regular user info update
        await api(`/users/${editedItem.value.id}`, {
          method: 'PUT',
          body: {
            first_name: editedItem.value.first_name,
            last_name: editedItem.value.last_name,
            email: editedItem.value.email,
            birthdate: editedItem.value.birthdate,
            phone: editedItem.value.phone,
            status: editedItem.value.status,
            updated_by: user.value.id ?? 0,
          },
        })

        // Update local list
        userList.value[editedIndex.value] = {
          ...editedItem.value,
          fullName: `${editedItem.value.first_name} ${editedItem.value.last_name}`,
        }
      } else {
        // New user
        userList.value.push(editedItem.value)
      }

      editDialog.value = false
    } catch (err) {
      console.error('Update failed', err)
    } finally {
      close()
    }
  }

  const deleteItemConfirm = () => {
    userList.value.splice(editedIndex.value, 1)
    closeDelete()
  }

  onMounted(() => {
    fetchUsers()
  })
</script>
<template>
  <div>
    <!-- 👉 Search Field -->
    <VCardText>
      <VRow>
        <VCol cols="12" offset-md="8" md="4">
          <AppTextField
            v-model="search"
            placeholder="Search ..."
            append-inner-icon="tabler-search"
            single-line
            hide-details
            dense
            outlined
          />
        </VCol>
      </VRow>
    </VCardText>
    <!-- 👉 Datatable -->
    <VDataTable
      :headers="headers"
      :items="userList"
      :search="search"
      :items-per-page="15"
      class="elevation-1"
    >
      <!-- full name -->
      <template #item.fullName="{ item }">
        <div class="d-flex align-center">
          <!-- avatar -->
          <VAvatar
            size="32"
            :color="item.avatar ? '' : 'primary'"
            :class="item.avatar ? '' : 'v-avatar-light-bg primary--text'"
            :variant="!item.avatar ? 'tonal' : undefined"
          >
            <VImg v-if="item.avatar" :src="item.avatar" />
            <span v-else>{{ avatarText(item.fullName) }}</span>
          </VAvatar>

          <div class="d-flex flex-column ms-3 text-start">
            <span
              class="d-block font-weight-medium text-high-emphasis text-truncate"
            >
              {{ item.fullName }}
            </span>
            <small>{{ item.email }}</small>
          </div>
        </div>
      </template>

      <!-- email -->
      <template #item.email="{ item }">
        <div class="text-start">{{ item.email }}</div>
      </template>

      <!-- phone -->
      <template #item.phone="{ item }">
        <div class="text-start">{{ item.phone }}</div>
      </template>

      <!-- birthdate -->
      <template #item.birthdate="{ item }">
        <div class="text-start">{{ item.birthdate }}</div>
      </template>

      <!-- age -->
      <template #item.age="{ item }">
        <div class="text-start">{{ item.age }}</div>
      </template>

      <!-- status -->
      <template #item.status="{ item }">
        <div class="text-center">
          <VChip :color="resolveStatusVariant(item.status).color" size="small">
            {{ resolveStatusVariant(item.status).text }}
          </VChip>
        </div>
      </template>

      <!-- actions -->
      <template #item.actions="{ item }">
        <div class="d-flex justify-start gap-1">
          <IconBtn @click="editItem(item)">
            <VIcon icon="tabler-edit" />
          </IconBtn>
          <IconBtn @click="editPassword(item)">
            <VIcon icon="tabler-lock" />
          </IconBtn>
          <IconBtn @click="deleteItem(item)">
            <VIcon icon="tabler-trash" />
          </IconBtn>
        </div>
      </template>
    </VDataTable>
  </div>

  <!-- 👉 Edit Dialog -->
  <VDialog v-model="editDialog" max-width="600px">
    <VForm ref="editForm" @submit.prevent="save">
      <VCard>
        <!-- Dynamic Title -->
        <VCardTitle> Edit User: {{ editedItem?.worker_id }} </VCardTitle>
        <VCardText>
          <!-- Edit Form -->
          <VRow v-if="editedItem.action === 'edit'">
            <!-- First Name -->
            <VCol cols="12" sm="6">
              <AppTextField
                v-model="editedItem.first_name"
                label="First Name"
                :rules="[requiredValidator]"
              />
            </VCol>

            <!-- Last Name -->
            <VCol cols="12" sm="6">
              <AppTextField
                v-model="editedItem.last_name"
                label="Last Name"
                :rules="[requiredValidator]"
              />
            </VCol>

            <!-- Email -->
            <VCol cols="12" sm="6">
              <AppTextField
                v-model="editedItem.email"
                label="Email"
                :rules="[validateEmail]"
              />
            </VCol>

            <!-- Phone -->
            <VCol cols="12" sm="6">
              <AppTextField v-model="editedItem.phone" label="Phone" />
            </VCol>

            <!-- Birthdate -->
            <VCol cols="12" sm="6">
              <AppTextField
                v-model="editedItem.birthdate"
                label="Birthdate (YYYY-MM-DD)"
                placeholder="2018-09-25"
                :rules="[validateBirthdate]"
                @update:model-value="updateAge"
              />
            </VCol>

            <!-- Age (auto-computed) -->
            <VCol cols="12" sm="6">
              <AppTextField
                v-model="editedItem.age"
                label="Age"
                type="number"
                readonly
              />
            </VCol>

            <!-- Status -->
            <VCol cols="12" sm="6">
              <AppSelect
                v-model="editedItem.status"
                :items="selectedOptions"
                item-title="text"
                item-value="value"
                label="Status"
              />
            </VCol>
          </VRow>

          <!-- Password Form -->
          <VRow v-else-if="editedItem.action === 'password'">
            <!-- Worker ID -->
            <VCol cols="12" sm="6">
              <AppTextField
                v-model="editedItem.worker_id"
                label="Worker ID"
                disabled
              />
            </VCol>

            <!-- Role Dropdown -->
            <VCol cols="12" sm="6">
              <AppSelect
                v-model="editedItem.role_id"
                label="Role"
                :items="roles"
                item-title="label"
                item-value="id"
                :rules="[requiredValidator]"
              />
            </VCol>

            <!-- Password -->
            <VCol cols="12" sm="6">
              <AppTextField
                v-model="editedItem.password"
                :type="showPassword ? 'text' : 'password'"
                label="New Password"
                :append-inner-icon="
                  showPassword ? 'tabler-eye' : 'tabler-eye-off'
                "
                @click:append-inner="showPassword = !showPassword"
                :rules="[requiredValidator, minLengthValidator]"
              />
            </VCol>

            <!-- Confirm Password -->
            <VCol cols="12" sm="6">
              <AppTextField
                v-model="editedItem.confirmPassword"
                :type="showConfirmPassword ? 'text' : 'password'"
                label="Confirm Password"
                :append-inner-icon="
                  showConfirmPassword ? 'tabler-eye' : 'tabler-eye-off'
                "
                @click:append-inner="showConfirmPassword = !showConfirmPassword"
                :rules="[requiredValidator, matchPasswordValidator]"
              />
            </VCol>
          </VRow>
        </VCardText>

        <VCardText>
          <div class="d-flex justify-end gap-4">
            <VBtn color="error" variant="outlined" @click="close">Cancel</VBtn>
            <VBtn color="success" variant="elevated" type="submit">Save</VBtn>
          </div>
        </VCardText>
      </VCard>
    </VForm>
  </VDialog>

  <!-- 👉 Delete Dialog -->
  <VDialog v-model="deleteDialog" max-width="500px">
    <VCard title="Are you sure you want to delete this user?">
      <VCardText>
        <div class="d-flex justify-center gap-4">
          <VBtn color="error" variant="outlined" @click="closeDelete">
            Cancel
          </VBtn>
          <VBtn color="success" variant="elevated" @click="deleteItemConfirm">
            OK
          </VBtn>
        </div>
      </VCardText>
    </VCard>
  </VDialog>
</template>
