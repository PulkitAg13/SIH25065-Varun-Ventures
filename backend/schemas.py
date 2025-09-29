from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

# Assessment schemas
class AssessmentBase(BaseModel):
    name: str
    location: str
    dwellers: int
    roof_area: float
    open_space: float
    roof_type: str
    roof_age: int = Field(ge=0, le=100, description="Age of roof in years")

class AssessmentCreate(AssessmentBase):
    pass

class AssessmentUpdate(BaseModel):
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    soil_type: Optional[str] = None
    aquifer_type: Optional[str] = None
    water_depth: Optional[float] = None
    annual_rainfall: Optional[float] = None
    runoff_coefficient: Optional[float] = None
    recommended_structure: Optional[str] = None
    annual_harvestable_water: Optional[float] = None
    installation_cost: Optional[float] = None
    payback_period: Optional[float] = None
    feedback_rating: Optional[float] = Field(None, ge=1, le=5)
    feedback_notes: Optional[str] = None

    class Config:
        orm_mode = True

class Assessment(AssessmentBase):
    id: int
    latitude: Optional[float]
    longitude: Optional[float]
    soil_type: Optional[str]
    aquifer_type: Optional[str]
    water_depth: Optional[float]
    annual_rainfall: Optional[float]
    runoff_coefficient: Optional[float]
    recommended_structure: Optional[str]
    annual_harvestable_water: Optional[float]
    installation_cost: Optional[float]
    payback_period: Optional[float]
    feedback_rating: Optional[float]
    feedback_notes: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        orm_mode = True

# ML Prediction schemas
class MLPredictionRequest(BaseModel):
    roof_type: str
    roof_age: int = Field(ge=0, le=100)
    roof_area: float = Field(gt=0)
    open_space: float = Field(ge=0)
    soil_type: str
    aquifer_type: str
    water_depth: float = Field(gt=0)
    annual_rainfall: float = Field(gt=0)
    region: str = "urban"

class MLPredictionResponse(BaseModel):
    runoff_coefficient: float = Field(ge=0.0, le=1.0)
    recommended_structure: str
    annual_harvestable_water: float = Field(ge=0)
    installation_cost: float = Field(ge=0)
    payback_period: float = Field(ge=0)
    success: bool = True

# Feedback schema
class FeedbackSchema(BaseModel):
    rating: float = Field(..., ge=1, le=5, description="Rating between 1-5")
    notes: Optional[str] = None

# Request/Response schemas for APIs
class GeocodingRequest(BaseModel):
    address: str

class GeocodingResponse(BaseModel):
    latitude: float
    longitude: float
    success: bool = True

class RainfallRequest(BaseModel):
    latitude: float
    longitude: float

class RainfallResponse(BaseModel):
    annual_rainfall: float
    monthly_breakdown: List[float]
    success: bool = True

class GroundwaterRequest(BaseModel):
    latitude: float
    longitude: float

class GroundwaterResponse(BaseModel):
    depth_to_water: float
    aquifer_type: str
    water_quality: str
    success: bool = True

class SoilTypeRequest(BaseModel):
    latitude: float
    longitude: float

class SoilTypeResponse(BaseModel):
    soil_type: str
    success: bool = True

class CalculateRequest(BaseModel):
    roof_area: float
    roof_type: str
    rainfall: float
    dwellers: int

class CalculateResponse(BaseModel):
    harvestable_water: float
    annual_demand: float
    potential_savings: float
    savings_percentage: float
    success: bool = True

class RecommendationRequest(BaseModel):
    roof_area: float
    open_space: float
    soil_type: str
    aquifer_type: str
    water_depth: float
    rainfall: float

class RecommendationItem(BaseModel):
    name: str
    description: str
    dimensions: Optional[str] = None
    capacity: Optional[str] = None
    cost: str
    confidence: Optional[float] = Field(None, ge=0.0, le=1.0)

class RecommendationResponse(BaseModel):
    recommendations: List[RecommendationItem]
    cost_benefit_analysis: Optional[Dict[str, Any]] = None
    success: bool = True

class AquiferInfoRequest(BaseModel):
    aquifer_type: str

class AquiferInfoResponse(BaseModel):
    description: str
    recharge_potential: str
    suitable_structures: List[str]
    success: bool = True

class WaterLevelTrendsRequest(BaseModel):
    latitude: float
    longitude: float

class WaterLevelTrend(BaseModel):
    year: int
    water_level: float

class WaterLevelTrendsResponse(BaseModel):
    trends: List[WaterLevelTrend]
    trend_analysis: Optional[str] = None
    success: bool = True

# Additional schemas for enhanced functionality
class RegionDetectionRequest(BaseModel):
    latitude: float
    longitude: float
    address: Optional[str] = None

class RegionDetectionResponse(BaseModel):
    region_type: str  # urban, semi-urban, rural
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    success: bool = True

class CostFactorsRequest(BaseModel):
    region: str
    structure_type: str
    roof_area: float

class CostFactorsResponse(BaseModel):
    material_cost_index: float
    labor_cost_index: float
    transportation_factor: float
    success: bool = True

class WaterQualityRequest(BaseModel):
    latitude: float
    longitude: float

class WaterQualityResponse(BaseModel):
    quality_index: float = Field(ge=0, le=100)
    contamination_level: str  # low, medium, high
    suitable_for: List[str]  # drinking, irrigation, industrial, etc.
    success: bool = True

# Batch processing schemas
class BatchAssessmentRequest(BaseModel):
    assessments: List[AssessmentCreate]
    process_async: bool = False

class BatchAssessmentResponse(BaseModel):
    processed_count: int
    successful_count: int
    failed_count: int
    results: List[Assessment]
    success: bool = True

# Export schemas
class ExportRequest(BaseModel):
    assessment_ids: List[int]
    format: str = "json"  # json, csv, pdf

class ExportResponse(BaseModel):
    download_url: str
    file_size: int
    format: str
    success: bool = True

# Analytics schemas
class AnalyticsRequest(BaseModel):
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    region: Optional[str] = None
    structure_type: Optional[str] = None

class AnalyticsResponse(BaseModel):
    total_assessments: int
    average_water_savings: float
    average_cost: float
    most_recommended_structure: str
    regional_breakdown: Dict[str, int]
    success: bool = True

# Model training feedback schemas
class TrainingDataPoint(BaseModel):
    features: Dict[str, Any]
    actual_outputs: Dict[str, Any]
    location: str
    timestamp: datetime
    data_quality: str = "high"  # high, medium, low

class TrainingFeedbackRequest(BaseModel):
    data_points: List[TrainingDataPoint]
    model_type: str  # runoff, structure, harvest, cost

class TrainingFeedbackResponse(BaseModel):
    accepted_points: int
    rejected_points: int
    model_accuracy_improvement: Optional[float] = None
    success: bool = True