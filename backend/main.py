from fastapi import FastAPI, Depends, HTTPException, status, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
import requests
import crud, models, schemas
from database import engine, get_db, init_db
from dependencies import get_db
from ml_models import ml_service
from config import settings
from schemas import MLPredictionResponse, FeedbackSchema

# Create database tables
init_db()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.PROJECT_VERSION
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict to your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# External API clients (to be implemented with real APIs)
class GeocodingClient:
    def get_coordinates(self, address: str):
        try:
            base_url = "https://nominatim.openstreetmap.org/search"
            params = {
                "q": address,
                "format": "json",
                "limit": 1
            }
            headers = {
                "User-Agent": "RTRWH-Assessment-App/1.0"  # Required by Nominatim
            }
            
            response = requests.get(base_url, params=params, headers=headers, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            if data:
                return {
                    "latitude": float(data[0]["lat"]),
                    "longitude": float(data[0]["lon"]),
                    "success": True
                }
            else:
                return {"success": False, "error": "No results found"}
                
        except Exception as e:
            return {"success": False, "error": str(e)}

class RainfallClient:
    def get_rainfall_data(self, lat: float, lon: float):
        try:
            base_url = "https://archive-api.open-meteo.com/v1/archive"
            params = {
                "latitude": lat,
                "longitude": lon,
                "start_date": "2020-01-01",
                "end_date": "2023-12-31",
                "daily": "rain_sum",
                "timezone": "auto"
            }
            
            response = requests.get(base_url, params=params, timeout=15)
            response.raise_for_status()
            
            data = response.json()
            
            # Calculate average annual rainfall
            daily_rainfall = data.get("daily", {}).get("rain_sum", [])
            annual_rainfall = sum(daily_rainfall) / (len(daily_rainfall) / 365.25) if daily_rainfall else 0
            
            # Estimate monthly breakdown (simplified)
            monthly_breakdown = self._estimate_monthly_breakdown(daily_rainfall)
            
            return {
                "annual_rainfall": round(annual_rainfall, 1),
                "monthly_breakdown": monthly_breakdown,
                "success": True
            }
                
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def _estimate_monthly_breakdown(self, daily_rainfall):
        # Simplified estimation - in real implementation, you'd use actual monthly data
        # This is a placeholder that creates a typical monsoon pattern for India
        return [15, 20, 25, 30, 50, 150, 300, 280, 150, 50, 20, 15]

class GroundwaterClient:
    def get_groundwater_data(self, lat: float, lon: float):
        try:
            # This is a placeholder - CGWB doesn't have a direct public API
            # You might need to use pre-downloaded data or scrape their reports
            
            # For now, return estimated values based on location
            depth_to_water = self._estimate_water_depth(lat, lon)
            aquifer_type = self._estimate_aquifer_type(lat, lon)
            
            return {
                "depth_to_water": depth_to_water,
                "aquifer_type": aquifer_type,
                "water_quality": "Good",  # Default assumption
                "success": True
            }
                
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def _estimate_water_depth(self, lat: float, lon: float):
        # Very simplified estimation - in real implementation, use actual data
        # This is just a placeholder that returns a reasonable estimate
        return 10.0 + (abs(lat - 28.6) + abs(lon - 77.2)) * 5
    
    def _estimate_aquifer_type(self, lat: float, lon: float):
        # Simplified estimation based on region
        # North India: Alluvial, South India: Basalt, etc.
        if lat > 20 and lat < 30 and lon > 70 and lon < 90:  # Northern plains
            return "Alluvial"
        elif lat > 10 and lat < 20 and lon > 70 and lon < 80:  # Southern peninsula
            return "Basalt"
        else:
            return "Alluvial"  # Default

class SoilClient:
    def get_soil_data(self, lat: float, lon: float):
        try:
            # OpenLandMap provides soil data via WCS services
            # This is a simplified implementation
            
            soil_type = self._get_soil_type_from_opendata(lat, lon)
            
            return {
                "soil_type": soil_type,
                "success": True
            }
                
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def _get_soil_type_from_opendata(self, lat: float, lon: float):
        # This is a placeholder implementation
        # In a real application, you would query a soil data service
        
        # Simplified logic based on coordinates
        if 28.0 < lat < 29.0 and 76.0 < lon < 78.0:  # Delhi region
            return "Sandy Loam"
        elif 18.0 < lat < 19.0 and 72.0 < lon < 74.0:  # Mumbai region
            return "Clay"
        elif 12.0 < lat < 13.0 and 77.0 < lon < 79.0:  # Bangalore region
            return "Red Loam"
        else:
            return "Sandy Loam"  # Default

geocoding_client = GeocodingClient()
rainfall_client = RainfallClient()
groundwater_client = GroundwaterClient()
soil_client = SoilClient()

@app.get("/")
def read_root():
    return {"message": "Rooftop Rainwater Harvesting Assessment API"}

# ... (keep all the imports and class definitions the same) ...

@app.post("/api/geocode", response_model=schemas.GeocodingResponse)
def geocode_address(request: schemas.GeocodingRequest):
    """Get coordinates from address using geocoding API"""
    try:
        result = geocoding_client.get_coordinates(request.address)
        if result["success"]:
            return schemas.GeocodingResponse(**result)
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result.get("error", "Geocoding failed")
            )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Geocoding failed: {str(e)}"
        )

