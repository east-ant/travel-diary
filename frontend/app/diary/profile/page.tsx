"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/diary/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Calendar, Search } from 'lucide-react'
import { Input } from "@/components/ui/input"
import { useGoogleAuth } from "@/hooks/use-google-auth"
import { useRouter } from "next/navigation"
import { getDiaries, type Diary as ApiDiary } from "@/lib/api-client"

interface Diary {
  id: string
  title: string
  date: string
  photoCount: number
  isCompleted?: boolean
  thumbnailUrl?: string
}

export default function ProfilePage() {
  const { user } = useGoogleAuth()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [diaries, setDiaries] = useState<Diary[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // 다이어리 데이터 가져오기
  useEffect(() => {
    const fetchDiaries = async () => {
      try {
        const userId = localStorage.getItem("userId")
        if (userId) {
          const response = await getDiaries(userId)
          if (response.success && response.data) {
            // API의 Diary 타입을 Sidebar의 Diary 타입으로 변환
            const mappedDiaries: Diary[] = response.data.map((diary: ApiDiary) => ({
              id: diary.id || diary._id || "",
              title: diary.title,
              date: diary.date,
              photoCount: diary.photoSlots?.length || 0,
              isCompleted: diary.isCompleted,
              thumbnailUrl: diary.thumbnailUrl
            }))
            setDiaries(mappedDiaries)
          }
        }
      } catch (error) {
        console.error("다이어리 로드 실패:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDiaries()
  }, [])

  const filteredDiaries = diaries.filter((diary) =>
    diary.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    diary.date.includes(searchQuery)
  )

  const handleSelectDiary = (diaryId: string) => {
    console.log("프로필에서 선택한 일기 ID:", diaryId)
    router.push(`/diary?id=${diaryId}`)
  }

  const handleNewDiary = () => {
    router.push('/diary')
  }

  const handleDeleteDiary = async (diaryId: string) => {
    // 삭제 로직은 필요시 구현
    console.log("Delete diary:", diaryId)
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        onNewDiary={handleNewDiary}
        diaries={diaries}
        currentDiaryId={null}
        onSelectDiary={handleSelectDiary}
        onDeleteDiary={handleDeleteDiary}
        onNavigateToDashboard={() => router.push("/")}
      />

      <div className={`flex-1 overflow-y-auto transition-all duration-300 ${isSidebarOpen ? "ml-80" : "ml-16"}`}>
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* 프로필 헤더 */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-8">
                <Avatar className="h-32 w-32 border-4 border-gray-100">
                  <AvatarImage src={user?.picture || "/placeholder.svg"} />
                  <AvatarFallback className="bg-[#8B7355] text-white text-4xl font-semibold">
                    {user?.name?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>

                <div>
                  <h2 className="text-2xl font-bold mb-1 text-gray-900">{user?.name || "사용자"}</h2>
                  <p className="text-blue-600 text-sm">{user?.email || "이메일 없음"}</p>
                </div>
              </div>

              <div className="text-center px-6 py-3 bg-gray-50 rounded-lg border border-gray-200 h-fit">
                <div className="text-2xl font-bold text-gray-900">{diaries.length}</div>
                <div className="text-xs text-gray-600">총 일기</div>
              </div>
            </div>

            {/* 검색 */}
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="일기 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-gray-50 border-gray-200 focus:border-gray-300 focus:ring-gray-300"
              />
            </div>
          </div>

          {/* 탭 */}
          <div className="border-t border-gray-200 mb-1">
            <div className="flex justify-center">
              <button className="flex items-center gap-2 px-4 py-3 border-t-2 border-gray-900 -mt-px">
                <Calendar className="h-4 w-4" />
                <span className="text-gray-900 font-semibold uppercase tracking-wider text-sm">일기</span>
              </button>
            </div>
          </div>

          {/* 일기 그리드 */}
          <div className="grid grid-cols-3 gap-1">
            {filteredDiaries.map((diary) => (
              <button
                key={diary.id}
                onClick={() => handleSelectDiary(diary.id)}
                className="aspect-square relative overflow-hidden group cursor-pointer bg-gray-200 block hover:opacity-80 transition-opacity"
              >
                <img
                  src={diary.thumbnailUrl || "/placeholder.svg"}
                  alt={diary.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                />

                {/* 항상 표시되는 날짜 */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                  <p className="text-white text-sm font-medium">{diary.date}</p>
                </div>

                {/* 호버 시 제목 표시 */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <p className="text-white text-lg font-bold px-4 text-center line-clamp-2">{diary.title}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
