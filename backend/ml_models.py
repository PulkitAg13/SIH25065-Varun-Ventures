import pickle
import pandas as pd
import numpy as np
from typing import List, Dict, Any
from config import settings
import joblib
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier
from sklearn.preprocessing import LabelEncoder, StandardScaler
import json

class MLModelService:
    def __init__(self):
        self.runoff_model = None
        self.structure_model = None
        self.harvest_model = None
        self.cost_model = None
        self.label_encoders = {}
        self.scalers = {}
        self.load_models()
    
    def load_models(self):
        """Load trained ML models"""
        try:
            # Load runoff coefficient model
            self.runoff_model = joblib.load('runoff_model.pkl')
            self.label_encoders['roof_type'] = joblib.load('roof_type_encoder.pkl')
            
            # Load structure recommendation model
            self.structure_model = joblib.load('structure_model.pkl')
            self.label_encoders['soil_type'] = joblib.load('soil_type_encoder.pkl')
            self.label_encoders['aquifer_type'] = joblib.load('aquifer_type_encoder.pkl')
            
            # Load water harvest model
            self.harvest_model = joblib.load('harvest_model.pkl')
            
            # Load cost model
            self.cost_model = joblib.load('cost_model.pkl')
            self.label_encoders['recommended_structure'] = joblib.load('structure_encoder.pkl')
            
        except FileNotFoundError:
            print("ML models not found. Using rule-based fallback.")
            self.models_loaded = False
    
    def predict_runoff_coefficient(self, roof_type: str, roof_age: int, region: str):
        """Predict runoff coefficient"""
        try:
            if self.runoff_model:
                # Encode categorical features
                roof_type_encoded = self.label_encoders['roof_type'].transform([roof_type])[0]
                
                # Create feature array
                features = np.array([[roof_type_encoded, roof_age, 1 if region == "urban" else 0]])
                
                # Predict
                runoff_coeff = self.runoff_model.predict(features)[0]
                return max(0.3, min(0.95, runoff_coeff))  # Ensure reasonable range
            else:
                # Fallback to rule-based
                return self._fallback_runoff_coefficient(roof_type, roof_age)
                
        except Exception as e:
            print(f"Runoff prediction error: {e}")
            return self._fallback_runoff_coefficient(roof_type, roof_age)
    
    def predict_structure(self, roof_area: float, open_space: float, 
                         soil_type: str, aquifer_type: str, water_depth: float):
        """Recommend RWH structure"""
        try:
            if self.structure_model:
                # Encode categorical features
                soil_encoded = self.label_encoders['soil_type'].transform([soil_type])[0]
                aquifer_encoded = self.label_encoders['aquifer_type'].transform([aquifer_type])[0]
                
                # Create feature array
                features = np.array([[roof_area, open_space, soil_encoded, aquifer_encoded, water_depth]])
                
                # Predict
                structure_idx = self.structure_model.predict(features)[0]
                structures = ["Storage_Tank", "Recharge_Pit", "Recharge_Trench", "Recharge_Shaft"]
                return structures[structure_idx]
            else:
                return self._fallback_structure_recommendation(roof_area, open_space, soil_type, water_depth)
                
        except Exception as e:
            print(f"Structure prediction error: {e}")
            return self._fallback_structure_recommendation(roof_area, open_space, soil_type, water_depth)
    
    def predict_water_harvest(self, open_space: float, runoff_coeff: float, 
                             annual_rainfall: float, roof_type: str):
        """Predict harvestable water"""
        try:
            if self.harvest_model:
                # Use roof_type as additional feature (encoded)
                roof_type_encoded = self.label_encoders['roof_type'].transform([roof_type])[0]
                
                features = np.array([[open_space, runoff_coeff, annual_rainfall, roof_type_encoded]])
                harvest = self.harvest_model.predict(features)[0]
                return max(0, harvest)
            else:
                return self._fallback_water_harvest(open_space, runoff_coeff, annual_rainfall)
                
        except Exception as e:
            print(f"Harvest prediction error: {e}")
            return self._fallback_water_harvest(open_space, runoff_coeff, annual_rainfall)
    
    def predict_cost_benefit(self, structure_type: str, roof_area: float, region: str = "urban"):
        """Predict costs and payback period"""
        try:
            if self.cost_model:
                # Encode structure type
                structure_encoded = self.label_encoders['recommended_structure'].transform([structure_type])[0]
                region_encoded = 1 if region == "urban" else 0
                
                features = np.array([[structure_encoded, roof_area, region_encoded]])
                prediction = self.cost_model.predict(features)[0]
                
                return {
                    'installation_cost': max(10000, prediction[0]),
                    'payback_period': max(1, prediction[1])
                }
            else:
                return self._fallback_cost_benefit(structure_type, roof_area, region)
                
        except Exception as e:
            print(f"Cost prediction error: {e}")
            return self._fallback_cost_benefit(structure_type, roof_area, region)
    
    # Fallback methods (rule-based)
    def _fallback_runoff_coefficient(self, roof_type: str, roof_age: int):
        coefficients = {
            'Concrete': 0.8, 'Tiled': 0.7, 'Metal': 0.9, 
            'Asbestos': 0.8, 'Thatched': 0.6, 'Plastic': 0.85
        }
        base_coeff = coefficients.get(roof_type, 0.7)
        # Adjust for roof age
        age_factor = max(0.7, 1 - (roof_age * 0.01))
        return base_coeff * age_factor
    
    def _fallback_structure_recommendation(self, roof_area: float, open_space: float, 
                                         soil_type: str, water_depth: float):
        if open_space >= 50 and soil_type in ['Sandy', 'Sandy Loam']:
            return "Recharge_Shaft"
        elif open_space >= 20:
            return "Recharge_Pit" if soil_type in ['Sandy', 'Sandy Loam'] else "Recharge_Trench"
        elif roof_area >= 50:
            return "Storage_Tank"
        else:
            return "Storage_Tank"
    
    def _fallback_water_harvest(self, roof_area: float, runoff_coeff: float, annual_rainfall: float):
        return roof_area * annual_rainfall * runoff_coeff
    
    def _fallback_cost_benefit(self, structure_type: str, roof_area: float, region: str):
        cost_factors = {
            'Storage_Tank': 150, 'Recharge_Pit': 200, 
            'Recharge_Trench': 250, 'Recharge_Shaft': 300
        }
        region_multiplier = 1.2 if region == "urban" else 1.0
        
        installation_cost = roof_area * cost_factors.get(structure_type, 200) * region_multiplier
        annual_savings = roof_area * 1000 * 0.7  # Simplified calculation
        payback_period = installation_cost / annual_savings if annual_savings > 0 else 5
        
        return {
            'installation_cost': installation_cost,
            'payback_period': payback_period
        }

# Initialize the ML service
ml_service = MLModelService()