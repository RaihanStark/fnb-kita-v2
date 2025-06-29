'use client'

import { OpeningProcedureFlow } from '@/components/procedures/opening/OpeningProcedureFlow'
import { AppLayout } from '@/components/layout/app-layout'

export default function OpeningProcedurePage() {
  return (
    <AppLayout>
      <OpeningProcedureFlow />
    </AppLayout>
  )
}