import { NextResponse } from 'next/server';
import { testFirebaseSetup } from '@/lib/firebase/test-setup';

export async function GET() {
  try {
    // Capture console output
    const logs: string[] = [];
    const originalLog = console.log;
    console.log = (...args) => {
      logs.push(args.join(' '));
      originalLog(...args);
    };
    
    const success = await testFirebaseSetup();
    
    // Restore console.log
    console.log = originalLog;
    
    return NextResponse.json({
      success,
      logs: logs.join('\n'),
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}