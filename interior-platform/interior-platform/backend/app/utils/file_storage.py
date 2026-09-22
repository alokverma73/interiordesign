"""
Storage abstraction so the rest of the app never talks to disk/S3 directly.
Swap STORAGE_BACKEND=local -> s3 in .env without touching calling code.
"""
import os
import uuid
from pathlib import Path
from typing import BinaryIO

from fastapi import HTTPException, UploadFile, status

from app.config.settings import get_settings

settings = get_settings()


def _safe_extension(filename: str) -> str:
    ext = Path(filename).suffix.lower().lstrip(".")
    if ext not in settings.allowed_upload_extensions_list:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            f"File type '.{ext}' is not allowed.",
        )
    return ext


def validate_upload(file: UploadFile, max_size_bytes: int) -> None:
    file.file.seek(0, os.SEEK_END)
    size = file.file.tell()
    file.file.seek(0)
    if size > max_size_bytes:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            f"File exceeds the {settings.MAX_UPLOAD_SIZE_MB}MB limit.",
        )


class StorageBackend:
    def save(self, file: UploadFile, subfolder: str) -> str:
        raise NotImplementedError

    def get_download_path(self, storage_key: str) -> str:
        raise NotImplementedError

    def delete(self, storage_key: str) -> None:
        raise NotImplementedError


class LocalStorageBackend(StorageBackend):
    def __init__(self, base_path: str):
        self.base_path = Path(base_path)
        self.base_path.mkdir(parents=True, exist_ok=True)

    def save(self, file: UploadFile, subfolder: str) -> str:
        ext = _safe_extension(file.filename)
        validate_upload(file, settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024)

        secure_name = f"{uuid.uuid4().hex}.{ext}"
        folder = self.base_path / subfolder
        folder.mkdir(parents=True, exist_ok=True)
        destination = folder / secure_name

        with destination.open("wb") as out_file:
            out_file.write(file.file.read())

        # storage_key is relative — never expose the absolute server path
        return f"{subfolder}/{secure_name}"

    def get_download_path(self, storage_key: str) -> str:
        path = (self.base_path / storage_key).resolve()
        if not str(path).startswith(str(self.base_path.resolve())):
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid file path.")
        if not path.exists():
            raise HTTPException(status.HTTP_404_NOT_FOUND, "File not found.")
        return str(path)

    def delete(self, storage_key: str) -> None:
        path = self.base_path / storage_key
        if path.exists():
            path.unlink()


class S3StorageBackend(StorageBackend):
    """
    Minimal S3-compatible backend (works with AWS S3, MinIO, DigitalOcean Spaces).
    Requires: pip install boto3
    """

    def __init__(self):
        import boto3  # imported lazily so local dev doesn't require boto3

        self.client = boto3.client(
            "s3",
            region_name=settings.S3_REGION or None,
            aws_access_key_id=settings.S3_ACCESS_KEY_ID or None,
            aws_secret_access_key=settings.S3_SECRET_ACCESS_KEY or None,
            endpoint_url=settings.S3_ENDPOINT_URL or None,
        )
        self.bucket = settings.S3_BUCKET_NAME

    def save(self, file: UploadFile, subfolder: str) -> str:
        ext = _safe_extension(file.filename)
        validate_upload(file, settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024)
        key = f"{subfolder}/{uuid.uuid4().hex}.{ext}"
        self.client.upload_fileobj(file.file, self.bucket, key)
        return key

    def get_download_path(self, storage_key: str) -> str:
        # Returns a pre-signed URL, valid for 10 minutes.
        return self.client.generate_presigned_url(
            "get_object",
            Params={"Bucket": self.bucket, "Key": storage_key},
            ExpiresIn=600,
        )

    def delete(self, storage_key: str) -> None:
        self.client.delete_object(Bucket=self.bucket, Key=storage_key)


def get_storage_backend() -> StorageBackend:
    if settings.STORAGE_BACKEND == "s3":
        return S3StorageBackend()
    return LocalStorageBackend(settings.LOCAL_STORAGE_PATH)
