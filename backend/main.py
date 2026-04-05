from pathlib import Path

from fastapi import FastAPI, Depends, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlmodel import Session, select
from typing import List
import database
import models

# ─── Paths ────────────────────────────────────────────────────────────────────
BASE_DIR   = Path(__file__).resolve().parent          # .../backend/
STATIC_DIR = BASE_DIR.parent / "frontend" / "dist"   # .../frontend/dist/

app = FastAPI(title="TranscendCapacity - Alocação de Equipe")

# ─── Startup ──────────────────────────────────────────────────────────────────
@app.on_event("startup")
def on_startup():
    database.create_db_and_tables()

# ─── API ping ─────────────────────────────────────────────────────────────────
@app.get("/api/ping")
def ping():
    return {"message": "TranscendCapacity API running."}

# ─── Helper: generic CRUD factory ─────────────────────────────────────────────
def make_crud(resource: str, Model):
    """Registers GET list, POST create, PUT update, DELETE endpoints under /api/<resource>."""

    @app.get(f"/api/{resource}", response_model=List[Model])
    def read_all(session: Session = Depends(database.get_session)):
        return session.exec(select(Model)).all()

    @app.post(f"/api/{resource}", response_model=Model)
    def create(item: Model, session: Session = Depends(database.get_session)):
        session.add(item)
        session.commit()
        session.refresh(item)
        return item

    @app.put(f"/api/{resource}/{{item_id}}", response_model=Model)
    def update(item_id: int, updated: Model, session: Session = Depends(database.get_session)):
        db_item = session.get(Model, item_id)
        if not db_item:
            raise HTTPException(status_code=404, detail="Not found")
        data = updated.model_dump(exclude_unset=True)
        for key, val in data.items():
            setattr(db_item, key, val)
        session.add(db_item)
        session.commit()
        session.refresh(db_item)
        return db_item

    @app.delete(f"/api/{resource}/{{item_id}}")
    def delete(item_id: int, session: Session = Depends(database.get_session)):
        db_item = session.get(Model, item_id)
        if not db_item:
            raise HTTPException(status_code=404, detail="Not found")
        session.delete(db_item)
        session.commit()
        return {"ok": True}

# ─── Register all lookup tables ───────────────────────────────────────────────
make_crud("assignments",           models.Assignment)
make_crud("process-teams",         models.ProcessTeam)
make_crud("roles",                 models.Role)
make_crud("companies",             models.Company)
make_crud("sprints",               models.Sprint)
make_crud("releases",              models.Release)
make_crud("countries",             models.Country)

# ─── Resources ────────────────────────────────────────────────────────────────
@app.get("/api/resources", response_model=List[models.Resource])
def read_resources(session: Session = Depends(database.get_session)):
    return session.exec(select(models.Resource)).all()

@app.post("/api/resources", response_model=models.Resource)
def create_resource(resource: models.Resource, session: Session = Depends(database.get_session)):
    session.add(resource)
    session.commit()
    session.refresh(resource)
    return resource

@app.put("/api/resources/{item_id}", response_model=models.Resource)
def update_resource(item_id: int, updated: models.Resource, session: Session = Depends(database.get_session)):
    db_item = session.get(models.Resource, item_id)
    if not db_item:
        raise HTTPException(status_code=404, detail="Not found")
    data = updated.model_dump(exclude_unset=True)
    for key, val in data.items():
        setattr(db_item, key, val)
    session.add(db_item)
    session.commit()
    session.refresh(db_item)
    return db_item

@app.delete("/api/resources/{item_id}")
def delete_resource(item_id: int, session: Session = Depends(database.get_session)):
    db_item = session.get(models.Resource, item_id)
    if not db_item:
        raise HTTPException(status_code=404, detail="Not found")
    session.delete(db_item)
    session.commit()
    return {"ok": True}

# ─── Resource Allocation Max ───────────────────────────────────────────────────
@app.get("/api/resource-allocation-max", response_model=List[models.ResourceAllocationMax])
def read_resource_allocation_max(session: Session = Depends(database.get_session)):
    return session.exec(select(models.ResourceAllocationMax)).all()

@app.post("/api/resource-allocation-max", response_model=models.ResourceAllocationMax)
def create_resource_allocation_max(alloc: models.ResourceAllocationMax, session: Session = Depends(database.get_session)):
    session.add(alloc)
    session.commit()
    session.refresh(alloc)
    return alloc

