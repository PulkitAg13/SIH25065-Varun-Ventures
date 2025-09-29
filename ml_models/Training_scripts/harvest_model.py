import pandas as pd
import numpy as np
import lightgbm as lgb # type: ignore
import pickle
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score, mean_absolute_error

def train_direct_harvesting_model():
    """
    Loads the synthetic dataset and trains a single, end-to-end LightGBM model
    to directly predict the final annual harvestable water volume.
    """
    print("--- Training Model 3: Direct Water Harvesting Predictor ---")
    
    # --- 1. Load Data ---
    try:
        df = pd.read_csv("Harvesting_dataset.csv")
        print("Dataset loaded successfully.")
    except FileNotFoundError:
        print("Error: 'Harvesting_dataset.csv' not found.")
        print("Please run the 'Synthetic_data.py' script first.")
        return

    # --- 2. Preprocessing ---
    # Define features (X) and the direct target (y) as per the specified inputs
    features = [
        'open_space',
        'roof_type',
        'runoff_coefficient',
        'annual_rainfall'
    ]
    X = df[features]
    y = df['annual_harvestable_water']

    # Convert the categorical feature into a numerical format
    X = pd.get_dummies(X, columns=['roof_type'], drop_first=True)

    # Split data into training and testing sets
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )
    print(f"Data split: {len(X_train)} training samples, {len(X_test)} testing samples.")

    # --- 3. Model Training ---
    print("Training the direct LightGBM model...")
    
    # Using the tuned hyperparameters for better performance
    model = lgb.LGBMRegressor(
        n_estimators=500,
        learning_rate=0.05,
        num_leaves=31,
        max_depth=-1,
        random_state=42,
        n_jobs=-1
    )
    
    model.fit(X_train, y_train)
    print("Training complete.")

    # --- 4. Model Evaluation ---
    y_pred = model.predict(X_test)

    # --- 4a. REGRESSION Metrics ---
    mse = mean_squared_error(y_test, y_pred)
    rmse = np.sqrt(mse)
    mae = mean_absolute_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)

    print("\n--- REGRESSION METRICS ---")
    print(f"Root Mean Squared Error (RMSE): {rmse:.2f} Liters")
    print(f"Mean Absolute Error (MAE): {mae:.2f} Liters")
    print(f"R-squared (R²): {r2:.4f}")
    print("--------------------------")
    
    
    # --- 5. Save the Model ---
    model_filename = "harvesting_model_direct.pkl"
    with open(model_filename, 'wb') as file:
        pickle.dump(model, file)
    
    print(f"\nModel successfully saved to '{model_filename}'")


if __name__ == "__main__":
    train_direct_harvesting_model()

