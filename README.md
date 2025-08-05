# AI Stock Price Predictor - TensorFlow.js Web App

A modern web application that uses TensorFlow.js to run LSTM-based stock price predictions directly in the browser. No backend required!

## 🚀 Features

- **Client-side AI**: Runs entirely in the browser using TensorFlow.js
- **Real-time Predictions**: Instant stock price predictions
- **Modern UI**: Beautiful, responsive design with interactive charts
- **No Backend**: Completely static web application
- **Sample Data**: Built-in sample data for testing
- **Visual Analytics**: Interactive charts showing price history and predictions

## 📁 Project Structure

```
WebApp-AI-StocksPredict/
├── data/                          # Stock data files
│   ├── nq-1m.csv                 # 1-minute NASDAQ data
│   └── nq-5m.csv                 # 5-minute NASDAQ data
├── model_checkpoints/             # Trained Keras models (.h5 files)
├── tfjs_model/                   # TensorFlow.js converted model
│   ├── model.json                # TensorFlow.js model
│   └── scaler_info.json          # Scaler parameters
├── web_app/                      # Web application files
│   ├── index.html                # Main HTML file
│   ├── styles.css                # CSS styling
│   ├── app.js                    # JavaScript application
│   └── sample_data.json          # Sample data for testing
├── stock_predictor.py            # Original Python training script
├── convert_to_tfjs.py            # Model conversion script
└── README.md                     # This file
```

## 🛠️ Setup Instructions

### Prerequisites

1. **Python Environment** (for model training and conversion):
   ```bash
   pip install tensorflow pandas numpy scikit-learn matplotlib
   ```

2. **Web Server** (for serving the web app):
   - Python's built-in server
   - Any static file server
   - Or simply open the HTML file in a browser

### Step 1: Train the Model

If you don't have a trained model yet, run the training script:

```bash
python stock_predictor.py
```

This will:
- Load and preprocess your stock data
- Train an LSTM model
- Save the model to `model_checkpoints/`
- Generate evaluation reports

### Step 2: Convert to TensorFlow.js

Convert your trained Keras model to TensorFlow.js format:

```bash
python convert_to_tfjs.py
```

This will:
- Load the most recent trained model
- Convert it to TensorFlow.js format
- Save scaler information for the web app
- Create sample data for testing

### Step 3: Run the Web Application

Start a local web server:

```bash
# Using Python
python -m http.server 8000

# Or using Node.js (if you have it installed)
npx serve web_app

# Or simply open the HTML file in your browser
```

Then open your browser and navigate to:
- `http://localhost:8000/web_app/` (if using Python server)
- Or open `web_app/index.html` directly in your browser

## 🎯 How to Use

1. **Load the Application**: Open the web app in your browser
2. **Wait for Model**: The app will automatically load the TensorFlow.js model
3. **Enter Stock Data**: Input the OHLCV (Open, High, Low, Close, Volume) data
4. **Load Sample Data**: Click "Load Sample Data" to test with pre-loaded data
5. **Make Prediction**: Click "Predict Price" to get the AI prediction
6. **View Results**: See the predicted price, change, direction, and chart

## 📊 Model Architecture

- **Type**: LSTM Neural Network
- **Input**: 20 time steps × 5 features
- **Features**: Close Price, Volume, High-Low Range, Close MA, Volume MA
- **Output**: Single price prediction (5 steps ahead)
- **Normalization**: MinMaxScaler for both features and targets

## 🔧 Technical Details

### Model Conversion Process

1. **Keras Model**: Trained using TensorFlow/Keras in Python
2. **TensorFlow.js Conversion**: Model converted to browser-compatible format
3. **Scaler Export**: Scaler parameters exported as JSON
4. **Web Integration**: JavaScript handles preprocessing and predictions

### Browser Requirements

- Modern browser with ES6+ support
- WebGL support (for TensorFlow.js GPU acceleration)
- No internet connection required after initial load

### Performance

- **Model Loading**: ~2-5 seconds (depending on model size)
- **Prediction Time**: ~50-200ms per prediction
- **Memory Usage**: ~10-50MB (depending on model complexity)

## 🎨 Customization

### Styling
- Edit `web_app/styles.css` to customize the appearance
- Modify colors, fonts, and layout as needed

### Model Parameters
- Adjust sequence length in `convert_to_tfjs.py`
- Modify feature engineering in both Python and JavaScript files
- Update prediction horizon in the conversion script

### Adding New Features
- Extend the feature array in both Python and JavaScript
- Update the UI to include new input fields
- Modify the preprocessing logic accordingly

## 🐛 Troubleshooting

### Common Issues

1. **Model Not Loading**:
   - Check that `tfjs_model/model.json` exists
   - Ensure the model was converted successfully
   - Check browser console for errors

2. **CORS Errors**:
   - Use a proper web server (not file:// protocol)
   - Ensure all files are served from the same domain

3. **Prediction Errors**:
   - Verify input data format
   - Check that scaler info is loaded correctly
   - Ensure all input fields are filled

4. **Performance Issues**:
   - Check browser's WebGL support
   - Consider using a smaller model
   - Monitor memory usage

### Debug Mode

Open browser developer tools and check the console for detailed error messages and debugging information.

## 📈 Future Enhancements

- **Real-time Data**: Integrate with live stock data APIs
- **Multiple Models**: Support for different prediction horizons
- **Advanced Charts**: More sophisticated visualization options
- **Model Comparison**: Compare multiple models side by side
- **Export Features**: Save predictions and charts
- **Mobile App**: Convert to Progressive Web App (PWA)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

- TensorFlow.js team for the excellent browser ML framework
- Chart.js for the beautiful charting library
- The open-source community for inspiration and tools

---

**Note**: This is a demonstration project. Stock predictions should not be used as the sole basis for investment decisions. Always do your own research and consult with financial professionals. 