// Stock Price Predictor Web App - Historical Analysis
// Shows actual vs predicted prices from historical data using JavaScript

class StockPredictor {
    constructor() {
        this.model = null;
        this.scalerInfo = null;
        this.sampleData = null;
        this.historicalPredictions = [];
        this.chart = null;
        this.isModelLoaded = false;
        
        this.initializeApp();
    }

    async initializeApp() {
        try {
            // Load model, scaler info, and sample data
            await this.loadModel();
            await this.loadScalerInfo();
            await this.loadSampleData();
            
            // Initialize UI and chart
            this.initializeUI();
            this.initializeChart();
            
            // Generate historical predictions in JavaScript
            await this.generateHistoricalPredictions();
            
        } catch (error) {
            console.error('Error initializing app:', error);
            this.updateModelStatus('error', 'Failed to load application');
        }
    }

    async loadModel() {
        try {
            this.updateModelStatus('loading', 'Loading TensorFlow.js model...');
            console.log('🔄 Loading model from ../tfjs_model/model/model.json');
            
            // Load the LayersModel (proper TensorFlow.js format)
            this.model = await tf.loadLayersModel('../tfjs_model/model/model.json');
            this.updateModelStatus('ready', 'Model loaded successfully');
            this.isModelLoaded = true;
            console.log('✅ TensorFlow.js LayersModel loaded successfully');
            console.log('Model input shape:', this.model.inputs[0].shape);
            console.log('Model output shape:', this.model.outputs[0].shape);
            
        } catch (error) {
            console.error('❌ Error loading LayersModel:', error);
            this.updateModelStatus('error', `Failed to load model: ${error.message}`);
            throw error;
        }
    }

    async loadScalerInfo() {
        try {
            const response = await fetch('../tfjs_model/scaler_info.json?v=' + Date.now());
            if (!response.ok) {
                throw new Error('Failed to load scaler info');
            }
            this.scalerInfo = await response.json();
            console.log('✅ Scaler info loaded');
            console.log('📊 Price scaler (MinMaxScaler) - Range:', this.scalerInfo.price_scaler.data_min_[0], 'to', this.scalerInfo.price_scaler.data_max_[0]);
            
        } catch (error) {
            console.error('Error loading scaler info:', error);
            throw error;
        }
    }

    updateModelStatus(status, message) {
        const statusElement = document.getElementById('modelStatus');
        if (!statusElement) return;
        
        const statusDot = statusElement.querySelector('.status-dot');
        const statusText = statusElement.querySelector('.status-text');
        
        if (statusDot) {
            // Remove all status classes
            statusDot.classList.remove('loading', 'ready', 'error');
            statusDot.classList.add(status);
        }
        
        if (statusText) {
            statusText.textContent = message;
        }
        
        console.log(`Model Status: ${status} - ${message}`);
    }

