import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

export async function POST(request: NextRequest) {
  try {
    const { diaryText, keywords, title } = await request.json()

    if (!diaryText && !keywords && !title) {
      return NextResponse.json({ error: "No diary content provided" }, { status: 400 })
    }

    // AI가 일기 내용과 키워드를 분석해 스타일을 추천
    const result = await generateText({
      model: openai("gpt-4o-mini"),
      messages: [
        {
          role: "user",
          content: `
You are a professional diary designer. Analyze the following diary content and recommend a visual style.

### Diary Information:
- Title: ${title || "제목 없음"}
- Keywords: ${keywords || "키워드 없음"}
- Content preview: ${diaryText || "내용 없음"}

### Your Task:
Based on the mood, emotions, and content of this diary entry, recommend:
1. **backgroundColor**: A hex color code for the page background (subtle, not too bright)
2. **textColor**: A hex color code for the text (must be readable against the background)
3. **fontFamily**: Choose ONE from this list that matches the diary mood:
   - "PretendardVariable" (modern, clean)
   - "Nanum Pen Script" (casual, handwritten)
   - "Cafe24Shiningstar" (elegant, dreamy)
   - "Cafe24고운밤" (soft, gentle)
   - "온글잎 바닷바람" (refreshing, natural)
   - "온글잎 의연체" (calm, mature)
   - "인천교육자람" (friendly, warm)
   - "memomentKkukkkuk" (playful, cute)
   - "샤우팅체" (bold, energetic)
   - "쿨가이체" (cool, trendy)
   - "강원교육현옥샘" (traditional, elegant)
   - "잉크립퀴드체" (artistic, flowing)
   - "국립박물관문화재단클래식M" (classic, refined)

4. **fontSize**: A number between 16-24 (in pixels)

### Style Guidelines:
- For happy/exciting diaries: warm colors, playful fonts
- For calm/peaceful diaries: soft pastels, gentle fonts
- For sad/emotional diaries: cool tones, elegant fonts
- For romantic diaries: soft pinks/purples, dreamy fonts
- For adventure diaries: vibrant colors, bold fonts

### Output format:
Return **only** a valid JSON object:
{
  "backgroundColor": "#hexcode",
  "textColor": "#hexcode",
  "fontFamily": "font name from the list",
  "fontSize": number,
  "reasoning": "brief explanation in Korean"
}

Make sure colors have good contrast for readability.
`,
        },
      ],
      maxTokens: 300,
    })

    // JSON 파싱
    const jsonMatch = result.text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error("Failed to parse JSON from response")
    }

    const parsed = JSON.parse(jsonMatch[0])

    return NextResponse.json({
      success: true,
      recommendation: {
        backgroundColor: parsed.backgroundColor || "#ffffff",
        textColor: parsed.textColor || "#1f2937",
        fontFamily: parsed.fontFamily || "Cafe24Shiningstar",
        fontSize: parsed.fontSize || 18,
      },
      reasoning: parsed.reasoning || "",
    })
  } catch (error) {
    console.error("Error recommending style:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to recommend style"
    }, { status: 500 })
  }
}
