// Real-Time LSTM Stock Price Predictor
// Professional real-time market prediction using Alpha Vantage API

class RealtimePredictor {
    constructor() {
        this.model = null;
        this.scalerInfo = null;
        this.isModelLoaded = false;
        this.isConnected = false;
        
        // Data source configuration
        this.dataSource = 'twelvedata'; // 'twelvedata' or 'alphavantage'
        this.apiKey = null; // Twelve Data API key
        this.alphaApiKey = null; // Alpha Vantage API key
        
        // Symbol and scaling configuration
        this.symbol = 'QQQ'; // Default: QQQ ETF for NASDAQ-100 tracking
        this.scalingFactor = 41.36; // Scale factor: NQ futures/QQQ ≈ 22750/550
        this.useScaling = true; // Scale QQQ to NQ futures range
        this.interval = '1min'; // Default interval
        this.predictionSteps = 5; // Predict 5 minutes ahead
        
        // Data storage
        this.marketData = [];
        this.predictions = [];
        this.priceHistory = [];
        this.predictionHistory = [];
        this.candlestickData = []; // For candlestick chart
        
        // Prediction tracking for accuracy
        this.predictionTracker = []; // {predictedTime, predictedPrice, actualPrice, accuracy}
        this.futureCandles = []; // Store future prediction candles
        this.allPredictions = []; // Store all predictions with their target times for chart display
        
        // Statistics
        this.updateCount = 0;
        this.predictionAccuracy = 0;
        this.averageError = 0;
        this.lastResponseTime = 0;
        
        // Update interval (in milliseconds)
        this.updateInterval = 60000; // 1 minute
        this.intervalId = null;
        
        // Chart
        this.chart = null;
        
        this.initialize();
    }
    
    isMarketOpen() {
        const now = new Date();
        const easternTime = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
        
        const day = easternTime.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
        const hours = easternTime.getHours();
        const minutes = easternTime.getMinutes();
        const currentMinutes = hours * 60 + minutes;
        
        // Market is closed on weekends (Saturday = 6, Sunday = 0)
        if (day === 0 || day === 6) {
            return {
                isOpen: false,
                isRegularHours: false,
                isExtendedHours: false,
                currentTime: easternTime
            };
        }
        
        // Regular trading hours: 9:30 AM - 4:00 PM ET (Monday-Friday)
        const marketOpen = 9 * 60 + 30; // 9:30 AM in minutes
        const marketClose = 16 * 60; // 4:00 PM in minutes
        
        // Extended hours: 4:00 AM - 8:00 PM ET
        const extendedOpen = 4 * 60; // 4:00 AM in minutes
        const extendedClose = 20 * 60; // 8:00 PM in minutes
        
        // Check if we're in extended trading hours
        const inExtendedHours = currentMinutes >= extendedOpen && currentMinutes < extendedClose;
        const inRegularHours = currentMinutes >= marketOpen && currentMinutes < marketClose;
        
        return {
            isOpen: inExtendedHours,
            isRegularHours: inRegularHours,
            isExtendedHours: inExtendedHours && !inRegularHours,
            currentTime: easternTime
        };
    }
    
    updateMarketStatus() {
        const marketInfo = this.isMarketOpen();
        const statusElement = document.getElementById('marketStatus');
        
        if (!statusElement) return;
        
        const statusDot = statusElement.querySelector('.status-dot');
        const statusText = statusElement.querySelector('span');
        
        // Update status display
        if (marketInfo.isRegularHours) {
            statusDot.className = 'status-dot ready';
            statusText.textContent = 'Open (Regular Hours)';
        } else if (marketInfo.isExtendedHours) {
            statusDot.className = 'status-dot loading';
            statusText.textContent = 'Extended Hours';
        } else {
            statusDot.className = 'status-dot error';
            statusText.textContent = 'Closed';
        }
        
        // Show/hide chart section based on market status
        this.toggleChartVisibility(marketInfo.isOpen);
        
        console.log(`Market Status: ${statusText.textContent} (ET: ${marketInfo.currentTime.toLocaleTimeString()})`);
    }
    
    toggleChartVisibility(isMarketOpen) {
        const chartSection = document.querySelector('.chart-section');
        const dashboardSection = document.querySelector('.dashboard-section');
        let marketClosedMessage = document.getElementById('marketClosedMessage');
        
        if (isMarketOpen) {
            // Market is open - show chart
            if (chartSection) chartSection.style.display = 'block';
            if (dashboardSection) dashboardSection.style.display = 'block';
            if (marketClosedMessage) marketClosedMessage.style.display = 'none';
        } else {
            // Market is closed - hide chart and show message
            if (chartSection) chartSection.style.display = 'none';
            if (dashboardSection) dashboardSection.style.display = 'none';
            
            // Create or show market closed message
            if (!marketClosedMessage) {
                marketClosedMessage = this.createMarketClosedMessage();
            }
            if (marketClosedMessage) marketClosedMessage.style.display = 'block';
        }
    }
    
    createMarketClosedMessage() {
        const mainContent = document.querySelector('.main-content');
        if (!mainContent) return null;
        
        const messageDiv = document.createElement('div');
        messageDiv.id = 'marketClosedMessage';
        messageDiv.className = 'market-closed-message';
        messageDiv.innerHTML = `
            <div class="closed-message-content">
                <div class="closed-icon">📈</div>
                <h2>Market is Currently Closed</h2>
                <p>Real-time trading and predictions are only available during market hours:</p>
                <div class="market-hours">
                    <div class="hours-item">
                        <strong>Regular Hours:</strong> 9:30 AM - 4:00 PM ET
                    </div>
                    <div class="hours-item">
                        <strong>Extended Hours:</strong> 4:00 AM - 8:00 PM ET
                    </div>
                    <div class="hours-item">
                        <strong>Days:</strong> Monday - Friday
                    </div>
                </div>
                <p>The chart and live predictions will automatically appear when markets reopen.</p>
                <div class="next-open" id="nextOpenTime"></div>
            </div>
        `;
        
        // Insert after the config section
        const configSection = document.querySelector('.config-section');
        if (configSection) {
            configSection.insertAdjacentElement('afterend', messageDiv);
        } else {
            mainContent.appendChild(messageDiv);
        }
        
        // Calculate and show next market open time
        this.updateNextOpenTime();
        
        return messageDiv;
    }
    
