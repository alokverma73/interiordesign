import secrets
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.auth.jwt import create_access_token, create_refresh_token, decode_refresh_token
from app.auth.security import hash_password, verify_password
from app.config.database import get_db
from app.middleware.rate_limit import limiter
from app.models.user import CustomerProfile, User, UserType
from app.schemas.auth import (
    ChangePasswordRequest, ForgotPasswordRequest, LoginRequest, RefreshTokenRequest,
    RegisterRequest, ResetPasswordRequest, TokenResponse, UpdateProfileRequest,
    UserOut, VerifyEmailRequest,
)
from app.utils.email import send_email

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status.HTTP_409_CONFLICT, "An account with this email already exists.")

    user = User(
        email=payload.email,
        hashed_password=hash_password(payload.password),
        full_name=payload.full_name,
        phone=payload.phone,
        user_type=UserType.CUSTOMER,
        email_verification_token=secrets.token_urlsafe(32),
    )
    db.add(user)
    db.flush()
    db.add(CustomerProfile(user_id=user.id))
    db.commit()
    db.refresh(user)

    send_email(
        user.email,
        "Verify your email",
        f"<p>Welcome! Verify your email using this token: {user.email_verification_token}</p>",
    )
    return user


@router.post("/verify-email", response_model=UserOut)
def verify_email(payload: VerifyEmailRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email_verification_token == payload.token).first()
    if not user:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid or expired verification token.")
    user.is_email_verified = True
    user.email_verification_token = None
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=TokenResponse)
@limiter.limit("5/minute")
def login(request: Request, payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Incorrect email or password.")
    if not user.is_active:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "This account has been disabled.")

    extra = {"user_type": user.user_type.value}
    return TokenResponse(
        access_token=create_access_token(str(user.id), extra),
        refresh_token=create_refresh_token(str(user.id)),
    )


@router.post("/admin/login", response_model=TokenResponse)
@limiter.limit("5/minute")
def admin_login(request: Request, payload: LoginRequest, db: Session = Depends(get_db)):
    """Separate endpoint for staff/admin login — deliberately isolated from customer login."""
    user = db.query(User).filter(User.email == payload.email, User.user_type == UserType.STAFF).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Incorrect email or password.")
    if not user.is_active:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "This account has been disabled.")

    extra = {"user_type": user.user_type.value, "role": user.role.name.value if user.role else None}
    return TokenResponse(
        access_token=create_access_token(str(user.id), extra),
        refresh_token=create_refresh_token(str(user.id)),
    )


@router.post("/refresh", response_model=TokenResponse)
def refresh_token(payload: RefreshTokenRequest, db: Session = Depends(get_db)):
    data = decode_refresh_token(payload.refresh_token)
    if not data:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired refresh token.")
    user = db.query(User).filter(User.id == data["sub"]).first()
    if not user or not user.is_active:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "User not found or inactive.")

    extra = {"user_type": user.user_type.value}
    return TokenResponse(
        access_token=create_access_token(str(user.id), extra),
        refresh_token=create_refresh_token(str(user.id)),
    )


@router.post("/forgot-password")
@limiter.limit("5/minute")
def forgot_password(request: Request, payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    # Always return a generic response — never reveal whether the email exists.
    if user:
        user.password_reset_token = secrets.token_urlsafe(32)
        user.password_reset_expires_at = (datetime.utcnow() + timedelta(hours=1)).isoformat()
        db.commit()
        send_email(
            user.email,
            "Reset your password",
            f"<p>Use this token to reset your password: {user.password_reset_token}</p>",
        )
    return {"message": "If that email exists, a reset link has been sent."}


@router.post("/reset-password")
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.password_reset_token == payload.token).first()
    if not user or not user.password_reset_expires_at:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid or expired reset token.")
    if datetime.fromisoformat(user.password_reset_expires_at) < datetime.utcnow():
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "This reset token has expired.")

    user.hashed_password = hash_password(payload.new_password)
    user.password_reset_token = None
    user.password_reset_expires_at = None
    db.commit()
    return {"message": "Password has been reset. You can now log in."}


@router.get("/me", response_model=UserOut)
def get_me(user: User = Depends(get_current_user)):
    return user


@router.put("/me", response_model=UserOut)
def update_me(payload: UpdateProfileRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if payload.full_name is not None:
        user.full_name = payload.full_name
    if payload.phone is not None:
        user.phone = payload.phone

    if user.user_type == UserType.CUSTOMER and user.customer_profile:
        if payload.address is not None:
            user.customer_profile.address = payload.address
        if payload.city is not None:
            user.customer_profile.city = payload.city
        if payload.preferred_contact_method is not None:
            user.customer_profile.preferred_contact_method = payload.preferred_contact_method

    db.commit()
    db.refresh(user)
    return user


@router.post("/change-password")
def change_password(
    payload: ChangePasswordRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    if not verify_password(payload.current_password, user.hashed_password):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Current password is incorrect.")
    user.hashed_password = hash_password(payload.new_password)
    db.commit()
    return {"message": "Password updated successfully."}
