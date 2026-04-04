from typing import Optional
from sqlmodel import Field, SQLModel
from sqlalchemy import UniqueConstraint

class Assignment(SQLModel, table=True):
    AssignmentID: Optional[int] = Field(default=None, primary_key=True)
    AssignmentDescription: str

class ProcessTeam(SQLModel, table=True):
    ProcessTeamID: Optional[int] = Field(default=None, primary_key=True)
    ProcessTeamDescription: str

class Role(SQLModel, table=True):
    RoleID: Optional[int] = Field(default=None, primary_key=True)
    RoleDescription: str

class Company(SQLModel, table=True):
    CompanyID: Optional[int] = Field(default=None, primary_key=True)
    CompanyDescription: str

class Sprint(SQLModel, table=True):
    SprintID: Optional[int] = Field(default=None, primary_key=True)
    SprintDescription: str

class Release(SQLModel, table=True):
    ReleaseID: Optional[int] = Field(default=None, primary_key=True)
    ReleaseDescription: str

class Country(SQLModel, table=True):
    CountryID: str = Field(primary_key=True, max_length=2)
    CountryDescription: str

class Resource(SQLModel, table=True):
    ResourceID: Optional[int] = Field(default=None, primary_key=True)
    ResourceName: str
    JIRAUserID: str
    ProcessTeamID: Optional[int] = Field(default=None, foreign_key="processteam.ProcessTeamID")
    RoleID: Optional[int] = Field(default=None, foreign_key="role.RoleID")
    CompanyID: Optional[int] = Field(default=None, foreign_key="company.CompanyID")
    CountryID: Optional[str] = Field(default=None, foreign_key="country.CountryID")

class ResourceAllocationMax(SQLModel, table=True):
    AllocationMaxID: Optional[int] = Field(default=None, primary_key=True)
    ResourceID: int = Field(foreign_key="resource.ResourceID")
    ReleaseID: int = Field(foreign_key="release.ReleaseID")
    SprintID: int = Field(foreign_key="sprint.SprintID")
    AllocationMaxCapacity: float

    __table_args__ = (
        UniqueConstraint("ResourceID", "ReleaseID", "SprintID", name="unique_allocation_max"),
    )

class Allocation(SQLModel, table=True):
    ResourceID: int = Field(foreign_key="resource.ResourceID", primary_key=True)
    ReleaseID: int = Field(foreign_key="release.ReleaseID", primary_key=True)
    SprintID: int = Field(foreign_key="sprint.SprintID", primary_key=True)
    AssignmentID: int = Field(foreign_key="assignment.AssignmentID", primary_key=True)
    AllocationValue: float
