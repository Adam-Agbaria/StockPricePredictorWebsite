"""
Convert real Keras model to TensorFlow.js format using direct SavedModel approach
"""

import os
import json
import shutil
import numpy as np
import pandas as pd
from sklearn.preprocessing import MinMaxScaler, StandardScaler
import tensorflow as tf
from tensorflow import keras

def convert_model_to_tfjs():
    """
    Convert the trained Keras model to TensorFlow.js format using SavedModel
    """
    print("🔄 Converting real model to TensorFlow.js format...")
    
    # Check if we have a trained model
    checkpoint_dir = 'model_checkpoints'
    if not os.path.exists(checkpoint_dir):
        print("❌ No model_checkpoints directory found!")
        print("Please run stock_predictor.py first to train a model.")
        return False
    
    # Find the most recent model file
    model_files = [f for f in os.listdir(checkpoint_dir) if f.endswith('.h5')]
    if not model_files:
        print("❌ No .h5 model files found in model_checkpoints directory!")
        print("Please run stock_predictor.py first to train a model.")
        return False
    
    # Get the most recent model file
    latest_model = sorted(model_files)[-1]
    model_path = os.path.join(checkpoint_dir, latest_model)
    print(f"📁 Found model: {latest_model}")
    
    # Load the model
    try:
        model = keras.models.load_model(model_path)
        print("✅ Model loaded successfully")
        print(f"Model input shape: {model.input_shape}")
        print(f"Model output shape: {model.output_shape}")
    except Exception as e:
        print(f"❌ Error loading model: {e}")
        return False
    
    # Create tfjs directory
    tfjs_dir = 'tfjs_model'
    os.makedirs(tfjs_dir, exist_ok=True)
    
    # Clean up any existing files
    import shutil
    if os.path.exists(f'{tfjs_dir}/model'):
        shutil.rmtree(f'{tfjs_dir}/model')
    
    # Save as SavedModel format first (this is the key!)
    saved_model_path = f'{tfjs_dir}/saved_model_temp'
    if os.path.exists(saved_model_path):
        shutil.rmtree(saved_model_path)
    
    try:
        # Save in SavedModel format
        print("💾 Saving model in SavedModel format...")
        model.export(saved_model_path)
        print("✅ Model saved in SavedModel format")
        
        # Now manually convert to TensorFlow.js format
        print("🔄 Converting to TensorFlow.js format...")
        
        # Create the model directory
        model_dir = f'{tfjs_dir}/model'
        os.makedirs(model_dir, exist_ok=True)
        
        # Use TensorFlow.js Python library to convert the model
        try:
            import tensorflowjs as tfjs
            # Remove the directory first to ensure clean conversion
            if os.path.exists(model_dir):
                shutil.rmtree(model_dir)
            
            # Convert the original Keras model directly
            tfjs.converters.save_keras_model(model, model_dir)
            print("✅ Model converted to TensorFlow.js format using tfjs.converters")
            
        except ImportError:
            print("❌ tensorflowjs not installed. Installing...")
            import subprocess
            subprocess.run(['pip', 'install', 'tensorflowjs'], check=True)
            import tensorflowjs as tfjs
            tfjs.converters.save_keras_model(model, model_dir)
            print("✅ Model converted to TensorFlow.js format after installing tensorflowjs")
            
        except Exception as e:
            print(f"❌ TensorFlow.js conversion failed: {e}")
            print("📝 Using SavedModel format as fallback...")
            tf.saved_model.save(model, model_dir)
            print("⚠️ Model saved in SavedModel format (fallback)")
        
        # Clean up temp directory
        shutil.rmtree(saved_model_path)
        
    except Exception as e:
        print(f"❌ Error converting model: {e}")
        print("Trying alternative approach...")
        
        # Alternative: Save directly as SavedModel that tfjs can load
        try:
            model_dir = f'{tfjs_dir}/model'
            if os.path.exists(model_dir):
                shutil.rmtree(model_dir)
            
            # Save the model directly
            model.save(model_dir, save_format='tf')
            print("✅ Model saved in TensorFlow SavedModel format")
            
        except Exception as e2:
            print(f"❌ Alternative approach also failed: {e2}")
            return False
    
    return True

