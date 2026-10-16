import io
import os
import base64
from pathlib import Path
from typing import Optional, List
from fastapi import FastAPI, UploadFile, File, Form, Query, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, FileResponse
from pydantic import BaseModel

from dataset_service import DatasetService
from model_service import ModelService
from report_service import ReportService

BASE_DIR = Path(__file__).resolve().parent.parent

app = FastAPI(
    title="BioLens AI Backend",
    description="Colorectal Tissue Intelligence Platform REST API",
    version="2.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Services
dataset_service = DatasetService(BASE_DIR)
model_service = ModelService(BASE_DIR)
report_service = ReportService(BASE_DIR)

# Request Models
class GradcamRequest(BaseModel):
    image_id: Optional[str] = None
    target_class_index: Optional[int] = None
    colormap: Optional[str] = "jet"

class ReportRequest(BaseModel):
    image_id: Optional[str] = None
    predicted_class: str
    confidence_percentage: float
    ground_truth: Optional[str] = None
    filename: Optional[str] = None
    input_dimensions: Optional[List[int]] = [150, 150]
    probabilities_sorted: Optional[List[dict]] = []
    explanation_summary: Optional[dict] = {}
    heatmap_base64: Optional[str] = None

class DatasetPathRequest(BaseModel):
    path: str

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "BioLens AI Backend",
        "version": "2.0.0",
        "model_loaded": model_service.model is not None,
        "model_status": model_service.model_status,
        "dataset_total_images": len(dataset_service.image_index)
    }

# ==================== DATASET ENDPOINTS ====================

@app.get("/api/dataset/summary")
def get_dataset_summary():
    return dataset_service.get_summary()

@app.get("/api/dataset/classes")
def get_dataset_classes():
    return dataset_service.get_summary()["classes"]

@app.get("/api/dataset/showcase")
def get_dataset_showcase():
    return dataset_service.get_class_showcase()

@app.get("/api/images")
def list_images(
    page: int = Query(1, ge=1),
    page_size: int = Query(24, ge=1, le=100),
    class_filter: Optional[str] = Query(None),
    search: Optional[str] = Query(None)
):
    return dataset_service.get_images(page, page_size, class_filter, search)

@app.get("/api/images/{image_id}")
def get_image_details(image_id: str):
    img = dataset_service.get_image_by_id(image_id)
    if not img:
        raise HTTPException(status_code=404, detail="Image not found")
    return img

@app.get("/api/images/{image_id}/raw")
def get_image_raw(image_id: str):
    img = dataset_service.get_image_by_id(image_id)
    if not img:
        raise HTTPException(status_code=404, detail="Image not found")
    try:
        raw_bytes = dataset_service.read_image_bytes(img["path"], format="PNG")
        return StreamingResponse(io.BytesIO(raw_bytes), media_type="image/png")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/images/{image_id}/similar")
def get_similar_images(image_id: str, limit: int = Query(6, ge=1, le=20)):
    return dataset_service.get_similar_images(image_id, limit)

# ==================== MODEL & INFERENCE ENDPOINTS ====================

@app.get("/api/model/info")
def get_model_info():
    return model_service.get_info()

@app.get("/api/model/outputs/{plot_name}")
def get_output_plot(plot_name: str):
    # Prevent directory traversal
    clean_name = os.path.basename(plot_name)
    plot_path = BASE_DIR / "rectal_cancer_outputs" / clean_name
    if not plot_path.exists():
        raise HTTPException(status_code=404, detail="Output plot not found")
    return FileResponse(str(plot_path), media_type="image/png")

@app.post("/api/predict")
async def predict_image(
    image_id: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None)
):
    if not model_service.model:
        raise HTTPException(
            status_code=503, 
            detail="Model is not loaded. Please upload or train model weights first."
        )

    image_bytes = None
    filename = ""
    ground_truth = None

    if file:
        image_bytes = await file.read()
        filename = file.filename or "upload.png"
    elif image_id:
        img_info = dataset_service.get_image_by_id(image_id)
        if not img_info:
            raise HTTPException(status_code=404, detail="Image ID not found")
        image_bytes = dataset_service.read_image_bytes(img_info["path"])
        filename = img_info["filename"]
        ground_truth = img_info.get("ground_truth")
    else:
        raise HTTPException(status_code=400, detail="Must provide either image_id or file upload")

    try:
        result = model_service.predict(image_bytes, filename, ground_truth)
        result["filename"] = filename
        result["image_id"] = image_id
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")

@app.post("/api/explain/gradcam")
async def explain_gradcam(
    image_id: Optional[str] = Form(None),
    target_class_index: Optional[int] = Form(None),
    colormap: Optional[str] = Form("jet"),
    file: Optional[UploadFile] = File(None)
):
    if not model_service.model:
        raise HTTPException(
            status_code=503, 
            detail="Model is not loaded. Cannot generate Grad-CAM."
        )

    image_bytes = None
    filename = ""

    if file:
        image_bytes = await file.read()
        filename = file.filename or "upload.png"
    elif image_id:
        img_info = dataset_service.get_image_by_id(image_id)
        if not img_info:
            raise HTTPException(status_code=404, detail="Image ID not found")
        image_bytes = dataset_service.read_image_bytes(img_info["path"])
        filename = img_info["filename"]
    else:
        raise HTTPException(status_code=400, detail="Must provide either image_id or file upload")

    try:
        gradcam_res = model_service.generate_gradcam(
            image_bytes=image_bytes,
            filename=filename,
            target_class_idx=target_class_index,
            colormap_name=colormap or "jet"
        )
        return gradcam_res
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Grad-CAM computation error: {str(e)}")

@app.post("/api/reports")
async def generate_report(req: ReportRequest):
    orig_bytes = None
    grad_bytes = None

    if req.image_id:
        img_info = dataset_service.get_image_by_id(req.image_id)
        if img_info:
            orig_bytes = dataset_service.read_image_bytes(img_info["path"])

    if req.heatmap_base64 and req.heatmap_base64.startswith("data:image"):
        try:
            b64_data = req.heatmap_base64.split(",")[1]
            grad_bytes = base64.b64decode(b64_data)
        except Exception:
            pass

    analysis_data = req.dict()
    try:
        pdf_bytes = report_service.generate_pdf_report(
            analysis_data,
            original_image_bytes=orig_bytes,
            gradcam_image_bytes=grad_bytes
        )
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=BioLens_Report_{req.filename or 'scan'}.pdf"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Report generation error: {str(e)}")

@app.post("/api/model/reload")
def reload_model_endpoint(path: Optional[str] = Form(None)):
    success = model_service.reload_model(path)
    return {
        "success": success,
        "status": model_service.model_status,
        "error": model_service.model_error
    }

@app.post("/api/model/upload")
async def upload_model_file(file: UploadFile = File(...)):
    if not file.filename.endswith((".keras", ".h5")):
        raise HTTPException(status_code=400, detail="Only .keras or .h5 files supported")

    save_path = BASE_DIR / "rectal_cancer_outputs" / file.filename
    content = await file.read()
    with open(save_path, "wb") as f:
        f.write(content)

    success = model_service.reload_model(str(save_path))
    return {
        "success": success,
        "filename": file.filename,
        "status": model_service.model_status,
        "error": model_service.model_error
    }

@app.post("/api/settings/dataset-path")
def update_dataset_path(req: DatasetPathRequest):
    success = dataset_service.set_dataset_path(req.path)
    if not success:
        raise HTTPException(status_code=400, detail="Invalid directory or directory not found")
    return dataset_service.get_summary()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
