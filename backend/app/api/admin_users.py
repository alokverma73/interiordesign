import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, model_validator
from sqlalchemy.orm import Session

from app.auth.dependencies import require_permission
from app.auth.security import hash_password
from app.config.database import get_db
from app.models.user import Role, StaffRole, User, UserType
from app.utils.pagination import PaginatedResponse, paginate

router = APIRouter(prefix="/admin/users", tags=["Admin - Users"])


class StaffCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    role: StaffRole


class UserSummary(BaseModel):
    id: uuid.UUID
    full_name: str
    email: EmailStr
    phone: Optional[str] = None
    user_type: str
    role: Optional[str] = None
    is_active: bool

    model_config = {"from_attributes": True}

    @model_validator(mode="before")
    @classmethod
    def flatten_orm_fields(cls, data):
        if isinstance(data, dict):
            return data
        role = getattr(data, "role", None)
        role_name = None
        if role is not None:
            role_name = role.name.value if hasattr(role.name, "value") else str(role.name)
        user_type = getattr(data, "user_type", None)
        return {
            "id": data.id,
            "full_name": data.full_name,
            "email": data.email,
            "phone": getattr(data, "phone", None),
            "user_type": user_type.value if hasattr(user_type, "value") else str(user_type),
            "role": role_name,
            "is_active": data.is_active,
        }


@router.get("/customers", response_model=PaginatedResponse[UserSummary])
def list_customers(
    search: Optional[str] = None,
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db),
    _=Depends(require_permission("customers.manage")),
):
    query = db.query(User).filter(User.user_type == UserType.CUSTOMER)
    if search:
        like = f"%{search}%"
        query = query.filter(User.full_name.ilike(like) | User.email.ilike(like))
    query = query.order_by(User.created_at.desc())
    items, total, page, page_size, total_pages = paginate(query, page, page_size)
    return PaginatedResponse(items=items, total=total, page=page, page_size=page_size, total_pages=total_pages)


@router.put("/customers/{user_id}/status")
def toggle_customer_status(
    user_id: uuid.UUID, is_active: bool, db: Session = Depends(get_db), _=Depends(require_permission("customers.manage"))
):
    user = db.query(User).filter(User.id == user_id, User.user_type == UserType.CUSTOMER).first()
    if not user:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Customer not found.")
    user.is_active = is_active
    db.commit()
    return {"message": "Customer status updated."}


@router.get("/staff", response_model=List[UserSummary])
def list_staff(db: Session = Depends(get_db), _=Depends(require_permission("users.manage"))):
    return db.query(User).filter(User.user_type == UserType.STAFF).all()


@router.post("/staff", response_model=UserSummary, status_code=status.HTTP_201_CREATED)
def create_staff(
    payload: StaffCreate, db: Session = Depends(get_db), _=Depends(require_permission("users.manage"))
):
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status.HTTP_409_CONFLICT, "An account with this email already exists.")

    role = db.query(Role).filter(Role.name == payload.role).first()
    if not role:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Unknown role — seed roles first.")

    staff = User(
        full_name=payload.full_name,
        email=payload.email,
        hashed_password=hash_password(payload.password),
        user_type=UserType.STAFF,
        role_id=role.id,
        is_active=True,
        is_email_verified=True,
    )
    db.add(staff)
    db.commit()
    db.refresh(staff)
    return staff


@router.put("/staff/{user_id}/status")
def toggle_staff_status(
    user_id: uuid.UUID, is_active: bool, db: Session = Depends(get_db), _=Depends(require_permission("users.manage"))
):
    user = db.query(User).filter(User.id == user_id, User.user_type == UserType.STAFF).first()
    if not user:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Staff member not found.")
    user.is_active = is_active
    db.commit()
    return {"message": "Staff status updated."}
