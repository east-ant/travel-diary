"use client"

import type React from "react"
import { useRef, useState } from "react"
import { ImageIcon, Upload, X, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import html2canvas from "html2canvas"
import type { PrintableDiaryPageProps } from "./printable-diary-page"

// Helper 함수들
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

function getImageUrl(slot: any): string {
  if (slot.imageData && slot.mimeType) {
    return `data:${slot.mimeType};base64,${slot.imageData}`
  }
  return slot.photo || "/placeholder.svg"
}

// Helper: oklch 색상을 hex로 변환 (html2canvas 호환성)
function replaceOklchWithHex(element: HTMLElement): Map<HTMLElement, string> {
  const originalStyles = new Map<HTMLElement, string>()

  function convertOklchToHex(oklchStr: string): string {
    const oklchMatch = oklchStr.match(/oklch\(([\d.]+%?)\s+([\d.]+)\s+([\d.]+)\s*\/?\s*([\d.%]*)\)/)
    if (!oklchMatch) return oklchStr

    try {
      const l = parseFloat(oklchMatch[1])
      const c = parseFloat(oklchMatch[2])
      const h = parseFloat(oklchMatch[3])
      const hRad = (h * Math.PI) / 180

      const r = Math.round(255 * (l / 100 + c * 0.3 * Math.cos(hRad)))
      const g = Math.round(255 * (l / 100 + c * 0.3 * Math.sin(hRad)))
      const b = Math.round(255 * (l / 100 - c * 0.3))

      const clamp = (val: number) => Math.max(0, Math.min(255, val))
      return `rgb(${clamp(r)}, ${clamp(g)}, ${clamp(b)})`
    } catch {
      return oklchStr
    }
  }

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

// 대괄호로 감싼 키워드를 제거하는 함수
function removeKeywordBrackets(text: string): string {
  return text.replace(/\[([^\]]+)\]/g, '')
}

// 우정여행 전용 레이아웃 (이미지 기반)
export function FamilyTravelPrint({
  photoSlots,
  diaryText,
  title,
  onBack,
  diaryId,
  userId,
  onComplete,
}: PrintableDiaryPageProps) {
  const pageRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isSaving, setIsSaving] = useState(false)

  // 폰트 시스템
  const [fontSize, setFontSize] = useState(18)
  const [textColor, setTextColor] = useState("#1f2937")
  const [fontFamily, setFontFamily] = useState("Cafe24Shiningstar")

  // 이모지 스티커 구조 (페이지별로 관리)
  const [decorationPhotos, setDecorationPhotos] = useState<
    Record<number, Array<{ id: string; src: string; x: number; y: number; width: number; height: number }>>
  >({})

  const [uploadedPhotos, setUploadedPhotos] = useState<Array<{ id: string; src: string }>>([
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
  ])

  const [draggedPhotoSrc, setDraggedPhotoSrc] = useState<string | null>(null)
  const [draggingPhotoId, setDraggingPhotoId] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null)
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0)

  // 크기 조절 state
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

  const [currentPageElement, setCurrentPageElement] = useState<HTMLElement | null>(null)

  // 파일 업로드
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    Array.from(files).forEach((file) => {
      const reader = new FileReader()
      reader.onload = (event) => {
        const src = event.target?.result as string
        setUploadedPhotos((prev) => [...prev, { id: `upload-${Date.now()}-${Math.random()}`, src }])
      }
      reader.readAsDataURL(file)
    })
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handlePhotoDragStart = (photoSrc: string) => {
    setDraggedPhotoSrc(photoSrc)
  }

  // Drop
  const handlePageDrop = (e: React.DragEvent, pageElement: HTMLDivElement, pageIndex: number) => {
    e.preventDefault()
    if (!draggedPhotoSrc) return

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
          id: `photo-${Date.now()}`,
          src: draggedPhotoSrc,
          x,
          y,
          width: 20,
          height: 20,
        },
      ],
    })

    setDraggedPhotoSrc(null)
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

          let newX = mouseX - dragOffset.x
          let newY = mouseY - dragOffset.y

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

          const widthPx = newWidth * 3.78
          const heightPx = newHeight * 3.78

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

  const handleRemoveUploadedPhoto = (photoId: string) => {
    setUploadedPhotos(uploadedPhotos.filter((photo) => photo.id !== photoId))
  }

  const handleCompleteClick = async () => {
    if (!diaryId || !userId) {
      alert("다이어리 정보가 없습니다.")
      return
    }

    setIsSaving(true)

    try {
      const pages = document.querySelectorAll('.diary-page')
      const imageDataArray: string[] = []

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i] as HTMLElement

        // oklch 색상 호환성 처리
        const originalStyles = replaceOklchWithHex(page)

        // 페이지의 실제 배경색 가져오기
        const computedStyle = window.getComputedStyle(page)
        const pageBgColor = computedStyle.backgroundColor || "#faf8f3"

        const canvas = await html2canvas(page, {
          backgroundColor: pageBgColor,
          scale: 2,
          logging: false,
          allowTaint: true,
          useCORS: true,
          ignoreElements: (el) => {
            return (
              el.classList.contains("print:hidden") ||
              el.classList.contains("ring-2") ||
              el.classList.contains("cursor-nwse-resize") ||
              el.classList.contains("cursor-nesw-resize") ||
              el.classList.contains("cursor-ns-resize") ||
              el.classList.contains("cursor-ew-resize")
            )
          },
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

        // 스타일 복원
        originalStyles.forEach((value, el) => {
          if (value) el.style.cssText = value
        })

        const imageData = canvas.toDataURL("image/png").split(",")[1]
        imageDataArray.push(imageData)
      }

      const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001"
      const response = await fetch(`${API_BASE_URL}/api/diaries/save-printable`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          diaryId,
          userId,
          imageData: imageDataArray,
        }),
      })

      const data = await response.json()

      if (data.success) {
        console.log("✅ 우정여행 다이어리 저장 완료")
        if (onComplete) onComplete()
      } else {
        throw new Error(data.error || "저장 실패")
      }
    } catch (error) {
      console.error("❌ 저장 오류:", error)
      alert("저장에 실패했습니다.")
    } finally {
      setIsSaving(false)
    }
  }

  // 일기 내용을 4개씩 묶어서 페이지 분할
  const ITEMS_PER_PAGE = 4
  const totalPages = Math.ceil(photoSlots.length / ITEMS_PER_PAGE)

  // 일기 내용을 \n\n로 분할 시도, 실패 시 전체 텍스트를 사진 개수만큼 균등 분할
  let paragraphs = diaryText.split("\n\n").filter((p) => p.trim())

  // 문단 수가 사진 수와 맞지 않으면 전체 텍스트를 사진 개수만큼 분할
  if (paragraphs.length < photoSlots.length) {
    const sentences = diaryText.split(/(?<=[.!?])\s+/).filter((s) => s.trim())
    const sentencesPerPhoto = Math.ceil(sentences.length / photoSlots.length)
    paragraphs = []
    for (let i = 0; i < photoSlots.length; i++) {
      const start = i * sentencesPerPhoto
      const end = Math.min(start + sentencesPerPhoto, sentences.length)
      const text = sentences.slice(start, end).join(" ")
      if (text.trim()) paragraphs.push(text)
    }
  }

  const pages: Array<{ photos: any[]; texts: string[] }> = []
  for (let i = 0; i < totalPages; i++) {
    const startIdx = i * ITEMS_PER_PAGE
    const endIdx = Math.min(startIdx + ITEMS_PER_PAGE, photoSlots.length)
    pages.push({
      photos: photoSlots.slice(startIdx, endIdx),
      texts: paragraphs.slice(startIdx, endIdx),
    })
  }

  return (
    <div
      className="min-h-screen bg-gray-50"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* 상단 컨트롤 바 */}
      <div className="print:hidden sticky top-0 z-50 bg-white border-b shadow-sm">
        <div className="flex items-center justify-between px-6 py-3">
          {onBack && (
            <Button onClick={onBack} variant="outline" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              뒤로가기
            </Button>
          )}

          <div className="flex items-center gap-4 bg-white border rounded-lg p-3 shadow-sm">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">폰트:</label>
              <select
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value)}
                className="px-3 py-1.5 text-sm border rounded"
              >
                <option value="Cafe24Shiningstar">Cafe24Shiningstar</option>
                <option value="인천교육자람">인천교육자람</option>
                <option value="memomentKkukkkuk">memomentKkukkkuk</option>
                <option value="온글잎 의연체">온글잎 의연체</option>
                <option value="PretendardVariable">PretendardVariable</option>
                <option value="Nanum Pen Script">나눔손글씨</option>
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
              <label className="text-sm text-gray-600">전체 색상:</label>
              <input
                type="color"
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
                className="w-12 h-8 rounded cursor-pointer border"
              />
            </div>
          </div>

          {diaryId && userId && (
            <Button
              onClick={handleCompleteClick}
              disabled={isSaving}
              size="sm"
              className="bg-blue-500 hover:bg-blue-600"
            >
              {isSaving ? "저장 중..." : "작성 완료"}
            </Button>
          )}
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex gap-4 max-w-6xl mx-auto p-6">
        {/* A4 페이지들 */}
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
                backgroundColor: "#faf8f3",
                backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0, 0, 0, 0.07) 5px, rgba(0, 0, 0, 0.04) 3px)",
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                const target = e.currentTarget as HTMLDivElement
                handlePageDrop(e, target, pageIdx)
              }}
              onClick={() => setSelectedPhotoId(null)}
            >
              {/* 제목 (첫 페이지만) */}
              {pageIdx === 0 && (
                <div className="text-center mb-12">
                  <h2
                    className="text-4xl font-bold text-blue-600 mb-2"
                    style={{
                      fontFamily: `'${fontFamily}'`,
                      color: textColor,
                    }}
                  >
                    {title}
                  </h2>
                  <div className="flex items-center justify-center gap-3 mt-3">
                    <div className="h-px w-20 bg-blue-300"></div>
                    <p className="text-sm text-gray-500" style={{ fontFamily: `'${fontFamily}'` }}>
                      {photoSlots[0]?.exifData?.timestamp
                        ? getDateFromTimestamp(photoSlots[0].exifData.timestamp)?.toLocaleDateString("ko-KR")
                        : new Date().toLocaleDateString("ko-KR")}
                    </p>
                    <div className="h-px w-20 bg-blue-300"></div>
                  </div>
                </div>
              )}

              {/* 메인 콘텐츠 */}
              <div className="space-y-6">
                {/* 상단 영역: 첫 번째 사진 + 일기 전반부 */}
                <div className="flex gap-6">
                  {/* 왼쪽: 첫 번째 사진 */}
                  {page.photos[0] && (
                    <div className="flex-shrink-0">
                      <div
                        className="bg-white shadow-lg border-4 border-white overflow-hidden"
                        style={{ width: "60mm", height: "70mm" }}
                      >
                        <img
                          src={getImageUrl(page.photos[0])}
                          className="w-full h-full object-cover"
                          alt="photo-0"
                        />
                      </div>
                    </div>
                  )}

                  {/* 오른쪽: 해시태그 + 일기 전반부 */}
                  <div className="flex-1 space-y-4">
                    {/* 모든 해시태그 (사진당 최대 3개) */}
                    <div className="flex flex-wrap gap-2">
                      {page.photos.flatMap((photo) => (photo.keywords || []).slice(0, 3)).filter((kw, idx, arr) => arr.indexOf(kw) === idx).map((keyword: string, kidx: number) => (
                        <span
                          key={kidx}
                          className="rounded-full text-sm"
                          style={{
                            fontFamily: `'${fontFamily}'`,
                            border: "1.5px solid #3B82F6",
                            backgroundColor: "transparent",
                            color: "#3B82F6",
                            display: "inline-block",
                            padding: "6px 14px",
                            textAlign: "center",
                            verticalAlign: "middle",
                            lineHeight: "1.2",
                          }}
                        >
                          #{keyword}
                        </span>
                      ))}
                    </div>

                    {/* 일기 전반부 */}
                    <p
                      className="leading-relaxed"
                      style={{ fontFamily: `'${fontFamily}'`, fontSize: `${fontSize}px`, color: textColor }}
                    >
                      {(() => {
                        const fullText = removeKeywordBrackets(page.texts.join(" "))
                        const halfLength = Math.ceil(fullText.length / 2)
                        return fullText.substring(0, halfLength)
                      })()}
                    </p>
                  </div>
                </div>

                {/* 중간 영역: 사진 2, 3, 4 가로 배치 */}
                {page.photos.length > 1 && (
                  <div className="flex gap-4 justify-center">
                    {page.photos.slice(1, 4).map((photo, idx) => (
                      <div
                        key={photo.id}
                        className="bg-white shadow-lg border-4 border-white overflow-hidden"
                        style={{ width: "60mm", height: "70mm" }}
                      >
                        <img
                          src={getImageUrl(photo)}
                          className="w-full h-full object-cover"
                          alt={`photo-${idx + 1}`}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* 하단: 일기 후반부 */}
                <div className="pt-4">
                  <p
                    className="leading-relaxed"
                    style={{ fontFamily: `'${fontFamily}'`, fontSize: `${fontSize}px`, color: textColor }}
                  >
                    {(() => {
                      const fullText = removeKeywordBrackets(page.texts.join(" "))
                      const halfLength = Math.ceil(fullText.length / 2)
                      return fullText.substring(halfLength)
                    })()}
                  </p>
                </div>

                {/* 마지막 페이지의 마지막 사진 아래 "여행의 끝" */}
                {pageIdx === pages.length - 1 && (
                  <div className="mt-6 pt-4 border-t border-dashed text-center">
                    <p className="text-blue-400" style={{ fontFamily: `'${fontFamily}'`, fontSize: `${fontSize + 7}px` }}>
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

        {/* Sidebar */}
        <div className="flex-shrink-0 w-40 bg-white border rounded-lg p-3 shadow-sm print:hidden sticky top-4 h-fit">
          <div className="flex items-center gap-2 mb-3">
            <ImageIcon className="w-4 h-4 text-gray-600" />
            <h3 className="font-semibold text-sm">이모지 추가</h3>
          </div>
          <p className="text-xs text-gray-500 mb-3">드래그해서 사용</p>

          <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="hidden" />
          <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="w-full mb-3" size="sm">
            <Upload className="w-3 h-3 mr-1" /> 업로드
          </Button>

          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {uploadedPhotos.map((photo) => (
              <div key={photo.id} className="relative group">
                <div draggable onDragStart={() => handlePhotoDragStart(photo.src)} className="cursor-grab hover:ring-2 hover:ring-blue-400 transition-all">
                  <img src={photo.src} className="w-full h-20 object-cover" />
                </div>
                <button
                  onClick={() => handleRemoveUploadedPhoto(photo.id)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>

          <div className="mt-3 pt-3 border-t text-xs text-gray-500">
            💡 드래그로 추가 가능
          </div>
        </div>
      </div>
    </div>
  )
}
