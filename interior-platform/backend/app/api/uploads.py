import uuid
from typing import List

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.auth.dependencies import require_permission
from app.config.database import get_db
from app.models.content import GalleryImage
from app.utils.file_storage import get_storage_backend

router = APIRouter(tags=["Uploads"])


@router.post("/uploads/public")
def upload_public_reference_file(file: UploadFile = File(...)):
    """
    Used by the public quote form to attach reference images/documents
    before an account exists. Files land in a quarantined folder; nothing
    here is ever served back without going through an authenticated,
    ownership-checked route.
    """
    storage = get_storage_backend()
    storage_key = storage.save(file, subfolder="public-references")
    return {"storage_key": storage_key, "file_name": file.filename}


# ---------- Admin gallery ----------

admin_gallery_router = APIRouter(prefix="/admin/gallery", tags=["Admin - Gallery"])


@admin_gallery_router.post("", status_code=status.HTTP_201_CREATED)
def admin_upload_gallery_image(
    caption: str = "",
    category: str = "",
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _=Depends(require_permission("content.manage")),
):
    storage = get_storage_backend()
    storage_key = storage.save(file, subfolder="gallery")
    image = GalleryImage(image_url=storage_key, caption=caption, category=category)
    db.add(image)
    db.commit()
    db.refresh(image)
    return {"id": image.id, "image_url": image.image_url, "caption": image.caption, "category": image.category}


@admin_gallery_router.get("")
def admin_list_gallery(db: Session = Depends(get_db), _=Depends(require_permission("content.manage"))):
    images = db.query(GalleryImage).order_by(GalleryImage.display_order).all()
    return [
        {"id": i.id, "image_url": i.image_url, "caption": i.caption, "category": i.category, "is_published": i.is_published}
        for i in images
    ]


@admin_gallery_router.delete("/{image_id}", status_code=status.HTTP_204_NO_CONTENT)
def admin_delete_gallery_image(
    image_id: uuid.UUID, db: Session = Depends(get_db), _=Depends(require_permission("content.manage"))
):
    image = db.query(GalleryImage).filter(GalleryImage.id == image_id).first()
    if not image:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Image not found.")
    db.delete(image)
    db.commit()


@router.get("/gallery")
def public_gallery(category: str | None = None, db: Session = Depends(get_db)):
    query = db.query(GalleryImage).filter(GalleryImage.is_published.is_(True))
    if category:
        query = query.filter(GalleryImage.category == category)
    images = query.order_by(GalleryImage.display_order).all()
    return [{"id": i.id, "image_url": i.image_url, "caption": i.caption, "category": i.category} for i in images]
