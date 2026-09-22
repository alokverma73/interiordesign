import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth.dependencies import require_permission
from app.config.database import get_db
from app.models.content import BlogPost, ContactMessage, FAQ, Testimonial
from app.schemas.content import (
    BlogPostCreate, BlogPostOut, ContactMessageCreate, FAQCreate, FAQOut,
    TestimonialAdminUpdate, TestimonialCreate, TestimonialOut,
)

router = APIRouter(tags=["Content"])


# ---------- Testimonials ----------

@router.get("/testimonials", response_model=List[TestimonialOut])
def list_testimonials(featured_only: bool = False, db: Session = Depends(get_db)):
    query = db.query(Testimonial).filter(Testimonial.is_published.is_(True))
    if featured_only:
        query = query.filter(Testimonial.is_featured.is_(True))
    return query.order_by(Testimonial.display_order).all()


@router.post("/testimonials", response_model=TestimonialOut, status_code=status.HTTP_201_CREATED)
def submit_testimonial(payload: TestimonialCreate, db: Session = Depends(get_db)):
    """Public submission — goes live only after admin approval."""
    testimonial = Testimonial(**payload.model_dump(), is_approved=False, is_published=False)
    db.add(testimonial)
    db.commit()
    db.refresh(testimonial)
    return testimonial


admin_testimonials_router = APIRouter(prefix="/admin/testimonials", tags=["Admin - Testimonials"])


@admin_testimonials_router.get("", response_model=List[TestimonialOut])
def admin_list_testimonials(db: Session = Depends(get_db), _=Depends(require_permission("content.manage"))):
    return db.query(Testimonial).order_by(Testimonial.created_at.desc()).all()


@admin_testimonials_router.put("/{testimonial_id}", response_model=TestimonialOut)
def admin_update_testimonial(
    testimonial_id: uuid.UUID,
    payload: TestimonialAdminUpdate,
    db: Session = Depends(get_db),
    _=Depends(require_permission("content.manage")),
):
    testimonial = db.query(Testimonial).filter(Testimonial.id == testimonial_id).first()
    if not testimonial:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Testimonial not found.")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(testimonial, field, value)
    db.commit()
    db.refresh(testimonial)
    return testimonial


# ---------- Blog ----------

@router.get("/blog", response_model=List[BlogPostOut])
def list_blog_posts(db: Session = Depends(get_db)):
    return (
        db.query(BlogPost)
        .filter(BlogPost.is_published.is_(True))
        .order_by(BlogPost.created_at.desc())
        .all()
    )


@router.get("/blog/{slug}", response_model=BlogPostOut)
def get_blog_post(slug: str, db: Session = Depends(get_db)):
    post = db.query(BlogPost).filter(BlogPost.slug == slug, BlogPost.is_published.is_(True)).first()
    if not post:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Article not found.")
    return post


admin_blog_router = APIRouter(prefix="/admin/blog", tags=["Admin - Blog"])


@admin_blog_router.get("", response_model=List[BlogPostOut])
def admin_list_blog_posts(db: Session = Depends(get_db), _=Depends(require_permission("content.manage"))):
    return db.query(BlogPost).order_by(BlogPost.created_at.desc()).all()


@admin_blog_router.post("", response_model=BlogPostOut, status_code=status.HTTP_201_CREATED)
def admin_create_blog_post(
    payload: BlogPostCreate, db: Session = Depends(get_db), _=Depends(require_permission("content.manage"))
):
    if db.query(BlogPost).filter(BlogPost.slug == payload.slug).first():
        raise HTTPException(status.HTTP_409_CONFLICT, "A post with this slug already exists.")
    post = BlogPost(**payload.model_dump())
    db.add(post)
    db.commit()
    db.refresh(post)
    return post


@admin_blog_router.put("/{post_id}", response_model=BlogPostOut)
def admin_update_blog_post(
    post_id: uuid.UUID,
    payload: BlogPostCreate,
    db: Session = Depends(get_db),
    _=Depends(require_permission("content.manage")),
):
    post = db.query(BlogPost).filter(BlogPost.id == post_id).first()
    if not post:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Post not found.")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(post, field, value)
    db.commit()
    db.refresh(post)
    return post


@admin_blog_router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
def admin_delete_blog_post(
    post_id: uuid.UUID, db: Session = Depends(get_db), _=Depends(require_permission("content.manage"))
):
    post = db.query(BlogPost).filter(BlogPost.id == post_id).first()
    if not post:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Post not found.")
    db.delete(post)
    db.commit()


# ---------- FAQ ----------

@router.get("/faqs", response_model=List[FAQOut])
def list_faqs(db: Session = Depends(get_db)):
    return db.query(FAQ).filter(FAQ.is_published.is_(True)).order_by(FAQ.display_order).all()


admin_faq_router = APIRouter(prefix="/admin/faqs", tags=["Admin - FAQ"])


@admin_faq_router.post("", response_model=FAQOut, status_code=status.HTTP_201_CREATED)
def admin_create_faq(
    payload: FAQCreate, db: Session = Depends(get_db), _=Depends(require_permission("content.manage"))
):
    faq = FAQ(**payload.model_dump())
    db.add(faq)
    db.commit()
    db.refresh(faq)
    return faq


@admin_faq_router.delete("/{faq_id}", status_code=status.HTTP_204_NO_CONTENT)
def admin_delete_faq(
    faq_id: uuid.UUID, db: Session = Depends(get_db), _=Depends(require_permission("content.manage"))
):
    faq = db.query(FAQ).filter(FAQ.id == faq_id).first()
    if not faq:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "FAQ not found.")
    db.delete(faq)
    db.commit()


# ---------- Contact ----------

@router.post("/contact", status_code=status.HTTP_201_CREATED)
def submit_contact_message(payload: ContactMessageCreate, db: Session = Depends(get_db)):
    message = ContactMessage(**payload.model_dump())
    db.add(message)
    db.commit()
    return {"message": "Thank you — we'll get back to you shortly."}


admin_contact_router = APIRouter(prefix="/admin/contact-messages", tags=["Admin - Contact Messages"])


@admin_contact_router.get("")
def admin_list_contact_messages(db: Session = Depends(get_db), _=Depends(require_permission("content.manage"))):
    messages = db.query(ContactMessage).order_by(ContactMessage.created_at.desc()).all()
    return [
        {
            "id": m.id, "name": m.name, "email": m.email, "phone": m.phone,
            "subject": m.subject, "message": m.message, "is_read": m.is_read,
            "created_at": m.created_at,
        }
        for m in messages
    ]
