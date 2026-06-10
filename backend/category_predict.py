# category_predict.py
import sys
import torch
from transformers import BertTokenizer, BertForSequenceClassification

# 입력 텍스트 받기
text = sys.argv[1]

# 모델 및 토크나이저 로드
model_path = "./diary_category_model"  # 네가 올린 폴더 경로 (config.json, model.safetensors 등 포함)
tokenizer = BertTokenizer.from_pretrained(model_path)
model = BertForSequenceClassification.from_pretrained(model_path)
model.eval()

# 입력 변환
inputs = tokenizer(text, return_tensors="pt", truncation=True, padding=True, max_length=512)

# 추론
with torch.no_grad():
    outputs = model(**inputs)
    pred_label = torch.argmax(outputs.logits, dim=1).item()

# 카테고리 매핑 (너의 프로젝트용)
id2label = {
    0: "family",
    1: "couple",
    2: "friend",
    3: "food",
    4: "group"
}

print(id2label[pred_label])
