"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useRouter } from 'next/navigation'
import { useGoogleAuth } from "@/hooks/use-google-auth"
import { Sparkles, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'

export default function Home() {
  const router = useRouter()
  const { user, loading, signOut } = useGoogleAuth()
  const [currentIndex, setCurrentIndex] = useState(4) // 중간 세트부터 시작
  const carouselRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [scrollLeft, setScrollLeft] = useState(0)

  const handleLogout = async () => {
    await signOut()
    router.push("/")
  }

  const diaryExamples = [
    {
      image: "/images/di1.png",
      title: "경주여행"
    },
    {
      image: "/images/di2.jpg",
      title: "Trip"
    },
    {
      image: "/images/di3.jpg",
      title: "부산여행"
    },
    {
      image: "/images/di4.jpg",
      title: "여행일기"
    },
    {
      image: "/images/di5.png",
      title: "여행일기"
    }
  ]

  const scrollCarousel = (direction: 'left' | 'right') => {
    setCurrentIndex(prev => direction === 'right' ? prev + 1 : prev - 1)
  }

  // 무한 루프를 위한 useEffect
  useEffect(() => {
    // 끝에 도달하면 중간으로 리셋 (transition 없이)
    if (currentIndex >= diaryExamples.length * 2) {
      const timer = setTimeout(() => {
        setCurrentIndex(diaryExamples.length)
      }, 500) // transition 후에 리셋
      return () => clearTimeout(timer)
    } else if (currentIndex < diaryExamples.length) {
      const timer = setTimeout(() => {
        setCurrentIndex(diaryExamples.length * 2 - 1)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [currentIndex, diaryExamples.length])

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setStartX(e.pageX - (carouselRef.current?.offsetLeft || 0))
    setScrollLeft(carouselRef.current?.scrollLeft || 0)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    e.preventDefault()
    const x = e.pageX - (carouselRef.current?.offsetLeft || 0)
    const walk = (x - startX) * 2
    if (carouselRef.current) {
      carouselRef.current.scrollLeft = scrollLeft - walk
    }
  }

  const handleMouseUp = () => {
    if (!isDragging) return
    setIsDragging(false)

    // Snap to nearest card
    if (carouselRef.current) {
      const cardWidth = 460 + 24 // card width + gap
      const scrollPosition = carouselRef.current.scrollLeft
      const newIndex = Math.round(scrollPosition / cardWidth) % diaryExamples.length
      setCurrentIndex(newIndex)
    }
  }

  const handleMouseLeave = () => {
    if (isDragging) {
      setIsDragging(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header - 기존 헤더 유지 */}
      <header className="border-b border-gray-200 bg-white">
        <div className="container mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image
              src="/images/pplane.png"
              alt="TRAVELY Logo"
              width={80}
              height={70}
              className="object-contain"
            />
            
          </div>

          {loading && (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            </div>
          )}

          {!loading && !user && (
            <div className="flex items-center gap-3 px-5 ">

              <Button
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-base"
                onClick={() => router.push('/login')}
              >
                로그인
              </Button>
            </div>
          )}

          {!loading && user && (
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => router.push('/diary')}
                className="hidden sm:flex px-6 py-5 text-base"
              >
                내 다이어리
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-3 hover:opacity-80 transition-opacity px-3 py-2">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={user.picture || "/placeholder.svg"} alt={user.name} />
                      <AvatarFallback className="bg-blue-600 text-white">
                        {user.name?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:block text-base font-medium text-gray-900">
                      {user.name}
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>

                  <DropdownMenuItem onClick={() => router.push('/diary/profile')}>
                    프로필 가기
                  </DropdownMenuItem>

                  <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                    로그아웃
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gray-100 py-20">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="flex-1 space-y-6">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 text-balance">
                어떤의 모든 순간
              </h1>
              <p className="text-gray-600 text-lg">
                사진 한 장, 생각 한 줄이면 충분해요
              </p>
              <p className="text-gray-600">
                일상 속 순간들을 기록하고 추억하세요.
              </p>
              <p className="text-gray-600 mb-8">
                AI가 당신의 이야기를 더욱 풍성하게 만들어드립니다.
              </p>

              <div className="flex items-center gap-3">
                <Button
                  size="lg"
                  className="bg-gray-900 hover:bg-gray-800 text-white rounded-full px-8 text-base"
                  onClick={() => router.push(user ? '/diary' : '/login')}
                >
                  시작 하기
                </Button>
              </div>
            </div>

            {/* 🖼️ 사진 삽입 위치 1: Hero Section 이미지 */}
            <div className="flex-1 flex justify-center md:justify-end">
              <div className="relative w-160 h-90 bg-white rounded-3xl shadow-2xl overflow-hidden flex items-center justify-center">
                <Image
                  src="/images/main2.jpg"
                  alt="AI Diary Hero"
                  width={300}
                  height={400}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Section 1 */}
      <section id="features" className="bg-[#1a1d2e] text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-4">
                <span className="text-blue-400 text-sm font-medium">기능 01</span>
                <h2 className="text-3xl md:text-4xl font-bold text-balance">
                  사진 한 장으로<br />완벽한 일기 완성
                </h2>
                <p className="text-gray-300 leading-relaxed">
                  사진을 올리면 AI가 자동으로 분석해 감정, 장소, 상황을 파악합니다. 간단한 메모만 추가하면 완성도 높은 일기가 완성됩니다. 매일 기록하는 것이 더 이상 부담스럽지 않아요.
                </p>
              </div>

              {/* 🖼️ 사진 삽입 위치 2: 기능 01 이미지 */}
              <div className="flex justify-center">
                <div className="w-full max-w-md  h-80 bg-[#252841] rounded-2xl overflow-hidden border border-purple-500/20">
                  <img
                    src="/images/main1.jpg"
                    alt="사진 한 장으로 완벽한 일기 완성"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Section 2 */}
      <section className="bg-[#1a1d2e] text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              {/* 🖼️ 사진 삽입 위치 3: 기능 02 이미지 */}
              <div className="flex justify-center order-2 md:order-1">
                <div className="w-full max-w-md h-80 bg-[#2d2442] rounded-2xl overflow-hidden border border-purple-500/20">
                  <img
                    src="/images/aa_text.png"
                    alt="AI가 당신의 이야기를 완성합니다"
                    className="w-full h-full object-fill"
                  />
                </div>
              </div>

              <div className="space-y-4 order-1 md:order-2">
                <span className="text-blue-400 text-sm font-medium">기능 02</span>
                <h2 className="text-3xl md:text-4xl font-bold text-balance">
                  AI가 당신의<br />이야기를 완성합니다
                </h2>
                <p className="text-gray-300 leading-relaxed">
                  짧은 문장만 작성해도 AI가 맥락을 이해하고 자연스러운 문장으로 확장해드립니다. 감정 표현이 서툴러도 괜찮아요. AI가 당신의 하루를 더 풍부한 이야기로 만들어줍니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Section 3 */}
      <section className="bg-[#1a1d2e] text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-4">
                <span className="text-blue-400 text-sm font-medium">기능 03</span>
                <h2 className="text-3xl md:text-4xl font-bold text-balance">
                  시간 순으로 정리된<br />하루의 기록
                </h2>
                <p className="text-gray-300 leading-relaxed">
                  날짜별로 깔끔하게 정리된 일기를 한눈에 확인하세요. 과거의 추억을 쉽게 되돌아볼 수 있고, 감정의 변화와 성장을 시각적으로 파악할 수 있습니다.
                </p>
              </div>

              {/* 🖼️ 사진 삽입 위치 4: 기능 03 이미지 */}
              <div className="flex justify-center">
                <div className="w-full max-w-md h-80 bg-[#1e2d3d] rounded-2xl overflow-hidden border border-blue-500/20">
                  <img
                    src="/images/main4.png"
                    alt="시간 순으로 정리된 하루의 기록"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* All Features Section */}
      <section className="bg-white py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
              모든 기능, 하나로
            </h2>
            <p className="text-gray-600">
              당신의 여행 일기를 더욱 특별하게
            </p>
          </div>

          <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-6">
            {/* AI 키워드 분석 */}
            <Card className="p-8 hover:shadow-lg transition-shadow border border-gray-200">
              <div className="mb-4">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-gray-900" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">AI 키워드 분석</h3>
              <p className="text-gray-600 leading-relaxed">
                당신의 하루를 이해하고 감정을 담아 자연스러운 일기로 작성합니다.
              </p>
            </Card>

            {/* 다양한 스타일 */}
            <Card className="p-8 hover:shadow-lg transition-shadow border border-gray-200">
              <div className="mb-4">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">다양한 스타일</h3>
              <p className="text-gray-600 leading-relaxed">
                감성적, 간결함, 재미있는 등 원하는 톤 일기로 일기를 작성할 수 있습니다.
              </p>
            </Card>

            {/* 빠른 작성 */}
            <Card className="p-8 hover:shadow-lg transition-shadow border border-gray-200">
              <div className="mb-4">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">빠른 작성</h3>
              <p className="text-gray-600 leading-relaxed">
                몇 가지 키워드만 입력하면 30초 안에 완성된 일기를 받아볼 수 있습니다.
              </p>
            </Card>

            {/* 프라이버시 보호 */}
            <Card className="p-8 hover:shadow-lg transition-shadow border border-gray-200">
              <div className="mb-4">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">프라이버시 보호</h3>
              <p className="text-gray-600 leading-relaxed">
                모든 일기는 완호화되어 저장되며 오직 당신만 볼 수 있습니다.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Diary Examples Section */}
      <section className="bg-gray-100 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
              AI가 완성한 일기
            </h2>
            <p className="text-gray-600">
              당신의 여행을 아름다운 이야기로
            </p>
          </div>

          <div className="relative max-w-6xl mx-auto">
            <button
              onClick={() => scrollCarousel('left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow-lg rounded-full p-3 transition-all hover:scale-110 -ml-4"
              aria-label="Previous"
            >
              <ChevronLeft className="w-6 h-6 text-gray-900" />
            </button>

            <div className="overflow-hidden px-4">
              <div
                ref={carouselRef}
                className="flex gap-6 cursor-grab active:cursor-grabbing select-none"
                style={{
                  transform: `translateX(-${currentIndex * 484}px)`,
                  transition: isDragging ? 'none' : 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeave}
              >
                {[...diaryExamples, ...diaryExamples, ...diaryExamples].map((diary, index) => (
                  <Card
                    key={index}
                    className="flex-shrink-0 w-[460px] h-[630px] border-0 overflow-hidden group shadow-xl"
                  >
                    <img
                      src={diary.image || "/placeholder.svg"}
                      alt={diary.title}
                      className="w-full h-full object-cover object-top pointer-events-none scale-150 group-hover:scale-[1.7] transition-transform duration-500 origin-top"
                      draggable="false"
                    />
                  </Card>
                ))}
              </div>
            </div>

            <button
              onClick={() => scrollCarousel('right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow-lg rounded-full p-3 transition-all hover:scale-110 -mr-4"
              aria-label="Next"
            >
              <ChevronRight className="w-6 h-6 text-gray-900" />
            </button>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="bg-gray-50 py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 text-balance">
            당신의 모든 순간을 기록하세요
          </h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            AI와 함께라면 일기 쓰기가 더 이상 어렵지 않습니다.<br />
            지금 바로 시작해보세요.
          </p>

          <Button
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-12 py-6 text-lg"
            onClick={() => router.push(user ? '/diary' : '/login')}
          >
            지금 시작하기
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#1a1d2e] text-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold">AI Diary</span>
            </div>

            <p className="text-sm text-gray-400">
              © 2025 AI Diary. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  )
}
