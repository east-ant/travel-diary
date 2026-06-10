"use client"

import type React from "react"

interface PhotoSlot {
  id: string
  photo?: string
  imageData?: string
  mimeType?: string
  keywords: string[]
  timeSlot: "morning" | "midday" | "afternoon" | "evening"
  timestamp: number
  exifData?: any
}

interface PhotoLayoutDefaultProps {
  slot: PhotoSlot
  paragraph: string
  getImageUrl: (slot: PhotoSlot) => string
  fontFamily: string
  fontSize: number
  textColor: string
  backgroundColor: string
  index: number
}

/**
 * 기본 레이아웃 사진 배치
 * - 사진 + 문단을 2개씩 세로로 배치
 */
export function PhotoLayoutDefault({
  slot,
  paragraph,
  getImageUrl,
  fontFamily,
  fontSize,
  textColor,
  backgroundColor,
  index
}: PhotoLayoutDefaultProps) {
  // 짝수/홀수에 따라 순서 변경 (지그재그 배치)
  const isEven = index % 2 === 0

  const photoElement = (
    <div className="flex-shrink-0">
      <div
        className="bg-white overflow-hidden transform transition-transform hover:scale-105"
        style={{
          width: "80mm",
          height: "100mm",
          padding: "8px",
          boxShadow: "0 10px 25px rgba(0, 0, 0, 0.15), 0 4px 10px rgba(0, 0, 0, 0.1)",
          borderRadius: "4px",
        }}
      >
        <div
          className="relative w-full h-full overflow-hidden"
          style={{
            boxShadow: "inset 0 0 10px rgba(0, 0, 0, 0.1)",
          }}
        >
          <img
            src={getImageUrl(slot)}
            className="w-full h-full object-cover"
            alt={`photo-${index}`}
            style={{
              borderRadius: "2px",
            }}
          />
          {/* 폴라로이드 빈티지 효과 오버레이 */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%, rgba(0,0,0,0.05) 100%)",
              mixBlendMode: "overlay",
            }}
          />
        </div>
      </div>
    </div>
  )

  const textElement = (
    <div className="flex-1 flex flex-col">
      {/* 해시태그 */}
      <div className="flex flex-wrap gap-2 mb-4">
        {slot.keywords?.slice(0, 3).map((kw, kidx) => (
          <span
            key={kidx}
            className="px-3 py-1 rounded-full text-sm"
            style={{
              fontFamily: `'${fontFamily}'`,
              backgroundColor: backgroundColor,
              color: "#000000",
              border: "1px solid #000000",
            }}
          >
            #{kw}
          </span>
        ))}
      </div>

      {/* 문단 */}
      <p
        className="leading-relaxed whitespace-pre-wrap"
        style={{
          fontFamily: `'${fontFamily}'`,
          fontSize: `${fontSize}px`,
          color: textColor,
        }}
      >
        {paragraph}
      </p>
    </div>
  )

  return (
    <div style={{ marginBottom: '120px' }}>
      {/* 사진 + 해시태그 + 문단 (지그재그 배치) */}
      <div className="flex gap-6">
        {isEven ? (
          <>
            {photoElement}
            {textElement}
          </>
        ) : (
          <>
            {textElement}
            {photoElement}
          </>
        )}
      </div>
    </div>
  )
}
