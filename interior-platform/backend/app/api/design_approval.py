import uuid
from typing import List

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from pydantic import BaseModel
from sqlalchemy.orm import Session, selectinload

from app.auth.dependencies import get_current_customer, require_permission
from app.config.database import get_db
from app.models.communication import Notification, NotificationType
from app.models.project import DesignApproval, DesignProposal, DesignProposalStatus, Project
from app.utils.file_storage import get_storage_backend

router = APIRouter(tags=["Design Approval"])


class ProposalOut(BaseModel):
    id: uuid.UUID
    version: int
    title: str
    files: List[str]
    status: DesignProposalStatus

    model_config = {"from_attributes": True}


class ApprovalDecision(BaseModel):
    decision: DesignProposalStatus
    comment: str | None = None


# ---------- Staff: upload a new versioned proposal ----------

admin_router = APIRouter(prefix="/admin/projects/{project_id}/proposals", tags=["Admin - Design Proposals"])


@admin_router.post("", response_model=ProposalOut, status_code=status.HTTP_201_CREATED)
def upload_proposal(
    project_id: uuid.UUID,
    title: str,
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
    staff=Depends(require_permission("projects.manage")),
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Project not found.")

    storage = get_storage_backend()
    stored_keys = [storage.save(f, subfolder=f"projects/{project_id}/proposals") for f in files]

    latest = (
        db.query(DesignProposal)
        .filter(DesignProposal.project_id == project_id)
        .order_by(DesignProposal.version.desc())
        .first()
    )
    next_version = (latest.version + 1) if latest else 1

    proposal = DesignProposal(
        project_id=project_id,
        uploaded_by_id=staff.id,
        version=next_version,
        title=title,
        files=stored_keys,
        status=DesignProposalStatus.PENDING_REVIEW,
    )
    db.add(proposal)

    if project.customer_id:
        db.add(
            Notification(
                user_id=project.customer_id,
                type=NotificationType.DESIGN_APPROVAL_REQUEST,
                title=f"New design proposal for {project.name}",
                body=f'"{title}" (v{next_version}) is ready for your review.',
                link=f"/dashboard/projects/{project_id}",
            )
        )

    db.commit()
    db.refresh(proposal)
    return proposal


# ---------- Customer: view + approve/request changes ----------

portal_router = APIRouter(prefix="/dashboard/projects/{project_id}/proposals", tags=["Customer Portal"])


@portal_router.get("", response_model=List[ProposalOut])
def list_proposals(project_id: uuid.UUID, db: Session = Depends(get_db), customer=Depends(get_current_customer)):
    project = db.query(Project).filter(Project.id == project_id, Project.customer_id == customer.id).first()
    if not project:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Project not found.")
    return (
        db.query(DesignProposal)
        .options(selectinload(DesignProposal.approvals))
        .filter(DesignProposal.project_id == project_id)
        .order_by(DesignProposal.version.desc())
        .all()
    )


@portal_router.post("/{proposal_id}/decision", response_model=ProposalOut)
def submit_decision(
    project_id: uuid.UUID,
    proposal_id: uuid.UUID,
    payload: ApprovalDecision,
    db: Session = Depends(get_db),
    customer=Depends(get_current_customer),
):
    project = db.query(Project).filter(Project.id == project_id, Project.customer_id == customer.id).first()
    if not project:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Project not found.")

    proposal = db.query(DesignProposal).filter(DesignProposal.id == proposal_id, DesignProposal.project_id == project_id).first()
    if not proposal:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Proposal not found.")

    if payload.decision not in (DesignProposalStatus.APPROVED, DesignProposalStatus.CHANGES_REQUESTED):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid decision.")

    proposal.status = payload.decision
    db.add(
        DesignApproval(
            proposal_id=proposal.id, customer_id=customer.id, decision=payload.decision, comment=payload.comment
        )
    )

    for member in project.members:
        db.add(
            Notification(
                user_id=member.user_id,
                type=NotificationType.DESIGN_APPROVAL_REQUEST,
                title=f"Design proposal {payload.decision.value.lower().replace('_', ' ')}",
                body=f'{customer.full_name} responded to "{proposal.title}" (v{proposal.version}).',
                link=f"/admin/projects/{project_id}",
            )
        )

    db.commit()
    db.refresh(proposal)
    return proposal
