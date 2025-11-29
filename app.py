import io
import torch
import torch.nn as nn
from torchvision import transforms
from PIL import Image
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware

import torchvision.models as models
import numpy as np
from skimage.color import rgb2lab


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def is_valid_rbc_image(pil_img):
   
    img = np.array(pil_img.resize((128, 128))) / 255.0
    mean_r = img[:, :, 0].mean()
    mean_g = img[:, :, 1].mean()
    mean_b = img[:, :, 2].mean()

    if not (0.25 < mean_r < 0.75 and 0.15 < mean_g < 0.60 and 0.20 < mean_b < 0.60):
        return False

    variance = img.var()
    if variance < 0.02:  
        # Too smooth = not a microscopy RBC image
        return False

    lab_img = rgb2lab(img)
    mean_L = lab_img[:, :, 0].mean()
    mean_A = lab_img[:, :, 1].mean()
    mean_B = lab_img[:, :, 2].mean()

    if not (30 < mean_L < 85 and -5 < mean_A < 25 and -10 < mean_B < 35):
        return False

    return True

def get_resnet18(num_classes=2):
    model = models.resnet18(pretrained=False)

    # Freeze layers except layer4
    for param in model.parameters():
        param.requires_grad = False
    for param in model.layer4.parameters():
        param.requires_grad = True

    # Replace final FC layer
    in_features = model.fc.in_features
    model.fc = nn.Linear(in_features, num_classes)
    return model

model_path = "resnet18_malaria_weights.pth"

model = get_resnet18(num_classes=2)
model.load_state_dict(torch.load(model_path, map_location="cpu"))
model.eval()

class_names = ["Parasitized", "Uninfected"]

transform = transforms.Compose([
    transforms.Resize((64, 64)),
    transforms.ToTensor(),
    transforms.Normalize([0.5]*3, [0.5]*3)
])

def predict_image(image: Image.Image):
    tensor = transform(image).unsqueeze(0)
    with torch.no_grad():
        out = model(tensor)
        probs = torch.softmax(out, dim=1)
        pred_idx = torch.argmax(probs).item()
        confidence = probs[0][pred_idx].item()

    return class_names[pred_idx], confidence

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    try:
        content = await file.read()
        image = Image.open(io.BytesIO(content)).convert("RGB")
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid image file.")

    if not is_valid_rbc_image(image):
        return {
            "valid": False,
            "error": "Please upload an RBC cell image (Thin Blood Smear)."
        }

    label, confidence = predict_image(image)

    return {
        "valid": True,
        "prediction": label,
        "confidence": round(confidence * 100, 2)
    }


@app.get("/health")
def health_check():
    return {"status": "ok", "message": "API is healthy"}

@app.get("/")
def home():
    return {"message": "Malaria ResNet18 API is running!"}
