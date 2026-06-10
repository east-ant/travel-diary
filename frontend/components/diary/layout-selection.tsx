"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Loader2, Sparkles, Check, LayoutIcon, Grid3x3, Eye, Image, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { LayoutThumbnail } from "./layout-thumbnail"

interface PhotoSlot {
  id: string
  photo?: string
  imageData?: string
  mimeType?: string
  keywords: string[]
  timeSlot: "morning" | "midday" | "afternoon" | "evening"
  timestamp: number
  exifData?: {
    timestamp?: Date | string
    location?: {
      latitude: number
      longitude: number
      locationName?: string
    }
  }
}

interface RecommendedLayout {
  layoutIndex: number
  layoutId: string
  layoutName: string
  description: string
  structure: {
    type: string
    photoLayout: string
    textPosition: string
  }
}

interface LayoutSelectionProps {
  photoSlots: PhotoSlot[]
  diaryTitle: string
  diaryText: string
  diaryId: string
  userId: string
  onBack: () => void
  onLayoutSelected: (layoutId: string, layoutIndex: number, category?: string) => void
}

export function LayoutSelection({
  photoSlots,
  diaryTitle,
  diaryText,
  diaryId,
  userId,
  onBack,
  onLayoutSelected,
}: LayoutSelectionProps) {
  const [recommendedLayouts, setRecommendedLayouts] = useState<RecommendedLayout[]>([])
  const [category, setCategory] = useState<string>("")
  const [isLoadingLayouts, setIsLoadingLayouts] = useState(true)
  const [selectedLayout, setSelectedLayout] = useState<string | null>(null)

  // 컴포넌트 마운트 시 레이아웃 추천 로드
  useEffect(() => {
    fetchLayoutRecommendations()
  }, [])

  const fetchLayoutRecommendations = async () => {
    setIsLoadingLayouts(true)
    try {
      console.log('🤖 레이아웃 추천 API 호출 (Next.js):', diaryId)

      const response = await fetch('/api/recommend-layouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ diaryId })
      })

      if (response.ok) {
        const data = await response.json()

        console.log('✅ API 전체 응답:', JSON.stringify(data, null, 2))

        if (data.success) {
          setRecommendedLayouts(data.recommendedLayouts || [])
          setCategory(data.category || '일반')

          console.log('📂 최종 카테고리:', data.category || '일반')
          console.log('🎨 최종 레이아웃:', data.recommendedLayouts?.length || 0, '개')
        } else {
          console.warn('⚠️ API 실패, 기본 레이아웃 사용')
          useDefaultLayouts()
        }
      } else {
        console.warn('⚠️ API 오류:', response.status)
        useDefaultLayouts()
      }
    } catch (error) {
      console.error('❌ 레이아웃 추천 오류:', error)
      useDefaultLayouts()
    } finally {
      setIsLoadingLayouts(false)
    }
  }

  const useDefaultLayouts = () => {
    setRecommendedLayouts([
      {
        layoutIndex: 1,
        layoutId: "layout_1",
        layoutName: "그리드 앨범",
        description: "사진첩처럼 깔끔하게 정리된 레이아웃",
        structure: { type: "grid", photoLayout: "2x2", textPosition: "bottom" }
      },
      {
        layoutIndex: 2,
        layoutId: "layout_2",
        layoutName: "자유로운 콜라주",
        description: "여러 사진을 자유롭게 배치한 역동적인 레이아웃",
        structure: { type: "collage", photoLayout: "mixed", textPosition: "floating" }
      }
    ])
    setCategory("일반")
  }

  const handleSelectLayout = async (layoutId: string, layoutIndex: number) => {
    setSelectedLayout(layoutId)

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'

      await fetch(`${backendUrl}/api/layouts/select/${diaryId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ layoutId, layoutIndex })
      })

      console.log('✅ 레이아웃 선택 저장:', layoutId)
    } catch (error) {
      console.error('⚠️ 레이아웃 저장 실패:', error)
    }
  }

  const handleConfirm = () => {
    if (selectedLayout) {
      const selectedLayoutIndex = recommendedLayouts.findIndex(l => l.layoutId === selectedLayout)
      if (selectedLayoutIndex !== -1) {
        // 추천된 레이아웃의 순서를 전달 (0 또는 1) + 카테고리도 함께 전달
        console.log("✅ 레이아웃 확인:", { selectedLayout, selectedLayoutIndex, category })
        onLayoutSelected(selectedLayout, selectedLayoutIndex, category)
      }
    }
  }

  // 레이아웃 미리보기 렌더링
  const renderLayoutPreview = (layoutIndex: number) => {
    const getLayoutType = (): "family" | "friend" | "couple" | "food" | "group" | "default" => {
      switch (category) {
        case "가족여행":
          return layoutIndex === 0 ? "family" : "friend"
        case "우정여행":
          return layoutIndex === 0 ? "friend" : "default"
        case "커플여행":
          return layoutIndex === 0 ? "couple" : "default"
        case "맛집탐방여행":
          return layoutIndex === 0 ? "family" : "couple"
        case "단체여행":
          return layoutIndex === 0 ? "default" : "family"
        default:
          return "default"
      }
    }

    return (
      <LayoutThumbnail
        layoutType={getLayoutType()}
        photoSlots={photoSlots}
        diaryText={diaryText}
        title={diaryTitle}
      />
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={onBack} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              뒤로
            </Button>
            <div className="h-6 w-px bg-border"></div>
            <h1 className="text-xl font-bold">레이아웃 선택</h1>
          </div>

          {selectedLayout && (
            <Button onClick={handleConfirm} className="bg-primary hover:bg-primary/90">
              확인 및 진행
            </Button>
          )}
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {category && (
          <Card className="p-6 mb-8 bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-primary shadow-lg flex items-center justify-center">
                <Sparkles className="w-7 h-7 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-1">AI가 감지한 카테고리</p>
                <p className="text-3xl font-bold">{category}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  📸 {photoSlots.filter(s => s.photo || s.imageData).length}장의 사진
                </p>
              </div>
            </div>
          </Card>
        )}

        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2">추천 레이아웃</h2>
          <p className="text-muted-foreground">
            일기 내용에 가장 잘 어울리는 레이아웃을 선택하세요
          </p>
        </div>

        {isLoadingLayouts ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground text-lg">AI가 최적의 레이아웃을 추천하고 있어요...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {recommendedLayouts.map((layout, index) => (
              <Card
                key={layout.layoutId}
                className={`relative overflow-hidden border-2 transition-all cursor-pointer ${
                  selectedLayout === layout.layoutId
                    ? 'border-primary bg-primary/5 shadow-xl scale-[1.02]'
                    : 'border-border hover:border-primary/50 hover:shadow-lg hover:scale-[1.01]'
                }`}
                onClick={() => {
                  handleSelectLayout(layout.layoutId, layout.layoutIndex)
                  // 선택 후 바로 진행
                  setTimeout(() => {
                    const selectedLayoutIndex = recommendedLayouts.findIndex(l => l.layoutId === layout.layoutId)
                    if (selectedLayoutIndex !== -1) {
                      onLayoutSelected(layout.layoutId, selectedLayoutIndex, category)
                    }
                  }, 300) // 애니메이션을 위한 짧은 딜레이
                }}
              >
                {selectedLayout === layout.layoutId && (
                  <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-primary shadow-lg flex items-center justify-center z-10 animate-in zoom-in">
                    <Check className="w-6 h-6 text-primary-foreground" />
                  </div>
                )}

                <div className="absolute top-4 left-4 bg-primary text-primary-foreground px-3 py-1.5 rounded-lg text-sm font-bold shadow-md z-10">
                  추천 #{index + 1}
                </div>

                <div className="relative h-[450px] bg-white overflow-hidden border-b flex items-start justify-center">
                  <div
                    className="pointer-events-none"
                    style={{
                      transform: 'scale(0.8)',
                      transformOrigin: 'top center',
                      width: '210mm',
                      height: '297mm',
                    }}
                  >
                    {renderLayoutPreview(index)}
                  </div>

                  {/* 하단 그라데이션 오버레이 */}
                  <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent pointer-events-none"></div>
                </div>

                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="text-xl font-bold mb-1">{layout.layoutName}</h3>
                    <p className="text-xs text-muted-foreground">{layout.description}</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <div className="flex items-center gap-1.5">
                      <LayoutIcon className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-muted-foreground">타입:</span>
                      <span className="font-medium">{layout.structure.type}</span>
                    </div>
                    <div className="h-3 w-px bg-border"></div>
                    <div className="flex items-center gap-1.5">
                      <Grid3x3 className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-muted-foreground">배치:</span>
                      <span className="font-medium">{layout.structure.photoLayout}</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
