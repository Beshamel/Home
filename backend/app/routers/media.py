from fastapi import APIRouter, UploadFile, File, Form
from app.controllers.media import add_file, get_file

router = APIRouter(prefix="/media", tags=["media"])


@router.get("/{filename}")
def get_media(filename: str):
    return get_file(filename)


@router.post("/")
def upload_media(file: UploadFile = File(...), original_filename: str = Form(...)):
    return {"filename": add_file(file, original_filename)}
