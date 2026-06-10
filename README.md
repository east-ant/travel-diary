# AI Diary 배포 가이드

이 문서는 AI Diary 프로젝트를 Vercel(프론트엔드)과 Render(백엔드)로 배포하는 방법을 설명합니다.

## 📋 목차
1. [사전 준비](#사전-준비)
2. [백엔드 배포 (Render)](#백엔드-배포-render)
3. [프론트엔드 배포 (Vercel)](#프론트엔드-배포-vercel)
4. [배포 후 설정](#배포-후-설정)
5. [문제 해결](#문제-해결)

---

## 사전 준비

### 필요한 계정
- [Render](https://render.com) 계정
- [Vercel](https://vercel.com) 계정
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) 계정
- GitHub 계정 (코드 저장소 연동용)

### 필요한 API 키
- OpenAI API Key
- Google Client ID (Google 로그인용)
- Kakao REST API Key (Kakao 로그인용)
- MongoDB Connection String

---

## 백엔드 배포 (Render)

### 1단계: GitHub에 코드 푸시

먼저 프로젝트를 GitHub 저장소에 푸시합니다.

```bash
# Git 초기화 (아직 안 했다면)
git init

# .gitignore 확인 (.env 파일이 제외되어 있는지 확인)
# .env 파일은 절대 커밋하지 마세요!

# 변경사항 추가
git add .

# 커밋
git commit -m "Initial commit for deployment"

# GitHub 저장소 생성 후 연결
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# 푸시
git push -u origin main
```

### 2단계: Render에서 백엔드 배포

1. [Render Dashboard](https://dashboard.render.com/)에 로그인
2. **New +** 버튼 클릭 → **Web Service** 선택
3. GitHub 저장소 연결
4. 다음 설정 입력:

   **기본 설정:**
   - **Name**: `ai-diary-backend` (원하는 이름)
   - **Region**: `Singapore` (한국과 가까운 지역)
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

   **환경 변수 (Environment Variables):**
   - `MONGODB_URI`: MongoDB Atlas 연결 문자열
   - `NODE_ENV`: `production`

5. **Plan**: `Free` 선택
6. **Create Web Service** 클릭

### 3단계: 배포 확인

배포가 완료되면 Render에서 URL을 제공합니다.
- 형식: `https://ai-diary-backend-XXXXX.onrender.com`
- 이 URL을 복사해두세요 (프론트엔드 설정에 필요)

**테스트:**
브라우저에서 `https://YOUR-BACKEND-URL.onrender.com/api/diaries/list/test` 접속
→ 빈 배열 `{"success": true, "data": []}` 응답이 오면 성공!

---

## 프론트엔드 배포 (Vercel)

### 1단계: Vercel에 프로젝트 연결

1. [Vercel Dashboard](https://vercel.com/dashboard)에 로그인
2. **Add New...** → **Project** 클릭
3. GitHub 저장소 선택
4. 다음 설정 입력:

   **Framework Preset**: `Next.js`

   **Root Directory**: `frontend` (중요!)

   **Environment Variables** (환경 변수 추가):
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id_here
   NEXT_PUBLIC_KAKAO_REST_API_KEY=your_kakao_rest_api_key_here
   NEXT_PUBLIC_BACKEND_URL=https://YOUR-BACKEND-URL.onrender.com
   ```

5. **Deploy** 클릭

### 2단계: 배포 확인

배포가 완료되면 Vercel에서 URL을 제공합니다.
- 형식: `https://your-project.vercel.app`

---

## 배포 후 설정

### 백엔드 CORS 설정 업데이트

백엔드의 [server.js](backend/server.js:16)에서 CORS 설정을 업데이트해야 합니다.

```javascript
app.use(cors({
  origin: [
    "http://localhost:3000",
    "https://your-project.vercel.app",  // Vercel 프론트엔드 URL 추가
    "https://ai-diary-merge.vercel.app",
    "https://ai-diary27.vercel.app"
  ],
  credentials: true,
}));
```

**변경 후:**
1. 변경사항을 GitHub에 커밋 & 푸시
2. Render가 자동으로 재배포합니다 (약 2-3분 소요)

### MongoDB Atlas IP 화이트리스트 설정

1. [MongoDB Atlas](https://cloud.mongodb.com/) 로그인
2. 클러스터 선택 → **Network Access** 탭
3. **Add IP Address** 클릭
4. **Allow Access from Anywhere** 선택 (0.0.0.0/0)
   - 또는 Render의 IP 주소 추가 (더 안전)
5. **Confirm** 클릭

### Google OAuth 리다이렉트 URI 추가

1. [Google Cloud Console](https://console.cloud.google.com/)
2. 프로젝트 선택 → **APIs & Services** → **Credentials**
3. OAuth 2.0 Client ID 선택
4. **Authorized redirect URIs**에 추가:
   ```
   https://your-project.vercel.app
   https://your-project.vercel.app/api/auth/callback/google
   ```
5. **Save** 클릭

---

## 문제 해결

### 백엔드 연결 실패

**증상**: 프론트엔드에서 백엔드 API 호출 실패

**해결 방법**:
1. Vercel 환경 변수 확인:
   - `NEXT_PUBLIC_BACKEND_URL`이 올바른 Render URL인지 확인
2. Render 로그 확인:
   - Render Dashboard → 서비스 선택 → **Logs** 탭
3. CORS 설정 확인:
   - [server.js](backend/server.js:16)에 Vercel URL이 추가되었는지 확인

### MongoDB 연결 실패

**증상**: `MongoServerError: bad auth` 또는 연결 타임아웃

**해결 방법**:
1. MongoDB Atlas에서 **Network Access** 확인 (IP 화이트리스트)
2. Render 환경 변수에서 `MONGODB_URI` 확인
3. MongoDB Atlas 사용자 권한 확인

### Render 무료 플랜 제한사항

**주의**: Render 무료 플랜은 15분간 요청이 없으면 서버가 슬립 모드로 전환됩니다.

**영향**:
- 첫 요청 시 약 30-60초 정도 지연 발생 (콜드 스타트)

**해결 방법**:
- 유료 플랜으로 업그레이드
- 또는 외부 서비스(UptimeRobot 등)로 주기적으로 핑 보내기

### 업로드된 이미지가 사라짐

**증상**: 업로드한 사진이 일정 시간 후 사라짐

**원인**: Render 무료 플랜은 파일 시스템이 임시(ephemeral)입니다.

**해결 방법**:
- 현재 구현: 이미지를 MongoDB에 Base64로 저장 (이미 적용됨)
- 또는 AWS S3, Cloudinary 등 외부 스토리지 사용

### Python 모델 실행 실패

**증상**: 카테고리 분류가 작동하지 않음

**원인**: Render 서버에 Python 및 필요한 라이브러리가 설치되지 않음

**해결 방법**:
1. `backend` 폴더에 `requirements.txt` 생성:
   ```
   tensorflow==2.x.x
   numpy==1.x.x
   # 필요한 Python 패키지 추가
   ```

2. Render Build Command 변경:
   ```bash
   pip install -r requirements.txt && npm install
   ```

3. 또는 Python 모델을 비활성화하고 기본 카테고리 사용

---

## 배포 체크리스트

배포 전 확인사항:

### 백엔드
- [ ] `.env` 파일이 `.gitignore`에 포함되어 있음
- [ ] `package.json`에 `start` 스크립트 추가됨
- [ ] MongoDB Atlas IP 화이트리스트 설정 완료
- [ ] 환경 변수가 Render에 올바르게 설정됨

### 프론트엔드
- [ ] `.env.local` 파일이 `.gitignore`에 포함되어 있음
- [ ] 환경 변수가 Vercel에 올바르게 설정됨
- [ ] `NEXT_PUBLIC_BACKEND_URL`이 Render URL로 설정됨
- [ ] Google OAuth 리다이렉트 URI 추가됨

### 배포 후
- [ ] 백엔드 CORS에 Vercel URL 추가됨
- [ ] 회원가입/로그인 테스트 완료
- [ ] 사진 업로드 테스트 완료
- [ ] 다이어리 생성/조회/삭제 테스트 완료

---

## 유용한 명령어

### Render 로그 확인
Render Dashboard → 서비스 선택 → **Logs** 탭

### Vercel 로그 확인
Vercel Dashboard → 프로젝트 선택 → **Deployments** → 특정 배포 클릭 → **Function Logs**

### 환경 변수 업데이트 후
- **Vercel**: 자동 재배포됨
- **Render**: 수동으로 **Manual Deploy** → **Clear build cache & deploy** 클릭

---

## 추가 리소스

- [Render 공식 문서](https://render.com/docs)
- [Vercel 공식 문서](https://vercel.com/docs)
- [Next.js 배포 가이드](https://nextjs.org/docs/deployment)
- [MongoDB Atlas 문서](https://docs.atlas.mongodb.com/)

---

## 지원

문제가 발생하면 다음을 확인하세요:
1. Render/Vercel 로그
2. 브라우저 개발자 도구 콘솔
3. 환경 변수 설정
4. CORS 및 네트워크 설정

행운을 빕니다! 🚀
