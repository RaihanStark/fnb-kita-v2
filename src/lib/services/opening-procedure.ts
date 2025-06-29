import { api } from '@/lib/api/client';

export interface OpeningProcedure {
  id: string;
  currentStep: number;
  completed: boolean;
  stepData: any;
  createdAt: Date;
}

export interface CheckOpeningResponse {
  success: boolean;
  hasOpening: boolean;
  opening?: OpeningProcedure;
}

export interface StartOpeningResponse {
  success: boolean;
  opening: OpeningProcedure;
  error?: string;
}

export interface UpdateOpeningResponse {
  success: boolean;
  opening: OpeningProcedure;
  error?: string;
}

export const openingProcedureService = {
  // Check if there's an opening procedure for today
  async checkTodayOpening(): Promise<CheckOpeningResponse> {
    return await api.get<CheckOpeningResponse>('/api/procedures/opening/check');
  },

  // Start a new opening procedure
  async startOpening(): Promise<StartOpeningResponse> {
    return await api.post<StartOpeningResponse>('/api/procedures/opening/start');
  },

  // Update opening procedure step
  async updateStep(
    openingId: string, 
    stepNumber: number, 
    stepData: any, 
    completed: boolean = true
  ): Promise<UpdateOpeningResponse> {
    return await api.post<UpdateOpeningResponse>('/api/procedures/opening/update', {
      openingId,
      stepNumber,
      stepData,
      completed
    });
  },

  // Save progress (partial update without completing the step)
  async saveProgress(
    openingId: string,
    stepNumber: number,
    stepData: any
  ): Promise<UpdateOpeningResponse> {
    return this.updateStep(openingId, stepNumber, stepData, false);
  }
};