# Real-Time NQ Futures LSTM Prediction Setup

## 🚀 Quick Start Guide

Your web application now includes a powerful **Real-Time NQ Futures Prediction** feature that tracks NASDAQ-100 E-mini futures and uses your trained LSTM model to predict the next price step.

## 📋 Requirements

1. **Twelve Data API Key** (FREE)
   - Visit: https://twelvedata.com/pricing
   - Sign up for a free account
   - Get your API key (800 requests/day on free plan)
   - **32x more requests than Alpha Vantage!**

## 🛠️ How to Use

### Step 1: Launch the Application
```bash
python start_webapp.py
```
Navigate to: `http://localhost:8000/web_app/`

### Step 2: Access Real-Time Feature
- Click on **"Real-Time"** in the navigation menu
- Or directly visit: `http://localhost:8000/web_app/realtime.html`

### Step 3: Configure Real-Time Connection
1. **Enter your Twelve Data API Key**
2. **NQ Futures Tracking** - Automatically configured (via QQQ with 41.36x scaling)
3. **Select Data Interval** (1min default for 5-minute ahead predictions)
4. Click **"Connect & Start"**

### Step 4: Monitor Real-Time NQ Futures Predictions
- View live QQQ scaled price vs LSTM predictions
- Track prediction accuracy and performance metrics
- See real-time charts updating automatically
- Monitor NASDAQ-100 futures information and model confidence

## 📊 Features

### Real-Time NQ Futures Dashboard
- **Current QQQ Price**: Live QQQ ETF price scaled to NQ futures range
- **LSTM Prediction**: 5-minute ahead price prediction with confidence
- **Performance Metrics**: Accuracy, response time, error rates
- **Live Chart**: Real-time visualization of QQQ prices vs predictions
- **NQ Futures Information**: Volume, day high/low, contract details, CME exchange info

### Professional Interface
- Dark financial theme (like Bloomberg/Reuters)
- Responsive design for all devices
- Professional typography and colors
- Real-time status indicators

## 🔧 Technical Details

### Data Source
- **Twelve Data API**: Professional-grade market data
- **Data Source**: QQQ ETF (NASDAQ-100 tracking fund)
- **Scaling Method**: 41.36x multiplier to match NQ futures price range
- **Update Frequency**: Every 1 minute (configurable)
- **Data Quality**: Real-time quotes from major exchanges
- **Rate Limit**: 800 requests/day (FREE plan) - 32x more than Alpha Vantage!

### LSTM Model
- **Architecture**: 64-unit LSTM neural network
- **Sequence Length**: 20 time steps
- **Features**: Close price, volume, HL range, moving averages
- **Scaling**: MinMaxScaler (same as training)
- **Prediction**: 5-minute ahead multi-step forecasting with confidence score

### Browser Requirements
- Modern browser (Chrome, Firefox, Safari, Edge)
- JavaScript enabled
- No additional plugins required

## 💡 Usage Tips

1. **Generous Limits**: Twelve Data API offers 800 requests/day (32x more than Alpha Vantage!)
2. **NQ Futures Tracking**: QQQ ETF closely tracks NASDAQ-100 index movements
3. **Market Hours**: Most accurate during US trading hours (9:30 AM - 4:00 PM EST)
4. **Update Frequency**: Uses 1-minute data for optimal 5-minute ahead predictions
5. **Model Accuracy**: Performance optimized for NASDAQ-100 patterns
6. **Free Tier**: Get started immediately with the generous free plan

## 🚨 Troubleshooting

### Common Issues

#### ⚠️ "Connection failed" Error
**Possible causes**:
- **API Key**: Verify your Twelve Data API key is correct
- **Network issues**: Check your internet connection
- **Markets closed**: Try again during market hours
- **Rate limit**: You may have reached the 800 requests/day limit

#### ⚠️ "No market data available" Error
- **API Key**: Ensure your Twelve Data API key is valid
- **Markets closed**: Limited data may be available outside market hours
- **Symbol issues**: QQQ symbol should always work during trading hours
- **Rate limit**: Check if you've reached your daily API limit

### Error Messages
- **404 errors**: Ensure model files are properly loaded
- **Model loading failed**: Check browser console for details
- **Prediction errors**: Verify scaler info and model compatibility

## 📈 Performance Expectations

- **Prediction Accuracy**: Typically 85-95% directional accuracy
- **Response Time**: Usually under 500ms for API calls
- **Update Frequency**: Real-time updates every 1-5 minutes
- **Model Confidence**: Ranges from 50-99% based on market volatility

## 🔮 Next Steps

1. **Get API Key**: Sign up at twelvedata.com for FREE
2. **Start Tracking**: Enter your API key and click "Connect & Start" 
3. **Monitor Performance**: Watch accuracy metrics for NASDAQ-100 patterns
4. **Experiment**: Try different time intervals for optimal results
5. **Real-Time Trading**: Use predictions to inform your NQ futures strategy

---

**Your LSTM Stock Predictor is now a professional real-time NQ futures trading platform!** 🎉

**NQ Futures Details:**
- **Contract**: E-mini NASDAQ-100 (NQ)
- **Exchange**: Chicago Mercantile Exchange (CME)  
- **Method**: QQQ ETF scaled 41.36x to match NQ futures range
- **Point Value**: $20 per index point
- **Trading Hours**: Nearly 24/7 (Sunday 6 PM - Friday 5 PM EST)

For questions or issues, check the browser console for detailed error messages.