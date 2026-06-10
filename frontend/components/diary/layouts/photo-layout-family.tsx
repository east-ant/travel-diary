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

interface PhotoLayoutFamilyProps {
  photos: PhotoSlot[]
  texts: string[]
  getImageUrl: (slot: PhotoSlot) => string
  fontFamily: string
  fontSize?: number
  textColor?: string
}

/**
 * 가족 레이아웃 사진 배치
 * - 첫 번째 사진: 왼쪽 대형
 * - 나머지 사진 2,3,4: 가로로 나열
 */
export function PhotoLayoutFamily({ photos, texts, getImageUrl, fontFamily, fontSize = 18, textColor = "#000000" }: PhotoLayoutFamilyProps) {
  return (
    <div className="space-y-6">
      {/* 상단 영역: 첫 번째 사진 + 첫 번째 사진 해시태그 + 첫 번째 문단 */}
      <div className="flex gap-6">
        {/* 왼쪽: 첫 번째 사진 */}
        {photos[0] && (
          <div className="flex-shrink-0">
            <div
              className="bg-white shadow-lg border-4 border-white overflow-hidden"
              style={{ width: "60mm", height: "70mm" }}
            >
              <img
                src={getImageUrl(photos[0])}
                className="w-full h-full object-cover"
                alt="photo-0"
              />
            </div>
          </div>
        )}

        {/* 오른쪽: 첫 번째 사진 해시태그 + 첫 번째 문단 */}
        <div className="flex-1 space-y-4">
          {/* 첫 번째 사진 해시태그만 */}
          {photos[0]?.keywords && photos[0].keywords.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {photos[0].keywords.map((keyword: string, kidx: number) => (
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

          {/* 첫 번째 문단 */}
          {texts && texts.length > 0 && (
            <p
              style={{
                fontFamily: `'${fontFamily}'`,
                fontSize: `${fontSize}px`,
                color: textColor,
                lineHeight: "1.8",
                whiteSpace: "pre-wrap",
              }}
            >
              {texts[0]}
            </p>
          )}
        </div>
      </div>

      {/* 중간 영역: 사진 2, 3, 4 가로 배치 */}
      {photos.length > 1 && (
        <div className="flex gap-4 justify-center">
          {photos.slice(1, 4).map((photo, idx) => (
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

      {/* 하단 영역: 나머지 일기 텍스트 (2, 3, 4번 합쳐서) */}
      {texts && texts.length > 1 && (
        <div className="mt-6">
          <p
            style={{
              fontFamily: `'${fontFamily}'`,
              fontSize: `${fontSize}px`,
              color: textColor,
              lineHeight: "1.8",
              whiteSpace: "pre-wrap",
            }}
          >
            {texts.slice(1).join(' ')}
          </p>
        </div>
      )}

    </div>
  )
}
