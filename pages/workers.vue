<script setup lang="ts">
  import { ref, onMounted } from 'vue'
  import { useUserData } from '@/composables/user'

  const { user } = useUserData()

  const search = ref('')

  const { $dayjs } = useNuxtApp()

  const api = useApi()

  interface Data {
    id: number
    first_name: string
    last_name: string
    fullName: string
    email: string
    phone: string
    birthdate: string
    age: string
    status: number
  }

  const userList = ref<Data[]>([])
  const editDialog = ref(false)
  const deleteDialog = ref(false)

  const defaultItem = ref<Data>({
    id: -1,
    first_name: '',
    last_name: '',
    fullName: '',
    email: '',
    phone: '',
    birthdate: '',
    age: '',
    status: 1,
  })

  const editedItem = ref<Data>({ ...defaultItem.value })
  const editedIndex = ref(-1)

  const selectedOptions = [
    { text: 'Active', value: 1 },
    { text: 'Inactive', value: 0 },
  ]

  const headers = [
    { title: 'NAME', key: 'fullName', sortable: true },
    { title: 'WORKER ID', key: 'worker_id', sortable: false },
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

      userList.value = response.map((user) => ({
        ...user,
        fullName: `${user.first_name} ${user.last_name}`,
        phone: user.phone || '',
        birthdate: user.birthdate || '',
        age: user.birthdate ? $dayjs().diff(user.birthdate, 'year') : null,
        status: user.status,
      }))
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

  // Edit / Delete
  const editItem = (item: Data) => {
    editedIndex.value = userList.value.indexOf(item)
    editedItem.value = { ...item }
    editDialog.value = true
  }

  const deleteItem = (item: Data) => {
    editedIndex.value = userList.value.indexOf(item)
    editedItem.value = { ...item }
    deleteDialog.value = true
  }

  const close = () => {
    editDialog.value = false
    editedIndex.value = -1
    editedItem.value = { ...defaultItem.value }
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
      if (editedIndex.value > -1) {
        await api(`/users/${editedItem.value.id}`, {
          method: 'PUT',
          body: {
            first_name: editedItem.value.first_name,
            last_name: editedItem.value.last_name,
            email: editedItem.value.email,
            birthdate: editedItem.value.birthdate,
            status: editedItem.value.status,
            updated_by: user.value.id ?? 0,
          },
        })

        // Update local list
        userList.value[editedIndex.value] = { ...editedItem.value }
        editDialog.value = false
      } else {
        userList.value.push(editedItem.value)
      }
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
        <VCardTitle>
          Edit User: {{ editedItem?.first_name }} {{ editedItem?.last_name }}
        </VCardTitle>
        <VCardText>
          <VRow>
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
