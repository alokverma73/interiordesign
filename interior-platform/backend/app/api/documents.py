import uuid
from typing import List

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_customer, get_current_user, require_permission
from app.config.database import get_db
from app.models.communication import Notification, NotificationType
from app.models.project import DocumentCategory, Project, ProjectDocument
from app.models.user import User, UserType
from app.utils.file_storage import get_storage_backend

router = APIRouter(tags=["Documents"])


def _serialize(doc: ProjectDocument) -> dict:
    return {
        "id": doc.id,
        "category": doc.category,
        "file_name": doc.file_name,
        "file_size_bytes": doc.file_size_bytes,
        "mime_type": doc.mime_type,
        "created_at": doc.created_at,
    }


def _assert_project_access(project: Project, user: User) -> None:
    """Customers may only touch their own project's documents; staff have blanket access."""
    if user.user_type == UserType.CUSTOMER and project.customer_id != user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "You do not have access to this project's documents.")


@router.get("/dashboard/projects/{project_id}/documents")
def list_project_documents(
    project_id: uuid.UUID, db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Project not found.")
    _assert_project_access(project, user)

    docs = (
        db.query(ProjectDocument)
        .filter(ProjectDocument.project_id == project_id, ProjectDocument.is_deleted.is_(False))
        .order_by(ProjectDocument.created_at.desc())
        .all()
    )
    return [_serialize(d) for d in docs]


@router.post("/dashboard/projects/{project_id}/documents", status_code=status.HTTP_201_CREATED)
def upload_project_document(
    project_id: uuid.UUID,
    category: DocumentCategory,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Project not found.")
    _assert_project_access(project, user)

    storage = get_storage_backend()
    storage_key = storage.save(file, subfolder=f"projects/{project_id}")

    file.file.seek(0, 2)
    size = file.file.tell()

    doc = ProjectDocument(
        project_id=project_id,
        uploaded_by_id=user.id,
        category=category,
        file_name=file.filename,
        storage_key=storage_key,
        file_size_bytes=size,
        mime_type=file.content_type or "application/octet-stream",
    )
    db.add(doc)

    # Notify the customer when staff uploads, and vice versa.
    recipients: List[uuid.UUID] = []
    if user.user_type == UserType.STAFF and project.customer_id:
        recipients.append(project.customer_id)
    for member in project.members:
        recipients.append(member.user_id)

    for recipient_id in set(recipients):
        if recipient_id != user.id:
            db.add(
                Notification(
                    user_id=recipient_id,
                    type=NotificationType.NEW_DOCUMENT,
                    title="New document uploaded",
                    body=f'"{file.filename}" was added to {project.name}.',
                    link=f"/dashboard/projects/{project_id}",
                )
            )

    db.commit()
    db.refresh(doc)
    return _serialize(doc)


@router.get("/dashboard/documents/{document_id}/download")
def download_project_document(
    document_id: uuid.UUID, db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    doc = db.query(ProjectDocument).filter(ProjectDocument.id == document_id, ProjectDocument.is_deleted.is_(False)).first()
    if not doc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Document not found.")

    project = db.query(Project).filter(Project.id == doc.project_id).first()
    _assert_project_access(project, user)

    storage = get_storage_backend()
    path = storage.get_download_path(doc.storage_key)
    return FileResponse(path, filename=doc.file_name, media_type=doc.mime_type)


@router.delete("/dashboard/documents/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project_document(
    document_id: uuid.UUID, db: Session = Depends(get_db), _=Depends(require_permission("documents.manage"))
):
    doc = db.query(ProjectDocument).filter(ProjectDocument.id == document_id).first()
    if not doc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Document not found.")
    doc.is_deleted = True
    db.commit()
