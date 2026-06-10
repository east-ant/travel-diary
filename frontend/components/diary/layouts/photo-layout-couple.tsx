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

interface PhotoLayoutCoupleProps {
  photos: PhotoSlot[]
  texts: string[]
  getImageUrl: (slot: PhotoSlot) => string
  fontFamily: string
  fontSize: number
  textColor: string
}

/**
 * 커플 레이아웃 사진 배치
 * - 사진 2개씩 겹쳐서 배치 (큰 사진 + 작은 사진 오버랩)
 */
export function PhotoLayoutCouple({
  photos,
  texts,
  getImageUrl,
  fontFamily,
  fontSize,
  textColor
}: PhotoLayoutCoupleProps) {
  return (
    <div className="space-y-6">
      {/* 첫 번째, 두 번째 사진 (가로 배치) */}
      {photos[0] && (
        <div className="flex gap-4">
          {/* 첫 번째 사진 + 두 번째 사진 겹침 */}
          <div className="flex-shrink-0 relative" style={{ zIndex: 1 }}>
            <div
              className="bg-white shadow-lg overflow-hidden"
              style={{
                width: "50mm",
                height: "70mm",
                border: "4px solid white",
              }}
            >
              <img
                src={getImageUrl(photos[0])}
                className="w-full h-full object-cover"
                alt="photo-0"
              />
            </div>

            {/* 두 번째 사진을 첫 번째 사진 아래에 겹쳐서 배치 */}
            {photos[1] && (
              <div
                className="absolute bg-white shadow-xl overflow-hidden"
                style={{
                  width: "25mm",
                  height: "35mm",
                  bottom: "-3mm",
                  right: "-3mm",
                  zIndex: 2,
                  border: "4px solid white",
                }}
              >
                <img
                  src={getImageUrl(photos[1])}
                  className="w-full h-full object-cover"
                  alt="photo-1"
                />
              </div>
            )}
          </div>

          {/* 첫 번째, 두 번째 사진의 일기 내용 (합쳐서) */}
          {(texts[0] || texts[1]) && (
            <div className="flex-1 flex flex-col justify-center" style={{ zIndex: 3 }}>
              {/* 첫 번째, 두 번째 사진 키워드 */}
              {((photos[0]?.keywords && photos[0].keywords.length > 0) || (photos[1]?.keywords && photos[1].keywords.length > 0)) && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {[...(photos[0]?.keywords || []), ...(photos[1]?.keywords || [])]
                    .filter((kw, idx, arr) => arr.indexOf(kw) === idx)
                    .slice(0, 5)
                    .map((keyword: string, kidx: number) => (
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

              <p
                className="leading-relaxed"
                style={{ fontFamily: `'${fontFamily}'`, fontSize: `${fontSize}px`, color: textColor }}
              >
                {[texts[0], texts[1]].filter(Boolean).join(' ')}
              </p>
            </div>
          )}
        </div>
      )}

      {/* 세 번째, 네 번째 사진 (같은 방식) */}
      {photos[2] && (
        <div className="flex gap-4">
          <div className="flex-shrink-0 relative" style={{ zIndex: 1 }}>
            <div
              className="bg-white shadow-lg overflow-hidden"
              style={{
                width: "50mm",
                height: "70mm",
                border: "4px solid white",
              }}
            >
              <img
                src={getImageUrl(photos[2])}
                className="w-full h-full object-cover"
                alt="photo-2"
              />
            </div>

            {photos[3] && (
              <div
                className="absolute bg-white shadow-xl overflow-hidden"
                style={{
                  width: "25mm",
                  height: "35mm",
                  bottom: "-3mm",
                  right: "-3mm",
                  zIndex: 2,
                  border: "4px solid white",
                }}
              >
                <img
                  src={getImageUrl(photos[3])}
                  className="w-full h-full object-cover"
                  alt="photo-3"
                />
              </div>
            )}
          </div>

          {(texts[2] || texts[3]) && (
            <div className="flex-1 flex flex-col justify-center" style={{ zIndex: 3 }}>
              {((photos[2]?.keywords && photos[2].keywords.length > 0) || (photos[3]?.keywords && photos[3].keywords.length > 0)) && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {[...(photos[2]?.keywords || []), ...(photos[3]?.keywords || [])]
                    .filter((kw, idx, arr) => arr.indexOf(kw) === idx)
                    .slice(0, 5)
                    .map((keyword: string, kidx: number) => (
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

              <p
                className="leading-relaxed"
                style={{ fontFamily: `'${fontFamily}'`, fontSize: `${fontSize}px`, color: textColor }}
              >
                {[texts[2], texts[3]].filter(Boolean).join(' ')}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
