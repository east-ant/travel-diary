import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { diaryId } = body;

    console.log('📥 레이아웃 추천 요청 (Next.js API):', diaryId);

    if (!diaryId) {
      return NextResponse.json(
        { success: false, error: 'diaryId가 필요합니다' },
        { status: 400 }
      );
    }

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
    console.log('🔗 백엔드 호출:', `${backendUrl}/api/layouts/recommend/${diaryId}`);
    
    const response = await fetch(`${backendUrl}/api/layouts/recommend/${diaryId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('❌ 백엔드 API 오류:', response.status);
      return NextResponse.json(
        { success: false, error: '백엔드 API 호출 실패' },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('✅ 백엔드 응답:', JSON.stringify(data, null, 2));

    return NextResponse.json(data);
  } catch (error) {
    console.error('❌ API Route 오류:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}