@app.post("/api/rainfall", response_model=schemas.RainfallResponse)
def get_rainfall_data(request: schemas.RainfallRequest):
    """Get rainfall data from external API"""
    try:
        result = rainfall_client.get_rainfall_data(request.latitude, request.longitude)
        if result["success"]:
            return schemas.RainfallResponse(**result)
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result.get("error", "Failed to fetch rainfall data")
            )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch rainfall data: {str(e)}"
        )

@app.post("/api/groundwater", response_model=schemas.GroundwaterResponse)
def get_groundwater_data(request: schemas.GroundwaterRequest):
    """Get groundwater data from external API"""
    try:
        result = groundwater_client.get_groundwater_data(request.latitude, request.longitude)
        if result["success"]:
            return schemas.GroundwaterResponse(**result)
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result.get("error", "Failed to fetch groundwater data")
            )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch groundwater data: {str(e)}"
        )

@app.post("/api/soil-type", response_model=schemas.SoilTypeResponse)
def get_soil_type(request: schemas.SoilTypeRequest):
    """Get soil type data from external API"""
    try:
        result = soil_client.get_soil_data(request.latitude, request.longitude)
        if result["success"]:
            return schemas.SoilTypeResponse(**result)
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result.get("error", "Failed to fetch soil type data")
            )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch soil type data: {str(e)}"
        )

# ... (keep the rest of the endpoints the same) ...

@app.post("/api/calculate", response_model=schemas.CalculateResponse)
def calculate_potential(request: schemas.CalculateRequest):
    """Calculate water harvesting potential"""
    try:
        # Calculate harvestable water
        runoff_coeff = ml_service.predict_runoff_coefficient(
            request.roof_type, request.roof_age, request.region
        )
        
        harvestable_water = ml_service.predict_water_harvest(
            request.open_space, runoff_coeff, request.annual_rainfall, request.roof_type
        )
        
        # Calculate water demand
        daily_water_demand = request.dwellers * 100  # 100 liters per person per day
        annual_water_demand = daily_water_demand * 365 / 1000  # in cubic meters
        
        # Calculate potential savings
        potential_savings = min(harvestable_water, annual_water_demand)
        savings_percentage = (potential_savings / annual_water_demand * 100) if annual_water_demand > 0 else 0
        
        return schemas.CalculateResponse(
            harvestable_water=harvestable_water,
            annual_demand=annual_water_demand,
            potential_savings=potential_savings,
            savings_percentage=savings_percentage
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Calculation failed: {str(e)}"
        )

@app.post("/api/recommend", response_model=schemas.RecommendationResponse)
def get_recommendations(request: schemas.RecommendationRequest):
    """Get recommendations from ML model"""
    try:
        # Use the ML service instead of the undefined recommendation_model
        recommended_structure = ml_service.predict_structure(
            request.roof_area,
            request.open_space,
            request.soil_type,
            request.aquifer_type,
            request.water_depth
        )
        
        # For now, create a simple recommendation item
        # In a real implementation, you'd have more detailed recommendations
        cost_benefit = ml_service.predict_cost_benefit(
            recommended_structure, request.roof_area, request.region
        )
        recommendation_item = cost_benefit["installation_cost"]
        # Simple cost-benefit analysis
        water_savings = request.roof_area * request.rainfall * 0.8
        water_cost = 5  # ₹ per liter (assuming cost of alternative water)
        annual_savings = water_savings * water_cost / 1000
        avg_cost = cost_benefit["installation_cost"]

        cost_benefit = ml_service.predict_cost_benefit(
            recommended_structure, request.roof_area, request.region
        )
        payback_period = cost_benefit["payback_period"]
        
        cost_benefit_analysis = {
            "annual_water_savings": water_savings,
            "annual_savings_value": annual_savings,
            "payback_period": payback_period
        }
        
        return schemas.RecommendationResponse(
            recommendations=[recommendation_item],
            cost_benefit_analysis=cost_benefit_analysis
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Recommendation generation failed: {str(e)}"
        )

