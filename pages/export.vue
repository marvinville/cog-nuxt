<script setup lang="ts">
  // Page config
  // Imports
  import { onMounted, ref } from 'vue'
  import html2canvas from 'html2canvas'
  import jsPDF from 'jspdf'
  import Export from '@/components/slots/Export.vue'

  import { useRouter } from 'vue-router'

  const router = useRouter() // add this at the top

  const { mutateData } = useSlotHelpers()

  definePageMeta({
    layout: 'blank',
  })

  // if converted to composable
  const api = useApi()

  const route = useRoute()
  const year = computed(() => Number(route.query.year)) // if using query
  const month = computed(() => Number(route.query.month))

  let exampleDate = ''
  let selectedYear = year.value || null
  let selectedMonth = month.value || null

  if (selectedYear && selectedMonth) {
    let monthString = selectedMonth.toString()

    // add lead zero to month 1-9
    if (selectedMonth < 10) {
      monthString = `0${selectedMonth.toString()}`
    }

    exampleDate = `${selectedYear}-${monthString}-01`
  }

  // PDF settings
  const { $dayjs } = useNuxtApp()

  const rangeTitle = $dayjs(exampleDate).format('MMM YYYY')
  const timestamp = $dayjs().format('YYYYMMDD_HHmm') // e.g. '20250922_125704'
  const pdfName = `PNW_Schedule_${rangeTitle}_${timestamp}`

  // Refs
  const pdfContent = ref<HTMLElement | null>(null)
  const schedules = ref([])
  const dataIsReady = ref(false)

  // Fetch schedules
  const fetchData = async () => {
    dataIsReady.value = false
    try {
      const res = await api('/slots')

      if (!res) {
        console.warn('No data returned')

        return
      }

      schedules.value = mutateData(res)
    } catch (err) {
      console.error('API request failed:', err)
    } finally {
      dataIsReady.value = true
    }
  }

  // Generate PDF
  const generatePdf = async () => {
    if (!pdfContent.value) return

    const element = pdfContent.value

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      scrollY: -window.scrollY,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
    })

    const imgData = canvas.toDataURL('image/png')

    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'legal',
    })

    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()

    const imgProps = pdf.getImageProperties(imgData)
    const pxToMm = 0.264583
    const imgWidthMm = imgProps.width * pxToMm
    const imgHeightMm = imgProps.height * pxToMm

    const scale = Math.min(pageWidth / imgWidthMm, pageHeight / imgHeightMm)
    const finalWidth = imgWidthMm * scale
    const finalHeight = imgHeightMm * scale
    const marginX = (pageWidth - finalWidth) / 2
    const marginY = (pageHeight - finalHeight) / 2

    pdf.addImage(imgData, 'PNG', marginX, marginY, finalWidth, finalHeight)
    pdf.save(`${pdfName}.pdf`)
  }

  // Generate Image
  const generateImage = async () => {
    if (!pdfContent.value) return

    const element = pdfContent.value

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      scrollY: -window.scrollY,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
    })

    const imgData = canvas.toDataURL('image/png')

    // Auto-download the image
    const link = document.createElement('a')
    link.href = imgData
    link.download = `${pdfName}.png` // filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  onMounted(() => {
    fetchData()
  })
</script>

<template>
  <div>
    <!-- Download Button -->
    <VCol class="d-flex gap-4">
      <VBtn
        color="secondary"
        variant="outlined"
        @click="
          router.push({
            path: '/schedule',
          })
        "
      >
        <VIcon start icon="tabler-arrow-left" />
        Back
      </VBtn>

      <VBtn @click="generatePdf">
        Download PDF
        <VIcon end icon="tabler-file-text" />
      </VBtn>

      <VBtn @click="generateImage">
        Download Image
        <VIcon end icon="tabler-camera-down" />
      </VBtn>
    </VCol>

    <!-- Export Content -->
    <div ref="pdfContent" class="pdf-content mb-5">
      <Export
        :schedules="schedules"
        :selectedMonth="selectedMonth"
        :selectedYear="selectedYear"
      />
    </div>
  </div>
</template>
<style lang="scss" scoped>
  .pdf-content {
    padding: 16px;
    border-radius: 0.5rem;
    background-color: #f9f9f9;
  }

  .v-theme--dark {
    .font-white {
      color: white !important;
    }

    .pdf-content {
      color: rgb(47, 43, 61);
    }
  }
</style>
