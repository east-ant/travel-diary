# 라즈베리파이 프린터 서버 설정 가이드

이 가이드는 라즈베리파이에서 포토프린터 서버를 설정하는 방법을 설명합니다.

## 📋 사전 요구사항

- Raspberry Pi (3 이상 권장)
- Canon SELPHY CP1500 포토프린터 (또는 호환 프린터)
- Node.js 14 이상 설치됨
- 라즈베리파이가 인터넷에 연결되어 있어야 함

---

## 🚀 설치 단계

### 1단계: 프로젝트 파일 전송

라즈베리파이에 `raspberry-pi` 폴더를 복사합니다.

**방법 1: USB 또는 SD카드 사용**
```bash
# raspberry-pi 폴더를 라즈베리파이의 홈 디렉토리에 복사
```

**방법 2: Git 사용 (추천)**
```bash
cd ~
git clone https://github.com/Hu-reung/travely-backend.git
cd travely-backend/raspberry-pi
```

**방법 3: SCP 사용 (다른 컴퓨터에서)**
```bash
scp -r raspberry-pi/ pi@raspberrypi.local:~/
```

### 2단계: 의존성 설치

라즈베리파이 터미널에서:

```bash
cd ~/raspberry-pi
npm install
```

### 3단계: 환경 변수 설정

`.env` 파일이 이미 생성되어 있습니다. 필요시 수정하세요:

```bash
nano .env
```

**현재 설정:**
```
BACKEND_URL=https://travely-backend-sk2w.onrender.com
PORT=3002
PRINTER_NAME=Photo_Printer
```

### 4단계: 프린터 연결

1. Canon SELPHY CP1500을 USB로 라즈베리파이에 연결
2. 프린터 전원 켜기
3. 프린터 연결 확인:

```bash
lpstat -p -d
```

### 5단계: 프린터 서버 실행

**일반 실행:**
```bash
node print-server.js
```

**백그라운드 실행 (PM2 사용):**

PM2 설치:
```bash
sudo npm install -g pm2
```

서버 시작:
```bash
pm2 start print-server.js --name "print-server"
pm2 save
pm2 startup
```

PM2 상태 확인:
```bash
pm2 status
pm2 logs print-server
```

서버 중지:
```bash
pm2 stop print-server
```

---

## 🔧 설정 확인

### 프린터 서버 상태 확인

라즈베리파이에서:
```bash
curl http://localhost:3002/api/printer/status
```

### 백엔드에서 프린터 연결 테스트

배포된 백엔드에서 프린터 서버로 접근이 가능한지 확인해야 합니다.

**중요:** 라즈베리파이는 로컬 네트워크에 있으므로, 배포된 백엔드(Render)에서 직접 접근할 수 없습니다!

---

## 🌐 네트워크 설정 (중요!)

배포된 백엔드가 라즈베리파이에 접근하려면 다음 중 하나를 선택하세요:

### 옵션 1: ngrok 사용 (추천 - 간단함)

1. ngrok 설치:
```bash
wget https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-arm.tgz
tar xvzf ngrok-v3-stable-linux-arm.tgz
sudo mv ngrok /usr/local/bin/
```

2. ngrok 계정 생성 및 인증:
   - https://ngrok.com 회원가입
   - Authtoken 복사

```bash
ngrok config add-authtoken YOUR_AUTHTOKEN
```

3. 프린터 서버를 ngrok으로 노출:
```bash
ngrok http 3002
```

4. ngrok이 제공하는 URL 복사 (예: `https://abc123.ngrok.io`)

5. 백엔드 코드 수정:
   - `backend/controllers/print-controller.js`에서
   - `RASPBERRY_PI_URL`을 ngrok URL로 변경

### 옵션 2: 포트 포워딩

