"use client"

import type React from "react"
import { useRef, useState, useEffect } from "react"
import { X, Printer, ArrowLeft, Smile, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import html2canvas from "html2canvas"
import { PhotoLayoutFamily } from "./layouts/photo-layout-family"
import { PhotoLayoutFriend } from "./layouts/photo-layout-friend"
import { PhotoLayoutCouple } from "./layouts/photo-layout-couple"
import { PhotoLayoutDefault } from "./layouts/photo-layout-default"

interface ExifData {
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

interface PhotoSlot {
  id: string
  photo?: string
  imageData?: string
  mimeType?: string
  keywords: string[]
  timeSlot: "morning" | "midday" | "afternoon" | "evening"
  timestamp: number
  exifData?: ExifData
}

export type LayoutType = "family" | "friend" | "couple" | "default"

export interface PrintableDiaryPageProps {
  photoSlots: PhotoSlot[]
  diaryText: string
  title: string
  onBack?: () => void
  diaryId?: string
  userId?: string
  onComplete?: () => void
  onMounted?: () => void
  layoutType?: LayoutType
}

// Helper: timestamp → Date
function getDateFromTimestamp(timestamp: Date | string | undefined): Date | null {
  if (!timestamp) return null
  if (timestamp instanceof Date) return timestamp
  try {
    const date = new Date(timestamp)
    return isNaN(date.getTime()) ? null : date
  } catch {
    return null
  }
}

// Helper: Base64 or URL
function getImageUrl(slot: PhotoSlot): string {
  if (slot.imageData && slot.mimeType) {
    return `data:${slot.mimeType};base64,${slot.imageData}`
  }
  return slot.photo || "/placeholder.svg"
}

// Helper: oklch 색상을 hex로 변환 (html2canvas 호환성)
function replaceOklchWithHex(element: HTMLElement): Map<HTMLElement, string> {
  const originalStyles = new Map<HTMLElement, string>()
  
  function convertOklchToHex(oklchStr: string): string {
    // oklch(L C H) 형식을 감지
    const oklchMatch = oklchStr.match(/oklch\(([\d.]+%?)\s+([\d.]+)\s+([\d.]+)\s*\/?\s*([\d.%]*)\)/)
    
    if (!oklchMatch) {
      // oklch가 아닌 경우 그대로 반환
      return oklchStr
    }

    // 간단한 oklch to hex 변환 (근사값)
    // 완벽한 변환이 아니라 html2canvas 호환성을 위한 근사값입니다
    try {
      const l = parseFloat(oklchMatch[1])
      const c = parseFloat(oklchMatch[2])
      const h = parseFloat(oklchMatch[3])

      // oklch를 RGB로 근사 변환
      // 이것은 완벽한 변환이 아니지만 html2canvas 호환성을 위한 실용적인 해결책입니다
      const hRad = (h * Math.PI) / 180

      // 간단한 근사 공식
      const r = Math.round(255 * (l / 100 + c * 0.3 * Math.cos(hRad)))
      const g = Math.round(255 * (l / 100 + c * 0.3 * Math.sin(hRad)))
      const b = Math.round(255 * (l / 100 - c * 0.3))

      // 값을 0-255 범위로 클램프
      const clamp = (val: number) => Math.max(0, Math.min(255, val))
      const finalR = clamp(r)
      const finalG = clamp(g)
      const finalB = clamp(b)

      return `rgb(${finalR}, ${finalG}, ${finalB})`
    } catch {
      return oklchStr
    }
  }

  // 재귀적으로 모든 요소 처리
  const walkTree = (el: HTMLElement) => {
    const style = window.getComputedStyle(el)
    
    // 배경색 처리
    const bgColor = style.backgroundColor
    if (bgColor && bgColor.includes("oklch")) {
      originalStyles.set(el, el.style.backgroundColor || "")
      el.style.backgroundColor = convertOklchToHex(bgColor)
    }

    // 텍스트 색 처리
    const color = style.color
    if (color && color.includes("oklch")) {
      originalStyles.set(el, el.style.color || "")
      el.style.color = convertOklchToHex(color)
    }

    // 테두리 색 처리
    const borderColor = style.borderColor
    if (borderColor && borderColor.includes("oklch")) {
      originalStyles.set(el, el.style.borderColor || "")
      el.style.borderColor = convertOklchToHex(borderColor)
    }

    // 자식 요소들에 대해 재귀 처리
    Array.from(el.children).forEach((child) => {
      if (child instanceof HTMLElement) {
        walkTree(child)
      }
    })
  }

  walkTree(element)
  return originalStyles
}

export function PrintableDiaryPage({
  photoSlots,
  diaryText,
  title,
  onBack,
  diaryId,
  userId,
  onComplete,
  onMounted,
  layoutType = "default",
}: PrintableDiaryPageProps) {
  const pageRef = useRef<HTMLDivElement>(null)

  // --- 너가 수정한 font system 적용 ---
  const [fontSize, setFontSize] = useState(18)
  const [textColor, setTextColor] = useState("#1f2937")
  const [fontFamily, setFontFamily] = useState("Cafe24Shiningstar")
  const [backgroundColor, setBackgroundColor] = useState("#faf8f3")
  const [isAiRecommending, setIsAiRecommending] = useState(false)

  // --- 너가 수정한 이모지 스티커 구조 적용 (페이지별로 관리) ---
  const [decorationPhotos, setDecorationPhotos] = useState<
    Record<number, Array<{ id: string; src: string; x: number; y: number; width: number; height: number }>>
  >({})

  // 기본 이모지 (상단 버튼 팝업에만 표시)
  const defaultEmojis = [
    { id: "default-1", src: "/emotion/cw1.png" },
    { id: "default-2", src: "/emotion/cw2.png" },
    { id: "default-3", src: "/emotion/cw3.png" },
    { id: "default-4", src: "/emotion/cw4.png" },
    { id: "default-5", src: "/emotion/cw5.png" },
    { id: "default-6", src: "/emotion/cw6.png" },
    { id: "default-7", src: "/emotion/cw7.png" },
    { id: "default-8", src: "/emotion/cw8.png" },
    { id: "default-9", src: "/emotion/cw9.png" },
    { id: "default-10", src: "/emotion/cw10.png" },
    { id: "default-11", src: "/emotion/ds1.png" },
    { id: "default-12", src: "/emotion/ds2.png" },
    { id: "default-13", src: "/emotion/ds3.png" },
    { id: "default-14", src: "/emotion/ds4.png" },
    { id: "default-15", src: "/emotion/ds5.png" },
    { id: "default-16", src: "/emotion/ds6.png" },
    { id: "default-17", src: "/emotion/ds7.png" },
    { id: "default-18", src: "/emotion/ds8.png" },
    { id: "default-19", src: "/emotion/ds9.png" },
    { id: "default-20", src: "/emotion/ds10.png" },
    { id: "default-21", src: "/emotion/sj1.png" },
    { id: "default-22", src: "/emotion/sj2.png" },
    { id: "default-23", src: "/emotion/sj3.png" },
    { id: "default-24", src: "/emotion/sj4.png" },
    { id: "default-25", src: "/emotion/sj5.png" },
    { id: "default-26", src: "/emotion/sj6.png" },
    { id: "default-27", src: "/emotion/sj7.png" },
    { id: "default-28", src: "/emotion/sj8.png" },
    { id: "default-29", src: "/emotion/sj9.png" },
    { id: "default-30", src: "/emotion/sj10.png" },
    { id: "default-31", src: "/emotion/yj1.png" },
    { id: "default-32", src: "/emotion/yj2.png" },
    { id: "default-33", src: "/emotion/yj3.png" },
    { id: "default-34", src: "/emotion/yj4.png" },
    { id: "default-35", src: "/emotion/yj5.png" },
    { id: "default-36", src: "/emotion/yj6.png" },
    { id: "default-37", src: "/emotion/yj7.png" },
  ]

  const [draggingPhotoId, setDraggingPhotoId] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null)
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0)

  // --- 너가 만든 크기 조절 state ---
  const [resizingPhotoId, setResizingPhotoId] = useState<string | null>(null)
  const [resizeHandle, setResizeHandle] = useState<string | null>(null)
  const [resizeStart, setResizeStart] = useState<{
    x: number
    y: number
    width: number
    height: number
    startX: number
    startY: number
  } | null>(null)

  const [isSavingComplete, setIsSavingComplete] = useState(false)
  const [currentPageElement, setCurrentPageElement] = useState<HTMLElement | null>(null)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)

  // 컴포넌트 마운트 시 부모에게 알림 (step 3 활성화용)
  useEffect(() => {
    if (onMounted) {
      onMounted()
    }
  }, [onMounted])

  const [draggedEmojiSrc, setDraggedEmojiSrc] = useState<string | null>(null)

  const handleEmojiDragStart = (emojiSrc: string) => {
    setDraggedEmojiSrc(emojiSrc)
  }

  const handleEmojiDrop = (e: React.DragEvent, pageElement: HTMLDivElement, pageIndex: number) => {
    e.preventDefault()
    if (!draggedEmojiSrc) return

    const rect = pageElement.getBoundingClientRect()
    const defaultW = 20 * 3.78
    const defaultH = 20 * 3.78

    let x = e.clientX - rect.left - defaultW / 2
    let y = e.clientY - rect.top - defaultH / 2

    const pageWidth = rect.width
    const pageHeight = rect.height

    x = Math.max(0, Math.min(x, pageWidth - defaultW))
    y = Math.max(0, Math.min(y, pageHeight - defaultH))

    const currentPagePhotos = decorationPhotos[pageIndex] || []

    setDecorationPhotos({
      ...decorationPhotos,
      [pageIndex]: [
        ...currentPagePhotos,
        {
          id: `emoji-${Date.now()}`,
          src: draggedEmojiSrc,
          x,
          y,
          width: 20,
          height: 20,
        },
      ],
    })

    setDraggedEmojiSrc(null)
  }

  // MouseDown for move
  const handlePhotoMouseDown = (e: React.MouseEvent, photoId: string, pageElement: HTMLElement, pageIndex: number) => {
    e.preventDefault()
    e.stopPropagation()

    const currentPagePhotos = decorationPhotos[pageIndex] || []
    const photo = currentPagePhotos.find((p) => p.id === photoId)
    if (!photo) return

    const rect = pageElement.getBoundingClientRect()
    setCurrentPageElement(pageElement)
    setCurrentPageIndex(pageIndex)
    setDraggingPhotoId(photoId)
    setSelectedPhotoId(photoId)
    setDragOffset({
      x: e.clientX - rect.left - photo.x,
      y: e.clientY - rect.top - photo.y,
    })
  }

  // MouseDown for resize
  const handleResizeMouseDown = (e: React.MouseEvent, photoId: string, handle: string, pageElement: HTMLElement, pageIndex: number) => {
    e.preventDefault()
    e.stopPropagation()

    const currentPagePhotos = decorationPhotos[pageIndex] || []
    const photo = currentPagePhotos.find((p) => p.id === photoId)
    if (!photo) return

    const rect = pageElement.getBoundingClientRect()

    setCurrentPageElement(pageElement)
    setCurrentPageIndex(pageIndex)
    setResizingPhotoId(photoId)
    setResizeHandle(handle)
    setSelectedPhotoId(photoId)
    setResizeStart({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      width: photo.width,
      height: photo.height,
      startX: photo.x,
      startY: photo.y,
    })
  }

  // MouseMove
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!currentPageElement) return

    const rect = currentPageElement.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    // Page boundaries
    const pageWidth = rect.width
    const pageHeight = rect.height

    if (draggingPhotoId && !resizingPhotoId) {
      const currentPagePhotos = decorationPhotos[currentPageIndex] || []

      setDecorationPhotos({
        ...decorationPhotos,
        [currentPageIndex]: currentPagePhotos.map((p) => {
          if (p.id !== draggingPhotoId) return p

          const widthPx = p.width * 3.78
          const heightPx = p.height * 3.78

          // Calculate new position
          let newX = mouseX - dragOffset.x
          let newY = mouseY - dragOffset.y

          // Constrain within page boundaries
          newX = Math.max(0, Math.min(newX, pageWidth - widthPx))
          newY = Math.max(0, Math.min(newY, pageHeight - heightPx))

          return { ...p, x: newX, y: newY }
        })
      })
    } else if (resizingPhotoId && resizeHandle && resizeStart) {
      const deltaX = mouseX - resizeStart.x
      const deltaY = mouseY - resizeStart.y

      const currentPagePhotos = decorationPhotos[currentPageIndex] || []

      setDecorationPhotos({
        ...decorationPhotos,
        [currentPageIndex]: currentPagePhotos.map((p) => {
          if (p.id !== resizingPhotoId) return p

          let newWidth = resizeStart.width
          let newHeight = resizeStart.height
          let newX = resizeStart.startX
          let newY = resizeStart.startY

          const minSize = 5

          if (resizeHandle.includes("e")) newWidth = Math.max(minSize, resizeStart.width + deltaX)
          if (resizeHandle.includes("w")) {
            newWidth = Math.max(minSize, resizeStart.width - deltaX)
            newX = resizeStart.startX + (resizeStart.width - newWidth)
          }
          if (resizeHandle.includes("s")) newHeight = Math.max(minSize, resizeStart.height + deltaY)
          if (resizeHandle.includes("n")) {
            newHeight = Math.max(minSize, resizeStart.height - deltaY)
            newY = resizeStart.startY + (resizeStart.height - newHeight)
          }

          // Constrain within page boundaries
          const widthPx = newWidth * 3.78
          const heightPx = newHeight * 3.78

          // Ensure emoji doesn't extend beyond page
          newX = Math.max(0, Math.min(newX, pageWidth - widthPx))
          newY = Math.max(0, Math.min(newY, pageHeight - heightPx))

          return { ...p, width: newWidth, height: newHeight, x: newX, y: newY }
        })
      })
    }
  }

  // MouseUp
  const handleMouseUp = () => {
    setDraggingPhotoId(null)
    setResizingPhotoId(null)
    setResizeHandle(null)
    setResizeStart(null)
    setCurrentPageElement(null)
  }

  const handlePhotoDoubleClick = (photoId: string, pageIndex: number) => {
    const currentPagePhotos = decorationPhotos[pageIndex] || []
    setDecorationPhotos({
      ...decorationPhotos,
      [pageIndex]: currentPagePhotos.filter((p) => p.id !== photoId)
    })
  }


  // AI 추천 함수
  const handleAiRecommendation = async () => {
    setIsAiRecommending(true)

    try {
      // 일기 내용에서 키워드 추출
      const keywords = photoSlots.flatMap(slot => slot.keywords).slice(0, 5).join(", ")

      const response = await fetch("/api/recommend-style", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          diaryText: diaryText.substring(0, 500), // 일기 내용 일부
          keywords: keywords,
          title: title
        }),
      })

      const data = await response.json()

      if (data.success) {
        // AI 추천 스타일 적용
        if (data.recommendation.backgroundColor) {
          setBackgroundColor(data.recommendation.backgroundColor)
        }
        if (data.recommendation.textColor) {
          setTextColor(data.recommendation.textColor)
        }
        if (data.recommendation.fontFamily) {
          setFontFamily(data.recommendation.fontFamily)
        }
        if (data.recommendation.fontSize) {
          setFontSize(data.recommendation.fontSize)
        }
      } else {
        console.error("AI 추천 실패:", data.error)
        alert("AI 추천을 가져오는데 실패했습니다.")
      }
    } catch (error) {
      console.error("AI 추천 오류:", error)
      alert("AI 추천 중 오류가 발생했습니다.")
    } finally {
      setIsAiRecommending(false)
    }
  }

  const handleCompleteClick = async () => {
    console.log("🔵 작성 완료 버튼 클릭됨!", {
      diaryId,
      diaryIdType: typeof diaryId,
      diaryIdValue: diaryId,
      userId,
      userIdType: typeof userId,
      userIdValue: userId
    })

    if (!diaryId) {
      console.error("❌ diaryId 없음:", diaryId)
      alert(`diaryId가 없습니다.\ndiaryId: ${diaryId}`)
      return
    }

    if (!userId) {
      console.error("❌ userId 없음:", userId)
      alert(`userId가 없습니다.\nuserId: ${userId}`)
      return
    }

    setIsSavingComplete(true)

    try {
      console.log("📸 다이어리 페이지를 이미지로 변환 중...")

      // 모든 페이지 요소 찾기
      const pages = document.querySelectorAll('.diary-page')
      console.log(`🔍 발견된 페이지 수: ${pages.length}`)
      console.log(`🔍 페이지 요소들:`, Array.from(pages).map((p, i) => `페이지 ${i + 1}`))

      if (pages.length === 0) {
        console.error("❌ .diary-page 클래스를 가진 요소를 찾을 수 없습니다!")
        alert("다이어리 페이지를 찾을 수 없습니다. 페이지를 새로고침해주세요.")
        setIsSavingComplete(false)
        return
      }

      const imageDataArray: string[] = []

      // 스크롤을 최상단으로 이동하고 모든 페이지를 동시에 렌더링
      window.scrollTo(0, 0)

      // 모든 페이지를 강제로 보이게 설정
      const pageStates: Array<{
        page: HTMLElement
        originalDisplay: string
        originalVisibility: string
        originalOpacity: string
      }> = []

      pages.forEach((page) => {
        const htmlPage = page as HTMLElement
        pageStates.push({
          page: htmlPage,
          originalDisplay: htmlPage.style.display,
          originalVisibility: htmlPage.style.visibility,
          originalOpacity: htmlPage.style.opacity,
        })
        htmlPage.style.display = 'block'
        htmlPage.style.visibility = 'visible'
        htmlPage.style.opacity = '1'
      })

      // 모든 페이지 렌더링 대기
      await new Promise(resolve => setTimeout(resolve, 500))

      // 각 페이지를 개별적으로 캡처
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i] as HTMLElement
        console.log(`📸 페이지 ${i + 1}/${pages.length} 캡처 시작...`)
        console.log(`📏 페이지 크기: ${page.offsetWidth}x${page.offsetHeight}`)
        console.log(`📍 페이지 위치: top=${page.offsetTop}, left=${page.offsetLeft}`)

        // oklch 색상 호환성 처리
        const originalStyles = replaceOklchWithHex(page)

        // 페이지의 실제 배경색 가져오기
        const computedStyle = window.getComputedStyle(page)
        const pageBgColor = computedStyle.backgroundColor || "#faf8f3"

        console.log(`🎨 html2canvas 호출 중...`)
        const canvas = await html2canvas(page, {
          backgroundColor: pageBgColor,
          scale: 2,
          logging: false,
          allowTaint: true,
          useCORS: true,
          imageTimeout: 10000,
          width: page.offsetWidth,
          height: page.offsetHeight,
          ignoreElements: (el) => {
            // 컨트롤 요소, 사이드바, 스크롤바 제외
            return (
              el.classList.contains("print:hidden") ||
              el.classList.contains("ring-2") ||
              el.classList.contains("cursor-nwse-resize") ||
              el.classList.contains("cursor-nesw-resize") ||
              el.classList.contains("cursor-ns-resize") ||
              el.classList.contains("cursor-ew-resize") ||
              el.classList.contains("diary-sidebar") ||
              el.tagName === "SCROLLBAR" ||
              (el as HTMLElement).style?.overflow === "scroll" ||
              (el as HTMLElement).style?.overflow === "auto"
            )
          },
        })

        console.log(`✅ Canvas 생성 완료: ${canvas.width}x${canvas.height}`)

        // 원래 스타일 복원
        originalStyles.forEach((original, el) => {
          if (original) {
            el.style.cssText = original
          }
        })

        // 줄무늬 패턴 추가 (CSS와 동일한 패턴)
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.globalCompositeOperation = 'source-over'
          // CSS: repeating-linear-gradient - 5px마다 반복
          const scale = 2 // html2canvas scale
          const patternRepeat = 5 * scale // 10px
          const transparentEnd = 3 * scale // 6px
          const lineWidth = 1 * scale // 2px (더 얇게)

          for (let y = 0; y < canvas.height; y += patternRepeat) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.04)'
            ctx.fillRect(0, y + transparentEnd, canvas.width, lineWidth)
          }
        }

        const imageData = canvas.toDataURL("image/png").split(",")[1]
        console.log(`💾 이미지 데이터 크기: ${imageData.length} bytes`)
        imageDataArray.push(imageData)
        console.log(`✅ 페이지 ${i + 1} 캡처 완료`)
      }

      console.log(`✅ 전체 ${imageDataArray.length}개 페이지 캡처 완료`)

      // 모든 페이지 스타일 원래대로 복원
      pageStates.forEach(({ page, originalDisplay, originalVisibility, originalOpacity }) => {
        page.style.display = originalDisplay
        page.style.visibility = originalVisibility
        page.style.opacity = originalOpacity
      })

      console.log("📤 완료된 다이어리 저장 중:", {
        diaryId,
        userId,
        pageCount: imageDataArray.length,
      })

      const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001"
      const response = await fetch(`${API_BASE_URL}/api/diaries/save-printable`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          diaryId,
          userId,
          imageData: imageDataArray, // 배열로 전송
        }),
      })

      const data = await response.json()

      if (data.success) {
        console.log("✅ 다이어리 완료 저장 성공")
        if (onComplete) {
          onComplete()
        }
      } else {
        throw new Error(data.error || "저장 실패")
      }
    } catch (error) {
      console.error("❌ 다이어리 완료 저장 오류:", error)
      alert(error instanceof Error ? error.message : "다이어리 저장에 실패했습니다.")
    } finally {
      setIsSavingComplete(false)
    }
  }

  // Paragraphs
  const paragraphs = diaryText.split("\n\n").filter((p) => p.trim())

  // 사진과 문단을 2개씩 그룹으로 나누기 (페이지 분할)
  // family와 couple 레이아웃은 한 페이지에만 표시
  const ITEMS_PER_PAGE = 2
  const totalPages = (layoutType === "family" || layoutType === "couple")
    ? 1
    : Math.ceil(paragraphs.length / ITEMS_PER_PAGE)
  const pages: Array<{ paragraphs: string[]; slots: PhotoSlot[] }> = []

  if (layoutType === "family" || layoutType === "couple") {
    // family와 couple은 모든 사진과 텍스트를 한 페이지에
    pages.push({
      paragraphs: paragraphs,
      slots: photoSlots,
    })
  } else {
    // 나머지 레이아웃은 기존처럼 페이지 분할
    for (let i = 0; i < totalPages; i++) {
      const startIdx = i * ITEMS_PER_PAGE
      const endIdx = Math.min(startIdx + ITEMS_PER_PAGE, paragraphs.length)
      pages.push({
        paragraphs: paragraphs.slice(startIdx, endIdx),
        slots: photoSlots.slice(startIdx, endIdx),
      })
    }
  }

  return (
    <div
      className="min-h-screen bg-gray-50"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Top Controls */}
      <div className="print:hidden sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between px-6 py-3">
          {/* 왼쪽: 뒤로가기 */}
          <div className="flex items-center gap-3">
            {onBack && (
              <Button onClick={onBack} variant="outline" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                뒤로가기
              </Button>
            )}
          </div>

          {/* 중앙: 폰트/크기/색상 설정 */}
          <div className="flex items-center gap-3 bg-white border rounded-lg p-3 shadow-sm">
            <div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAiRecommendation}
                disabled={isAiRecommending}
                className="gap-2 bg-gradient-to-r from-black-30 to-black-50 hover:from-black-100 hover:to-white-100 border-black-200"
              >
                <Sparkles className="w-4 h-4 text-black-600" />
                {isAiRecommending ? "추천 중..." : "AI 추천"}
              </Button>
            </div>
            <div className="flex items-center gap-2 border-l border-gray-300 pl-3">
              <label className="text-sm text-gray-600">배경색:</label>
              <input
                type="color"
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                className="w-12 h-8 rounded cursor-pointer border"
              />
            </div>

            <div className="flex items-center gap-2 border-l border-gray-300 pl-3">
              <label className="text-sm text-gray-600">폰트:</label>
              <select
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value)}
                className="px-3 py-1.5 text-sm border rounded"
              >
                <option value="PretendardVariable">프리텐다드</option>
                <option value="Nanum Pen Script">나눔손글씨</option>
                <option value="Cafe24Shiningstar">카페24샤이닝스타</option>
                <option value="Cafe24고운밤">카페24고운밤</option>
                <option value="온글잎 바닷바람">온글잎 바닷바람</option>
                <option value="온글잎 의연체">온글잎 의연체</option>
                <option value="인천교육자람">인천교육자람</option>
                <option value="memomentKkukkkuk">메모먼트꾹꾹체</option>
                <option value="샤우팅체">샤우팅체</option>
                <option value="쿨가이체">쿨가이체</option>
                <option value="강원교육현옥샘">강원교육현옥샘</option>
                <option value="잉크립퀴드체">잉크립퀴드체</option>
                <option value="국립박물관문화재단클래식M">국립박물관체</option>
              </select>
            </div>

            <div className="flex items-center gap-2 border-l border-gray-300 pl-3">
              <label className="text-sm text-gray-600">크기:</label>
              <input
                type="number"
                min="12"
                max="32"
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="w-16 px-2 py-1.5 text-sm border rounded"
              />
              <span className="text-sm text-gray-500">px</span>
            </div>

            <div className="flex items-center gap-2 border-l border-gray-300 pl-3">
              <label className="text-sm text-gray-600">글씨 색상:</label>
              <input
                type="color"
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
                className="w-12 h-8 rounded cursor-pointer border"
              />
            </div>

            

            <div className="relative border-l border-gray-300 pl-3">
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  setShowEmojiPicker(!showEmojiPicker)
                }}
                className="gap-2"
              >
                <Smile className="w-4 h-4" />

              </Button>

              {showEmojiPicker && (
                <>
                  <div
                    className="fixed inset-0 z-40 pointer-events-none"
                    onClick={() => setShowEmojiPicker(false)}
                  />
                  <div
                    className="absolute top-full left-3 mt-1 bg-white border border-gray-300 rounded-lg shadow-xl z-50 p-4 w-[450px] max-h-[500px] overflow-y-auto pointer-events-auto"
                    onDragOver={(e) => e.preventDefault()}
                  >
                    <div className="flex items-center justify-between mb-5 pb-2 border-b">
                      <h3 className="font-semibold text-sm">이모지 선택</h3>
                      <button
                        onClick={() => setShowEmojiPicker(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-6 gap-1">
                      {defaultEmojis.map((photo) => (
                        <div
                          key={photo.id}
                          draggable
                          onDragStart={(e) => {
                            handleEmojiDragStart(photo.src)

                          }}
                          onClick={(e) => {
                            e.stopPropagation()
                          }}
                          className="cursor-grab active:cursor-grabbing hover:bg-gray-100 rounded p-1 transition-all"
                        >
                          <img
                            src={photo.src}
                            className="w-full h-auto object-cover pointer-events-none"
                            alt="emoji"
                            draggable={false}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* 오른쪽: 작성 완료 */}
          <div className="flex gap-2">
            {diaryId && userId && (
              <Button
                onClick={handleCompleteClick}
                disabled={isSavingComplete}
                size="sm"
                className="bg-primary hover:bg-primary/90 gap-2"
              >
                {isSavingComplete ? "저장 중..." : "작성 완료"}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex gap-4 max-w-6xl mx-auto p-6">
        {/* Diary Pages (A4) */}
        <div className="flex-1 space-y-8">
          {pages.map((page, pageIdx) => (
            <div
              key={pageIdx}
              className="diary-page shadow-lg relative mx-auto"
              style={{
                width: "210mm",
                minHeight: "297mm",
                padding: "20mm",
                boxSizing: "border-box",
                position: "relative",
                backgroundColor: backgroundColor,
                backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0, 0, 0, 0.07) 5px, rgba(0, 0, 0, 0.04) 3px)",
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                const target = e.currentTarget as HTMLDivElement
                handleEmojiDrop(e, target, pageIdx)
              }}
              onClick={() => setSelectedPhotoId(null)}
            >
              {/* Title (첫 페이지만) */}
              {pageIdx === 0 && (
                <div className="text-center mb-8">
                  <h2
                    className="text-3xl font-bold text-gray-900"
                    style={{
                      fontFamily: `'${fontFamily}'`,
                      color: textColor,
                      fontSize: (fontFamily === "온글잎 의연체" || fontFamily === "Cafe24Shiningstar")
                        ? `${fontSize + 10}pt`
                        : undefined
                    }}
                  >
                    {title}
                  </h2>
                  <div className="flex items-center justify-center gap-2 mt-2">
                    <div className="h-px w-16 bg-gray-400"></div>
                    <p className="text-sm text-gray-600" style={{ fontFamily: `'${fontFamily}'` }}>
                      {photoSlots[0]?.exifData?.timestamp
                        ? getDateFromTimestamp(photoSlots[0].exifData.timestamp)?.toLocaleDateString("ko-KR", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })
                        : new Date().toLocaleDateString("ko-KR", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                    </p>
                    <div className="h-px w-16 bg-gray-400"></div>
                  </div>
                </div>
              )}

              {/* Content - 레이아웃 타입별로 다른 렌더링 */}
              <div className={layoutType === "default" ? "" : "space-y-8"}>
                {layoutType === "family" && pageIdx === 0 && (
                  <PhotoLayoutFamily
                    photos={photoSlots}
                    texts={paragraphs}
                    getImageUrl={getImageUrl}
                    fontFamily={fontFamily}
                    fontSize={fontSize}
                    textColor={textColor}
                  />
                )}

                {layoutType === "friend" && (
                  <>
                    {page.paragraphs.map((paragraph, idx) => {
                      const photoSlot = page.slots[idx]
                      if (!photoSlot) return null
                      return (
                        <PhotoLayoutFriend
                          key={photoSlot.id}
                          photo={photoSlot}
                          text={paragraph}
                          getImageUrl={getImageUrl}
                          fontFamily={fontFamily}
                          fontSize={fontSize}
                          textColor={textColor}
                          index={pageIdx * ITEMS_PER_PAGE + idx}
                        />
                      )
                    })}
                  </>
                )}

                {layoutType === "couple" && pageIdx === 0 && (
                  <PhotoLayoutCouple
                    photos={photoSlots}
                    texts={paragraphs}
                    getImageUrl={getImageUrl}
                    fontFamily={fontFamily}
                    fontSize={fontSize}
                    textColor={textColor}
                  />
                )}

                {layoutType === "default" && (
                  <>
                    {page.paragraphs.map((paragraph, idx) => {
                      const photoSlot = page.slots[idx]
                      if (!photoSlot) return null
                      return (
                        <PhotoLayoutDefault
                          key={photoSlot.id}
                          slot={photoSlot}
                          paragraph={paragraph}
                          getImageUrl={getImageUrl}
                          fontFamily={fontFamily}
                          fontSize={fontSize}
                          textColor={textColor}
                          backgroundColor={backgroundColor}
                          index={pageIdx * ITEMS_PER_PAGE + idx}
                        />
                      )
                    })}
                  </>
                )}

                {/* 여행의 끝 - 마지막 페이지에만 */}
                {pageIdx === pages.length - 1 && (
                  <div className="mt-6 pt-4 border-t border-dashed text-center">
                    <p className="text-gray-600" style={{ fontFamily: `'${fontFamily}'`, fontSize: `${fontSize + 7}px` }}>
                      ✈️ 여행의 끝 ✈️
                    </p>
                  </div>
                )}
              </div>

              {/* Stickers - 페이지별로 독립적으로 관리 */}
              {(decorationPhotos[pageIdx] || []).map((photo) => {
                const widthPx = photo.width * 3.78
                const heightPx = photo.height * 3.78
                const selected = selectedPhotoId === photo.id
                const pageElement = document.querySelectorAll('.diary-page')[pageIdx] as HTMLElement

                return (
                  <div
                    key={photo.id}
                    className={`absolute cursor-move ${
                      selected ? "ring-2 ring-blue-500" : "hover:ring-2 hover:ring-blue-400"
                    }`}
                    style={{
                      left: `${photo.x}px`,
                      top: `${photo.y}px`,
                      width: `${widthPx}px`,
                      height: `${heightPx}px`,
                    }}
                    onMouseDown={(e) => {
                      if (pageElement) handlePhotoMouseDown(e, photo.id, pageElement, pageIdx)
                    }}
                    onDoubleClick={() => handlePhotoDoubleClick(photo.id, pageIdx)}
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedPhotoId(photo.id)
                    }}
                  >
                    <img src={photo.src} className="w-full h-full object-cover rounded pointer-events-none" />

                    {selected && pageElement && (
                      <>
                        {/* 8 resize handles */}
                        <div
                          className="absolute -top-1 -left-1 w-3 h-3 bg-white border-2 border-blue-500 rounded-full cursor-nwse-resize"
                          onMouseDown={(e) => handleResizeMouseDown(e, photo.id, "nw", pageElement, pageIdx)}
                        />
                        <div
                          className="absolute -top-1 -right-1 w-3 h-3 bg-white border-2 border-blue-500 rounded-full cursor-nesw-resize"
                          onMouseDown={(e) => handleResizeMouseDown(e, photo.id, "ne", pageElement, pageIdx)}
                        />
                        <div
                          className="absolute -bottom-1 -left-1 w-3 h-3 bg-white border-2 border-blue-500 rounded-full cursor-nesw-resize"
                          onMouseDown={(e) => handleResizeMouseDown(e, photo.id, "sw", pageElement, pageIdx)}
                        />
                        <div
                          className="absolute -bottom-1 -right-1 w-3 h-3 bg-white border-2 border-blue-500 rounded-full cursor-nwse-resize"
                          onMouseDown={(e) => handleResizeMouseDown(e, photo.id, "se", pageElement, pageIdx)}
                        />

                        <div
                          className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-2 border-blue-500 rounded-full cursor-ns-resize"
                          onMouseDown={(e) => handleResizeMouseDown(e, photo.id, "n", pageElement, pageIdx)}
                        />
                        <div
                          className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-2 border-blue-500 rounded-full cursor-ns-resize"
                          onMouseDown={(e) => handleResizeMouseDown(e, photo.id, "s", pageElement, pageIdx)}
                        />
                        <div
                          className="absolute -left-1 top-1/2 -translate-y-1/2 w-3 h-3 bg-white border-2 border-blue-500 rounded-full cursor-ew-resize"
                          onMouseDown={(e) => handleResizeMouseDown(e, photo.id, "w", pageElement, pageIdx)}
                        />
                        <div
                          className="absolute -right-1 top-1/2 -translate-y-1/2 w-3 h-3 bg-white border-2 border-blue-500 rounded-full cursor-ew-resize"
                          onMouseDown={(e) => handleResizeMouseDown(e, photo.id, "e", pageElement, pageIdx)}
                        />
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>

      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .diary-page,
          .diary-page * {
            visibility: visible;
          }
          .diary-page {
            position: absolute;
            left: 0;
            top: 0;
            box-shadow: none !important;
            margin: 0 !important;
            width: 210mm !important;
            min-height: 297mm !important;
          }
          @page {
            size: A4 portrait;
            margin: 0;
          }
        }

        .diary-page {
          background-image: repeating-linear-gradient(
            0deg,
            transparent,
            transparent 3px,
            rgba(0, 0, 0, 0.07) 5px,
            rgba(0, 0, 0, 0.04) 3px
          );
        }
      `}</style>
    </div>
  )
}