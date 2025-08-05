<script setup lang="ts">
  // Page config
  // Imports
  import { onMounted, ref } from 'vue'
  import html2canvas from 'html2canvas'
  import jsPDF from 'jspdf'
  import Export from '@/components/slots/Export.vue'

  const { mutateData } = useSlotHelpers()

  definePageMeta({
    layout: 'blank',
  })

  // if converted to composable
  const api = useApi()

  const route = useRoute()
  const year = computed(() => Number(route.query.year)) // if using query
  const month = computed(() => Number(route.query.month))

  console.log(year, month)

  // PDF settings
  const exampleDate = '2025-08-01'
  const dayjs = useNuxtApp().$dayjs

  const range = dayjs(exampleDate).format('YYYY-MM')
  const rangeTitle = dayjs(exampleDate).format('MMM YYYY')
  const pdfName = `PNW_Schedule_${rangeTitle}`

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
      <Export :schedules="schedules" :range="range" />
    </div>
  </div>
</template>

<style scoped>
  .pdf-content {
    padding: 1rem;
    border-radius: 8px;
    background-color: #f9f9f9;
  }
</style>
