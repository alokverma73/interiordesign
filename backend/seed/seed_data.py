"""
Seed the database with roles, permissions and realistic demo data so the
site never looks empty on first run.

Usage:
    python -m seed.seed_data
"""
import datetime
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parent.parent))

from app.auth.security import hash_password  # noqa: E402
from app.config.database import Base, SessionLocal, engine  # noqa: E402
from app.models.content import FAQ, BlogCategory, BlogPost, Testimonial, WebsiteSetting  # noqa: E402
from app.models.project import (  # noqa: E402
    Project, ProjectCategory, ProjectMember, ProjectMemberRole, ProjectMilestone,
    ProjectStatus, Service,
)
from app.models.user import CustomerProfile, Permission, Role, StaffRole, User, UserType  # noqa: E402

PERMISSIONS = [
    ("services.manage", "Create, edit, delete services"),
    ("projects.manage", "Create, edit, delete projects and milestones"),
    ("enquiries.manage", "View and manage leads/enquiries"),
    ("appointments.manage", "Manage the appointment calendar"),
    ("content.manage", "Manage testimonials, blog, gallery, FAQ, contact messages"),
    ("settings.manage", "Edit website/CMS settings"),
    ("users.manage", "Manage staff accounts and roles"),
    ("customers.manage", "View and manage customer accounts"),
    ("documents.manage", "Delete/manage uploaded project documents"),
]

ROLE_PERMISSIONS = {
    StaffRole.SUPER_ADMIN: [p[0] for p in PERMISSIONS],  # bypassed anyway, kept for completeness
    StaffRole.ADMIN: [p[0] for p in PERMISSIONS],
    StaffRole.PROJECT_MANAGER: [
        "projects.manage", "enquiries.manage", "appointments.manage", "documents.manage", "customers.manage",
    ],
    StaffRole.DESIGNER: ["projects.manage", "documents.manage"],
    StaffRole.CONTENT_MANAGER: ["content.manage", "settings.manage"],
}


