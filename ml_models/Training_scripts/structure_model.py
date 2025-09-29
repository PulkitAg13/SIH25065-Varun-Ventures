import pandas as pd
import pickle
import joblib
import seaborn as sns
import matplotlib.pyplot as plt
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, accuracy_score, confusion_matrix

# ================== TRAINING PART ==================
def train_model():
    print("Loading dataset from harvesting_structure_dataset.csv ...")
    df = pd.read_csv("harvesting_structure_dataset.csv")

    # Encode categorical features
    label_encoders = {}
    categorical_features = ["soil_type", "aquifer_type", "structure"]

    for col in categorical_features:
        le = LabelEncoder()
        df[col] = le.fit_transform(df[col])
        label_encoders[col] = le

    X = df.drop("structure", axis=1)
    y = df["structure"]

    # Train-Test Split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, stratify=y, random_state=42
    )

    # Train Model
    print("Training model...")
    model = RandomForestClassifier(
        n_estimators=400,
        max_depth=None,
        random_state=42,
        class_weight="balanced"
    )
    model.fit(X_train, y_train)

    # Evaluate
    y_pred = model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    report = classification_report(y_test, y_pred)

    print("\n========== CLASSIFICATION MODEL REPORT ==========")
    print(f"Model Accuracy: {accuracy * 100:.2f}%")
    print(report)

    # Save classification report
    with open("classification_report.txt", "w") as f:
        f.write(f"Accuracy: {accuracy * 100:.2f}%\n\n")
        f.write(report)

    # Confusion Matrix
    cm = confusion_matrix(y_test, y_pred, labels=model.classes_)
    plt.figure(figsize=(6, 4))
    sns.heatmap(cm, annot=True, fmt="d", cmap="Blues",
                xticklabels=label_encoders["structure"].classes_,
                yticklabels=label_encoders["structure"].classes_)
    plt.title("Confusion Matrix")
    plt.xlabel("Predicted")
    plt.ylabel("Actual")
    plt.tight_layout()
    plt.savefig("confusion_matrix.png")
    plt.close()

    # Save model
    with open("structure_model.pkl", "wb") as f:
        pickle.dump(model, f)

    # Save individual encoders as separate files
    for col, encoder in label_encoders.items():
        encoder_filename = f"{col}_encoder.pkl"
        joblib.dump(encoder, encoder_filename)
        print(f"Saved {encoder_filename}")

    print("\nModel saved as structure_model.pkl")
    print("Individual encoder files saved:")
    print("- soil_type_encoder.pkl")
    print("- aquifer_type_encoder.pkl") 
    print("- structure_encoder.pkl")
    print("Report saved as classification_report.txt")
    print("Confusion matrix saved as confusion_matrix.png")


# ================== PREDICTION PART ==================
def predict_from_input():
    # Load model
    with open("structure_model.pkl", "rb") as f:
        model = pickle.load(f)
    
    # Load individual encoders
    label_encoders = {}
    encoder_files = {
        'soil_type': 'soil_type_encoder.pkl',
        'aquifer_type': 'aquifer_type_encoder.pkl',
        'structure': 'structure_encoder.pkl'
    }
    
    for col, filename in encoder_files.items():
        try:
            label_encoders[col] = joblib.load(filename)
        except FileNotFoundError:
            print(f"Error: {filename} not found. Please train the model first.")
            return

    print("\n========== RAINWATER STRUCTURE PREDICTOR ==========")
    try:
        roof_area = float(input("Enter roof area (m²): "))
        open_space = float(input("Enter open space (m²): "))
        soil_type = input("Enter soil type (Clay/Loamy/Sandy): ").strip().capitalize()
        aquifer_type = input("Enter aquifer type (Unconfined/Confined/Perched): ").strip().capitalize()
        water_depth = float(input("Enter water depth (m): "))
        annual_rainfall = float(input("Enter annual rainfall (mm): "))

        # Encode categorical inputs using individual encoders
        soil_encoded = label_encoders["soil_type"].transform([soil_type])[0]
        aquifer_encoded = label_encoders["aquifer_type"].transform([aquifer_type])[0]

        # Prepare DataFrame
        feature_names = ["roof_area", "open_space", "soil_type", "aquifer_type", "water_depth", "annual_rainfall"]
        features = pd.DataFrame([[roof_area, open_space,
                                  soil_encoded, aquifer_encoded,
                                  water_depth, annual_rainfall]],
                                columns=feature_names)

        # Predict
        pred_encoded = model.predict(features)[0]
        prediction = label_encoders["structure"].inverse_transform([pred_encoded])[0]
        print(f"\n ✅ Recommended Structure: {prediction}")

    except ValueError as e:
        print(f"Invalid input: {e}. Please enter valid values.")
    except Exception as e:
        print(f"Error during prediction: {e}")


# ================== MAIN ==================
if __name__ == "__main__":
    choice = input("Do you want to (T)rain or (P)redict? ").strip().lower()
    if choice == "t":
        train_model()
    elif choice == "p":
        predict_from_input()
    else:
        print("Invalid choice. Enter 'T' to train or 'P' to predict.")
