"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Calendar, ImageIcon, Printer, FileDown, ArrowLeft } from "lucide-react"
import { printDiary, getPrinterStatus } from "@/lib/print-client"
import { getUserId } from "@/lib/api-client"

interface CompletedDiaryViewerProps {
  diaryId: string
  onBack: () => void
}

export function CompletedDiaryViewer({ diaryId, onBack }: CompletedDiaryViewerProps) {
  const [diaryData, setDiaryData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [printablePages, setPrintablePages] = useState<Array<{ imageData: string; pageNumber: number }>>([])
  const [isPrinting, setIsPrinting] = useState(false)
  const [printerStatus, setPrinterStatus] = useState<string>("unknown")

  useEffect(() => {
    async function loadCompletedDiary() {
      try {
        console.log("📥 완료된 다이어리 로딩:", diaryId)

        const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001"
        const res = await fetch(`${API_BASE_URL}/api/diaries/${diaryId}`)
        const data = await res.json()

        if (data.success) {
          console.log("✅ 다이어리 데이터:", data.data)
          setDiaryData(data.data)

          try {
            const printRes = await fetch(`${API_BASE_URL}/api/diaries/printable/${diaryId}`)
            const printData = await printRes.json()

            if (printData.success && printData.data?.pages) {
              const pages = printData.data.pages.map((page: any) => ({
                imageData: `data:${printData.data.mimeType};base64,${page.imageData}`,
                pageNumber: page.pageNumber
              }))
              setPrintablePages(pages)
              console.log(`✅ 저장된 인쇄 이미지 로드 완료 (${pages.length}페이지)`)
            } else {
              console.log("ℹ️ 저장된 인쇄 이미지 없음")
            }
          } catch (e) {
            console.log("ℹ️ 저장된 인쇄 이미지 로드 실패:", e)
          }
        }
      } catch (e) {
        console.error("❌ 다이어리 로딩 오류:", e)
      } finally {
        setLoading(false)
      }
    }

    loadCompletedDiary()
  }, [diaryId])

  useEffect(() => {
    async function checkPrinter() {
      const status = await getPrinterStatus()
      if (status.success && status.data) {
        setPrinterStatus(status.data.online ? "online" : "offline")
      }
    }
    checkPrinter()
  }, [])

  const handlePrint = async () => {
    const userId = getUserId()
    if (!userId) {
      alert("사용자 정보를 찾을 수 없습니다.")
      return
    }

    if (!diaryData || printablePages.length === 0) {
      alert("인쇄할 다이어리가 없습니다.")
      return
    }

    setIsPrinting(true)

    try {
      console.log("🖨️  인쇄 요청 시작...")

      const result = await printDiary({
        diaryId,
        userId
      })

      if (result.success) {
        alert(`인쇄 요청이 접수되었습니다.\n작업 ID: ${result.jobId}\n총 ${result.totalPages || printablePages.length}페이지`)
        console.log("✅ 인쇄 요청 완료:", result)
      } else {
        alert(`인쇄 요청 실패: ${result.error || "알 수 없는 오류"}`)
        console.error("❌ 인쇄 요청 실패:", result)
      }
    } catch (error) {
      console.error("❌ 인쇄 오류:", error)
      alert("인쇄 중 오류가 발생했습니다.")
    } finally {
      setIsPrinting(false)
    }
  }

  const handleSavePDF = () => {
    window.print()
  }


  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">다이어리를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (!diaryData) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">다이어리를 찾을 수 없습니다.</p>
          <Button onClick={onBack}>돌아가기</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* 헤더 */}
      <div className="flex-shrink-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-semibold text-foreground">
                {diaryData.title}
              </h1>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{diaryData.date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" />
                  <span>{diaryData.photoSlots?.length || 0}장</span>
                </div>
              </div>

              <Button
                onClick={handlePrint}
                disabled={isPrinting || printablePages.length === 0}
                className="gap-2"
                variant="default"
              >
                <Printer className="w-4 h-4" />
                {isPrinting ? "인쇄 중..." : "인쇄하기"}
              </Button>

              <Button
                onClick={handleSavePDF}
                disabled={printablePages.length === 0}
                className="gap-2"
                variant="outline"
              >
                <FileDown className="w-4 h-4" />
                PDF로 저장
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 메인 컨텐츠 - 세로 스크롤 가능 */}
      <div className="flex-1 overflow-y-auto bg-gradient-to-b from-background to-secondary/10">
        <div className="w-full py-8">
          <div className="max-w-3xl mx-auto px-6 space-y-8">
            {printablePages.length > 0 ? (
              printablePages.map((page, idx) => (
                <div key={idx} className="bg-white rounded-xl shadow-2xl overflow-hidden border border-border">
                  <img
                    src={page.imageData}
                    alt={`${diaryData.title} - 페이지 ${page.pageNumber}`}
                    className="w-full h-auto"
                    style={{
                      display: 'block',
                      width: '100%',
                      height: 'auto'
                    }}
                  />
                </div>
              ))
            ) : (
              <div className="bg-white rounded-xl shadow-2xl p-12 border border-border">
                <div className="text-center text-muted-foreground space-y-4">
                  <p className="mb-4 text-lg">아직 저장된 다이어리가 없습니다.</p>
                  <p className="text-sm">"작성 완료" 버튼을 눌러 다이어리를 저장해주세요.</p>
                  <Button onClick={onBack} className="mt-4">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    돌아가기
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 인쇄 스타일 */}
      <style jsx global>{`
        @media print {
          /* 사이드바 완전히 숨기기 */
          .diary-sidebar,
          aside {
            display: none !important;
            visibility: hidden !important;
          }

          /* 헤더 숨기기 */
          .flex-shrink-0 {
            display: none !important;
          }

          /* body와 전체 레이아웃 리셋 */
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }

          /* 메인 컨텐츠 영역 왼쪽으로 당기기 */
          .flex-1 {
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
            margin-left: 0 !important;
          }

          .w-full {
            padding: 0 !important;
            margin: 0 !important;
          }

          .py-8 {
            padding: 0 !important;
          }

          .max-w-3xl {
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
          }

          .px-6 {
            padding: 0 !important;
          }

          .space-y-8 {
            margin: 0 !important;
          }

          /* 일기 컨텐츠 스타일 */
          .print-content {
            border-radius: 0 !important;
            box-shadow: none !important;
            border: none !important;
            margin: 0 !important;
            padding: 0 !important;
            page-break-after: always;
            page-break-inside: avoid;
          }

          .print-content img {
            width: 100% !important;
            height: auto !important;
            display: block;
            margin: 0 !important;
            padding: 0 !important;
          }

          /* 페이지 설정 */
          @page {
            size: A4;
            margin: 0;
          }
        }
      `}</style>
    </div>
  )
}