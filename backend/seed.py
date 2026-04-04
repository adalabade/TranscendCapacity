from sqlmodel import Session
from database import engine, create_db_and_tables
import models

def seed_data():
    create_db_and_tables()
    with Session(engine) as session:
        # Example Assignments
        session.add(models.Assignment(AssignmentDescription="Desenvolvimento Frontend"))
        session.add(models.Assignment(AssignmentDescription="Manutenção de Banco"))
        
        # Example Teams
        session.add(models.ProcessTeam(ProcessTeamDescription="Team Alpha"))
        session.add(models.ProcessTeam(ProcessTeamDescription="Team Beta"))
        
        # Example Roles
        session.add(models.Role(RoleDescription="Sênior Developer"))
        session.add(models.Role(RoleDescription="Tech Lead"))
        
        # Example Companies
        session.add(models.Company(CompanyDescription="Transcend Corp"))
        
        # Example Sprints
        session.add(models.Sprint(SprintDescription="Sprint 2024.1"))
        
        # Example Releases
        session.add(models.Release(ReleaseDescription="v1.0.0-PROD"))
        
        # Countries
        session.add(models.Country(CountryID="IN", CountryDescription="India"))
        session.add(models.Country(CountryID="ES", CountryDescription="Spain"))
        session.add(models.Country(CountryID="BE", CountryDescription="Belgium"))
        session.add(models.Country(CountryID="GB", CountryDescription="United Kingdom"))
        session.add(models.Country(CountryID="US", CountryDescription="United States"))
        
        session.commit() # Commit lookups first to ensure IDs are available

        # Resources
        session.add(models.Resource(
            ResourceName="Alice Johnson", 
            JIRAUserID="alice.j", 
            ProcessTeamID=1, 
            RoleID=2, 
            CompanyID=1, 
            CountryID="US"
        ))
        session.add(models.Resource(
            ResourceName="Bob Smith", 
            JIRAUserID="bob.s", 
            ProcessTeamID=1, 
            RoleID=1, 
            CompanyID=1, 
            CountryID="GB"
        ))
        session.add(models.Resource(
            ResourceName="Carlos Rodriguez", 
            JIRAUserID="carlos.r", 
            ProcessTeamID=2, 
            RoleID=1, 
            CompanyID=1, 
            CountryID="ES"
        ))
        
        session.commit() # Commit resources first

        # Max Allocation Capacities
        session.add(models.ResourceAllocationMax(ResourceID=1, ReleaseID=1, SprintID=1, AllocationMaxCapacity=1.0))
        session.add(models.ResourceAllocationMax(ResourceID=2, ReleaseID=1, SprintID=1, AllocationMaxCapacity=0.8))
        session.add(models.ResourceAllocationMax(ResourceID=3, ReleaseID=1, SprintID=1, AllocationMaxCapacity=1.0))
        
        session.commit() # Commit max capacities

        # Actual Allocations
        # Alice: 0.7 on Frontend, 0.2 on DB (Total 0.9 / Max 1.0)
        session.add(models.Allocation(ResourceID=1, ReleaseID=1, SprintID=1, AssignmentID=1, AllocationValue=0.7))
        session.add(models.Allocation(ResourceID=1, ReleaseID=1, SprintID=1, AssignmentID=2, AllocationValue=0.2))
        
        # Bob: 0.8 on Frontend (Total 0.8 / Max 0.8)
        session.add(models.Allocation(ResourceID=2, ReleaseID=1, SprintID=1, AssignmentID=1, AllocationValue=0.8))
        
        session.commit()
    print("Banco de dados semeado com sucesso!")

if __name__ == "__main__":
    seed_data()
