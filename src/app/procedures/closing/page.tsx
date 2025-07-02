'use client'

import { SimplifiedClosingFlow } from '@/components/procedures/closing/SimplifiedClosingFlow'
import { AppLayout } from '@/components/layout/app-layout'

export default function ClosingProcedurePage() {
  return (
    <AppLayout title="Prosedur Penutupan">
      <SimplifiedClosingFlow />
    </AppLayout>
  )
}