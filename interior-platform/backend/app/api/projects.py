import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, selectinload

from app.auth.dependencies import get_current_customer, require_permission
from app.config.database import get_db
from app.models.project import Project, ProjectCategory, Service
from app.schemas.project import ProjectCreate, ProjectOut, ProjectPortalOut, ProjectUpdateSchema
from app.utils.pagination import PaginatedResponse, paginate

router = APIRouter(tags=["Projects"])


# ---------- Public portfolio ----------

@router.get("/projects", response_model=PaginatedResponse[ProjectOut])
def list_projects(
    category: Optional[ProjectCategory] = None,
    search: Optional[str] = None,
    featured: Optional[bool] = None,
    page: int = 1,
    page_size: int = 12,
    db: Session = Depends(get_db),
):
    query = db.query(Project).filter(Project.is_published.is_(True), Project.is_deleted.is_(False))
    if category:
        query = query.filter(Project.category == category)
    if featured is not None:
        query = query.filter(Project.is_featured == featured)
    if search:
        like = f"%{search}%"
        query = query.filter(Project.name.ilike(like) | Project.location.ilike(like))
    query = query.order_by(Project.completion_date.desc().nulls_last())

    items, total, page, page_size, total_pages = paginate(query, page, page_size)
    return PaginatedResponse(items=items, total=total, page=page, page_size=page_size, total_pages=total_pages)


@router.get("/projects/{slug}", response_model=ProjectOut)
def get_project(slug: str, db: Session = Depends(get_db)):
    project = (
        db.query(Project)
        .filter(Project.slug == slug, Project.is_published.is_(True), Project.is_deleted.is_(False))
        .first()
    )
    if not project:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Project not found.")
    return project


@router.get("/projects/{slug}/related", response_model=List[ProjectOut])
def get_related_projects(slug: str, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.slug == slug).first()
    if not project:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Project not found.")
    return (
        db.query(Project)
        .filter(
            Project.category == project.category,
            Project.id != project.id,
            Project.is_published.is_(True),
        )
        .limit(3)
        .all()
    )


# ---------- Customer portal ----------

portal_router = APIRouter(prefix="/dashboard/projects", tags=["Customer Portal"])


@portal_router.get("", response_model=List[ProjectOut])
def my_projects(db: Session = Depends(get_db), customer=Depends(get_current_customer)):
    return db.query(Project).filter(Project.customer_id == customer.id, Project.is_deleted.is_(False)).all()


@portal_router.get("/{project_id}", response_model=ProjectPortalOut)
def my_project_detail(project_id: uuid.UUID, db: Session = Depends(get_db), customer=Depends(get_current_customer)):
    project = (
        db.query(Project)
        .options(selectinload(Project.milestones), selectinload(Project.members))
        .filter(Project.id == project_id)
        .first()
    )
    if not project or project.is_deleted:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Project not found.")
    # Critical: a customer may only ever see their own project.
    if project.customer_id != customer.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "You do not have access to this project.")
    return project


# ---------- Admin ----------

admin_router = APIRouter(prefix="/admin/projects", tags=["Admin - Projects"])


@admin_router.get("", response_model=PaginatedResponse[ProjectOut])
def admin_list_projects(
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db),
    _=Depends(require_permission("projects.manage")),
):
    query = db.query(Project).filter(Project.is_deleted.is_(False)).order_by(Project.created_at.desc())
    items, total, page, page_size, total_pages = paginate(query, page, page_size)
    return PaginatedResponse(items=items, total=total, page=page, page_size=page_size, total_pages=total_pages)


@admin_router.post("", response_model=ProjectOut, status_code=status.HTTP_201_CREATED)
def admin_create_project(
    payload: ProjectCreate, db: Session = Depends(get_db), _=Depends(require_permission("projects.manage"))
):
    if db.query(Project).filter(Project.slug == payload.slug).first():
        raise HTTPException(status.HTTP_409_CONFLICT, "A project with this slug already exists.")

    data = payload.model_dump(exclude={"service_ids"})
    project = Project(**data)
    if payload.service_ids:
        project.services = db.query(Service).filter(Service.id.in_(payload.service_ids)).all()

    db.add(project)
    db.commit()
    db.refresh(project)
    return project


@admin_router.put("/{project_id}", response_model=ProjectOut)
def admin_update_project(
    project_id: uuid.UUID,
    payload: ProjectUpdateSchema,
    db: Session = Depends(get_db),
    _=Depends(require_permission("projects.manage")),
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Project not found.")

    data = payload.model_dump(exclude_unset=True, exclude={"service_ids"})
    for field, value in data.items():
        setattr(project, field, value)

    if payload.service_ids is not None:
        project.services = db.query(Service).filter(Service.id.in_(payload.service_ids)).all()

    db.commit()
    db.refresh(project)
    return project


@admin_router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def admin_delete_project(
    project_id: uuid.UUID, db: Session = Depends(get_db), _=Depends(require_permission("projects.manage"))
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Project not found.")
    project.is_deleted = True
    db.commit()
