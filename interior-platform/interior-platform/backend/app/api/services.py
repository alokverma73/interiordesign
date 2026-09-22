import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth.dependencies import require_permission
from app.config.database import get_db
from app.models.project import Service
from app.schemas.service import ServiceCreate, ServiceOut, ServiceUpdate

router = APIRouter(tags=["Services"])


# ---------- Public ----------

@router.get("/services", response_model=List[ServiceOut])
def list_services(db: Session = Depends(get_db)):
    return (
        db.query(Service)
        .filter(Service.is_active.is_(True), Service.is_deleted.is_(False))
        .order_by(Service.display_order)
        .all()
    )


@router.get("/services/{slug}", response_model=ServiceOut)
def get_service(slug: str, db: Session = Depends(get_db)):
    service = db.query(Service).filter(Service.slug == slug, Service.is_deleted.is_(False)).first()
    if not service or not service.is_active:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Service not found.")
    return service


# ---------- Admin ----------

admin_router = APIRouter(prefix="/admin/services", tags=["Admin - Services"])


@admin_router.get("", response_model=List[ServiceOut])
def admin_list_services(
    db: Session = Depends(get_db), _=Depends(require_permission("services.manage"))
):
    return db.query(Service).filter(Service.is_deleted.is_(False)).order_by(Service.display_order).all()


@admin_router.post("", response_model=ServiceOut, status_code=status.HTTP_201_CREATED)
def admin_create_service(
    payload: ServiceCreate, db: Session = Depends(get_db), _=Depends(require_permission("services.manage"))
):
    if db.query(Service).filter(Service.slug == payload.slug).first():
        raise HTTPException(status.HTTP_409_CONFLICT, "A service with this slug already exists.")
    service = Service(**payload.model_dump())
    db.add(service)
    db.commit()
    db.refresh(service)
    return service


@admin_router.put("/{service_id}", response_model=ServiceOut)
def admin_update_service(
    service_id: uuid.UUID,
    payload: ServiceUpdate,
    db: Session = Depends(get_db),
    _=Depends(require_permission("services.manage")),
):
    service = db.query(Service).filter(Service.id == service_id).first()
    if not service:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Service not found.")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(service, field, value)
    db.commit()
    db.refresh(service)
    return service


@admin_router.delete("/{service_id}", status_code=status.HTTP_204_NO_CONTENT)
def admin_delete_service(
    service_id: uuid.UUID, db: Session = Depends(get_db), _=Depends(require_permission("services.manage"))
):
    service = db.query(Service).filter(Service.id == service_id).first()
    if not service:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Service not found.")
    service.is_deleted = True
    db.commit()