공유기 설정에서 3002 포트를 라즈베리파이로 포워딩:
1. 공유기 관리 페이지 접속
2. 포트 포워딩 설정
3. 외부 포트: 3002 → 내부 IP: 라즈베리파이 IP
4. 공유기의 공인 IP 또는 DDNS 주소 사용

### 옵션 3: Cloudflare Tunnel

무료이면서 안전한 방법:
```bash
# Cloudflare Tunnel 설치 및 설정
# https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/
```

---

## 📝 백엔드 설정 업데이트

라즈베리파이 URL을 확정한 후, 백엔드에 알려야 합니다.

`backend/controllers/print-controller.js` 파일에서:

```javascript
const RASPBERRY_PI_URL = process.env.RASPBERRY_PI_URL || 'https://your-ngrok-url.ngrok.io';
```

그리고 Render 환경 변수에 추가:
- Key: `RASPBERRY_PI_URL`
- Value: `https://your-ngrok-url.ngrok.io`

---

## 🧪 테스트

### 1. 로컬 테스트 (라즈베리파이에서)

```bash
curl -X POST http://localhost:3002/api/print/image \
  -H "Content-Type: application/json" \
  -d '{
    "image_data": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    "extension": "png"
  }'
```

### 2. 외부 접근 테스트 (다른 컴퓨터에서)

ngrok URL 사용:
```bash
curl https://your-ngrok-url.ngrok.io/api/printer/status
```

### 3. 프론트엔드에서 테스트

`https://travely-capturesharestory.vercel.app`에서:
1. 로그인
2. 다이어리 작성
3. 인쇄 버튼 클릭
4. 라즈베리파이 터미널에서 로그 확인

---

## 🔍 문제 해결

### 프린터가 인식되지 않을 때

```bash
# USB 장치 확인
lsusb

# 프린터 상태 확인
lpstat -p

# 프린터 재설정
sudo service cups restart
```

### 서버가 시작되지 않을 때

```bash
# 포트 사용 중인지 확인
sudo lsof -i :3002

# 사용 중이면 프로세스 종료
sudo kill -9 <PID>
```

### 로그 확인

```bash
# PM2 로그
pm2 logs print-server

# 실시간 로그
pm2 logs print-server --lines 100
```

### 네트워크 연결 문제

```bash
# 라즈베리파이 IP 확인
hostname -I

# 백엔드 접근 테스트
curl https://travely-backend-sk2w.onrender.com/api/printer/status

# 인터넷 연결 확인
ping google.com
```

---

## 📚 추가 정보

### PM2 자동 시작 설정

라즈베리파이 재부팅 시 자동으로 프린터 서버 시작:

```bash
pm2 startup
pm2 save
```

### PM2 업데이트

코드를 수정한 후:

```bash
pm2 restart print-server
```

### 보안 권장사항

- `.env` 파일을 Git에 커밋하지 마세요
- ngrok을 사용할 경우, Basic Auth 설정 권장
- 프린터 서버 접근을 백엔드 IP로만 제한 (CORS)

---

## 🎯 요약

1. ✅ 라즈베리파이에 프로젝트 파일 복사
2. ✅ `npm install`로 의존성 설치
3. ✅ `.env` 파일 설정 확인
4. ✅ 프린터 USB 연결
5. ✅ `node print-server.js` 실행 (또는 PM2로 백그라운드 실행)
6. ⚠️ ngrok으로 외부 접근 가능하게 설정
7. ⚠️ 백엔드에 ngrok URL 등록
8. ✅ 프론트엔드에서 인쇄 테스트

---

## 🆘 지원

문제가 발생하면:
1. 라즈베리파이 로그 확인 (`pm2 logs`)
2. 백엔드 로그 확인 (Render Dashboard)
3. 프론트엔드 브라우저 콘솔 확인

**현재 설정:**
- 백엔드: https://travely-backend-sk2w.onrender.com
- 프론트엔드: https://travely-capturesharestory.vercel.app
- 라즈베리파이: 로컬 (ngrok 설정 필요)
