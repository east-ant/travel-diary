"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Edit2, Check, X, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { PrintableDiaryPage } from "./printable-diary-page"
import { LayoutSelection } from "./layout-selection"

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
    camera?: {
      make?: string
      model?: string
      settings?: string
    }
  }
}

interface DiaryPreviewProps {
  photoSlots: PhotoSlot[]
  diaryTitle: string
  onBack: () => void
  diaryId: string
  userId: string
  onComplete?: () => void
  onLayoutSelectionChange?: (isSelecting: boolean) => void
}

export function DiaryPreview({
  photoSlots,
  diaryTitle,
  onBack,
  diaryId,
  userId,
  onComplete,
  onLayoutSelectionChange,
}: DiaryPreviewProps) {
  // 시간순으로 정렬된 photoSlots
  const sortedPhotoSlots = [...photoSlots].sort((a, b) => {
    const timeA = a.exifData?.timestamp
      ? (a.exifData.timestamp instanceof Date
        ? a.exifData.timestamp.getTime()
        : new Date(a.exifData.timestamp).getTime())
      : a.timestamp
    const timeB = b.exifData?.timestamp
      ? (b.exifData.timestamp instanceof Date
        ? b.exifData.timestamp.getTime()
        : new Date(b.exifData.timestamp).getTime())
      : b.timestamp
    return timeA - timeB
  })

  const [aiContent, setAiContent] = useState<string>("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isEditingAi, setIsEditingAi] = useState(false)
  const [editedAiContent, setEditedAiContent] = useState<string>("")
  const [isSaving, setIsSaving] = useState(false)
  const [showLayoutSelection, setShowLayoutSelection] = useState(false)
  const [showPrintablePage, setShowPrintablePage] = useState(false)
  const [selectedLayoutId, setSelectedLayoutId] = useState<string | null>(null)
  const [selectedLayoutIndex, setSelectedLayoutIndex] = useState<number | null>(null)
  const [category, setCategory] = useState<string>("")
  const { toast } = useToast()

  // 돌아가기 시 다이어리 삭제
  const handleBack = () => {
    console.log("🔙 돌아가기: 다이어리 유지")
    onBack()
  }

  // 카테고리 정보 가져오기
  useEffect(() => {
    const fetchCategory = async () => {
      if (!diaryId) return

      try {
        const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001"
        const response = await fetch(`${API_BASE_URL}/api/layouts/recommend/${diaryId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        })
        const data = await response.json()

        if (data.success && data.category) {
          setCategory(data.category)
          console.log("✅ 카테고리 로드:", data.category)
        }
      } catch (error) {
        console.error("❌ 카테고리 로드 실패:", error)
      }
    }

    fetchCategory()
  }, [diaryId])

  // 레이아웃 선택 상태 변경 시 부모 컴포넌트에 알림
  useEffect(() => {
    if (onLayoutSelectionChange) {
      onLayoutSelectionChange(showLayoutSelection)
    }
  }, [showLayoutSelection, onLayoutSelectionChange])

  const generateAiDiary = async () => {
    if (sortedPhotoSlots.length === 0) {
      toast({
        title: "오류",
        description: "사진이 없습니다.",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)

    try {
      const keywords = sortedPhotoSlots
        .flatMap((slot) => slot.keywords)
        .filter((kw) => kw)
        .join(", ")

      console.log("📤 AI 생성 요청:", { diaryTitle, keywords, photoCount: sortedPhotoSlots.length })

      const response = await fetch("/api/generate-diary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: diaryTitle,
          keywords,
          photoCount: sortedPhotoSlots.length,
        }),
      })

      const data = await response.json()

      console.log("📥 API 응답:", data)

      if (data.success) {
        setAiContent(data.content || "")
        setEditedAiContent(data.content || "")

        // ⭐ AI 생성 후 diaries 컬렉션에 content 저장
        try {
          console.log("💾 diaries 컬렉션에 content 저장 시작:", diaryId)

          const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001"
          const saveResponse = await fetch(`${API_BASE_URL}/api/diaries/update-content`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              diaryId,
              content: data.content
            })
          })

          const saveData = await saveResponse.json()

          if (saveData.success) {
            console.log("✅ diaries 컬렉션에 content 저장 완료:", diaryId)
          } else {
            console.warn("⚠️ diaries 컬렉션 content 저장 실패:", saveData.error)
          }
        } catch (saveError) {
          console.error("❌ diaries 컬렉션 저장 오류:", saveError)
        }

        toast({
          title: "생성 완료",
          description: "AI 다이어리가 생성되었습니다!",
        })
      } else {
        throw new Error(data.error || "생성 실패")
      }
    } catch (error) {
      console.error("AI 생성 오류:", error)
      toast({
        title: "생성 오류",
        description: error instanceof Error ? error.message : "AI 다이어리 생성에 실패했습니다.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const saveAiDiary = async () => {
    setIsSaving(true)

    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001"
      const response = await fetch(`${API_BASE_URL}/api/diaries/update-content`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          diaryId,
          content: editedAiContent,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setAiContent(editedAiContent)
        setIsEditingAi(false)

        toast({
          title: "저장 완료",
          description: "수정사항이 저장되었습니다!",
        })
      } else {
        throw new Error(data.error || "저장 실패")
      }
    } catch (error) {
      console.error("저장 오류:", error)
      toast({
        title: "저장 오류",
        description: error instanceof Error ? error.message : "저장에 실패했습니다.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const startEditing = () => {
    setEditedAiContent(aiContent)
    setIsEditingAi(true)
  }

  const cancelEditing = () => {
    setIsEditingAi(false)
    setEditedAiContent("")
  }

  const handleLayoutSelected = (layoutId: string, layoutIndex: number, selectedCategory?: string) => {
    setSelectedLayoutId(layoutId)
    setSelectedLayoutIndex(layoutIndex)
    if (selectedCategory) {
      setCategory(selectedCategory)
      console.log("✅ 레이아웃 선택 시 카테고리 업데이트:", selectedCategory)
    }
    setShowLayoutSelection(false)
    setShowPrintablePage(true)
  }

  // 레이아웃 선택 화면 표시
  if (showLayoutSelection) {
    return (
      <LayoutSelection
        photoSlots={sortedPhotoSlots}
        diaryTitle={diaryTitle}
        diaryText={aiContent}
        diaryId={diaryId}
        userId={userId}
        onBack={() => setShowLayoutSelection(false)}
        onLayoutSelected={handleLayoutSelected}
      />
    )
  }

  // 카테고리별 인쇄 컴포넌트 렌더링
  const renderPrintablePage = () => {
    const commonProps = {
      photoSlots: sortedPhotoSlots,
      diaryText: aiContent,
      title: diaryTitle,
      onBack: () => {
        setShowPrintablePage(false)
        setShowLayoutSelection(true)
      },
      diaryId,
      userId,
      onComplete,
      onMounted: () => {
        if (onLayoutSelectionChange) {
          onLayoutSelectionChange(true)
        }
      },
    }

    // layoutIndex와 category에 따라 layoutType 결정
    let layoutType: "family" | "friend" | "couple" | "default" = "default"

    switch (category) {
      case "가족여행":
        // 가족 / 우정
        layoutType = selectedLayoutIndex === 0 ? "family" : "friend"
        break
      case "우정여행":
        // 우정 / 기본
        layoutType = selectedLayoutIndex === 0 ? "friend" : "default"
        break
      case "커플여행":
        // 커플 / 기본
        layoutType = selectedLayoutIndex === 0 ? "couple" : "default"
        break
      case "맛집탐방여행":
        // 가족 / 커플
        layoutType = selectedLayoutIndex === 0 ? "family" : "couple"
        break
      case "단체여행":
        // 기본 / 가족
        layoutType = selectedLayoutIndex === 0 ? "default" : "family"
        break
      default:
        layoutType = "default"
    }

    return <PrintableDiaryPage {...commonProps} layoutType={layoutType} />
  }

  // 최종 완성본 페이지 표시
  if (showPrintablePage) {
    return <div className="w-full">{renderPrintablePage()}</div>
  }

  if (!aiContent) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center space-x-3 mb-8">
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h2 className="text-2xl font-bold text-foreground">검토 및 생성</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4">사진</h3>
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
              {sortedPhotoSlots.map((slot, idx) => (
                <Card key={slot.id} className="overflow-hidden border-border">
                  <div className="aspect-video bg-muted overflow-hidden">
                    <img
                      src={
                        slot.imageData && slot.mimeType
                          ? `data:${slot.mimeType};base64,${slot.imageData}`
                          : slot.photo || "/placeholder.svg"
                      }
                      alt={`photo-${idx}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-3 bg-card">
                    <div className="flex flex-wrap gap-2">
                      {slot.keywords.map((keyword, kidx) => (
                        <span
                          key={kidx}
                          className="px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded-full font-medium"
                        >
                          #{keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">생성된 다이어리</h3>
            </div>

            <Card className="p-8 text-center space-y-6 border-dashed bg-secondary/30 h-full flex flex-col justify-center items-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted">
                <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  여행 다이어리를 생성하시겠습니까?
                </h3>
                <p className="text-sm text-muted-foreground">
                  "{diaryTitle}" 버튼을 클릭하여 사진과<br />
                  키워드로 이야기를 만드세요.
                </p>
              </div>

              <div className="flex flex-col w-full space-y-2">
                <Button
                  onClick={generateAiDiary}
                  disabled={isGenerating}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  {isGenerating ? "생성 중..." : "다이어리 생성"}
                </Button>
                <Button variant="outline" onClick={handleBack} className="w-full">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  돌아가기
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="flex items-center space-x-3 mb-8">
        <Button variant="ghost" size="sm" onClick={handleBack}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h2 className="text-2xl font-bold text-foreground">검토 및 생성</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4">사진</h3>
          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
            {sortedPhotoSlots.map((slot, idx) => (
              <Card key={slot.id} className="overflow-hidden border-border">
                <div className="aspect-video bg-muted overflow-hidden">
                  <img
                    src={
                      slot.imageData && slot.mimeType
                        ? `data:${slot.mimeType};base64,${slot.imageData}`
                        : slot.photo || "/placeholder.svg"
                    }
                    alt={`photo-${idx}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-3 bg-card">
                  <div className="flex flex-wrap gap-2">
                    {slot.keywords.map((keyword, kidx) => (
                      <span
                        key={kidx}
                        className="px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded-full font-medium"
                      >
                        #{keyword}
                      </span>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">생성된 다이어리</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={generateAiDiary}
              disabled={isGenerating}
              className="gap-1"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? "animate-spin" : ""}`} />
              재생성
            </Button>
          </div>

          {isEditingAi ? (
            <div className="space-y-3">
              <textarea
                value={editedAiContent}
                onChange={(e) => setEditedAiContent(e.target.value)}
                className="w-full h-80 px-4 py-3 bg-background border border-primary rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none text-sm leading-relaxed"
                placeholder="다이어리 내용을 자유롭게 수정하세요..."
              />

              <div className="flex justify-end space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={cancelEditing}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4 mr-1" />
                  취소
                </Button>
                <Button
                  size="sm"
                  onClick={saveAiDiary}
                  disabled={isSaving}
                  className="bg-primary hover:bg-primary/90"
                >
                  <Check className="w-4 h-4 mr-1" />
                  {isSaving ? "저장 중..." : "저장하기"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <Card className="p-6 bg-card border-border min-h-80 max-h-80 overflow-y-auto">
                <p className="text-foreground leading-relaxed whitespace-pre-wrap text-sm">
                  {aiContent}
                </p>
              </Card>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={startEditing}
                  className="text-foreground hover:bg-secondary"
                >
                  <Edit2 className="w-4 h-4 mr-1" />
                  수정하기
                </Button>
                <Button
                  onClick={() => setShowLayoutSelection(true)}
                  className="bg-primary hover:bg-primary/90"
                >
                  확인 및 진행
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
