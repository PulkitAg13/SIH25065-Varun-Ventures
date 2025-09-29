import pandas as pd
import numpy as np
import lightgbm as lgb
import pickle
import joblib
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import mean_squared_error, r2_score, mean_absolute_error

def train_runoff_model():
    """
    Loads the synthetic dataset, trains a LightGBM model to predict the
    runoff coefficient, evaluates it, and saves the trained model and encoders.
    """
    print("--- Training Model 1: Runoff Coefficient Predictor ---")
    
    # --- 1. Load Data ---
    try:
        df = pd.read_csv("Runoff_coeff_dataset.csv")
        print("Dataset loaded successfully.")
    except FileNotFoundError:
        print("Error: 'Runoff_coeff_dataset.csv' not found.")
        print("Please run the 'Synthetic_data.py' script first.")
        return

    # --- 2. Preprocessing ---
    # Define features (X) and target (y)
    X = df[['roof_type', 'roof_age', 'region']]
    y = df['runoff_coefficient']

    # Create and fit label encoders for categorical variables
    label_encoders = {}
    categorical_columns = ['roof_type', 'region']
    
    for column in categorical_columns:
        le = LabelEncoder()
        X[column] = le.fit_transform(X[column])
        label_encoders[column] = le
        print(f"Label encoder created for {column}")

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.25, random_state=50
    )
    print(f"Data split: {len(X_train)} training samples, {len(X_test)} testing samples.")

    # --- 3. Model Training ---
    print("Training the LightGBM model...")
    # Initialize the LightGBM Regressor
    model = lgb.LGBMRegressor(
        random_state=50,
        n_estimators=1000,
        learning_rate=0.01,
        num_leaves=31,
        max_depth=-1,
        n_jobs=-1)
    
    # Train the model
    model.fit(X_train, y_train)
    print("Training complete.")

    # --- 4. Model Evaluation ---
    y_pred = model.predict(X_test)

    mse = mean_squared_error(y_test, y_pred)
    rmse = np.sqrt(mse)
    mae = mean_absolute_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)

    print("\n--- Model Evaluation ---")
    print(f"Root Mean Squared Error (RMSE): {rmse:.4f}")
    print(f"Mean Absolute Error (MAE): {mae:.4f}")
    print(f"R-squared (R²): {r2:.4f}")
    print("------------------------")

    # --- 5. Save the Model and Encoders ---
    # Save the main model
    model_filename = "runoff_model.pkl"
    with open(model_filename, 'wb') as file:
        pickle.dump(model, file)
    
    # Save each label encoder
    for column_name, encoder in label_encoders.items():
        encoder_filename = f"{column_name}_encoder.pkl"
        joblib.dump(encoder, encoder_filename)
        print(f"Saved {encoder_filename}")
    
    print(f"\nModel successfully saved to '{model_filename}'")
    print("All encoders saved successfully!")

    # --- 6. Optional: Test the encoders work correctly ---
    print("\n--- Testing Encoders ---")
    for column_name, encoder in label_encoders.items():
        test_values = df[column_name].unique()[:3]  # Test with first 3 unique values
        encoded_values = encoder.transform(test_values)
        decoded_values = encoder.inverse_transform(encoded_values)
        print(f"{column_name}: {list(test_values)} -> {encoded_values} -> {list(decoded_values)}")

if __name__ == "__main__":
    train_runoff_model()

