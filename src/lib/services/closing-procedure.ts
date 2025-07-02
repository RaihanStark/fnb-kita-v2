import { api } from '@/lib/api/client';

export interface ClosingProcedure {
  id: string;
  currentStep: number;
  completed: boolean;
  stepData: any;
  createdAt: Date;
}

export interface CheckClosingResponse {
  success: boolean;
  hasClosing: boolean;
  closing?: ClosingProcedure;
}

export interface StartClosingResponse {
  success: boolean;
  closing: ClosingProcedure;
  error?: string;
}

export interface UpdateClosingResponse {
  success: boolean;
  closing: ClosingProcedure;
  error?: string;
}

export const closingProcedureService = {
  // Check if there's a closing procedure for today
  async checkTodayClosing(): Promise<CheckClosingResponse> {
    return await api.get<CheckClosingResponse>('/api/procedures/closing/check');
  },

  // Start a new closing procedure
  async startClosing(): Promise<StartClosingResponse> {
    return await api.post<StartClosingResponse>('/api/procedures/closing/start');
  },

  // Update closing procedure step
  async updateStep(
    closingId: string, 
    stepNumber: number, 
    stepData: any, 
    completed: boolean = true
  ): Promise<UpdateClosingResponse> {
    return await api.post<UpdateClosingResponse>('/api/procedures/closing/update', {
      closingId,
      stepNumber,
      stepData,
      completed
    });
  },

  // Save progress (partial update without completing the step)
  async saveProgress(
    closingId: string,
    stepNumber: number,
    stepData: any
  ): Promise<UpdateClosingResponse> {
    return this.updateStep(closingId, stepNumber, stepData, false);
  },

  // Cancel today's closing procedure
  async cancelTodayClosing(): Promise<{ success: boolean; message?: string; error?: string }> {
    return await api.delete('/api/procedures/closing/delete-today');
  }
};