@app.get("/api/aquifer", response_model=schemas.AquiferInfoResponse)
def get_aquifer_info(aquifer_type: str = Query(..., description="Type of aquifer")):
    """Get aquifer information"""
    try:
        aquifer_info = {
            "Alluvial": {
                "description": "Alluvial aquifers consist of sand, gravel, and silt deposits with good permeability and water storage capacity.",
                "recharge_potential": "High",
                "suitable_structures": ["Recharge Pit", "Recharge Trench", "Recharge Shaft"]
            },
            "Basalt": {
                "description": "Basalt aquifers have fractured rock formations with variable permeability.",
                "recharge_potential": "Moderate",
                "suitable_structures": ["Recharge Shaft", "Recharge Trench"]
            },
            "": {  # Handle empty aquifer type
                "description": "Please select an aquifer type.",
                "recharge_potential": "Unknown",
                "suitable_structures": []
            }
        }
        
        # Handle case where aquifer_type is None or empty
        if not aquifer_type:
            aquifer_type = ""
        
        info = aquifer_info.get(aquifer_type, {
            "description": f"Information not available for '{aquifer_type}' aquifer type.",
            "recharge_potential": "Unknown",
            "suitable_structures": []
        })
        
        return schemas.AquiferInfoResponse(**info)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch aquifer information: {str(e)}"
        )

# Add a new endpoint to get ML predictions
@app.post("/api/predict", response_model=schemas.MLPredictionResponse)
async def get_ml_predictions(request: schemas.MLPredictionRequest):
    """Get ML predictions for given inputs"""
    try:
        # Make all ML predictions
        runoff_coeff = ml_service.predict_runoff_coefficient(
            request.roof_type, request.roof_age, request.region
        )
        
        recommended_structure = ml_service.predict_structure(
            request.roof_area, request.open_space,
            request.soil_type, request.aquifer_type, request.water_depth
        )
        
        harvestable_water = ml_service.predict_water_harvest(
            request.open_space, runoff_coeff, request.annual_rainfall, request.roof_type
        )
        
        cost_benefit = ml_service.predict_cost_benefit(
            recommended_structure, request.roof_area, request.region
        )
        
        return schemas.MLPredictionResponse(
            runoff_coefficient=runoff_coeff,
            recommended_structure=recommended_structure,
            annual_harvestable_water=harvestable_water,
            installation_cost=cost_benefit["installation_cost"],
            payback_period=cost_benefit["payback_period"],
            success=True
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"ML prediction failed: {str(e)}"
        )

# Replace the simple region detection with a more robust approach:
def detect_region_type(location: str, latitude: float, longitude: float) -> str:
    """Detect if a location is urban, semi-urban, or rural"""
    if not location:
        return "rural"
    
# Check for major cities
    major_cities = ["delhi", "mumbai", "chennai", "kolkata", "bangalore", "hyderabad", "pune", "ahmedabad", "jaipur", "lucknow", "kanpur", "nagpur"]
    
    location_lower = location.lower()
    if any(city in location_lower for city in major_cities):
        return "urban"
    
    # You could add more sophisticated logic here based on coordinates
    # For example, using population density data or other indicators
    
    return "rural"

