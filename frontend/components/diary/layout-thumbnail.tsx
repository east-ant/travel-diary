"use client"

interface PhotoSlot {
  id: string
  photo?: string
  imageData?: string
  mimeType?: string
}

interface LayoutThumbnailProps {
  layoutType: "family" | "friend" | "couple" | "food" | "group" | "default"
  photoSlots: PhotoSlot[]
  diaryText: string
  title: string
}

function getImageUrl(slot: PhotoSlot): string {
  if (slot.imageData && slot.mimeType) {
    return `data:${slot.mimeType};base64,${slot.imageData}`
  }
  return slot.photo || ""
}

export function LayoutThumbnail({ layoutType, photoSlots, diaryText, title }: LayoutThumbnailProps) {
  const cleanedText = diaryText.replace(/\[([^\]]+)\]/g, '').trim()

  // 텍스트를 사진 수대로 분할하는 함수
  const splitTextByPhotos = (text: string, count: number): string[] => {
    const sentences = text.split(/([.!?]\s+)/).filter(s => s.trim())
    const result: string[] = []
    const sentencesPerPhoto = Math.ceil(sentences.length / count)

    for (let i = 0; i < count; i++) {
      const start = i * sentencesPerPhoto
      const end = Math.min(start + sentencesPerPhoto, sentences.length)
      const chunk = sentences.slice(start, end).join('').trim()
      result.push(chunk || '...')
    }

    return result
  }

  const photoCount = photoSlots.filter(slot => slot.photo || slot.imageData).length
  const textChunks = splitTextByPhotos(cleanedText, Math.max(photoCount, 1))

  // 각 텍스트를 절반만 표시
  const halfTextChunks = textChunks.map(chunk => {
    const words = chunk.split(' ')
    const halfLength = Math.ceil(words.length / 2)
    return words.slice(0, halfLength).join(' ') + (words.length > halfLength ? '...' : '')
  })

  // Family Layout - 가족여행 (FamilyTravelPrint 첫 페이지)
  if (layoutType === "family") {
    return (
      <div
        className="bg-white"
        style={{
          width: "210mm",
          minHeight: "297mm",
          padding: "20mm",
          boxSizing: "border-box",
        }}
      >
        {/* 제목 */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-black mb-4" style={{ fontFamily: "'Cafe24Shiningstar'" }}>{title}</h1>
          <div className="flex items-center justify-center gap-2 mt-2">
            <div className="h-px w-16 bg-gray-400"></div>
            <p className="text-sm text-gray-600" style={{ fontFamily: "'Cafe24Shiningstar'" }}>여행 일기</p>
            <div className="h-px w-16 bg-gray-400"></div>
          </div>
        </div>

        {/* 상단: 큰 사진 + 텍스트 */}
        <div className="flex gap-6 mb-6">
          {/* 큰 사진 */}
          {photoSlots[0] && (photoSlots[0].photo || photoSlots[0].imageData) && (
            <div className="bg-white shadow-lg" style={{ width: "280px", height: "280px", padding: "6px" }}>
              <img src={getImageUrl(photoSlots[0])} alt="" className="w-full h-full object-cover" />
            </div>
          )}
          {/* 텍스트 */}
          <div className="flex-1 flex items-center">
            <p className="text-black text-sm leading-relaxed whitespace-pre-wrap" style={{ fontFamily: "'Cafe24Shiningstar'" }}>
              {halfTextChunks[0]}
            </p>
          </div>
        </div>

        {/* 하단: 작은 사진 3개 + 텍스트 */}
        <div className="space-y-4">
          <div className="flex gap-4 justify-center">
            {photoSlots[1] && (photoSlots[1].photo || photoSlots[1].imageData) && (
              <div>
                <div className="bg-white shadow-lg mb-2" style={{ width: "200px", height: "200px", padding: "6px" }}>
                  <img src={getImageUrl(photoSlots[1])} alt="" className="w-full h-full object-cover" />
                </div>
                <p className="text-black text-xs leading-relaxed" style={{ width: "200px", fontFamily: "'Cafe24Shiningstar'" }}>
                  {halfTextChunks[1]}
                </p>
              </div>
            )}
            {photoSlots[2] && (photoSlots[2].photo || photoSlots[2].imageData) && (
              <div>
                <div className="bg-white shadow-lg mb-2" style={{ width: "200px", height: "200px", padding: "6px" }}>
                  <img src={getImageUrl(photoSlots[2])} alt="" className="w-full h-full object-cover" />
                </div>
                <p className="text-black text-xs leading-relaxed" style={{ width: "200px", fontFamily: "'Cafe24Shiningstar'" }}>
                  {halfTextChunks[2]}
                </p>
              </div>
            )}
            {photoSlots[3] && (photoSlots[3].photo || photoSlots[3].imageData) && (
              <div>
                <div className="bg-white shadow-lg mb-2" style={{ width: "200px", height: "200px", padding: "6px" }}>
                  <img src={getImageUrl(photoSlots[3])} alt="" className="w-full h-full object-cover" />
                </div>
                <p className="text-black text-xs leading-relaxed" style={{ width: "200px", fontFamily: "'Cafe24Shiningstar'" }}>
                  {halfTextChunks[3]}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Friend Layout - 우정여행 (FriendTravelPrint 첫 페이지)
  if (layoutType === "friend") {
    return (
      <div
        className="bg-white"
        style={{
          width: "210mm",
          minHeight: "297mm",
          padding: "20mm",
          boxSizing: "border-box",
        }}
      >
        {/* 제목 */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-black mb-4" style={{ fontFamily: "'Cafe24Shiningstar'" }}>{title}</h1>
          <div className="flex items-center justify-center gap-2 mt-2">
            <div className="h-px w-16 bg-gray-400"></div>
            <p className="text-sm text-gray-600" style={{ fontFamily: "'Cafe24Shiningstar'" }}>여행 일기</p>
            <div className="h-px w-16 bg-gray-400"></div>
          </div>
        </div>

        {/* 사진 + 텍스트 레이아웃 */}
        <div className="space-y-6">
          {photoSlots[0] && (photoSlots[0].photo || photoSlots[0].imageData) && (
            <div className="flex gap-6">
              <div className="bg-white shadow-lg" style={{ width: "220px", height: "220px", padding: "6px" }}>
                <img src={getImageUrl(photoSlots[0])} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 flex items-center">
                <p className="text-black text-sm leading-relaxed whitespace-pre-wrap" style={{ fontFamily: "'Cafe24Shiningstar'" }}>
                  {halfTextChunks[0]}
                </p>
              </div>
            </div>
          )}
          {photoSlots[1] && (photoSlots[1].photo || photoSlots[1].imageData) && (
            <div className="flex gap-6">
              <div className="bg-white shadow-lg" style={{ width: "220px", height: "220px", padding: "6px" }}>
                <img src={getImageUrl(photoSlots[1])} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 flex items-center">
                <p className="text-black text-sm leading-relaxed whitespace-pre-wrap" style={{ fontFamily: "'Cafe24Shiningstar'" }}>
                  {halfTextChunks[1]}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Couple Layout - 커플여행 (CoupleTravelPrint 첫 페이지)
  if (layoutType === "couple") {
    return (
      <div
        className="bg-white"
        style={{
          width: "210mm",
          minHeight: "297mm",
          padding: "20mm",
          boxSizing: "border-box",
        }}
      >
        {/* 제목 */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-black mb-2" style={{ fontFamily: "'Cafe24Shiningstar'" }}>{title}</h2>
          <div className="flex items-center justify-center gap-3 mt-3">
            <div className="h-px w-20 bg-gray-400"></div>
            <p className="text-sm text-gray-600" style={{ fontFamily: "'Cafe24Shiningstar'" }}>여행 일기</p>
            <div className="h-px w-20 bg-gray-400"></div>
          </div>
        </div>

        {/* 사진 1 + 사진 2 겹침 + 텍스트 */}
        <div style={{ marginBottom: "-1px" }}>
          <div className="flex gap-6 items-center">
            {/* 사진 1 + 사진 2 겹침 */}
            <div className="relative flex-shrink-0" style={{ width: "180px", height: "240px" }}>
              {/* 사진 1 (큰 사진) */}
              {photoSlots[0] && (photoSlots[0].photo || photoSlots[0].imageData) && (
                <div
                  className="absolute bg-white shadow-lg"
                  style={{
                    width: "180px",
                    height: "240px",
                    left: 0,
                    top: 0,
                    zIndex: 1,
                    padding: "6px",
                  }}
                >
                  <img
                    src={getImageUrl(photoSlots[0])}
                    className="w-full h-full object-cover"
                    alt=""
                  />
                </div>
              )}

              {/* 사진 2 (작은 사진, 1/4 크기로 겹침) */}
              {photoSlots[1] && (photoSlots[1].photo || photoSlots[1].imageData) && (
                <div
                  className="absolute bg-white shadow-xl"
                  style={{
                    width: "90px",
                    height: "120px",
                    right: "-10px",
                    bottom: "-5px",
                    zIndex: 2,
                    padding: "6px",
                  }}
                >
                  <img
                    src={getImageUrl(photoSlots[1])}
                    className="w-full h-full object-cover"
                    alt=""
                  />
                </div>
              )}
            </div>

            {/* 텍스트 1 */}
            <div className="flex-1 flex items-center">
              <p className="text-black text-sm leading-relaxed whitespace-pre-wrap" style={{ fontFamily: "'Cafe24Shiningstar'" }}>
                {halfTextChunks[0]}
              </p>
            </div>
          </div>

          {/* 텍스트 2 (사진 2 바로 아래) */}
          {halfTextChunks[1] && (
            <div className="px-8" style={{ marginTop: "5px" }}>
              <p className="text-black text-sm leading-relaxed whitespace-pre-wrap" style={{ fontFamily: "'Cafe24Shiningstar'" }}>
                {halfTextChunks[1]}
              </p>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Default Layout - 기본 (PrintableDiaryPage 첫 페이지)
  return (
    <div
      className="bg-white"
      style={{
        width: "210mm",
        minHeight: "297mm",
        padding: "20mm",
        boxSizing: "border-box",
      }}
    >
      {/* 제목 */}
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-black mb-4" style={{ fontFamily: "'Cafe24Shiningstar'" }}>{title}</h1>
        <div className="flex items-center justify-center gap-2 mt-2">
          <div className="h-px w-16 bg-gray-400"></div>
          <p className="text-sm text-gray-600" style={{ fontFamily: "'Cafe24Shiningstar'" }}>여행 일기</p>
          <div className="h-px w-16 bg-gray-400"></div>
        </div>
      </div>

      {/* 사진 + 텍스트 레이아웃 (지그재그) */}
      <div className="space-y-6">
        {/* 첫 번째: 사진1 + 글1 */}
        {photoSlots[0] && (photoSlots[0].photo || photoSlots[0].imageData) && (
          <div className="flex gap-4 items-center">
            <div className="bg-white shadow-lg" style={{ width: "180px", height: "240px", padding: "6px", flexShrink: 0 }}>
              <img src={getImageUrl(photoSlots[0])} alt="" className="w-full h-full object-cover" />
            </div>
            {halfTextChunks[0] && (
              <p className="text-black text-xs leading-relaxed whitespace-pre-wrap flex-1" style={{ fontFamily: "'Cafe24Shiningstar'" }}>
                {halfTextChunks[0]}
              </p>
            )}
          </div>
        )}

        {/* 두 번째: 글2 + 사진2 */}
        {photoSlots[1] && (photoSlots[1].photo || photoSlots[1].imageData) && (
          <div className="flex gap-4 items-start">
            {halfTextChunks[1] && (
              <p className="text-black text-xs leading-relaxed whitespace-pre-wrap flex-1" style={{ fontFamily: "'Cafe24Shiningstar'", marginTop: "40px" }}>
                {halfTextChunks[1]}
              </p>
            )}
            <div className="bg-white shadow-lg" style={{ width: "180px", height: "240px", padding: "6px", flexShrink: 0 }}>
              <img src={getImageUrl(photoSlots[1])} alt="" className="w-full h-full object-cover" />
            </div>
          </div>
        )}

        {/* 세 번째: 사진3 + 글3 */}
        {photoSlots[2] && (photoSlots[2].photo || photoSlots[2].imageData) && (
          <div className="flex gap-4 items-center">
            <div className="bg-white shadow-lg" style={{ width: "180px", height: "240px", padding: "6px", flexShrink: 0 }}>
              <img src={getImageUrl(photoSlots[2])} alt="" className="w-full h-full object-cover" />
            </div>
            {halfTextChunks[2] && (
              <p className="text-black text-xs leading-relaxed whitespace-pre-wrap flex-1" style={{ fontFamily: "'Cafe24Shiningstar'" }}>
                {halfTextChunks[2]}
              </p>
            )}
          </div>
        )}

        {/* 네 번째: 글4 + 사진4 */}
        {photoSlots[3] && (photoSlots[3].photo || photoSlots[3].imageData) && (
          <div className="flex gap-4 items-center">
            {halfTextChunks[3] && (
              <p className="text-black text-xs leading-relaxed whitespace-pre-wrap flex-1" style={{ fontFamily: "'Cafe24Shiningstar'" }}>
                {halfTextChunks[3]}
              </p>
            )}
            <div className="bg-white shadow-lg" style={{ width: "180px", height: "240px", padding: "6px", flexShrink: 0 }}>
              <img src={getImageUrl(photoSlots[3])} alt="" className="w-full h-full object-cover" />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
