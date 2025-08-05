#!/usr/bin/env python3
"""
Simple startup script for the Stock Prediction Web App
"""

import webbrowser
import http.server
import socketserver
import os
import sys
import time
from pathlib import Path

def check_files():
    """Check if all required files exist"""
    required_files = [
        'tfjs_model/model/',  # SavedModel directory
        'tfjs_model/scaler_info.json',
        'web_app/index.html',
        'web_app/app.js',
        'web_app/styles.css',
        'web_app/sample_data.json'
    ]
    
    missing_files = []
    for file_path in required_files:
        if not os.path.exists(file_path):
            missing_files.append(file_path)
    
    if missing_files:
        print("❌ Missing required files:")
        for file_path in missing_files:
            print(f"   - {file_path}")
        print("\nPlease run 'python convert_to_tfjs_real.py' first to create the TensorFlow.js model.")
        return False
    
    print("✅ All required files found!")
    return True

def start_server():
    """Start the HTTP server"""
    PORT = 8000
    
    # Change to the project directory
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    # Create a simple HTTP server
    Handler = http.server.SimpleHTTPRequestHandler
    
    try:
        with socketserver.TCPServer(("", PORT), Handler) as httpd:
            print(f"🚀 Starting web server on http://localhost:{PORT}")
            print("📱 Open your browser and navigate to:")
            print(f"   http://localhost:{PORT}/web_app/")
            print("\n⏹️  Press Ctrl+C to stop the server")
            print("=" * 50)
            
            # Open browser automatically
            webbrowser.open(f'http://localhost:{PORT}/web_app/')
            
            # Start serving
            httpd.serve_forever()
            
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
    except OSError as e:
        if e.errno == 48 or "10048" in str(e):  # Address already in use (Linux/Windows)
            print(f"✅ Web server is already running on port {PORT}!")
            print("📱 Open your browser and navigate to:")
            print(f"   http://localhost:{PORT}/web_app/")
            print("\n⚠️  If you need to stop the server, press Ctrl+C in the terminal where it's running.")
        else:
            print(f"❌ Error starting server: {e}")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")

def main():
    print("🤖 AI Stock Price Predictor - Web App")
    print("=" * 50)
    
    # Check if required files exist
    if not check_files():
        sys.exit(1)
    
    print("\n🌐 Starting web application...")
    start_server()

if __name__ == "__main__":
    main() 