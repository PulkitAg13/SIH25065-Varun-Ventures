import pandas as pd
import numpy as np
import pickle
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.multioutput import MultiOutputRegressor
from sklearn.metrics import r2_score, mean_squared_error, mean_absolute_error
from xgboost import XGBRegressor

# ========== Load Dataset ==========
csv_path = "rwh_dataset.csv"   # <-- use the clean dataset
df = pd.read_csv(csv_path)

# Inputs & Outputs
features = ["recommended_structure", "roof_area", "region"]
targets = ["installation_cost", "payback_period"]

X = df[features]
y = df[targets]

# ========== Preprocessing ==========
cat_feats = ["recommended_structure", "region"]
num_feats = ["roof_area"]

preprocessor = ColumnTransformer(transformers=[
    ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), cat_feats),
    ("num", StandardScaler(), num_feats)
])

# ========== Model ==========
regressor = MultiOutputRegressor(
    XGBRegressor(
        n_estimators=2000,      # more trees for high accuracy
        learning_rate=0.01,     # small steps
        max_depth=10,           # deep trees
        subsample=1.0,
        colsample_bytree=1.0,
        reg_lambda=1,
        random_state=42
    )
)

pipeline = Pipeline(steps=[("preprocessor", preprocessor),
                           ("regressor", regressor)])

# ========== Train-Test Split ==========
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Train
pipeline.fit(X_train, y_train)

# Predict
y_pred = pipeline.predict(X_test)

# ========== Combined Metrics ==========
rmse = np.sqrt(mean_squared_error(y_test, y_pred))
mae = mean_absolute_error(y_test, y_pred)
r2 = r2_score(y_test, y_pred)

print("\n--- Model Evaluation ---")
print(f"Root Mean Squared Error (RMSE): {rmse:.4f}")
print(f"Mean Absolute Error (MAE): {mae:.4f}")
print(f"R-squared (R²): {r2:.4f}")
print("-------------------------")

# Save Model
with open("model.pkl", "wb") as f:
    pickle.dump(pipeline, f)

with open("encoders.pkl", "wb") as f:
    pickle.dump(preprocessor, f)

print("\n Model saved as model.pkl and encoders.pkl")

# ========== User Input Prediction ==========
print("\n User Input Prediction")

rec_structure = input("Enter recommended_structure (e.g. Cistern, Recharge Pit, Rainwater Barrel): ")

# keep asking until numeric input
while True:
    try:
        roof_area = float(input("Enter roof_area_sqm (numeric): "))
        break
    except ValueError:
        print("Please enter a numeric value for roof_area_sqm.")

region = input("Enter region (e.g. Delhi NCR, Rajasthan, Punjab): ")

user_input = pd.DataFrame([{
    "recommended_structure": rec_structure,
    "roof_area_sqm": roof_area,
    "region": region
}])

user_pred = pipeline.predict(user_input)

print("\n✅ Prediction Result:")
print({
    "installation_cost_inr": round(user_pred[0, 0], 2),
    "payback_period_years": round(user_pred[0, 1], 2)
})