# Assessment management endpoints
@app.post("/assessments/", response_model=schemas.Assessment)
async def create_assessment(assessment: schemas.AssessmentCreate, db: Session = Depends(get_db)):
    """Create a new assessment with ML predictions"""
    try:
        # First create the basic assessment
        db_assessment = crud.create_assessment(db, assessment)
        
        # Get location data
        geocoding_result = geocoding_client.get_coordinates(assessment.location)
        if not geocoding_result["success"]:
            # Still create assessment but without ML results
            return db_assessment
        
        # Get additional data from APIs with error handling
        rainfall_data = rainfall_client.get_rainfall_data(
            geocoding_result["latitude"], geocoding_result["longitude"]
        )
        if not rainfall_data or not rainfall_data.get("success"):
            rainfall_data = {"annual_rainfall": 1000, "success": True}  # Default value

        groundwater_data = groundwater_client.get_groundwater_data(
            geocoding_result["latitude"], geocoding_result["longitude"]
        )
        if not groundwater_data or not groundwater_data.get("success"):
            groundwater_data = {"depth_to_water": 15, "aquifer_type": "Alluvial", "success": True}

        soil_data = soil_client.get_soil_data(
            geocoding_result["latitude"], geocoding_result["longitude"]
        )
        if not soil_data or not soil_data.get("success"):
            soil_data = {"soil_type": "Sandy Loam", "success": True}
        
        # Detect region type (using the function now defined outside)
        region_type = detect_region_type(
            assessment.location, 
            geocoding_result["latitude"], 
            geocoding_result["longitude"]
        )
        
        # Make ML predictions with error handling
        try:
            runoff_coeff = ml_service.predict_runoff_coefficient(
                assessment.roof_type, assessment.roof_age, region_type
            )
            
            recommended_structure = ml_service.predict_structure(
                assessment.roof_area, assessment.open_space,
                soil_data["soil_type"], groundwater_data["aquifer_type"],
                groundwater_data["depth_to_water"]
            )
            
            # FIXED: Added the missing roof_type parameter
            harvestable_water = ml_service.predict_water_harvest(
                assessment.open_space, runoff_coeff,
                rainfall_data["annual_rainfall"], assessment.roof_type
            )
            
            cost_benefit = ml_service.predict_cost_benefit(
                recommended_structure, assessment.roof_area, region_type
            )
            
        except Exception as ml_error:
            print(f"ML prediction failed: {ml_error}")
            # Fallback to simple calculations if ML fails
            runoff_coeff = 0.8  # Default value
            recommended_structure = "Storage_Tank"
            harvestable_water = assessment.roof_area * rainfall_data["annual_rainfall"] * runoff_coeff
            cost_benefit = {
                "installation_cost": assessment.roof_area * 200,
                "payback_period": 3.0
            }
        
        # Update assessment with results
        update_data = {
            "latitude": geocoding_result["latitude"],
            "longitude": geocoding_result["longitude"],
            "soil_type": soil_data["soil_type"],
            "aquifer_type": groundwater_data["aquifer_type"],
            "water_depth": groundwater_data["depth_to_water"],
            "annual_rainfall": rainfall_data["annual_rainfall"],
            "runoff_coefficient": runoff_coeff,
            "recommended_structure": recommended_structure,
            "annual_harvestable_water": harvestable_water,
            "installation_cost": cost_benefit["installation_cost"],
            "payback_period": cost_benefit["payback_period"]
        }
        
        updated_assessment = crud.update_assessment_results(
            db, db_assessment.id, update_data
        )
        
        return updated_assessment
        
    except Exception as e:
        # If ML processing fails, still return the basic assessment
        print(f"Assessment creation failed: {e}")
        return db_assessment

@app.get("/assessments/", response_model=List[schemas.Assessment])
def read_assessments(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get all assessments"""
    assessments = crud.get_all_assessments(db, skip=skip, limit=limit)
    return assessments

@app.get("/assessments/{assessment_id}", response_model=schemas.Assessment)
def read_assessment(assessment_id: int, db: Session = Depends(get_db)):
    """Get a specific assessment by ID"""
    db_assessment = crud.get_assessment(db, assessment_id=assessment_id)
    if db_assessment is None:
        raise HTTPException(status_code=404, detail="Assessment not found")
    return db_assessment

@app.put("/assessments/{assessment_id}", response_model=schemas.Assessment)
def update_assessment(assessment_id: int, assessment_update: schemas.AssessmentUpdate, db: Session = Depends(get_db)):
    """Update an assessment with results"""
    # Convert Pydantic model to dict for update
    update_dict = assessment_update.dict(exclude_unset=True)
    
    db_assessment = crud.update_assessment_results(db, assessment_id=assessment_id, results=update_dict)
    if db_assessment is None:
        raise HTTPException(status_code=404, detail="Assessment not found")
    return db_assessment

@app.delete("/assessments/{assessment_id}")
def delete_assessment(assessment_id: int, db: Session = Depends(get_db)):
    """Delete an assessment"""
    success = crud.delete_assessment(db, assessment_id=assessment_id)
    if not success:
        raise HTTPException(status_code=404, detail="Assessment not found")
    return {"message": "Assessment deleted successfully"}

@app.post("/assessments/{assessment_id}/feedback")
def add_assessment_feedback(assessment_id: int, feedback: schemas.FeedbackSchema, db: Session = Depends(get_db)):
    """Add feedback to an assessment"""
    db_assessment = crud.get_assessment(db, assessment_id=assessment_id)
    if db_assessment is None:
        raise HTTPException(status_code=404, detail="Assessment not found")
    
    update_data = {"feedback_rating": feedback.rating}
    if feedback.notes:
        update_data["feedback_notes"] = feedback.notes
    
    updated_assessment = crud.update_assessment_results(db, assessment_id, update_data)
    return {"message": "Feedback added successfully", "assessment": updated_assessment}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)