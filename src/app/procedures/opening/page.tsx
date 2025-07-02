'use client'

import { SimplifiedOpeningFlow } from '@/components/procedures/opening/SimplifiedOpeningFlow'
import { AppLayout } from '@/components/layout/app-layout'

export default function OpeningProcedurePage() {
  return (
    <AppLayout title="Prosedur Pembukaan">
      <SimplifiedOpeningFlow />
    </AppLayout>
  )
}