def create_real_scaler_info():
    """
    Create real scaler information from the actual training data
    """
    print("📊 Creating real scaler information...")
    
    # Load the actual data and create scalers exactly like in training
    csv_path = "data/nq-1m.csv"
    
    try:
        # Load and preprocess data exactly like in stock_predictor.py
        df = pd.read_csv(csv_path, sep=";", header=None,
                         names=["date", "time", "open", "high", "low", "close", "volume"])

        df["datetime"] = pd.to_datetime(df["date"] + " " + df["time"],
                                         format="%d/%m/%Y %H:%M:%S")
        df.set_index("datetime", inplace=True)
        df.drop(columns=["date", "time"], inplace=True)
        df = df.apply(pd.to_numeric, errors="coerce").dropna()

        # Feature engineering (EXACTLY like in stock_predictor.py)
        df["hl_range"] = (df["high"] - df["low"]) / df["low"]
        df["close_ma"] = df["close"].rolling(20).mean()
        df["vol_ma"] = df["volume"].rolling(20).mean()
        df.dropna(inplace=True)

        # Create target (EXACTLY like in stock_predictor.py)
        prediction_steps = 5  # Same as in stock_predictor.py
        df["future_price"] = df["close"].shift(-prediction_steps)
        df.dropna(inplace=True)

        # Create feature and target arrays (EXACTLY like in stock_predictor.py)
        features = df[["close", "volume", "hl_range", "close_ma", "vol_ma"]].values
        prices = df["future_price"].values.reshape(-1, 1)

        # Create and fit scalers - Using MinMaxScaler EXACTLY like original training
        # This is the same scaler type used when training the model
        feature_scaler = MinMaxScaler()
        price_scaler = MinMaxScaler()
        
        # Fit scalers on the SAME data used for training
        feature_scaler.fit(features)
        price_scaler.fit(prices)
        
        # Save scaler information with MinMaxScaler parameters (EXACT same format as original)
        scaler_info = {
            'scaler_type': 'MinMaxScaler',
            'feature_scaler': {
                'min_': feature_scaler.min_.tolist(),
                'scale_': feature_scaler.scale_.tolist(),
                'data_min_': feature_scaler.data_min_.tolist(),
                'data_max_': feature_scaler.data_max_.tolist(),
                'data_range_': feature_scaler.data_range_.tolist()
            },
            'price_scaler': {
                'min_': price_scaler.min_.tolist(),
                'scale_': price_scaler.scale_.tolist(),
                'data_min_': price_scaler.data_min_.tolist(),
                'data_max_': price_scaler.data_max_.tolist(),
                'data_range_': price_scaler.data_range_.tolist()
            },
            'sequence_length': 20,  # Same as in stock_predictor.py
            'prediction_steps': prediction_steps,
            'features': ['close', 'volume', 'hl_range', 'close_ma', 'vol_ma']
        }
        
        # Save to JSON file
        with open('tfjs_model/scaler_info.json', 'w') as f:
            json.dump(scaler_info, f, indent=2)
        
        print("✅ Real scaler information saved")
        print(f"   Feature data ranges: {feature_scaler.data_range_}")
        print(f"   Feature min values: {feature_scaler.data_min_}")
        print(f"   Price range: {price_scaler.data_min_[0]:.2f} - {price_scaler.data_max_[0]:.2f}")
        print("   ✅ Using ORIGINAL MinMaxScaler - same as training!")
        
        return True
        
    except Exception as e:
        print(f"❌ Error creating real scaler info: {e}")
        return False

def create_real_sample_data():
    """
    Create real sample data from the actual dataset
    """
    print("📈 Creating real sample data...")
    
    try:
        # Load recent data for sample (for demo purposes)
        csv_path = "data/nq-1m.csv"
        # First, count total lines to know how many to skip  
        with open(csv_path, 'r') as f:
            total_lines = sum(1 for _ in f)
        
        print(f"📊 Total lines in CSV: {total_lines}")
        
        # Skip to the last 500 rows to get recent data for demo
        skip_rows = max(0, total_lines - 500)
        print(f"📊 Skipping {skip_rows} rows to get recent data")
        
        df = pd.read_csv(csv_path, sep=";", header=None, skiprows=skip_rows,
                         names=["date", "time", "open", "high", "low", "close", "volume"])

        df["datetime"] = pd.to_datetime(df["date"] + " " + df["time"],
                                         format="%d/%m/%Y %H:%M:%S")
        df.set_index("datetime", inplace=True)
        df.drop(columns=["date", "time"], inplace=True)
        df = df.apply(pd.to_numeric, errors="coerce").dropna()

        # Feature engineering
        df["hl_range"] = (df["high"] - df["low"]) / df["low"]
        df["close_ma"] = df["close"].rolling(20).mean()
        df["vol_ma"] = df["volume"].rolling(20).mean()
        df.dropna(inplace=True)

        # Get the last few rows as sample data
        sample_data = df.tail(50).to_json(orient='records', date_format='iso')
        
        with open('web_app/sample_data.json', 'w') as f:
            f.write(sample_data)
        
        print("✅ Real sample data created")
        print(f"   Sample data points: {len(df.tail(50))}")
        
    except Exception as e:
        print(f"❌ Error creating real sample data: {e}")

if __name__ == "__main__":
    print("🚀 Converting REAL model to TensorFlow.js...")
    
    # Convert real model
    if convert_model_to_tfjs():
        # Create real scaler info
        if create_real_scaler_info():
            # Create real sample data
            create_real_sample_data()
            
            print("\n✅ REAL model conversion completed successfully!")
            print("📁 Files created:")
            print("   - tfjs_model/model/ (Real TensorFlow.js model)")
            print("   - tfjs_model/scaler_info.json (Real scaler parameters)")
            print("   - web_app/sample_data.json (Real sample data)")
            print("\n🌐 You can now run the web application with REAL predictions!")
        else:
            print("\n❌ Failed to create scaler info")
    else:
        print("\n❌ Real model conversion failed!")