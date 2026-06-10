const express = require("express");
const { MongoClient, ObjectId } = require("mongodb");
const multer = require("multer");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const ExifParser = require("exif-parser");
const bcrypt = require("bcrypt");
const { spawn } = require("child_process");
const printController = require("./controllers/print-controller");

const app = express();
require("dotenv").config();

app.use(cors({
  origin: [
    "http://localhost:3000",
    "https://travely-capturesharestory.vercel.app",
    "https://ai-diary-merge.vercel.app",
    "https://ai-diary27.vercel.app"
  ],
  credentials: true,
}));

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);
let imagesCollection, loginCollection, diariesCollection, printableDiaryCollection, diaryResultsCollection, testCollection;

async function connectDB() {
  try {
    await client.connect();
    console.log("✅ MongoDB connected");

    const db = client.db("diary");
    imagesCollection = db.collection("images");
    loginCollection = db.collection("login");
    diariesCollection = db.collection("diaries");
    printableDiaryCollection = db.collection("printable_diaries");
    diaryResultsCollection = db.collection("AI diary results");
    testCollection = db.collection("test");

    // 프린트 컨트롤러에 컬렉션 참조 전달
    printController.initializeCollections(diariesCollection, printableDiaryCollection);

    const uploadsDir = path.join(__dirname, "uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir);
      console.log("📁 uploads 폴더 생성됨");
    }

    const PORT = 3001;
    app.listen(PORT, () => {
      console.log(`🚀 Backend running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("❌ DB 연결 실패:", err);
  }
}
connectDB();

// ============================================
// 🎨 5개의 공통 레이아웃 구조 (PPT 기반)
// ============================================

const LAYOUT_STRUCTURES = [
  {
    layoutIndex: 0,
    layoutId: "layout_0",
    layoutName: "👨‍👩‍👧‍👦 따뜻한 가족 스타일",
    description: "온 가족의 행복한 순간을 담백하게 담은 따뜻한 레이아웃",
    structure: {
      type: "timeline",
      photoLayout: "vertical",
      textPosition: "right"
    }
  },
  {
    layoutIndex: 1,
    layoutId: "layout_1",
    layoutName: "📸 생생한 포토북",
    description: "사진이 주인공! 추억을 생생하게 담은 사진 중심 레이아웃",
    structure: {
      type: "grid",
      photoLayout: "2x2",
      textPosition: "bottom"
    }
  },
  {
    layoutIndex: 2,
    layoutId: "layout_2",
    layoutName: "💕 설레는 커플 스타일",
    description: "둘만의 특별한 순간을 로맨틱하게 담은 달콤한 레이아웃",
    structure: {
      type: "collage",
      photoLayout: "mixed",
      textPosition: "floating"
    }
  },
  {
    layoutIndex: 3,
    layoutId: "layout_3",
    layoutName: "✍️ 감성 일기장",
    description: "이야기가 주인공! 감성적인 글로 마음을 담은 일기 중심 레이아웃",
    structure: {
      type: "story",
      photoLayout: "sequential",
      textPosition: "side"
    }
  },
  {
    layoutIndex: 4,
    layoutId: "layout_4",
    layoutName: "🎨 심플 클래식",
    description: "깔끔하고 정갈한 느낌의 베이직 레이아웃",
    structure: {
      type: "gallery",
      photoLayout: "showcase",
      textPosition: "caption"
    }
  }
];

// ============================================
// 🎯 카테고리 → 레이아웃 매핑 (왼쪽/오른쪽)
// ============================================

const CATEGORY_LAYOUT_MAP = {
  "가족여행": [0, 1],    // 가족 / 우정
  "우정여행": [1, 3],    // 우정 / 기본
  "커플여행": [2, 3],    // 커플 / 기본
  "맛집탐방여행": [0, 2], // 가족 / 커플
  "단체여행": [3, 0]     // 기본 / 가족
};

// 유틸리티 함수들
async function registerLogin(email, password) {
  const exist = await loginCollection.findOne({ email });
  if (exist) return { success: false, msg: "이미 존재하는 사용자입니다." };

  const hashed = await bcrypt.hash(password, 10);
  await loginCollection.insertOne({
    email,
    password: hashed,
    username: email.split("@")[0],
    provider: "email",
    createdAt: new Date(),
  });

  return { success: true, msg: "회원가입 완료" };
}

async function loginCheck(email, password) {
  const user = await loginCollection.findOne({ email });
  if (!user) return { success: false, msg: "존재하지 않는 사용자입니다." };

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return { success: false, msg: "비밀번호가 올바르지 않습니다." };

  return {
    success: true,
    msg: "로그인 성공",
    user: {
      email: user.email,
      username: user.username,
      createdAt: user.createdAt,
    },
  };
}

async function extractImgInfo(imagePath) {
  try {
    const buffer = fs.readFileSync(imagePath);
    const parser = ExifParser.create(buffer);
    const result = parser.parse();

    const lat = result.tags.GPSLatitude;
    const lon = result.tags.GPSLongitude;
    const latRef = result.tags.GPSLatitudeRef;
    const lonRef = result.tags.GPSLongitudeRef;

    let latitude = lat ? (latRef === "S" ? -lat : lat) : null;
    let longitude = lon ? (lonRef === "W" ? -lon : lon) : null;
    const date = result.tags.CreateDate ? new Date(result.tags.CreateDate * 1000).toISOString() : null;

    return { success: true, latitude, longitude, date, hasGPS: latitude !== null && longitude !== null };
  } catch (error) {
    console.error("EXIF img error:", error);
    return { success: false, msg: "다른 사진을 입력하세요." };
  }
}

function getTimeSlot(date) {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 15) return "midday";
  if (hour >= 15 && hour < 18) return "afternoon";
  return "evening";
}

// ============================================
// 🔥 카테고리 분류 API (파이썬 연동)
// ============================================

async function classifyWithLocalModel(allText) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, "category_predict.py");

    // Python 스크립트 파일 존재 확인
    if (!fs.existsSync(scriptPath)) {
      console.error("❌ category_predict.py 파일이 없습니다. 기본 카테고리로 설정합니다.");
      return resolve("friend"); // 기본값: 우정여행
    }

    const pythonProcess = spawn("python", [scriptPath, allText]);

    let output = "";
    let errorMsg = "";

    pythonProcess.stdout.on("data", (data) => (output += data.toString()));
    pythonProcess.stderr.on("data", (data) => (errorMsg += data.toString()));

    pythonProcess.on("close", (code) => {
      if (code === 0 && output.trim()) {
        resolve(output.trim());
      } else {
        console.error("❌ Python 실행 오류:", errorMsg || "출력 없음");
        resolve("friend"); // 에러 시 기본값
      }
    });

    pythonProcess.on("error", (err) => {
      console.error("❌ Python 프로세스 실행 실패:", err.message);
      resolve("friend"); // Python이 설치되지 않은 경우 기본값
    });
  });
}

// ==========================================
// 인증 관련 API
// ==========================================

app.post("/api/register", async (req, res) => {
  console.log("📥 회원가입 요청:", req.body);
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, error: "이메일과 비밀번호를 입력해주세요." });
  }

  if (password.length < 6) {
    return res.status(400).json({ success: false, error: "비밀번호는 6자 이상이어야 합니다." });
  }

  const result = await registerLogin(email, password);
  
  if (result.success) {
    console.log("✅ 회원가입 성공:", email);
    res.json({
      success: true,
      user: { email: email, username: email.split("@")[0], createdAt: new Date() },
      message: "회원가입 완료"
    });
  } else {
    res.status(400).json({ success: false, error: result.msg });
  }
});

app.post("/api/login", async (req, res) => {
  console.log("📥 로그인 요청:", req.body);
  const { email, password } = req.body;
  const result = await loginCheck(email, password);
  
  if (result.success) {
    res.json({ success: true, user: result.user, message: result.msg });
  } else {
    res.status(401).json({ success: false, error: result.msg });
  }
});

app.post("/api/google-login", async (req, res) => {
  console.log("📥 Google 로그인 요청:", req.body);
  const { email, name, picture } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, msg: "이메일이 필요합니다." });
  }

  try {
    let user = await loginCollection.findOne({ email });

    if (!user) {
      const newUser = {
        email,
        username: name || email.split("@")[0],
        picture: picture || null,
        provider: "google",
        createdAt: new Date(),
      };
      
      const insertResult = await loginCollection.insertOne(newUser);
      
      if (!insertResult.insertedId) {
        return res.status(500).json({ success: false, msg: "사용자 생성에 실패했습니다." });
      }

      user = { ...newUser, _id: insertResult.insertedId };
      console.log("✅ 새 Google 사용자 생성:", email);
    } else {
      console.log("✅ 기존 Google 사용자 로그인:", email);
    }

    res.json({
      success: true,
      msg: "Google 로그인 성공",
      user: { email: user.email, username: user.username, picture: user.picture, createdAt: user.createdAt },
    });
  } catch (error) {
    console.error("❌ Google 로그인 에러:", error);
    res.status(500).json({ success: false, msg: "서버 오류가 발생했습니다." });
  }
});

// ==========================================
// 이미지 업로드 API
// ==========================================

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

app.post("/api/upload", upload.single("image"), async (req, res) => {
  try {
    const { userId, keywords, tempSlotId } = req.body
    const imageBuffer = fs.readFileSync(req.file.path)
    const base64Image = imageBuffer.toString('base64')
    const mimeType = req.file.mimetype
    const exifData = await extractImgInfo(req.file.path)

    const result = await imagesCollection.insertOne({
      userId,
      imageData: base64Image,
      mimeType: mimeType,
      keywords: keywords ? JSON.parse(keywords) : [],
      tempSlotId: tempSlotId || Date.now().toString(),
      exifData,
      usedInDiary: false,
      createdAt: new Date(),
    })

    fs.unlinkSync(req.file.path)

    res.json({ 
      message: "✅ 업로드 성공", 
      imageId: result.insertedId,
      imageData: base64Image,
      mimeType: mimeType,
      exifData,
      tempSlotId: tempSlotId || Date.now().toString()
    })
  } catch (err) {
    console.error("❌ 업로드 오류:", err)
    res.status(500).json({ error: err.message })
  }
})

// ==========================================
// 다이어리 관련 API (순서 중요!)
// ==========================================

// ✅ 1. POST 라우트들
app.post("/api/diaries", async (req, res) => {
  console.log("📥 다이어리 생성 요청:", req.body);
  const { userId, title, date, photoSlotIds } = req.body;

  if (!userId || !title) {
    return res.status(400).json({ error: "userId와 title이 필요합니다." });
  }

  try {
    let photoSlots = [];
    
    if (photoSlotIds && photoSlotIds.length > 0) {
      const { ObjectId } = require("mongodb");
      const imageIds = photoSlotIds
        .filter(id => id && id !== 'temp')
        .map(id => {
          try {
            return new ObjectId(id);
          } catch (e) {
            return null;
          }
        })
        .filter(id => id !== null);

      if (imageIds.length > 0) {
        const images = await imagesCollection.find({ _id: { $in: imageIds } }).toArray();

        photoSlots = images.map((img) => ({
          id: img._id.toString(),
          photo: `http://localhost:3001${img.imageUrl}`,
          // imageData는 images 컬렉션에 저장되어 있으므로 다이어리에는 포함하지 않음 (16MB 제한 회피)
          mimeType: img.mimeType,
          keywords: img.keywords || [],
          timeSlot: img.exifData?.date ? getTimeSlot(new Date(img.exifData.date)) : "evening",
          timestamp: img.exifData?.date ? new Date(img.exifData.date).getTime() : Date.now(),
          exifData: {
            timestamp: img.exifData?.date ? new Date(img.exifData.date) : new Date(),
            location: img.exifData?.latitude && img.exifData?.longitude ? {
              latitude: img.exifData.latitude,
              longitude: img.exifData.longitude,
            } : undefined,
          }
        }));

        await imagesCollection.updateMany(
          { _id: { $in: imageIds } },
          { $set: { usedInDiary: true } }
        );
      }
    }

    const newDiary = {
      userId,
      title,
      date: date || new Date().toLocaleDateString(),
      photoSlots,
      createdAt: new Date(),
    };

    const result = await diariesCollection.insertOne(newDiary);

    // 응답할 때 imageData 추가 (검토 페이지에서 사진을 보기 위함)
    const diaryWithImages = { ...newDiary, _id: result.insertedId };
    if (diaryWithImages.photoSlots && diaryWithImages.photoSlots.length > 0) {
      const photoIds = diaryWithImages.photoSlots.map(slot => {
        try {
          return new (require("mongodb").ObjectId)(slot.id);
        } catch (e) {
          return slot.id;
        }
      }).filter(id => id);

      if (photoIds.length > 0) {
        const images = await imagesCollection.find({ _id: { $in: photoIds } }).toArray();
        diaryWithImages.photoSlots = diaryWithImages.photoSlots.map(slot => {
          const image = images.find(img => img._id.toString() === slot.id.toString());
          return {
            ...slot,
            imageData: image?.imageData,
            mimeType: image?.mimeType,
          };
        });
      }
    }

    res.json({
      success: true,
      message: "✅ 다이어리 생성 완료",
      diary: diaryWithImages,
    });
  } catch (err) {
    console.error("❌ 다이어리 생성 오류:", err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/save-ai-diary", async (req, res) => {
  console.log("📥 AI 다이어리 저장 요청:", req.body);
  const { diaryId, userId, content, photoSlots } = req.body;

  try {
    const { ObjectId } = require("mongodb");
    const aiDiaryCollection = client.db("diary").collection("AI diary results");
    
    const objectIdDiaryId = new ObjectId(diaryId);
    
    const cleanPhotoSlots = photoSlots ? photoSlots.map(slot => {
      const { imageData, mimeType, ...rest } = slot;
      return rest;
    }) : [];
    
    const result = await aiDiaryCollection.insertOne({
      diaryId: objectIdDiaryId,
      userId,
      content,
      photoSlots: cleanPhotoSlots,
      createdAt: new Date(),
    });

    res.json({
      success: true,
      message: "✅ AI 다이어리 저장 완료",
      aiDiaryId: result.insertedId,
    });
  } catch (err) {
    console.error("❌ AI 다이어리 저장 오류:", err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/diaries/save-printable", async (req, res) => {
  console.log("📥 인쇄 다이어리 저장 요청");
  const { diaryId, userId, imageData } = req.body;

  if (!diaryId || !userId || !imageData) {
    return res.status(400).json({ success: false, error: "diaryId, userId, imageData가 필요합니다." });
  }

  try {
    const { ObjectId } = require("mongodb");
    const objectIdDiaryId = new ObjectId(diaryId);

    // imageData가 배열인지 확인 (여러 페이지)
    const imageDataArray = Array.isArray(imageData) ? imageData : [imageData];
    const savedPages = [];

    for (let i = 0; i < imageDataArray.length; i++) {
      const base64Data = imageDataArray[i].includes(",")
        ? imageDataArray[i].split(",")[1]
        : imageDataArray[i];

      console.log(`✅ 인쇄 다이어리 Base64 데이터 준비 (페이지 ${i + 1})`);

      savedPages.push({
        pageNumber: i + 1,
        imageData: base64Data,  // Base64 문자열을 MongoDB에 직접 저장
      });
    }

    const result = await printableDiaryCollection.insertOne({
      diaryId: objectIdDiaryId,
      userId,
      pages: savedPages,
      pageCount: savedPages.length,
      mimeType: "image/png",  // 프론트엔드에서 PNG로 변환
      createdAt: new Date(),
    });

    await diariesCollection.updateOne(
      { _id: objectIdDiaryId },
      { $set: { isCompleted: true, completedAt: new Date() } }
    );

    console.log(`✅ 인쇄 다이어리 저장 완료 (${savedPages.length}페이지) + isCompleted 플래그 설정`);

    res.json({
      success: true,
      message: `✅ 인쇄 다이어리 저장 완료 (${savedPages.length}페이지)`,
      printableDiaryId: result.insertedId,
      pageCount: savedPages.length,
    });
  } catch (err) {
    console.error("❌ 인쇄 다이어리 저장 오류:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/api/diaries/mark-complete", async (req, res) => {
  console.log("📥 다이어리 작성 완료 표시:", req.body);
  const { diaryId } = req.body;

  if (!diaryId) {
    return res.status(400).json({ success: false, error: "diaryId가 필요합니다." });
  }

  try {
    const { ObjectId } = require("mongodb");
    const objectIdDiaryId = new ObjectId(diaryId);

    const result = await diariesCollection.updateOne(
      { _id: objectIdDiaryId },
      { $set: { isCompleted: true } }
    );

    res.json({
      success: true,
      message: "✅ 다이어리 완료 상태 저장됨",
    });
  } catch (err) {
    console.error("❌ 완료 상태 저장 오류:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ✅ 2. GET 라우트들 (구체적인 경로부터)
app.get("/api/diaries/list/:userId", async (req, res) => {
  console.log("📥 다이어리 목록 조회:", req.params.userId);
  const { userId } = req.params;

  try {
    const diaries = await diariesCollection.find({ userId }).toArray();
    diaries.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // 썸네일 데이터 추가 (printable_diaries의 첫 번째 페이지 이미지)
    const diariesWithThumbnails = await Promise.all(diaries.map(async (diary) => {
      try {
        const printableDiary = await printableDiaryCollection.findOne({
          diaryId: diary._id
        });

        // printable_diaries에서 첫 번째 페이지의 첫 번째 이미지를 썸네일로 사용
        let thumbnailUrl = null;
        if (printableDiary && printableDiary.pages && printableDiary.pages.length > 0) {
          const firstPage = printableDiary.pages[0];
          console.log(`📸 다이어리 ${diary._id} 전체 페이지 구조:`, Object.keys(firstPage));
          console.log(`📸 다이어리 ${diary._id} 썸네일 정보:`, {
            hasImageData: !!firstPage.imageData,
            mimeType: firstPage.mimeType,
            pageCount: firstPage.pageCount,
            pageNumber: firstPage.pageNumber
          });

          // mimeType 찾기 (필드명이 다를 수 있음)
          const mimeType = firstPage.mimeType || firstPage.mimetype || 'image/png';

          if (firstPage.imageData && mimeType) {
            // Base64 이미지 데이터를 data URL로 변환
            thumbnailUrl = `data:${mimeType};base64,${firstPage.imageData}`;
            console.log(`✅ 썸네일 생성 성공: ${thumbnailUrl.substring(0, 50)}...`);
          }
        } else {
          console.log(`⚠️ 다이어리 ${diary._id}에 printable_diaries 없음`);
        }

        return {
          ...diary,
          thumbnailUrl
        };
      } catch (err) {
        console.error(`⚠️ 다이어리 ${diary._id} 썸네일 로드 실패:`, err);
        return diary;
      }
    }));

    console.log(`✅ ${diariesWithThumbnails.length}개의 다이어리 목록 조회 완료 (썸네일 포함)`);

    res.json({ success: true, data: diariesWithThumbnails });
  } catch (err) {
    console.error("❌ 다이어리 조회 오류:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get("/api/diaries/status/:diaryId", async (req, res) => {
  console.log("📥 다이어리 상태 조회:", req.params.diaryId);
  const { diaryId } = req.params;

  try {
    const { ObjectId } = require("mongodb");
    const objectIdDiaryId = new ObjectId(diaryId);

    const diary = await diariesCollection.findOne(
      { _id: objectIdDiaryId },
      { projection: { isCompleted: 1 } }
    );

    if (!diary) {
      return res.status(404).json({ success: false, error: "해당 다이어리를 찾을 수 없습니다." });
    }

    res.json({
      success: true,
      isCompleted: diary.isCompleted === true,
    });
  } catch (err) {
    console.error("❌ 다이어리 상태 조회 오류:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get("/api/diaries/printable/:diaryId", async (req, res) => {
  console.log("📥 인쇄 다이어리 조회:", req.params.diaryId);
  const { diaryId } = req.params;

  try {
    const { ObjectId } = require("mongodb");
    
    let printableDiary;
    
    try {
      const objectIdDiaryId = new ObjectId(diaryId);
      printableDiary = await printableDiaryCollection.findOne({ diaryId: objectIdDiaryId });
    } catch (e) {
      console.log("⚠️ ObjectId 변환 실패, 문자열로 찾기");
    }

    if (!printableDiary) {
      printableDiary = await printableDiaryCollection.findOne({ diaryId: diaryId });
    }

    if (!printableDiary) {
      return res.status(404).json({
        success: false,
        error: "저장된 인쇄 다이어리가 없습니다.",
        hasPrintable: false
      });
    }

    // MongoDB에서 Base64 데이터 직접 조회 (파일 시스템 의존 X)
    let pages = [];
    if (printableDiary.pages && Array.isArray(printableDiary.pages)) {
      for (const page of printableDiary.pages) {
        if (page.imageData) {
          pages.push({
            imageData: page.imageData,
            pageNumber: page.pageNumber,
          });
        }
      }
    }

    res.json({
      success: true,
      hasPrintable: true,
      data: {
        _id: printableDiary._id.toString(),
        diaryId: printableDiary.diaryId.toString(),
        userId: printableDiary.userId,
        pages: pages,
        pageCount: pages.length,
        mimeType: printableDiary.mimeType,
        createdAt: printableDiary.createdAt,
      }
    });
  } catch (err) {
    console.error("❌ 인쇄 다이어리 조회 오류:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get("/api/diaries/:diaryId/detail", async (req, res) => {
  console.log("📥 다이어리 상세 조회 (detail):", req.params.diaryId);
  const { diaryId } = req.params;

  try {
    const { ObjectId } = require("mongodb");
    
    let diary;
    
    try {
      const objectIdDiaryId = new ObjectId(diaryId);
      diary = await diariesCollection.findOne({ _id: objectIdDiaryId });
    } catch (e) {
      console.log("⚠️ ObjectId 변환 실패, 문자열로 찾기");
    }
    
    if (!diary) {
      diary = await diariesCollection.findOne({ _id: diaryId });
    }

    if (!diary) {
      return res.status(404).json({ success: false, error: "다이어리를 찾을 수 없습니다." });
    }

    if (diary.photoSlots && diary.photoSlots.length > 0) {
      const photoIds = diary.photoSlots.map(slot => {
        try {
          return new ObjectId(slot.id);
        } catch (e) {
          return slot.id;
        }
      }).filter(id => id);

      if (photoIds.length > 0) {
        const images = await imagesCollection.find({ _id: { $in: photoIds } }).toArray();

        diary.photoSlots = diary.photoSlots.map(slot => {
          const image = images.find(img => img._id.toString() === slot.id.toString());
          return {
            ...slot,
            imageData: image?.imageData,
            mimeType: image?.mimeType,
          };
        });
      }
    }

    res.json({ success: true, data: diary });
  } catch (err) {
    console.error("❌ 다이어리 상세 조회 오류:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ✅ 3. DELETE 라우트
app.delete("/api/diaries/:diaryId", async (req, res) => {
  console.log("📥 다이어리 삭제 요청:", req.params.diaryId);
  const { diaryId } = req.params;

  try {
    const { ObjectId } = require("mongodb");
    
    let diary;
    
    try {
      const objectIdDiaryId = new ObjectId(diaryId);
      diary = await diariesCollection.findOne({ _id: objectIdDiaryId });
      if (diary) {
        console.log("✅ ObjectId로 찾음: 성공");
      } else {
        console.log("⚠️ ObjectId로 못 찾음, 문자열로 시도");
      }
    } catch (e) {
      console.log("⚠️ ObjectId 변환 실패:", e.message);
    }
    
    if (!diary) {
      diary = await diariesCollection.findOne({ _id: diaryId });
      if (diary) {
        console.log("✅ 문자열로 찾음: 성공");
      }
    }

    if (!diary) {
      console.log("❌ 다이어리를 찾을 수 없음. diaryId:", diaryId);
      return res.status(404).json({ error: "다이어리를 찾을 수 없습니다." });
    }

    console.log("📝 조회된 다이어리:", diary._id);

    const imageIds = [];
    if (diary.photoSlots && Array.isArray(diary.photoSlots)) {
      diary.photoSlots.forEach((slot) => {
        if (slot.id && !slot.id.startsWith("temp")) {
          try {
            // ObjectId로 변환 시도
            imageIds.push(new ObjectId(slot.id));
          } catch (e) {
            // 변환 실패 시 문자열 그대로 추가
            imageIds.push(slot.id);
          }
        }
      });
    }

    console.log(`🗑️ 삭제할 이미지 ID: ${imageIds.length}개`, imageIds);

    let deletedImageCount = 0;
    if (imageIds.length > 0) {
      const imageDeleteResult = await imagesCollection.deleteMany({ _id: { $in: imageIds } });
      deletedImageCount = imageDeleteResult.deletedCount;
      console.log(`✅ ${deletedImageCount}개의 이미지 삭제됨`);
    } else {
      console.log("⚠️ 삭제할 이미지가 없습니다.");
    }

    await diariesCollection.deleteOne({ _id: diary._id });
    console.log("✅ 다이어리 삭제 완료");

    const aiDiaryCollection = client.db("diary").collection("AI diary results");
    
    let aiDeleteResult;
    try {
      const objectIdDiaryId = new ObjectId(diaryId);
      aiDeleteResult = await aiDiaryCollection.deleteMany({ diaryId: objectIdDiaryId });
    } catch (e) {
      aiDeleteResult = await aiDiaryCollection.deleteMany({ diaryId: diaryId });
    }
    
    console.log(`✅ ${aiDeleteResult.deletedCount}개의 AI 다이어리 결과 삭제됨`);

    try {
      const objectIdDiaryId = new ObjectId(diaryId);
      const printDeleteResult = await printableDiaryCollection.deleteMany({ diaryId: objectIdDiaryId });
      console.log(`✅ ${printDeleteResult.deletedCount}개의 인쇄 다이어리 삭제됨`);
    } catch (e) {
      console.log("⚠️ 인쇄 다이어리 삭제 시도 (문자열)");
      const printDeleteResult = await printableDiaryCollection.deleteMany({ diaryId: diaryId });
      console.log(`✅ ${printDeleteResult.deletedCount}개의 인쇄 다이어리 삭제됨`);
    }

    res.json({ 
      success: true, 
      message: "✅ 다이어리 삭제 완료",
      deletedImages: deletedImageCount,
      deletedAIDiaries: aiDeleteResult.deletedCount
    });
  } catch (err) {
    console.error("❌ 다이어리 삭제 오류:", err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ 4. 통합 다이어리 조회 (맨 마지막!)
app.get("/api/diaries/:diaryId", async (req, res) => {
  console.log("📥 다이어리 상세 조회 (통합 API):", req.params.diaryId);
  const { diaryId } = req.params;

  try {
    const { ObjectId } = require("mongodb");

    let diary;

    try {
      const objectIdDiaryId = new ObjectId(diaryId);
      diary = await diariesCollection.findOne({ _id: objectIdDiaryId });
      console.log("🔍 ObjectId로 조회:", diary ? "성공" : "실패");
    } catch (e) {
      console.log("⚠️ ObjectId 변환 실패, 문자열로 찾기");
    }

    if (!diary) {
      diary = await diariesCollection.findOne({ _id: diaryId });
      console.log("🔍 문자열로 조회:", diary ? "성공" : "실패");
    }

    if (!diary) {
      return res.status(404).json({ success: false, error: "다이어리를 찾을 수 없습니다." });
    }

    console.log("📝 조회된 다이어리:", {
      _id: diary._id,
      title: diary.title,
      isCompleted: diary.isCompleted
    });

    const aiDiaryCollection = client.db("diary").collection("AI diary results");
    let aiDiary = null;

    try {
      const objectIdDiaryId = new ObjectId(diaryId);
      aiDiary = await aiDiaryCollection.findOne({ diaryId: objectIdDiaryId });
    } catch (e) {
      aiDiary = await aiDiaryCollection.findOne({ diaryId: diaryId });
    }

    console.log("🤖 AI 내용:", aiDiary?.content ? "있음" : "없음");

    if (diary.photoSlots && diary.photoSlots.length > 0) {
      const photoIds = diary.photoSlots
        .map(slot => {
          try {
            return new ObjectId(slot.id);
          } catch (e) {
            return slot.id;
          }
        })
        .filter(id => id);

      if (photoIds.length > 0) {
        const images = await imagesCollection.find({
          _id: { $in: photoIds }
        }).toArray();

        diary.photoSlots = diary.photoSlots.map(slot => {
          const image = images.find(img => img._id.toString() === slot.id.toString());
          return {
            ...slot,
            imageData: image?.imageData,
            mimeType: image?.mimeType,
          };
        });
      }
    }

    const responseData = {
      ...diary,
      aiContent: aiDiary?.content || null,
      isCompleted: diary.isCompleted === true
    };

    console.log("✅ 최종 응답:", {
      hasAiContent: !!responseData.aiContent,
      isCompleted: responseData.isCompleted
    });

    res.json({
      success: true,
      data: responseData
    });
  } catch (err) {
    console.error("❌ 다이어리 상세 조회 오류:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 인쇄 관련 API
// ==========================================

// 다이어리 인쇄 요청
app.post("/api/print/diary", printController.printDiary);

// 인쇄 작업 상태 조회
app.get("/api/print/status/:jobId", printController.getPrintStatus);

// 프린터 상태 확인
app.get("/api/print/printer-status", printController.getPrinterStatus);

// 라즈베리파이에서 인쇄 완료 알림 웹훅
app.post("/api/print/complete", printController.handlePrintComplete);

// ============================================
// 🔥 카테고리 분류 API (파이썬 연동)
// ============================================

app.post("/category/:diaryId", async (req, res) => {
  try {
    const { diaryId } = req.params;
    const doc = await testCollection.findOne({ diaryId });

    if (!doc) {
      return res.status(404).json({ error: "일기 데이터 없음" });
    }

    let categoryArray = Array.isArray(doc.category) ? doc.category : [];
    const allText = doc.content || "";
    let category = await classifyWithLocalModel(allText);

    const categoryMap = {
      "family": "가족여행",
      "couple": "커플여행",
      "friend": "우정여행",
      "food": "맛집탐방여행",
      "group": "단체여행"
    };

    category = categoryMap[category] || "우정여행";

    if (!categoryArray.includes(category)) {
      categoryArray.push(category);
    }

    await testCollection.updateOne(
      { diaryId },
      { $set: { category: categoryArray } }
    );

    res.json({ success: true, category: categoryArray });
  } catch (err) {
    console.error("❌ 카테고리 분류 실패:", err);
    res.status(500).json({ success: false, msg: "서버 오류" });
  }
});

// ============================================
// 📝 다이어리 content 업데이트 API
// ============================================

app.post("/api/diaries/update-content", async (req, res) => {
  console.log("📥 다이어리 content 업데이트 요청:", req.body);

  const { diaryId, content } = req.body;

  if (!diaryId || !content) {
    return res.status(400).json({
      success: false,
      error: "diaryId와 content가 필요합니다."
    });
  }

  try {
    const { ObjectId } = require("mongodb");
    const objectIdDiaryId = new ObjectId(diaryId);

    // diaries 컬렉션에 content 필드 업데이트
    const result = await diariesCollection.updateOne(
      { _id: objectIdDiaryId },
      {
        $set: {
          content: content,
          updatedAt: new Date()
        }
      }
    );

    if (result.matchedCount === 0) {
      console.warn("⚠️ 다이어리를 찾을 수 없음:", diaryId);
      return res.status(404).json({
        success: false,
        error: "다이어리를 찾을 수 없습니다."
      });
    }

    console.log("✅ diaries 컬렉션 content 업데이트 완료:", diaryId);

    res.json({
      success: true,
      message: "다이어리 content가 저장되었습니다.",
      diaryId
    });
  } catch (error) {
    console.error("❌ content 업데이트 오류:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// 🎨 레이아웃 추천 API (카테고리 인덱스 기반!)
// ============================================

app.post("/api/layouts/recommend/:diaryId", async (req, res) => {
  console.log("📥 레이아웃 추천 요청:", req.params.diaryId);

  const { diaryId } = req.params;

  try {
    const { ObjectId } = require("mongodb");
    const objectIdDiaryId = new ObjectId(diaryId);

    const diaryDoc = await diariesCollection.findOne({ _id: objectIdDiaryId });

    if (!diaryDoc) {
      console.log("⚠️ 다이어리 없음 - 기본 레이아웃 반환");
      return res.json({
        success: true,
        diaryId,
        category: "우정여행",
        layoutIndices: [1, 3],
        recommendedLayouts: [LAYOUT_STRUCTURES[1], LAYOUT_STRUCTURES[3]],
        diaryData: { title: "여행 일기", content: "", photos: [] }
      });
    }

    console.log("✅ diaries 컬렉션에서 일기 발견:", diaryId);

    // 1. 카테고리 추출 및 AI 분류
    let koreanCategory = "우정여행";
    let hasExistingCategory = false;

    if (diaryDoc.category && Array.isArray(diaryDoc.category)) {
      const travelCategories = diaryDoc.category.filter(cat =>
        isNaN(cat) && typeof cat === 'string' && CATEGORY_LAYOUT_MAP[cat] !== undefined
      );

      if (travelCategories.length > 0) {
        koreanCategory = travelCategories[0];
        hasExistingCategory = true;
        console.log("✅ 기존 카테고리:", koreanCategory);
      }
    }

    // 내용이 있고 카테고리가 없으면 AI 분류 실행
    if (!hasExistingCategory && diaryDoc.content) {
      console.log("🤖 AI 카테고리 분류 시작...");
      console.log("📝 분석할 텍스트 길이:", diaryDoc.content.length);
      console.log("📝 텍스트 미리보기:", diaryDoc.content.substring(0, 100) + "...");

      try {
        let aiCategory = await classifyWithLocalModel(diaryDoc.content);
        console.log("🤖 AI 분류 결과 (영문):", aiCategory);

        const categoryMap = {
          "family": "가족여행",
          "couple": "커플여행",
          "friend": "우정여행",
          "food": "맛집탐방여행",
          "group": "단체여행"
        };
        koreanCategory = categoryMap[aiCategory] || "우정여행";

        // diaries 컬렉션에 category 저장
        await diariesCollection.updateOne(
          { _id: objectIdDiaryId },
          { $addToSet: { category: koreanCategory } }
        );

        console.log("✅ AI 분류 완료 (한글):", koreanCategory);
      } catch (aiError) {
        console.error("❌ AI 분류 실패:", aiError);
        console.error("❌ 에러 상세:", aiError.stack);
      }
    } else if (!diaryDoc.content) {
      console.log("⚠️ 다이어리 내용이 없어서 AI 분류를 건너뜁니다.");
    }

    // 2. ⭐ 카테고리 → 레이아웃 인덱스 매핑 가져오기
    const layoutIndices = CATEGORY_LAYOUT_MAP[koreanCategory] || [1, 3];

    // 3. ⭐ 매핑된 레이아웃 가져오기
    const recommendedLayouts = [
      { ...LAYOUT_STRUCTURES[layoutIndices[0]], categoryName: koreanCategory },
      { ...LAYOUT_STRUCTURES[layoutIndices[1]], categoryName: koreanCategory }
    ];

    console.log(`✅ 추천 레이아웃: ${koreanCategory} -> [${layoutIndices[0]}, ${layoutIndices[1]}]`);

    res.json({
      success: true,
      diaryId,
      category: koreanCategory,
      layoutIndices,
      recommendedLayouts,
      diaryData: {
        title: diaryDoc.title || "여행 일기",
        content: diaryDoc.content || "",
        photos: diaryDoc.photoSlots || []
      }
    });

  } catch (error) {
    console.error("❌ 레이아웃 추천 오류:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// 레이아웃 선택 저장
// ============================================

app.post("/api/layouts/select/:diaryId", async (req, res) => {
  const { diaryId } = req.params;
  const { layoutId, layoutIndex } = req.body;

  try {
    await testCollection.updateOne(
      { diaryId },
      {
        $set: {
          selectedLayoutId: layoutId,
          selectedLayoutIndex: layoutIndex,
          layoutSelectedAt: new Date()
        }
      }
    );

    console.log(`✅ 레이아웃 저장: ${diaryId} -> ${layoutId} (Index: ${layoutIndex})`);

    res.json({
      success: true,
      message: "레이아웃이 저장되었습니다."
    });
  } catch (error) {
    console.error("❌ 레이아웃 저장 오류:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// 카테고리 재분류 API (강제 재분류)
// ============================================

app.post("/api/diaries/reclassify/:diaryId", async (req, res) => {
  console.log("🔄 카테고리 재분류 요청:", req.params.diaryId);

  const { diaryId } = req.params;

  try {
    const { ObjectId } = require("mongodb");
    const objectIdDiaryId = new ObjectId(diaryId);

    const diaryDoc = await diariesCollection.findOne({ _id: objectIdDiaryId });

    if (!diaryDoc) {
      return res.status(404).json({
        success: false,
        error: "다이어리를 찾을 수 없습니다."
      });
    }

    if (!diaryDoc.content) {
      return res.status(400).json({
        success: false,
        error: "다이어리 내용이 없습니다. AI 분류를 실행할 수 없습니다."
      });
    }

    console.log("🤖 AI 카테고리 강제 재분류 시작...");
    console.log("📝 분석할 텍스트 길이:", diaryDoc.content.length);

    try {
      let aiCategory = await classifyWithLocalModel(diaryDoc.content);
      console.log("🤖 AI 분류 결과 (영문):", aiCategory);

      const categoryMap = {
        "family": "가족여행",
        "couple": "커플여행",
        "friend": "우정여행",
        "food": "맛집탐방여행",
        "group": "단체여행"
      };
      const koreanCategory = categoryMap[aiCategory] || "우정여행";

      // 기존 카테고리 제거하고 새 카테고리 저장
      await diariesCollection.updateOne(
        { _id: objectIdDiaryId },
        { $set: { category: [koreanCategory] } }
      );

      console.log("✅ AI 재분류 완료 (한글):", koreanCategory);

      res.json({
        success: true,
        category: koreanCategory,
        message: `카테고리가 "${koreanCategory}"로 재분류되었습니다.`
      });
    } catch (aiError) {
      console.error("❌ AI 분류 실패:", aiError);
      res.status(500).json({
        success: false,
        error: "AI 분류 중 오류가 발생했습니다: " + aiError.message
      });
    }

  } catch (error) {
    console.error("❌ 카테고리 재분류 오류:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// 프리뷰 데이터 조회
// ============================================

app.get("/api/layouts/preview/:diaryId/:layoutId", async (req, res) => {
  const { diaryId, layoutId } = req.params;

  try {
    const diaryDoc = await testCollection.findOne({ diaryId });

    if (!diaryDoc) {
      return res.status(404).json({
        success: false,
        error: "다이어리를 찾을 수 없습니다."
      });
    }

    let koreanCategory = "우정여행";
    if (diaryDoc.category && Array.isArray(diaryDoc.category)) {
      const travelCategories = diaryDoc.category.filter(cat =>
        isNaN(cat) && typeof cat === 'string' && CATEGORY_LAYOUT_MAP[cat] !== undefined
      );
      if (travelCategories.length > 0) {
        koreanCategory = travelCategories[0];
      }
    }

    const layoutIndices = CATEGORY_LAYOUT_MAP[koreanCategory] || [1, 3];

    const layouts = [
      LAYOUT_STRUCTURES[layoutIndices[0]],
      LAYOUT_STRUCTURES[layoutIndices[1]]
    ];

    const selectedLayout = layouts.find(l => l.layoutId === layoutId) || layouts[0];

    res.json({
      success: true,
      layout: selectedLayout,
      diary: {
        diaryId,
        title: diaryDoc.title || "여행 일기",
        content: diaryDoc.content || "",
        photos: diaryDoc.photoSlots || [],
        createdAt: diaryDoc.createdAt || new Date()
      }
    });
  } catch (error) {
    console.error("❌ 프리뷰 조회 오류:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});