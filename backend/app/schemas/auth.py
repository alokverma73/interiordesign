import uuid
from typing import Any, Optional

from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator


class RegisterRequest(BaseModel):
    full_name: str = Field(min_length=2, max_length=150)
    email: EmailStr
    phone: Optional[str] = None
    password: str = Field(min_length=8, max_length=128)

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one digit")
        if not any(c.isalpha() for c in v):
            raise ValueError("Password must contain at least one letter")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(min_length=8, max_length=128)


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8, max_length=128)


class VerifyEmailRequest(BaseModel):
    token: str


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    id: uuid.UUID
    email: EmailStr
    full_name: str
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    user_type: str
    role: Optional[str] = None
    is_email_verified: bool

    model_config = {"from_attributes": True}

    @model_validator(mode="before")
    @classmethod
    def flatten_orm_fields(cls, data: Any) -> Any:
        """
        `User.role` is a Role relationship object and `user_type` is an Enum.
        Flatten both to plain strings before validation so this schema can be
        built directly from the ORM instance.
        """
        if isinstance(data, dict):
            return data

        role = getattr(data, "role", None)
        role_name = None
        if role is not None:
            role_name = role.name.value if hasattr(role.name, "value") else str(role.name)

        user_type = getattr(data, "user_type", None)

        return {
            "id": data.id,
            "email": data.email,
            "full_name": data.full_name,
            "phone": getattr(data, "phone", None),
            "avatar_url": getattr(data, "avatar_url", None),
            "user_type": user_type.value if hasattr(user_type, "value") else str(user_type),
            "role": role_name,
            "is_email_verified": data.is_email_verified,
        }


class UpdateProfileRequest(BaseModel):
    full_name: Optional[str] = Field(default=None, min_length=2, max_length=150)
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    preferred_contact_method: Optional[str] = None
