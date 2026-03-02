import os

from fastapi.responses import FileResponse

from app.util import strip_accents


media_directory = "C:/home/media"


def get_file(filename: str):
    file_path = os.path.join(media_directory, filename)
    if not os.path.exists(file_path):
        raise ValueError(f"File not found at path: {file_path}")
    return FileResponse(file_path)


def delete_file(filename: str):
    file_path = os.path.join(media_directory, filename)
    if not os.path.exists(file_path):
        raise ValueError(f"File not found at path: {file_path}")
    os.remove(file_path)


def add_file(file, original_filename: str):
    existing_files = os.listdir(media_directory)
    suffix = 1
    original_filename = strip_accents(original_filename).replace(" ", "_")
    if not os.path.splitext(original_filename)[1]:
        original_filename += f".{file.filename.split('.')[-1]}"
    filename = original_filename
    while filename in existing_files:
        filename = f"{os.path.splitext(original_filename)[0]}_{suffix}{os.path.splitext(original_filename)[1]}"
        suffix += 1

    file_path = os.path.join(media_directory, filename)
    with open(file_path, "wb") as f:
        f.write(file.file.read())
    return filename