    initializeUI() {
        // Add refresh button listener if it exists
        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.generateHistoricalPredictions());
        }
    }

    validateInputs() {
        // This method is not needed for historical analysis
        // but kept for compatibility
        console.log('Input validation called (not needed for historical analysis)');
    }

    async loadSampleData() {
        try {
            const response = await fetch('sample_data.json?v=' + Date.now());
            if (!response.ok) {
                throw new Error('Failed to load sample data');
            }
            
            this.sampleData = await response.json();
            console.log('✅ Sample data loaded:', this.sampleData.length, 'records');
            console.log('📊 First record price:', this.sampleData[0].close);
            console.log('📊 Last record price:', this.sampleData[this.sampleData.length - 1].close);
            console.log('📊 Price range check:', Math.min(...this.sampleData.map(d => d.close)), 'to', Math.max(...this.sampleData.map(d => d.close)));
            
        } catch (error) {
            console.error('Error loading sample data:', error);
            throw error;
        }
    }

    clearInputs() {
        // This method is not needed for historical analysis
        // but kept for compatibility
        console.log('Clear inputs called (not needed for historical analysis)');
    }

    scaleFeatures(features) {
        const { feature_scaler } = this.scalerInfo;
        const scaled = [];
        
        for (let i = 0; i < features.length; i++) {
            // MinMaxScaler: (value - data_min) / data_range
            const scaledValue = (features[i] - feature_scaler.data_min_[i]) / feature_scaler.data_range_[i];
            scaled.push(scaledValue);
        }
        
        return scaled;
    }

    inverseScalePrice(scaledPrice) {
        const { price_scaler } = this.scalerInfo;
        // MinMaxScaler inverse: scaled * data_range + data_min
        return scaledPrice * price_scaler.data_range_[0] + price_scaler.data_min_[0];
    }

    initializeChart() {
        const ctx = document.getElementById('predictionChart').getContext('2d');
        
        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'Actual Price',
                        data: [],
                        borderColor: '#2563eb',
                        backgroundColor: 'rgba(37, 99, 235, 0.1)',
                        borderWidth: 2,
                        fill: false,
                        tension: 0.1
                    },
                    {
                        label: 'Predicted Price',
                        data: [],
                        borderColor: '#dc2626',
                        backgroundColor: 'rgba(220, 38, 38, 0.1)',
                        borderWidth: 2,
                        fill: false,
                        tension: 0.1,
                        borderDash: [5, 5]
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Historical Analysis: Actual vs Predicted Prices',
                        font: {
                            size: 16
                        }
                    },
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: function(context) {
                                const label = context.dataset.label || '';
                                const value = '$' + context.parsed.y.toLocaleString();
                                return label + ': ' + value;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        title: {
                            display: true,
                            text: 'Price ($)'
                        },
                        ticks: {
                            callback: function(value) {
                                return '$' + value.toLocaleString();
                            }
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Data Points'
                        }
                    }
                },
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                }
            }
        });
    }

    async generateHistoricalPredictions() {
        if (!this.isModelLoaded || !this.scalerInfo || !this.sampleData) {
            console.error('Model, scaler info, or sample data not loaded');
            return;
        }

        try {
            console.log('🔮 Generating FRESH predictions with LSTM model using recent data...');
            console.log(`📊 Using sample data: ${this.sampleData.length} records`);
            console.log(`💰 Price range: $${Math.min(...this.sampleData.map(d => d.close))} - $${Math.max(...this.sampleData.map(d => d.close))}`);
            
            // Take a subset of sample data for predictions (last 100 points)
            const dataSubset = this.sampleData.slice(-1000);
            const predictions = [];
            const sequenceLength = 20;
            
            // Process each data point that has enough history
            for (let i = sequenceLength; i < dataSubset.length; i++) {
                const currentData = dataSubset[i];
                
                // Create sequence from previous 20 points
                const sequence = [];
                for (let j = i - sequenceLength; j < i; j++) {
                    const point = dataSubset[j];
                    
                    // Calculate features (same as Python)
                    const hlRange = (point.high - point.low) / point.low;
                    const closeMA = point.close_ma || point.close; // Use existing or fallback
                    const volMA = point.vol_ma || point.volume; // Use existing or fallback
                    
                    const features = [point.close, point.volume, hlRange, closeMA, volMA];
                    const scaledFeatures = this.scaleFeatures(features);
                    sequence.push(scaledFeatures);
                }
                
                // Make prediction
                const inputTensor = tf.tensor3d([sequence], [1, sequenceLength, 5]);
                const predictionTensor = this.model.predict(inputTensor);
                const scaledPrediction = predictionTensor.dataSync()[0];
                const predictedPrice = this.inverseScalePrice(scaledPrediction);
                
                // Clean up tensors
                inputTensor.dispose();
                predictionTensor.dispose();
                
                // Store prediction
                predictions.push({
                    timestamp: currentData.datetime || new Date(i * 60000).toISOString(),
                    actual_price: currentData.close,
                    predicted_price: predictedPrice,
                    difference: predictedPrice - currentData.close,
                    accuracy_percent: 100 - Math.abs(predictedPrice - currentData.close) / currentData.close * 100
                });
            }
            
            this.historicalPredictions = predictions;
            console.log('✅ Generated', predictions.length, 'FRESH LSTM predictions');
            console.log(`🎯 Prediction price range: $${Math.min(...predictions.map(p => p.predicted_price))} - $${Math.max(...predictions.map(p => p.predicted_price))}`);
            
            // Update statistics and chart with fresh predictions
            this.updateStatistics();
            this.updateChart();
            
        } catch (error) {
            console.error('Error generating historical predictions:', error);
        }
    }

    updateStatistics() {
        if (this.historicalPredictions.length === 0) return;
        
        // Calculate statistics
        const predictions = this.historicalPredictions;
        const accuracies = predictions.map(p => p.accuracy_percent);
        const differences = predictions.map(p => Math.abs(p.difference));
        
        const avgAccuracy = accuracies.reduce((a, b) => a + b, 0) / accuracies.length;
        const mae = differences.reduce((a, b) => a + b, 0) / differences.length;
        const rmse = Math.sqrt(differences.map(d => d * d).reduce((a, b) => a + b, 0) / differences.length);
        
        // Update UI elements if they exist
        const totalPredictions = document.getElementById('totalPredictions');
        const avgAccuracyEl = document.getElementById('avgAccuracy');
        const maeEl = document.getElementById('mae');
        const rmseEl = document.getElementById('rmse');
        
        if (totalPredictions) totalPredictions.textContent = predictions.length;
        if (avgAccuracyEl) avgAccuracyEl.textContent = avgAccuracy.toFixed(2) + '%';
        if (maeEl) maeEl.textContent = '$' + mae.toFixed(2);
        if (rmseEl) rmseEl.textContent = '$' + rmse.toFixed(2);
        
        console.log('📊 Statistics updated:', {
            total: predictions.length,
            accuracy: avgAccuracy.toFixed(2) + '%',
            mae: '$' + mae.toFixed(2),
            rmse: '$' + rmse.toFixed(2)
        });
    }

    updateChart() {
        if (!this.chart || this.historicalPredictions.length === 0) return;
        
        // Take the last 25 points for visualization
        const chartData = this.historicalPredictions.slice(-25);
        
        // Prepare data for the chart
        const labels = chartData.map((p, index) => `Point ${index + 1}`);
        const actualPrices = chartData.map(p => p.actual_price);
        const predictedPrices = chartData.map(p => p.predicted_price);

        // Update chart data
        this.chart.data.labels = labels;
        this.chart.data.datasets[0].data = actualPrices;
        this.chart.data.datasets[1].data = predictedPrices;
        
        this.chart.update();
        console.log('✅ Chart updated with', chartData.length, 'data points');
    }
}

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new StockPredictor();
}); 