# ─── Allocations ──────────────────────────────────────────────────────────────
@app.get("/api/allocations", response_model=List[models.Allocation])
def read_allocations(session: Session = Depends(database.get_session)):
    return session.exec(select(models.Allocation)).all()

@app.post("/api/allocations", response_model=models.Allocation)
def create_allocation(allocation: models.Allocation, session: Session = Depends(database.get_session)):
    session.add(allocation)
    session.commit()
    session.refresh(allocation)
    return allocation

@app.put("/api/allocations/{res_id}/{rel_id}/{spr_id}/{asgn_id}", response_model=models.Allocation)
def update_allocation(res_id: int, rel_id: int, spr_id: int, asgn_id: int, updated: models.Allocation, session: Session = Depends(database.get_session)):
    db_item = session.get(models.Allocation, (res_id, rel_id, spr_id, asgn_id))
    if not db_item:
        raise HTTPException(status_code=404, detail="Allocation not found")
    db_item.AllocationValue = updated.AllocationValue
    session.add(db_item)
    session.commit()
    session.refresh(db_item)
    return db_item

@app.delete("/api/allocations/{res_id}/{rel_id}/{spr_id}/{asgn_id}")
def delete_allocation(res_id: int, rel_id: int, spr_id: int, asgn_id: int, session: Session = Depends(database.get_session)):
    db_item = session.get(models.Allocation, (res_id, rel_id, spr_id, asgn_id))
    if not db_item:
        raise HTTPException(status_code=404, detail="Allocation not found")
    session.delete(db_item)
    session.commit()
    return {"ok": True}


@app.get("/api/export-data")
def export_data(session: Session = Depends(database.get_session)):
    # Perform a sequence of outer joins to get a flat dataset
    statement = (
        select(
            models.Resource.ResourceName,
            models.Role.RoleDescription,
            models.Company.CompanyDescription,
            models.Country.CountryID,
            models.ProcessTeam.ProcessTeamDescription,
            models.Release.ReleaseDescription,
            models.Sprint.SprintDescription,
            models.Assignment.AssignmentDescription,
            models.Allocation.AllocationValue
        )
        .join(models.Allocation, models.Resource.ResourceID == models.Allocation.ResourceID, isouter=True)
        .join(models.Role, models.Resource.RoleID == models.Role.RoleID, isouter=True)
        .join(models.Company, models.Resource.CompanyID == models.Company.CompanyID, isouter=True)
        .join(models.Country, models.Resource.CountryID == models.Country.CountryID, isouter=True)
        .join(models.ProcessTeam, models.Resource.ProcessTeamID == models.ProcessTeam.ProcessTeamID, isouter=True)
        .join(models.Release, models.Allocation.ReleaseID == models.Release.ReleaseID, isouter=True)
        .join(models.Sprint, models.Allocation.SprintID == models.Sprint.SprintID, isouter=True)
        .join(models.Assignment, models.Allocation.AssignmentID == models.Assignment.AssignmentID, isouter=True)
    )
    
    results = session.exec(statement).all()
    
    # Flatten and handle nulls
    flat = []
    for r in results:
        flat.append({
            "Resource":   r.ResourceName or "-",
            "Role":       r.RoleDescription or "-",
            "Company":    r.CompanyDescription or "-",
            "Country":    r.CountryID or "-",
            "Team":       r.ProcessTeamDescription or "-",
            "Release":    r.ReleaseDescription or "Unassigned",
            "Sprint":     r.SprintDescription or "Unassigned",
            "Assignment": r.AssignmentDescription or "N/A",
            "Allocation": float(r.AllocationValue) if r.AllocationValue is not None else 0.0
        })
    
    return flat

# ─── Serve React SPA (MUST be last — catches all non-API routes) ──────────────
if STATIC_DIR.exists():
    app.mount("/assets", StaticFiles(directory=STATIC_DIR / "assets"), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    def serve_spa(full_path: str):
        """Catch-all: return index.html so React Router handles client-side routes."""
        return FileResponse(STATIC_DIR / "index.html")
else:
    @app.get("/{full_path:path}", include_in_schema=False)
    def spa_not_built(full_path: str):
        return {"error": "Frontend not built. Run: cd frontend && npm run build"}