def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # ---------- Permissions & Roles ----------
        perm_objs = {}
        for code, desc in PERMISSIONS:
            perm = db.query(Permission).filter(Permission.code == code).first()
            if not perm:
                perm = Permission(code=code, description=desc)
                db.add(perm)
                db.flush()
            perm_objs[code] = perm

        role_objs = {}
        for role_name, perm_codes in ROLE_PERMISSIONS.items():
            role = db.query(Role).filter(Role.name == role_name).first()
            if not role:
                role = Role(name=role_name, description=role_name.value.replace("_", " ").title())
                db.add(role)
                db.flush()
            role.permissions = [perm_objs[c] for c in perm_codes]
            role_objs[role_name] = role
        db.commit()

        # ---------- Demo staff users ----------
        def get_or_create_staff(email, name, role_name):
            user = db.query(User).filter(User.email == email).first()
            if not user:
                user = User(
                    email=email,
                    hashed_password=hash_password("DemoPass123!"),
                    full_name=name,
                    user_type=UserType.STAFF,
                    role_id=role_objs[role_name].id,
                    is_active=True,
                    is_email_verified=True,
                )
                db.add(user)
                db.flush()
            return user

        admin = get_or_create_staff("admin@aetherlume.demo", "Admin User", StaffRole.SUPER_ADMIN)
        designer = get_or_create_staff("designer@aetherlume.demo", "Riya Kapoor", StaffRole.DESIGNER)
        pm = get_or_create_staff("pm@aetherlume.demo", "Arjun Mehta", StaffRole.PROJECT_MANAGER)
        db.commit()

        # ---------- Demo customer ----------
        customer = db.query(User).filter(User.email == "customer@aetherlume.demo").first()
        if not customer:
            customer = User(
                email="customer@aetherlume.demo",
                hashed_password=hash_password("DemoPass123!"),
                full_name="Ananya Sharma",
                phone="+91 98765 43210",
                user_type=UserType.CUSTOMER,
                is_active=True,
                is_email_verified=True,
            )
            db.add(customer)
            db.flush()
            db.add(CustomerProfile(user_id=customer.id, city="Mumbai", preferred_contact_method="EMAIL"))
        db.commit()

        # ---------- Services ----------
        services_data = [
            ("Residential Interior Design", "residential-interior-design",
             "Full-home interiors tailored to how you actually live."),
            ("Modular Kitchen", "modular-kitchen", "Ergonomic, high-durability kitchens built to order."),
            ("Living Room Design", "living-room-design", "Layouts and finishes designed for everyday life and hosting."),
            ("Bedroom Design", "bedroom-design", "Calm, considered bedroom interiors."),
            ("Office Interior", "office-interior", "Workspaces designed for focus and culture."),
            ("Commercial Interior", "commercial-interior", "Retail and hospitality interiors that perform."),
            ("Turnkey Interior", "turnkey-interior", "End-to-end execution — design to handover, one point of contact."),
            ("3D Visualization", "3d-visualization", "Photoreal renders before a single wall changes."),
        ]
        service_objs = {}

        # Verified, real (non-placeholder) photos fetched and confirmed working —
        # matched to the services where a strong real-content match exists.
        # Services not listed here fall back to the frontend's rotation pool.
        SERVICE_COVER_IMAGES = {
            "modular-kitchen": "https://images.unsplash.com/photo-1649083048198-f57bd8fb7a3b?q=80&w=1200&auto=format&fit=crop",
            "living-room-design": "https://images.unsplash.com/photo-1768488314310-3742b3c75579?q=80&w=1200&auto=format&fit=crop",
            "bedroom-design": "https://images.unsplash.com/photo-1617325247661-675ab4b64ae2?q=80&w=1200&auto=format&fit=crop",
            "office-interior": "https://images.unsplash.com/photo-1747992021633-762a63985d01?q=80&w=1200&auto=format&fit=crop",
        }

        for i, (name, slug, short_desc) in enumerate(services_data):
            svc = db.query(Service).filter(Service.slug == slug).first()
            if not svc:
                svc = Service(
                    name=name, slug=slug, short_description=short_desc,
                    description=f"{short_desc} Our team manages concept, material selection, "
                                 f"3D visualization and execution end-to-end.",
                    cover_image_url=SERVICE_COVER_IMAGES.get(slug),
                    features=["Free initial consultation", "3D visualization included", "Dedicated project manager"],
                    process_steps=[
                        {"title": "Consultation", "description": "Understand your brief, site and budget."},
                        {"title": "Concept", "description": "Mood boards and spatial concepts."},
                        {"title": "Design & 3D", "description": "Detailed drawings and photoreal renders."},
                        {"title": "Execution", "description": "On-site execution with quality checkpoints."},
                    ],
                    faqs=[{"question": "How long does this take?", "answer": "Typically 6-14 weeks depending on scope."}],
                    display_order=i, is_active=True,
                )
                db.add(svc)
                db.flush()
            elif svc.cover_image_url is None and slug in SERVICE_COVER_IMAGES:
                # Backfill for a service created before this image mapping existed.
                svc.cover_image_url = SERVICE_COVER_IMAGES[slug]
            service_objs[slug] = svc
        db.commit()
        # Verified, real (non-placeholder) photos fetched and confirmed working —
        # matched to the services where a strong real-content match exists.
        # Services not listed here fall back to the frontend's rotation pool.
        SERVICE_COVER_IMAGES = {
            "modular-kitchen": "https://images.unsplash.com/photo-1649083048198-f57bd8fb7a3b?q=80&w=1200&auto=format&fit=crop",
            "living-room-design": "https://images.unsplash.com/photo-1768488314310-3742b3c75579?q=80&w=1200&auto=format&fit=crop",
            "bedroom-design": "https://images.unsplash.com/photo-1617325247661-675ab4b64ae2?q=80&w=1200&auto=format&fit=crop",
            "office-interior": "https://images.unsplash.com/photo-1747992021633-762a63985d01?q=80&w=1200&auto=format&fit=crop",
        }

        for i, (name, slug, short_desc) in enumerate(services_data):
            svc = db.query(Service).filter(Service.slug == slug).first()
            if not svc:
                svc = Service(
                    name=name, slug=slug, short_description=short_desc,
                    description=f"{short_desc} Our team manages concept, material selection, "
                                 f"3D visualization and execution end-to-end.",
                    cover_image_url=SERVICE_COVER_IMAGES.get(slug),
                    features=["Free initial consultation", "3D visualization included", "Dedicated project manager"],
                    process_steps=[
                        {"title": "Consultation", "description": "Understand your brief, site and budget."},
                        {"title": "Concept", "description": "Mood boards and spatial concepts."},
                        {"title": "Design & 3D", "description": "Detailed drawings and photoreal renders."},
                        {"title": "Execution", "description": "On-site execution with quality checkpoints."},
                    ],
                    faqs=[{"question": "How long does this take?", "answer": "Typically 6-14 weeks depending on scope."}],
                    display_order=i, is_active=True,
                )
                db.add(svc)
                db.flush()
            elif svc.cover_image_url is None and slug in SERVICE_COVER_IMAGES:
                # Backfill for a service created before this image mapping existed.
                svc.cover_image_url = SERVICE_COVER_IMAGES[slug]
            service_objs[slug] = svc
        db.commit()

        # Verified, real (non-placeholder) photos fetched and confirmed working —
        # matched to the services where a strong real-content match exists.
        # Services not listed here fall back to the frontend's rotation pool.
        SERVICE_COVER_IMAGES = {
            "modular-kitchen": "https://images.unsplash.com/photo-1649083048198-f57bd8fb7a3b?q=80&w=1200&auto=format&fit=crop",
            "living-room-design": "https://images.unsplash.com/photo-1768488314310-3742b3c75579?q=80&w=1200&auto=format&fit=crop",
            "bedroom-design": "https://images.unsplash.com/photo-1617325247661-675ab4b64ae2?q=80&w=1200&auto=format&fit=crop",
            "office-interior": "https://images.unsplash.com/photo-1747992021633-762a63985d01?q=80&w=1200&auto=format&fit=crop",
        }

        for i, (name, slug, short_desc) in enumerate(services_data):
            svc = db.query(Service).filter(Service.slug == slug).first()
            if not svc:
                svc = Service(
                    name=name, slug=slug, short_description=short_desc,
                    description=f"{short_desc} Our team manages concept, material selection, "
                                 f"3D visualization and execution end-to-end.",
                    cover_image_url=SERVICE_COVER_IMAGES.get(slug),
                    features=["Free initial consultation", "3D visualization included", "Dedicated project manager"],
                    process_steps=[
                        {"title": "Consultation", "description": "Understand your brief, site and budget."},
                        {"title": "Concept", "description": "Mood boards and spatial concepts."},
                        {"title": "Design & 3D", "description": "Detailed drawings and photoreal renders."},
                        {"title": "Execution", "description": "On-site execution with quality checkpoints."},
                    ],
                    faqs=[{"question": "How long does this take?", "answer": "Typically 6-14 weeks depending on scope."}],
                    display_order=i, is_active=True,
                )
                db.add(svc)
                db.flush()
            elif svc.cover_image_url is None and slug in SERVICE_COVER_IMAGES:
                # Backfill for a service created before this image mapping existed.
                svc.cover_image_url = SERVICE_COVER_IMAGES[slug]
            service_objs[slug] = svc
        db.commit()

        # ---------- Demo project (with a live portal for the demo customer) ----------
        project = db.query(Project).filter(Project.slug == "ananya-3bhk-bandra").first()
        if not project:
            project = Project(
                name="A Warm Minimalist 3BHK",
                slug="ananya-3bhk-bandra",
                category=ProjectCategory.APARTMENT,
                location="Bandra West, Mumbai",
                client_type="Individual Homeowner",
                area_sqft=1450,
                description="A warm, minimal 3BHK apartment interior blending natural materials with "
                             "restrained detailing throughout.",
                design_concept="Warm minimalism — white oak, limewash walls, brass accents.",
                materials_used=["White oak veneer", "Limewash paint", "Brass hardware", "Terrazzo flooring"],
                is_featured=True,
                is_published=True,
                status=ProjectStatus.EXECUTION,
                start_date=datetime.date.today() - datetime.timedelta(days=45),
                expected_completion_date=datetime.date.today() + datetime.timedelta(days=40),
                customer_id=customer.id,
            )
            project.services = [service_objs["residential-interior-design"], service_objs["modular-kitchen"]]
            db.add(project)
            db.flush()

            db.add(ProjectMember(project_id=project.id, user_id=designer.id, role=ProjectMemberRole.DESIGNER))
            db.add(ProjectMember(project_id=project.id, user_id=pm.id, role=ProjectMemberRole.PROJECT_MANAGER))

            milestone_defs = [
                ("Consultation", ProjectStatus.CONSULTATION, True),
                ("Concept & Moodboard", ProjectStatus.CONCEPT, True),
                ("Detailed Design", ProjectStatus.DESIGN, True),
                ("3D Visualization", ProjectStatus.VISUALIZATION, True),
                ("Client Approval", ProjectStatus.APPROVAL, True),
                ("Material Procurement", ProjectStatus.PROCUREMENT, True),
                ("Execution", ProjectStatus.EXECUTION, False),
                ("Installation", ProjectStatus.INSTALLATION, False),
                ("Handover", ProjectStatus.HANDOVER, False),
            ]
            for order, (title, status_val, done) in enumerate(milestone_defs):
                db.add(
                    ProjectMilestone(
                        project_id=project.id, title=title, status=status_val,
                        sort_order=order, is_completed=done,
                        completed_at=datetime.date.today() - datetime.timedelta(days=(9 - order) * 5) if done else None,
                    )
                )
            db.commit()

        # ---------- Testimonials ----------
        if db.query(Testimonial).count() == 0:
            db.add_all([
                Testimonial(
                    client_name="Ananya Sharma", client_location="Bandra, Mumbai", project_id=project.id,
                    rating=5, content="The team translated a vague mood board into a home that actually "
                    "feels like us. Communication throughout execution was excellent.",
                    is_approved=True, is_published=True, is_featured=True, display_order=0,
                ),
                Testimonial(
                    client_name="Karan Vora", client_location="Powai, Mumbai", rating=5,
                    content="Professional from the first site visit to final handover. Highly recommend "
                    "for anyone doing a full-home renovation.",
                    is_approved=True, is_published=True, is_featured=True, display_order=1,
                ),
                Testimonial(
                    client_name="Meera Iyer", client_location="Indiranagar, Bengaluru", rating=4,
                    content="Great design sense and a genuinely collaborative process on material selection.",
                    is_approved=True, is_published=True, display_order=2,
                ),
            ])

        # ---------- Blog ----------
        if db.query(BlogCategory).count() == 0:
            cat = BlogCategory(name="Design Notes", slug="design-notes")
            db.add(cat)
            db.flush()
            db.add(BlogPost(
                title="Five Materials We Keep Coming Back To",
                slug="five-materials-we-keep-coming-back-to",
                excerpt="A short list of materials that age well and photograph even better.",
                content="White oak, limewash, brass, terrazzo and linen — a short case for each, and "
                        "where they work best in an Indian home.",
                category_id=cat.id, author_id=designer.id, is_published=True,
                published_at=datetime.datetime.utcnow().isoformat(),
            ))

        # ---------- FAQs ----------
        if db.query(FAQ).count() == 0:
            db.add_all([
                FAQ(question="How long does a full-home interior project take?",
                    answer="Most 2-4BHK projects take 10-16 weeks from design approval to handover, "
                           "depending on scope and material lead times.", category="Process", display_order=0),
                FAQ(question="Do you offer 3D visualization before execution?",
                    answer="Yes — every project includes photoreal 3D renders before any execution begins.",
                    category="Process", display_order=1),
                FAQ(question="What is included in a turnkey project?",
                    answer="Design, material sourcing, civil work, execution and handover — one contract, "
                           "one point of contact.", category="Pricing", display_order=2),
            ])

        # ---------- Website settings (CMS) ----------
        default_settings = [
            ("hero_headline", "Interiors, considered.", "homepage"),
            ("hero_subtitle", "A design studio for homes and workspaces that are built to be lived in, not just photographed.", "homepage"),
            ("company_name", "Aetherlume Interiors", "company"),
            ("company_phone", "+91 79000 96886", "company"),
            ("company_email", "knafis574@gmail.com", "company"),
            ("company_address", "Kalyan, Maharashtra", "company"),
            ("stat_projects_completed", 180, "homepage"),
            ("stat_years_experience", 12, "homepage"),
            ("stat_cities_served", 6, "homepage"),
            ("social_instagram", "https://www.instagram.com/shameem_interior_kalyan", "company"),
        ]
        for key, value, group in default_settings:
            if not db.query(WebsiteSetting).filter(WebsiteSetting.key == key).first():
                db.add(WebsiteSetting(key=key, value=value, group=group))

        db.commit()
        print("Seed complete.")
        print("Demo admin:     admin@aetherlume.demo / DemoPass123!")
        print("Demo designer:  designer@aetherlume.demo / DemoPass123!")
        print("Demo PM:        pm@aetherlume.demo / DemoPass123!")
        print("Demo customer:  customer@aetherlume.demo / DemoPass123!")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