    updateNextOpenTime() {
        const nextOpenElement = document.getElementById('nextOpenTime');
        if (!nextOpenElement) return;
        
        const now = new Date();
        const easternTime = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
        
        let nextOpen = new Date(easternTime);
        const day = easternTime.getDay();
        const hours = easternTime.getHours();
        const minutes = easternTime.getMinutes();
        const currentMinutes = hours * 60 + minutes;
        
        // If it's Friday after 8 PM or weekend, next open is Monday 4 AM
        if ((day === 5 && currentMinutes >= 20 * 60) || day === 6 || day === 0) {
            // Calculate next Monday
            const daysUntilMonday = day === 0 ? 1 : (8 - day);
            nextOpen.setDate(nextOpen.getDate() + daysUntilMonday);
            nextOpen.setHours(4, 0, 0, 0);
        }
        // If it's a weekday but after 8 PM, next open is tomorrow 4 AM
        else if (currentMinutes >= 20 * 60) {
            nextOpen.setDate(nextOpen.getDate() + 1);
            nextOpen.setHours(4, 0, 0, 0);
        }
        // If it's before 4 AM on a weekday, next open is today 4 AM
        else if (currentMinutes < 4 * 60) {
            nextOpen.setHours(4, 0, 0, 0);
        }
        // If it's between 4 PM and 8 PM, already in extended hours
        else {
            nextOpen.setHours(4, 0, 0, 0);
            nextOpen.setDate(nextOpen.getDate() + 1);
        }
        
        const timeUntilOpen = nextOpen.getTime() - easternTime.getTime();
        const hoursUntilOpen = Math.floor(timeUntilOpen / (1000 * 60 * 60));
        const minutesUntilOpen = Math.floor((timeUntilOpen % (1000 * 60 * 60)) / (1000 * 60));
        
        if (hoursUntilOpen > 0) {
            nextOpenElement.innerHTML = `<strong>Next market open:</strong> ${nextOpen.toLocaleString('en-US', {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                timeZoneName: 'short',
                timeZone: 'America/New_York'
            })} (in ${hoursUntilOpen}h ${minutesUntilOpen}m)`;
        } else {
            nextOpenElement.innerHTML = `<strong>Market opens in:</strong> ${minutesUntilOpen} minutes`;
        }
    }
    
    async initialize() {
        console.log('🚀 Initializing Real-Time Predictor...');
        
        try {
            await this.loadModel();
            await this.loadScalerInfo();
            this.setupEventListeners();
            this.updateMarketStatus();
            
            // Update market status every minute
            setInterval(() => {
                this.updateMarketStatus();
                this.updateNextOpenTime(); // Also update countdown
            }, 60000);
            this.updateStatus('ready', 'Real-time system ready');
            console.log('Real-time predictor initialized successfully');
        } catch (error) {
            console.error('Error initializing predictor:', error);
            this.updateStatus('error', 'Initialization failed');
        }
    }
    
    async loadModel() {
        console.log('📦 Loading LSTM model...');
        this.updateStatus('loading', 'Loading neural network...');
        
        try {
            this.model = await tf.loadLayersModel('../tfjs_model/model/model.json');
            this.isModelLoaded = true;
            console.log('LSTM model loaded successfully');
        } catch (error) {
            console.error('Error loading model:', error);
            throw new Error('Failed to load LSTM model');
        }
    }
    
    async loadScalerInfo() {
        console.log('Loading scaler information...');
        
        try {
            const response = await fetch('../tfjs_model/scaler_info.json?v=20250803');
            this.scalerInfo = await response.json();
            console.log('Scaler info loaded successfully');
        } catch (error) {
            console.error('Error loading scaler info:', error);
            throw new Error('Failed to load scaler information');
        }
    }
    
