from sqlalchemy.orm import Session
from sqlalchemy import func, desc
import models
import schemas
from typing import List, Optional, Dict, Any

def create_assessment(db: Session, assessment: schemas.AssessmentCreate):
    db_assessment = models.UserAssessment(
        name=assessment.name,
        location=assessment.location,
        dwellers=assessment.dwellers,
        roof_area=assessment.roof_area,
        open_space=assessment.open_space,
        roof_type=assessment.roof_type,
        roof_age=assessment.roof_age  # Added the new field
    )
    db.add(db_assessment)
    db.commit()
    db.refresh(db_assessment)
    return db_assessment

def get_assessment(db: Session, assessment_id: int):
    return db.query(models.UserAssessment).filter(models.UserAssessment.id == assessment_id).first()

def get_all_assessments(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.UserAssessment).order_by(desc(models.UserAssessment.created_at)).offset(skip).limit(limit).all()

def update_assessment_results(db: Session, assessment_id: int, results: dict):
    db_assessment = db.query(models.UserAssessment).filter(models.UserAssessment.id == assessment_id).first()
    if db_assessment:
        for key, value in results.items():
            if hasattr(db_assessment, key):
                setattr(db_assessment, key, value)
        db.commit()
        db.refresh(db_assessment)
    return db_assessment

def delete_assessment(db: Session, assessment_id: int):
    db_assessment = db.query(models.UserAssessment).filter(models.UserAssessment.id == assessment_id).first()
    if db_assessment:
        db.delete(db_assessment)
        db.commit()
        return True
    return False

# NEW CRUD FUNCTIONS FOR ENHANCED FUNCTIONALITY

def get_assessments_by_location(db: Session, location: str, limit: int = 10):
    """Get assessments by location (case-insensitive search)"""
    return db.query(models.UserAssessment).filter(
        func.lower(models.UserAssessment.location).ilike(f"%{location.lower()}%")
    ).order_by(desc(models.UserAssessment.created_at)).limit(limit).all()

def get_assessments_by_roof_type(db: Session, roof_type: str):
    """Get assessments by roof type"""
    return db.query(models.UserAssessment).filter(
        models.UserAssessment.roof_type == roof_type
    ).order_by(desc(models.UserAssessment.created_at)).all()

def get_recent_assessments(db: Session, hours: int = 24, limit: int = 50):
    """Get assessments from the last specified hours"""
    from datetime import datetime, timedelta
    time_threshold = datetime.utcnow() - timedelta(hours=hours)
    
    return db.query(models.UserAssessment).filter(
        models.UserAssessment.created_at >= time_threshold
    ).order_by(desc(models.UserAssessment.created_at)).limit(limit).all()

def get_assessments_with_feedback(db: Session, min_rating: Optional[float] = None):
    """Get assessments that have feedback"""
    query = db.query(models.UserAssessment).filter(
        models.UserAssessment.feedback_rating.isnot(None)
    )
    
    if min_rating:
        query = query.filter(models.UserAssessment.feedback_rating >= min_rating)
    
    return query.order_by(desc(models.UserAssessment.feedback_rating)).all()

def get_assessment_stats(db: Session):
    """Get basic statistics about assessments"""
    from sqlalchemy import cast, Float, case
    
    total_assessments = db.query(func.count(models.UserAssessment.id)).scalar()
    
    avg_roof_area = db.query(func.avg(models.UserAssessment.roof_area)).scalar() or 0
    avg_water_harvest = db.query(func.avg(models.UserAssessment.annual_harvestable_water)).filter(
        models.UserAssessment.annual_harvestable_water.isnot(None)
    ).scalar() or 0
    
    # Count by roof type
    roof_type_counts = db.query(
        models.UserAssessment.roof_type,
        func.count(models.UserAssessment.id)
    ).group_by(models.UserAssessment.roof_type).all()
    
    # Count by recommended structure
    structure_counts = db.query(
        models.UserAssessment.recommended_structure,
        func.count(models.UserAssessment.id)
    ).filter(models.UserAssessment.recommended_structure.isnot(None)).group_by(models.UserAssessment.recommended_structure).all()
    
    return {
        'total_assessments': total_assessments,
        'average_roof_area': round(avg_roof_area, 2),
        'average_water_harvest': round(avg_water_harvest, 2),
        'roof_type_distribution': dict(roof_type_counts),
        'structure_recommendations': dict(structure_counts)
    }

def search_assessments(db: Session, search_term: str, limit: int = 20):
    """Search assessments by location or name"""
    return db.query(models.UserAssessment).filter(
        (func.lower(models.UserAssessment.location).ilike(f"%{search_term.lower()}%")) |
        (func.lower(models.UserAssessment.name).ilike(f"%{search_term.lower()}%"))
    ).order_by(desc(models.UserAssessment.created_at)).limit(limit).all()

def update_feedback(db: Session, assessment_id: int, rating: float, notes: Optional[str] = None):
    """Update feedback for an assessment"""
    db_assessment = db.query(models.UserAssessment).filter(models.UserAssessment.id == assessment_id).first()
    if db_assessment:
        db_assessment.feedback_rating = rating
        db_assessment.feedback_notes = notes
        db.commit()
        db.refresh(db_assessment)
    return db_assessment

def get_assessments_by_region(db: Session, region_type: str, limit: int = 50):
    """
    Get assessments by region type (urban/rural)
    This uses a simple heuristic based on location names
    """
    urban_keywords = ['delhi', 'mumbai', 'chennai', 'kolkata', 'bangalore', 'hyderabad', 'pune', 'city']
    
    query = db.query(models.UserAssessment)
    
    if region_type.lower() == 'urban':
        # Filter for urban locations
        conditions = [func.lower(models.UserAssessment.location).ilike(f"%{keyword}%") for keyword in urban_keywords]
        query = query.filter(*conditions)
    elif region_type.lower() == 'rural':
        # Filter for non-urban locations (simplified)
        conditions = [~func.lower(models.UserAssessment.location).ilike(f"%{keyword}%") for keyword in urban_keywords]
        query = query.filter(*conditions)
    
    return query.order_by(desc(models.UserAssessment.created_at)).limit(limit).all()

def export_assessments_data(db: Session, assessment_ids: List[int]):
    """Get assessment data for export"""
    return db.query(models.UserAssessment).filter(
        models.UserAssessment.id.in_(assessment_ids)
    ).all()