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

interface PhotoLayoutFriendProps {
  photo: PhotoSlot
  text: string
  getImageUrl: (slot: PhotoSlot) => string
  fontFamily: string
  fontSize: number
  textColor: string
  index: number
}

/**
 * 우정 레이아웃 사진 배치
 * - 각 사진마다 2열 그리드로 배치 (왼쪽: 사진, 오른쪽: 일기)
 */
export function PhotoLayoutFriend({
  photo,
  text,
  getImageUrl,
  fontFamily,
  fontSize,
  textColor,
  index
}: PhotoLayoutFriendProps) {
  const imageUrl = getImageUrl(photo)

  return (
    <div className="grid grid-cols-2 gap-6 mb-8">
      {/* 왼쪽: 사진 */}
      <div className="space-y-2">
        <div
          className="bg-white shadow-lg border-4 border-white overflow-hidden"
          style={{
            width: "70mm",
            height: "90mm",
          }}
        >
          <img
            src={imageUrl}
            className="w-full h-full object-cover"
            alt={`photo-${index}`}
          />
        </div>

        {/* 사진별 키워드 */}
        {photo.keywords && photo.keywords.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {photo.keywords.slice(0, 3).map((keyword: string, kidx: number) => (
              <span
                key={kidx}
                className="rounded-full text-sm"
                style={{
                  fontFamily: `'${fontFamily}'`,
                  border: `1.5px solid ${textColor}`,
                  backgroundColor: "transparent",
                  color: textColor,
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
        )}
      </div>

      {/* 오른쪽: 일기 내용 */}
      {text && (
        <div className="flex flex-col justify-start">
          <p
            className="leading-relaxed"
            style={{ fontFamily: `'${fontFamily}'`, fontSize: `${fontSize}px`, color: textColor }}
          >
            {text}
          </p>
        </div>
      )}
    </div>
  )
}