    setupEventListeners() {
        document.getElementById('connectBtn').addEventListener('click', () => this.startRealTimeConnection());
        document.getElementById('stopBtn').addEventListener('click', () => this.stopRealTimeConnection());
        
        // Data source selector
        document.getElementById('dataSource').addEventListener('change', (e) => {
            this.handleDataSourceChange(e.target.value);
        });
        
        // API key inputs with enter key support
        document.getElementById('apiKey').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.startRealTimeConnection();
            }
        });
        
        document.getElementById('alphaApiKey').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.startRealTimeConnection();
            }
        });
    }
    
    handleDataSourceChange(dataSource) {
        this.dataSource = dataSource;
        console.log(`Data source changed to: ${dataSource}`);
        
        // Show/hide appropriate API key inputs
        const twelveDataConfig = document.getElementById('twelveDataConfig');
        const alphaVantageConfig = document.getElementById('alphaVantageConfig');
        const futuresSymbol = document.getElementById('futuresSymbol');
        const futuresDescription = document.getElementById('futuresDescription');
        
        if (dataSource === 'alphavantage') {
            twelveDataConfig.style.display = 'none';
            alphaVantageConfig.style.display = 'block';
            
            // Update configuration for Alpha Vantage
            this.symbol = 'QQQ'; // Alpha Vantage also uses QQQ for NASDAQ-100
            this.useScaling = true;
            this.scalingFactor = 41.36;
            
            // Update UI text
            futuresSymbol.textContent = 'Alpha Vantage × 41.36 Scale';
            futuresDescription.textContent = 'Alpha Vantage data scaled to NQ E-mini futures price range';
            
            // Update chart legend and footer
            const chartLegend = document.getElementById('chartLegendPrice');
            const chartFooter = document.getElementById('chartFooterText');
            if (chartLegend) chartLegend.textContent = 'Alpha Vantage Scaled Price';
            if (chartFooter) chartFooter.textContent = 'Real-time NQ futures via Alpha Vantage • 1-min data • 5-min ahead LSTM predictions • Persistent history';
        } else {
            twelveDataConfig.style.display = 'block';
            alphaVantageConfig.style.display = 'none';
            
            // Update configuration for Twelve Data
            this.symbol = 'QQQ';
            this.useScaling = true;
            this.scalingFactor = 41.36;
            
            // Update UI text
            futuresSymbol.textContent = 'QQQ × 41.36 = NQ Scale';
            futuresDescription.textContent = 'QQQ ETF scaled to NQ E-mini futures price range';
            
            // Update chart legend and footer
            const chartLegend = document.getElementById('chartLegendPrice');
            const chartFooter = document.getElementById('chartFooterText');
            if (chartLegend) chartLegend.textContent = 'QQQ Scaled Price';
            if (chartFooter) chartFooter.textContent = 'Real-time NQ futures via QQQ scaled • 1-min data • 5-min ahead LSTM predictions • Persistent prediction history';
        }
        
        // Stop current connection if running
        if (this.isConnected) {
            this.stopRealTimeConnection();
        }
    }
    
    updateStatus(type, message) {
        const statusDot = document.querySelector('.status-dot');
        const statusText = document.querySelector('.status-text');
        
        statusDot.className = `status-dot ${type}`;
        statusText.textContent = message;
    }
    
    async startRealTimeConnection() {
        console.log(`Starting ${this.dataSource} API connection...`);
        
        // Check if market is open before starting connection
        const marketInfo = this.isMarketOpen();
        if (!marketInfo.isOpen) {
            alert('Cannot start real-time connection - market is currently closed. Please wait for market hours.');
            return;
        }
        
        // Get configuration based on data source
        if (this.dataSource === 'alphavantage') {
            this.alphaApiKey = document.getElementById('alphaApiKey').value.trim();
            if (!this.alphaApiKey) {
                alert('Please enter your Alpha Vantage API key');
                return;
            }
        } else {
            this.apiKey = document.getElementById('apiKey').value.trim();
            if (!this.apiKey) {
                alert('Please enter your Twelve Data API key');
                return;
            }
        }
        
        this.symbol = 'QQQ'; // Both APIs use QQQ for NASDAQ-100 tracking
        this.interval = '1min'; // Fixed to 1-minute intervals only
        
        if (!this.isModelLoaded) {
            alert('LSTM model is not loaded yet');
            return;
        }
        
        const apiName = this.dataSource === 'alphavantage' ? 'Alpha Vantage' : 'Twelve Data';
        this.updateStatus('loading', `Connecting to ${apiName} API...`);
        
        try {
            // Fetch market data 
            await this.fetchMarketData();
            
            this.isConnected = true;
            this.showDashboard();
            this.startPeriodicUpdates();
            
            // Update UI
            document.getElementById('connectBtn').disabled = true;
            document.getElementById('stopBtn').disabled = false;
            
            const intervalText = `1min data, ${this.predictionSteps}min predictions`;
            const apiName = this.dataSource === 'alphavantage' ? 'Alpha Vantage' : 'Twelve Data';
            const dailyLimit = this.dataSource === 'alphavantage' ? '25' : '800';
            
            const statusMsg = `Connected to NQ Futures via ${this.symbol} (${intervalText}) - ${dailyLimit} req/day FREE!`;
            this.updateStatus('ready', statusMsg);
            console.log(`${apiName} connection established: ${intervalText}`);
            
        } catch (error) {
            console.error('Error starting connection:', error);
            this.updateStatus('error', 'Connection failed');
            
            // Provide specific error messages for both APIs
            const apiName = this.dataSource === 'alphavantage' ? 'Alpha Vantage' : 'Twelve Data';
            const dailyLimit = this.dataSource === 'alphavantage' ? '25' : '800';
            
            let errorMessage = 'Failed to connect to market data.';
            if (error.message.includes('rate limit exceeded')) {
                errorMessage = `${apiName} API rate limit exceeded (${dailyLimit}/day). Please wait until tomorrow or upgrade to premium.`;
            } else if (error.message.includes('fetch')) {
                errorMessage = 'Network error. Check your internet connection.';
            } else if (error.message.includes('Markets might be closed')) {
                errorMessage = 'No market data available. Markets might be closed or symbol invalid.';
            } else if (error.message.includes('API Error')) {
                errorMessage = `${apiName} API Error: ${error.message}. Check your API key.`;
            } else {
                errorMessage = `Connection failed: ${error.message}`;
            }
            
            alert(errorMessage);
        }
    }
    
    stopRealTimeConnection() {
        console.log('🛑 Stopping real-time connection...');
        
        this.isConnected = false;
        
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        
        // Reset interval and prediction steps back to defaults for next connection attempt
        this.interval = '1min';
        this.predictionSteps = 5;
        
        // Update UI
        document.getElementById('connectBtn').disabled = false;
        document.getElementById('stopBtn').disabled = true;
        document.getElementById('realtimeDashboard').style.display = 'none';
        
        this.updateStatus('ready', 'Disconnected');
        console.log('Real-time connection stopped');
    }
    
    showDashboard() {
        document.getElementById('realtimeDashboard').style.display = 'block';
        this.initializeChart();
    }
    
    startPeriodicUpdates() {
        // Initial update
        this.fetchAndPredict();
        
        // Set up periodic updates
        this.intervalId = setInterval(() => {
            if (this.isConnected) {
                this.fetchAndPredict();
            }
        }, this.updateInterval);
        
        console.log(`Periodic updates started (every ${this.updateInterval / 1000}s)`);
    }
    
    async fetchAndPredict() {
                    console.log('Fetching market data and making prediction...');
        
        try {
            const startTime = Date.now();
            
            // Fetch latest market data
            const marketData = await this.fetchMarketData();
            
            // Calculate response time
            this.lastResponseTime = Date.now() - startTime;
            
            // Make prediction
            const prediction = await this.makePrediction(marketData);
            
            // Update displays
            this.updateDisplays(marketData, prediction);
            this.updateChart(marketData, prediction);
            this.updateStatistics();
            
            this.updateCount++;
            
            console.log('Update completed successfully');
            
        } catch (error) {
            console.error('Error in fetch and predict:', error);
            this.updateStatus('error', 'Update failed');
        }
    }
    
    async fetchMarketData() {
        if (this.dataSource === 'alphavantage') {
            return await this.fetchAlphaVantageData();
        } else {
            return await this.fetchTwelveData();
        }
    }
    
    async fetchTwelveData() {
        // Using Twelve Data API - 800 requests/day FREE! 🎉
        const url = `https://api.twelvedata.com/time_series?symbol=${this.symbol}&interval=${this.interval}&outputsize=100&apikey=${this.apiKey}`;
        
        console.log(`Fetching NQ futures data via ${this.symbol} (${this.interval} interval)...`);
        console.log(`📡 Twelve Data API URL: ${url}`);
        console.log('Using Twelve Data API - 800 requests/day FREE! (32x more than Alpha Vantage)');
        
        const response = await fetch(url);
        console.log(`Response status: ${response.status} ${response.statusText}`);
        
        const data = await response.json();
        console.log(`📋 Twelve Data Response:`, data);
        
        // Check for Twelve Data API errors
        if (data.status === 'error') {
            console.error(`Twelve Data Error:`, data.message);
            throw new Error(`Twelve Data API Error: ${data.message}`);
        }
        
        if (data.code && data.code !== 200) {
            console.error(`Twelve Data Error Code ${data.code}:`, data.message);
            if (data.code === 429) {
                throw new Error('API rate limit exceeded. You have used your 800 daily requests. Please wait until tomorrow.');
            }
            throw new Error(`Twelve Data API Error: ${data.message}`);
        }
        
        if (!data.values || !Array.isArray(data.values) || data.values.length === 0) {
            console.error('No time series data found. Full API response:', data);
            
            // Rate limited with 1min interval - no fallback since we only support 1min
            console.log('Rate limited with 1min interval - please wait before retrying...');
            
            throw new Error('No market data available from Twelve Data. Markets might be closed or symbol invalid.');
        }
        
        // Convert Twelve Data format to our format
        const dataArray = data.values.map((item) => {
            let open = parseFloat(item.open);
            let high = parseFloat(item.high);
            let low = parseFloat(item.low);
            let close = parseFloat(item.close);
            let volume = parseInt(item.volume) || 0;
            
            // Skip null/undefined values
            if (!open || !high || !low || !close) {
                return null;
            }
            
            // Apply scaling factor for NQ futures
            if (this.useScaling) {
                open *= this.scalingFactor;
                high *= this.scalingFactor;
                low *= this.scalingFactor;
                close *= this.scalingFactor;
                // Scale volume down to match NQ futures volume range (QQQ volume is much higher)
                volume = Math.round(volume / 1000); // Rough approximation to get into NQ volume range
            }
            
            // DEBUG: Let's see what we're getting from the API
            console.log(`Raw datetime from API: "${item.datetime}"`);
            
            // Create timestamp - let's be more explicit about timezone handling
            let timestamp = new Date(item.datetime);
            console.log(`Parsed timestamp: ${timestamp.toLocaleString()}`);
            console.log(`Timezone offset: ${timestamp.getTimezoneOffset()} minutes`);
            
            // Force the timestamp to be interpreted as local time if it looks like UTC
            if (item.datetime.includes('T') && item.datetime.includes(':00')) {
                // Try parsing as if it's local time instead of UTC
                const parts = item.datetime.split('T');
                const datePart = parts[0];
                const timePart = parts[1];
                const localTimeString = `${datePart} ${timePart}`;
                timestamp = new Date(localTimeString);
                console.log(`Adjusted to local time: ${timestamp.toLocaleString()}`);
            }
            
            return {
                timestamp: timestamp,
                open: open,
                high: high,
                low: low,
                close: close,
                volume: volume
            };
        }).filter(item => item !== null) // Remove null entries
          .sort((a, b) => a.timestamp - b.timestamp);
        
        // Store latest data
        this.marketData = dataArray;
        
        console.log(`Received ${dataArray.length} data points`);
        
        if (dataArray.length > 0) {
            const latest = dataArray[dataArray.length - 1];
            const currentTime = new Date();
            console.log(`🕐 Latest data timestamp: ${latest.timestamp.toLocaleString()}`);
            console.log(`🕐 Current local time: ${currentTime.toLocaleString()}`);
            console.log(`Current price: $${latest.close.toFixed(2)} (scaled from QQQ with ${this.scalingFactor}x factor)`);
            
            // Check if price is out of training range
            if (latest.close > 22317.75) {
                console.warn(`🚨 Price $${latest.close.toFixed(2)} is above training max $22,317.75 - using dynamic scaling`);
            }
        }
        
        if (this.useScaling) {
            const latestPrice = dataArray[dataArray.length - 1];
            console.log(`🔢 Using ${this.symbol} with ${this.scalingFactor.toFixed(2)}x scaling. Latest price: ${latestPrice.close.toFixed(2)}`);
        }
        
        return dataArray;
    }
    
    async fetchAlphaVantageData() {
        // Using Alpha Vantage API - 25 requests/day FREE
        const url = `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${this.symbol}&interval=1min&outputsize=compact&apikey=${this.alphaApiKey}`;
        
        console.log(`Fetching NQ futures data via ${this.symbol} from Alpha Vantage (${this.interval} interval)...`);
        console.log(`📡 Alpha Vantage API URL: ${url}`);
        console.log('Using Alpha Vantage API - 25 requests/day FREE');
        
        const response = await fetch(url);
        console.log(`Response status: ${response.status} ${response.statusText}`);
        
        const data = await response.json();
        console.log(`📋 Alpha Vantage Response:`, data);
        
        // Check for Alpha Vantage API errors
        if (data['Error Message']) {
            console.error(`Alpha Vantage Error:`, data['Error Message']);
            throw new Error(`Alpha Vantage API Error: ${data['Error Message']}`);
        }
        
        if (data['Note']) {
            console.error(`Alpha Vantage Rate Limit:`, data['Note']);
            throw new Error('Alpha Vantage API rate limit exceeded. You have used your 25 daily requests. Please wait until tomorrow.');
        }
        
        const timeSeries = data['Time Series (1min)'];
        if (!timeSeries) {
            console.error('No time series data found. Full API response:', data);
            throw new Error('No market data available from Alpha Vantage. Markets might be closed or symbol invalid.');
        }
        
        // Convert Alpha Vantage format to our format
        const dataArray = [];
        for (const [datetime, values] of Object.entries(timeSeries)) {
            let open = parseFloat(values['1. open']);
            let high = parseFloat(values['2. high']);
            let low = parseFloat(values['3. low']);
            let close = parseFloat(values['4. close']);
            let volume = parseInt(values['5. volume']) || 0;
            
            // Skip null/undefined values
            if (!open || !high || !low || !close) {
                continue;
            }
            
            // Apply scaling factor for NQ futures
            if (this.useScaling) {
                open *= this.scalingFactor;
                high *= this.scalingFactor;
                low *= this.scalingFactor;
                close *= this.scalingFactor;
                // Scale volume down to match NQ futures volume range (QQQ volume is much higher)
                volume = Math.round(volume / 1000); // Rough approximation to get into NQ volume range
            }
            
            // Create timestamp
            let timestamp = new Date(datetime);
            
            dataArray.push({
                timestamp: timestamp,
                open: open,
                high: high,
                low: low,
                close: close,
                volume: volume
            });
        }
        
        // Sort by timestamp (Alpha Vantage returns data in reverse chronological order)
        dataArray.sort((a, b) => a.timestamp - b.timestamp);
        
        // Store latest data
        this.marketData = dataArray;
        
        console.log(`Received ${dataArray.length} data points from Alpha Vantage`);
        
        if (dataArray.length > 0) {
            const latest = dataArray[dataArray.length - 1];
            const currentTime = new Date();
            console.log(`🕐 Latest data timestamp: ${latest.timestamp.toLocaleString()}`);
            console.log(`🕐 Current local time: ${currentTime.toLocaleString()}`);
            console.log(`Current price: $${latest.close.toFixed(2)} (scaled from QQQ with ${this.scalingFactor}x factor)`);
            
            // Check if price is out of training range
            if (latest.close > 22317.75) {
                console.warn(`🚨 Price $${latest.close.toFixed(2)} is above training max $22,317.75 - using dynamic scaling`);
            }
        }
        
        if (this.useScaling) {
            const latestPrice = dataArray[dataArray.length - 1];
            console.log(`🔢 Using Alpha Vantage ${this.symbol} with ${this.scalingFactor.toFixed(2)}x scaling. Latest price: ${latestPrice.close.toFixed(2)}`);
        }
        
        return dataArray;
    }
    
    async makePrediction(marketData) {
        // Need at least 40 points to calculate proper 20-period moving averages for the last 20 points
        if (marketData.length < 40) {
            throw new Error('Not enough data for prediction (need at least 40 points for proper moving averages)');
        }
        
        console.log(`Making DIRECT ${this.predictionSteps}-step LSTM prediction (matching trained model)...`);
        
        // CRITICAL FIX: Calculate moving averages BEFORE creating sequences, exactly like Python!
        // We need to calculate MA for all points, not just within the sequence
        const enrichedData = [];
        for (let i = 0; i < marketData.length; i++) {
            const point = marketData[i];
            let closeMA = point.close;
            let volMA = point.volume;
            
            // Calculate 20-period moving averages if we have enough history
            if (i >= 19) {
                const last20 = marketData.slice(i - 19, i + 1);
                closeMA = last20.reduce((sum, p) => sum + p.close, 0) / 20;
                volMA = last20.reduce((sum, p) => sum + p.volume, 0) / 20;
            }
            
            enrichedData.push({
                ...point,
                closeMA: closeMA,
                volMA: volMA
            });
        }
        
        // Now get the last 20 enriched points for our sequence
        const last20Points = enrichedData.slice(-20);
        
        // Prepare sequence of features - now with PROPER moving averages like Python!
        const sequence = [];
        for (let i = 0; i < 20; i++) {
            const point = last20Points[i];
            
            // Calculate technical indicators
            const hlRange = (point.high - point.low) / point.low;
            
            // Use pre-calculated moving averages
            const features = [point.close, point.volume, hlRange, point.closeMA, point.volMA];
            const scaledFeatures = this.scaleFeatures(features);
            sequence.push(scaledFeatures);
        }
        
        console.log(`Prepared sequence: ${sequence.length} timesteps × ${sequence[0].length} features`);
        
        // Debug: Verify moving averages are properly calculated
        console.log(`🔍 Feature verification for last point:`);
        const lastPoint = last20Points[19];
        console.log(`   Close: $${lastPoint.close.toFixed(2)}`);
        console.log(`   Close MA: $${lastPoint.closeMA.toFixed(2)} (should be ~close to current price)`);
        console.log(`   Volume: ${lastPoint.volume}`);
        console.log(`   Volume MA: ${lastPoint.volMA.toFixed(0)}`);
        console.log(`   HL Range: ${((lastPoint.high - lastPoint.low) / lastPoint.low).toFixed(6)}`);
        console.log(`   MA/Close ratio: ${(lastPoint.closeMA / lastPoint.close).toFixed(3)} (should be close to 1.0)`);
        
        // Debug: Show first few and last few points of sequence for comparison with Python
        console.log(`🔍 SEQUENCE DEBUG - First 3 timesteps (scaled):`);
        for (let i = 0; i < Math.min(3, sequence.length); i++) {
            console.log(`   t-${sequence.length-1-i}: [${sequence[i].map(f => f.toFixed(6)).join(', ')}]`);
        }
        console.log(`🔍 SEQUENCE DEBUG - Last 3 timesteps (scaled):`);
        for (let i = Math.max(0, sequence.length-3); i < sequence.length; i++) {
            console.log(`   t-${sequence.length-1-i}: [${sequence[i].map(f => f.toFixed(6)).join(', ')}]`);
        }
        
        // SINGLE prediction - exactly like Python model was trained
        const inputTensor = tf.tensor3d([sequence], [1, 20, 5]);
        const predictionTensor = this.model.predict(inputTensor);
        const scaledPrediction = predictionTensor.dataSync()[0];
        const predictedPrice = this.inverseScalePrice(scaledPrediction);
        
        // Clean up tensors
        inputTensor.dispose();
        predictionTensor.dispose();
        
        const currentPrice = marketData[marketData.length - 1].close;
        console.log(`DIRECT prediction (${this.predictionSteps} min ahead): $${predictedPrice.toFixed(2)}`);
        console.log(`Current price: $${currentPrice.toFixed(2)}`);
        console.log(`Predicted change: ${((predictedPrice - currentPrice) / currentPrice * 100).toFixed(2)}%`);
        
        // Calculate confidence
        const confidence = Math.max(50, Math.min(99, 100 - Math.abs((predictedPrice - currentPrice) / currentPrice) * 100));
        
        return {
            value: predictedPrice,
            confidence: confidence,
            timestamp: new Date(),
            currentPrice: currentPrice
        };
    }
    
    scaleFeatures(features) {
        const { feature_scaler } = this.scalerInfo;
        const scaled = [];
        
        console.log(`🔢 FEATURE SCALING DEBUG:`);
                    console.log(`   Raw features: [${features.map(f => f.toFixed(2)).join(', ')}]`);
        
        for (let i = 0; i < features.length; i++) {
            // MinMaxScaler: (value - data_min) / data_range - NO CLAMPING!
            const scaledValue = (features[i] - feature_scaler.data_min_[i]) / feature_scaler.data_range_[i];
            
            if (i === 0) { // Only log for price feature to avoid spam
                console.log(`   Price feature: ${features[i].toFixed(2)} → scaled: ${scaledValue.toFixed(6)}`);
                
                if (scaledValue < 0 || scaledValue > 1) {
                    console.log(`   Price ${features[i].toFixed(2)} is outside training range [${feature_scaler.data_min_[i].toFixed(2)}, ${(feature_scaler.data_min_[i] + feature_scaler.data_range_[i]).toFixed(2)}] - EXTRAPOLATING`);
                }
            }
            
            scaled.push(scaledValue);
        }
        
        console.log(`   Scaled features: [${scaled.map(f => f.toFixed(6)).join(', ')}]`);
        return scaled;
    }
    
    inverseScalePrice(scaledPrice) {
        const { price_scaler } = this.scalerInfo;
        
        // DIRECT LSTM PREDICTION - No conservative clamping!
        const currentPrice = this.marketData.length > 0 ? this.marketData[this.marketData.length - 1].close : null;
        
        console.log(`🔍 DIRECT LSTM PREDICTION:`);
        console.log(`   Scaled prediction from model: ${scaledPrice}`);
        console.log(`   Current market price: $${currentPrice?.toFixed(2)}`);
        console.log(`   📏 Training range: $${price_scaler.data_min_[0].toFixed(2)} - $${price_scaler.data_max_[0].toFixed(2)}`);
        
        // Direct inverse scaling - TRUST THE MODEL!
        const lstmPrediction = scaledPrice * price_scaler.data_range_[0] + price_scaler.data_min_[0];
        console.log(`   LSTM PREDICTION: $${lstmPrediction.toFixed(2)}`);
        
        if (currentPrice) {
            const percentChange = ((lstmPrediction - currentPrice) / currentPrice) * 100;
            console.log(`   Predicted change: ${percentChange.toFixed(2)}%`);
            
            // Just log the prediction magnitude for awareness, but DON'T clamp it
            if (Math.abs(percentChange) > 2) {
                console.log(`   🚀 Large movement predicted: ${percentChange.toFixed(2)}% - USING LSTM PREDICTION AS-IS!`);
            }
        }
        
        console.log(`   DIRECT LSTM OUTPUT: $${lstmPrediction.toFixed(2)}`);
        return lstmPrediction;
    }
    
    updateDisplays(marketData, prediction) {
        const currentData = marketData[marketData.length - 1];
        const previousData = marketData[marketData.length - 2];
        
        // Update current price
        document.getElementById('currentPrice').textContent = `$${currentData.close.toFixed(2)}`;
        
        // Update price change
        if (previousData) {
            const change = currentData.close - previousData.close;
            const changePercent = (change / previousData.close) * 100;
            
            const changeElement = document.getElementById('priceChange');
            const changeAmount = document.querySelector('.change-amount');
            const changePercentElement = document.querySelector('.change-percent');
            
            changeAmount.textContent = `${change >= 0 ? '+' : ''}$${change.toFixed(2)}`;
            changePercentElement.textContent = `(${change >= 0 ? '+' : ''}${changePercent.toFixed(2)}%)`;
            
            changeElement.className = `price-change ${change >= 0 ? 'positive' : 'negative'}`;
        }
        
        // Update timestamp (CURRENT LOCAL TIME - not API time)
        const currentLocalTime = new Date();
        const timeOptions = { 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone // Use local timezone
        };
        document.getElementById('lastUpdate').textContent = 
            `Last update: ${currentLocalTime.toLocaleTimeString(navigator.language, timeOptions)}`;
        
        // Update prediction
        document.getElementById('predictedPrice').textContent = `$${prediction.value.toFixed(2)}`;
        document.getElementById('confidence').textContent = `Confidence: ${prediction.confidence.toFixed(1)}%`;
        
        // Update prediction target time
        const predictionTargetTime = new Date(currentLocalTime.getTime() + (this.predictionSteps * 60000));
        const targetTimeOptions = { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true,
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        };
        document.getElementById('predictionTime').textContent = 
            `Target time: ${predictionTargetTime.toLocaleTimeString(navigator.language, targetTimeOptions)}`;
        
        // Store this prediction for persistent chart display
        this.allPredictions.push({
            targetTime: predictionTargetTime,
            predictedPrice: prediction.value,
            madeAt: currentLocalTime,
            confidence: prediction.confidence,
            minutesAhead: this.predictionSteps // Store how many minutes ahead this was
        });
        
        console.log(`💾 Stored prediction: $${prediction.value.toFixed(2)} for ${predictionTargetTime.toLocaleTimeString()} (${this.predictionSteps} min ahead)`);
        
        // Clean up old predictions more aggressively - only keep predictions that are still relevant
        const tenMinutesAgo = new Date(currentLocalTime.getTime() - (10 * 60 * 1000));
        const fiveMinutesFromNow = new Date(currentLocalTime.getTime() + (5 * 60 * 1000));
        
        // Only keep predictions that:
        // 1. Were made recently (within last 10 minutes) OR
        // 2. Have target times in the future (within next 5 minutes)
        this.allPredictions = this.allPredictions.filter(pred => {
            const isRecentlyMade = pred.madeAt > tenMinutesAgo;
            const isFutureTarget = pred.targetTime > currentLocalTime && pred.targetTime <= fiveMinutesFromNow;
            const shouldKeep = isRecentlyMade && isFutureTarget;
            
            if (!shouldKeep) {
                console.log(`Removing old prediction: made at ${pred.madeAt.toLocaleTimeString()}, target ${pred.targetTime.toLocaleTimeString()}`);
            }
            
            return shouldKeep;
        });
        
        // Also limit to max 20 predictions to avoid clutter
        if (this.allPredictions.length > 20) {
            this.allPredictions = this.allPredictions.slice(-20);
        }
        
        // Update prediction direction
        const direction = prediction.value > currentData.close ? 'up' : 'down';
        const directionText = prediction.value > currentData.close ? 'Bullish' : 'Bearish';
        const directionArrow = prediction.value > currentData.close ? '↗' : '↘';
        
        document.getElementById('directionArrow').textContent = directionArrow;
        document.getElementById('directionText').textContent = directionText;
        document.getElementById('predictionDirection').className = `prediction-direction ${direction}`;
        
        // Update market info
        document.getElementById('volume').textContent = currentData.volume.toLocaleString();
        document.getElementById('dayHigh').textContent = `$${Math.max(...marketData.map(d => d.high)).toFixed(2)}`;
        document.getElementById('dayLow').textContent = `$${Math.min(...marketData.map(d => d.low)).toFixed(2)}`;
        document.getElementById('openPrice').textContent = `$${marketData[0].open.toFixed(2)}`;
        
        // Track prediction for accuracy calculation
        this.trackPredictionAccuracy(prediction);
    }
    
    trackPredictionAccuracy(prediction) {
        const currentTime = new Date();
        const predictedTime = new Date(currentTime.getTime() + (this.predictionSteps * 60000)); // 5 minutes ahead
        
        // Store prediction for future accuracy tracking
        this.predictionTracker.push({
            predictedTime: predictedTime,
            predictedPrice: prediction.value,
            actualPrice: null, // Will be filled when actual data arrives
            accuracy: null,
            timestamp: currentTime
        });
        
        // Clean up old predictions (older than 1 hour)
        const oneHourAgo = new Date(currentTime.getTime() - 3600000);
        this.predictionTracker = this.predictionTracker.filter(p => p.timestamp > oneHourAgo);
        
        // Check if we have actual data for any previous predictions
        this.updatePredictionAccuracy(currentTime);
    }
    
    updatePredictionAccuracy(currentTime) {
        let accuracySum = 0;
        let accurateCount = 0;
        
        this.predictionTracker.forEach(track => {
            // If we've reached the predicted time, calculate accuracy
            if (currentTime >= track.predictedTime && track.actualPrice === null && this.marketData.length > 0) {
                // Find the closest actual price to the predicted time
                const actualPrice = this.marketData[this.marketData.length - 1].close;
                track.actualPrice = actualPrice;
                
                // Calculate accuracy (percentage error)
                const error = Math.abs(track.predictedPrice - actualPrice);
                const accuracy = Math.max(0, 100 - (error / actualPrice * 100));
                track.accuracy = accuracy;
                
                console.log(`Prediction vs Actual: $${track.predictedPrice.toFixed(2)} vs $${actualPrice.toFixed(2)} (${accuracy.toFixed(1)}% accurate)`);
            }
            
            if (track.accuracy !== null) {
                accuracySum += track.accuracy;
                accurateCount++;
            }
        });
        
        // Update overall accuracy
        if (accurateCount > 0) {
            this.predictionAccuracy = accuracySum / accurateCount;
            document.getElementById('predictionAccuracy').textContent = `${this.predictionAccuracy.toFixed(1)}%`;
            console.log(`Overall Prediction Accuracy: ${this.predictionAccuracy.toFixed(1)}%`);
        }
    }
    
    updateStatistics() {
        // Calculate prediction accuracy (simplified)
        if (this.predictions.length > 1) {
            let correctPredictions = 0;
            for (let i = 1; i < this.predictions.length; i++) {
                const prevPrediction = this.predictions[i - 1];
                const currentPrice = this.priceHistory[i];
                const prevPrice = this.priceHistory[i - 1];
                
                const predictedDirection = prevPrediction.value > prevPrice;
                const actualDirection = currentPrice > prevPrice;
                
                if (predictedDirection === actualDirection) {
                    correctPredictions++;
                }
            }
            this.predictionAccuracy = (correctPredictions / (this.predictions.length - 1)) * 100;
        }
        
        // Calculate average error
        if (this.predictions.length > 0) {
            const errors = this.predictions.map((pred, i) => {
                if (i < this.priceHistory.length) {
                    return Math.abs(pred.value - this.priceHistory[i]);
                }
                return 0;
            }).filter(e => e > 0);
            
            if (errors.length > 0) {
                this.averageError = errors.reduce((sum, e) => sum + e, 0) / errors.length;
            }
        }
        
        // Update UI
        document.getElementById('predictionAccuracy').textContent = `${this.predictionAccuracy.toFixed(1)}%`;
        document.getElementById('updateCount').textContent = this.updateCount.toString();
        document.getElementById('responseTime').textContent = `${this.lastResponseTime}ms`;
        document.getElementById('avgError').textContent = `$${this.averageError.toFixed(2)}`;
    }
    
    initializeChart() {
        const ctx = document.getElementById('realtimeChart').getContext('2d');
        
        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: `${this.symbol} Price (Current)`,
                        data: [],
                        borderColor: 'rgb(59, 130, 246)',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        tension: 0.1,
                        pointRadius: 4,
                        pointHoverRadius: 6,
                        fill: false
                    },
                    {
                        label: 'High/Low Range',
                        data: [],
                        type: 'line',
                        borderColor: 'rgba(156, 163, 175, 0.5)',
                        backgroundColor: 'rgba(156, 163, 175, 0.1)',
                        tension: 0,
                        pointRadius: 0,
                        fill: '+1'
                    },
                    {
                        label: 'Low Range',
                        data: [],
                        type: 'line',
                        borderColor: 'rgba(156, 163, 175, 0.5)',
                        backgroundColor: 'rgba(156, 163, 175, 0.1)',
                        tension: 0,
                        pointRadius: 0,
                        fill: false
                    },
                    {
                        label: 'LSTM Predictions (All)',
                        data: [],
                        borderColor: 'rgb(239, 68, 68)',
                        backgroundColor: 'rgba(239, 68, 68, 0.9)',
                        tension: 0,
                        pointRadius: 6,
                        pointHoverRadius: 8,
                        borderDash: [5, 5],
                        fill: false,
                        spanGaps: false, // Don't connect across null values - show individual points
                        showLine: false  // Show only points, not connecting lines
                    },
                    {
                        label: 'All Predictions',
                        data: [],
                        type: 'scatter',
                        borderColor: 'rgb(255, 99, 132)',
                        backgroundColor: 'rgba(255, 99, 132, 0.8)',
                        pointRadius: 4,
                        pointHoverRadius: 6,
                        showLine: false
                    },
                    {
                        label: 'Prediction vs Actual',
                        data: [],
                        type: 'scatter',
                        borderColor: 'rgb(147, 51, 234)',
                        backgroundColor: 'rgba(147, 51, 234, 0.8)',
                        pointRadius: 8,
                        pointHoverRadius: 10,
                        showLine: false
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        grid: {
                            color: 'rgba(75, 85, 99, 0.1)'
                        },
                        ticks: {
                            color: 'rgb(156, 163, 175)',
                            maxTicksLimit: 10
                        }
                    },
                    y: {
                        grid: {
                            color: 'rgba(75, 85, 99, 0.1)'
                        },
                        ticks: {
                            color: 'rgb(156, 163, 175)',
                            callback: function(value) {
                                return '$' + value.toFixed(2);
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        labels: {
                            color: 'rgb(156, 163, 175)'
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(17, 24, 39, 0.9)',
                        titleColor: 'rgb(243, 244, 246)',
                        bodyColor: 'rgb(156, 163, 175)',
                        borderColor: 'rgba(75, 85, 99, 0.2)',
                        borderWidth: 1,
                        callbacks: {
                            afterBody: function(context) {
                                // Add extra info for prediction points
                                const datasetIndex = context[0].datasetIndex;
                                const dataIndex = context[0].dataIndex;
                                
                                if (datasetIndex === 4) { // All Predictions scatter
                                    const data = context[0].raw;
                                    if (data && typeof data === 'object') {
                                        return [
                                            `Target: ${data.targetTime}`,
                                            `Made at: ${data.madeAt}`,
                                            `Confidence: ${data.confidence?.toFixed(1)}%`,
                                            data.isPast ? 'Past prediction' : 'Future prediction'
                                        ];
                                    }
                                }
                                return [];
                            }
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });
    }
    
    updateChart(marketData, prediction) {
        if (!this.chart) return;
        
        // Get recent data for chart (last 30 candles for better context)
        const recentData = marketData.slice(-30);
        const currentData = marketData[marketData.length - 1];
        
        // Create labels using current local time and working backwards
        const currentTime = new Date();
        const labels = [];
        for (let i = recentData.length - 1; i >= 0; i--) {
            // Calculate time for each candle based on current time minus intervals
            const candleTime = new Date(currentTime.getTime() - (i * 60000)); // 1 minute intervals
            const timeOptions = { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: false,
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
            };
            labels.push(candleTime.toLocaleTimeString(navigator.language, timeOptions));
        }
        
        // Add future prediction labels (up to 5 minutes ahead from current time)
        for (let i = 1; i <= this.predictionSteps; i++) {
            const futureTime = new Date(currentTime.getTime() + (i * 60000));
            const futureLabel = futureTime.toLocaleTimeString(navigator.language, { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: false,
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
            });
            labels.push(futureLabel);
        }
        
        // Prepare datasets
        const closeData = recentData.map(d => d.close);
        const highData = recentData.map(d => d.high);
        const lowData = recentData.map(d => d.low);
        
        // Add null values for future time slots (5 minutes ahead)
        for (let i = 0; i < this.predictionSteps; i++) {
            closeData.push(null); // No actual data yet
            highData.push(null);
            lowData.push(null);
        }
        
        // Prediction dataset - show ALL stored predictions that are still relevant
        const predictionData = new Array(recentData.length + this.predictionSteps).fill(null);
        
        // Fill prediction data with ALL stored predictions
        const chartStartTime = new Date(currentTime.getTime() - (29 * 60000)); // 29 minutes ago (to match 25 candles)
        const chartEndTime = new Date(currentTime.getTime() + (this.predictionSteps * 60000)); // 5 minutes ahead
        
        console.log(`Chart time range: ${chartStartTime.toLocaleTimeString()} to ${chartEndTime.toLocaleTimeString()}`);
        
        // Process all stored predictions and place them in the correct positions
        this.allPredictions.forEach(pred => {
            const predTargetTime = pred.targetTime;
            
            console.log(`🔍 Processing prediction: $${pred.predictedPrice.toFixed(2)} for ${predTargetTime.toLocaleTimeString()}`);
            
            // Show predictions that fall within our chart time range and are in the future
            if (predTargetTime >= chartStartTime && predTargetTime <= chartEndTime && predTargetTime > currentTime) {
                // Calculate which position this should be at
                const minutesFromStart = Math.round((predTargetTime.getTime() - chartStartTime.getTime()) / 60000);
                const chartIndex = Math.min(Math.max(0, minutesFromStart), predictionData.length - 1);
                
                // Only place predictions in the future part of the chart (after historical data)
                if (chartIndex >= recentData.length) {
                    console.log(`   Placing prediction at chart position ${chartIndex} (${labels[chartIndex]})`);
                    predictionData[chartIndex] = pred.predictedPrice;
                } else {
                    console.log(`   ⏰ Skipping prediction - would appear in historical range (position ${chartIndex})`);
                }
            } else {
                console.log(`   Prediction outside chart range or in the past`);
            }
        });
        
        // Add the current prediction at the correct future time slot (5 minutes ahead)
        predictionData[recentData.length + this.predictionSteps - 1] = prediction.value;
        
        // COMPLETELY CLEAR AND REBUILD prediction scatter plot - ZERO TOLERANCE FOR HISTORICAL PREDICTIONS
        const allPredictionsData = [];
        
        console.log(`🧹 CLEARING ALL PREDICTIONS - Starting fresh`);
        console.log(`📏 Chart boundaries: historical data ends at index ${recentData.length - 1}, future starts at ${recentData.length}`);
        
        // ONLY add the current prediction at the very end (5 minutes ahead)
        const currentPredictionIndex = recentData.length + this.predictionSteps - 1;
        console.log(`Adding ONLY current prediction at position ${currentPredictionIndex} (should be >= ${recentData.length})`);
        
        if (currentPredictionIndex >= recentData.length) {
            allPredictionsData.push({
                x: currentPredictionIndex,
                y: prediction.value,
                isPast: false,
                confidence: prediction.confidence,
                targetTime: labels[currentPredictionIndex],
                madeAt: currentTime.toLocaleTimeString()
            });
            console.log(`Added current prediction at position ${currentPredictionIndex}: $${prediction.value.toFixed(2)}`);
        } else {
            console.log(`ERROR: Current prediction position ${currentPredictionIndex} is not in future zone!`);
        }
        
        // DO NOT ADD ANY STORED PREDICTIONS FOR NOW - COMPLETELY DISABLE THEM
        console.log(`DISABLED: Not adding any stored predictions to eliminate left-side dots`);
        
        // FINAL VERIFICATION: Ensure NO predictions are in historical positions
        const filteredPredictions = allPredictionsData.filter(pred => {
            const isInFutureZone = pred.x >= recentData.length;
            if (!isInFutureZone) {
                console.log(`EMERGENCY REMOVAL: prediction at historical position ${pred.x}!`);
            }
            return isInFutureZone;
        });
        
        console.log(`FINAL RESULT: ${filteredPredictions.length} predictions (ALL should be in future zone)`);
        filteredPredictions.forEach(pred => {
            console.log(`   Position ${pred.x}: $${pred.y.toFixed(2)} (${pred.x >= recentData.length ? 'FUTURE' : 'HISTORICAL - ERROR!'})`);
        });
        
        console.log(`Chart Update: Showing ${this.allPredictions.length} stored predictions`);
        console.log(`🔴 Prediction data array:`, predictionData);
        console.log(`🔴 Non-null prediction points:`, predictionData.filter(p => p !== null).length);
        console.log(`🔴 All stored predictions:`, this.allPredictions.map(p => ({
            price: p.predictedPrice.toFixed(2),
            targetTime: p.targetTime.toLocaleTimeString(),
            madeAt: p.madeAt.toLocaleTimeString()
        })));
        
        // Actual vs Predicted comparison points
        const comparisonData = [];
        this.predictionTracker.forEach(track => {
            if (track.actualPrice !== null) {
                // Find the index in our current data that matches the prediction time
                const matchIndex = recentData.findIndex(d => 
                    Math.abs(d.timestamp.getTime() - track.predictedTime.getTime()) < 60000 // Within 1 minute
                );
                if (matchIndex >= 0) {
                    comparisonData[matchIndex] = {
                        x: matchIndex,
                        y: track.actualPrice,
                        predicted: track.predictedPrice,
                        accuracy: track.accuracy
                    };
                }
            }
        });
        
        // COMPLETELY CLEAR ALL CHART DATA FIRST
        console.log(`🧹 CLEARING ALL CHART DATA before update`);
        this.chart.data.datasets[4].data = []; // Clear pink dots dataset completely
        
        // Update chart data
        this.chart.data.labels = labels;
        this.chart.data.datasets[0].data = closeData; // Current price line
        this.chart.data.datasets[1].data = highData; // High range
        this.chart.data.datasets[2].data = lowData;  // Low range
        this.chart.data.datasets[3].data = predictionData; // Current prediction
        this.chart.data.datasets[4].data = filteredPredictions; // All predictions as scatter points (FILTERED)
        this.chart.data.datasets[5].data = comparisonData.filter(d => d); // Actual vs predicted points
        
        console.log(`CHART DATA SET: Dataset 4 (pink dots) now has ${this.chart.data.datasets[4].data.length} points`);
        this.chart.data.datasets[4].data.forEach((point, idx) => {
            console.log(`   Pink dot ${idx}: position ${point.x}, price $${point.y.toFixed(2)}`);
        });
        
        // Force complete chart refresh to eliminate any cached data
        this.chart.update('none'); // No animation to ensure immediate update
        
        // Double check after update
        console.log(`🔍 POST-UPDATE CHECK: Dataset 4 has ${this.chart.data.datasets[4].data.length} points`);
        if (this.chart.data.datasets[4].data.length > 0) {
            this.chart.data.datasets[4].data.forEach((point, idx) => {
                const isHistorical = point.x < recentData.length;
                console.log(`   ${isHistorical ? 'HISTORICAL' : 'FUTURE'} dot ${idx}: position ${point.x}, price $${point.y.toFixed(2)}`);
            });
        }
        
        console.log(`Chart updated with ${recentData.length} candles + ${this.predictionSteps} future slots`);
        console.log(`Prediction for ${labels[recentData.length + this.predictionSteps - 1]}: $${prediction.value.toFixed(2)}`);
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('Real-Time Predictor starting...');
    window.realtimePredictor = new RealtimePredictor();
});