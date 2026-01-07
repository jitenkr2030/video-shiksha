import { NextRequest, NextResponse } from 'next/server';
import { scriptGenerationService } from '@/lib/services/script-generation.service';
import { userManagementService } from '@/lib/services/user-management.service';

export async function POST(request: NextRequest) {
  try {
    // Get user from token
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = await userManagementService.validateToken(token) || {};
    if (!userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { slides, options } = await request.json();

    if (!slides || !Array.isArray(slides)) {
      return NextResponse.json({ error: 'Invalid slides data' }, { status: 400 });
    }

    // Generate scripts
    const scripts = await scriptGenerationService.generateScripts(slides, options);

    return NextResponse.json({ 
      success: true, 
      data: scripts 
    });

  } catch (error) {
    console.error('Script generation error:', error);
    return NextResponse.json(
      { error: 'Script generation failed' }, 
      { status: 500 }
    );
  }
}