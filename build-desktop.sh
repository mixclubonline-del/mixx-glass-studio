#!/bin/bash

# Mixx Club Studio - Tauri Desktop Build Script
# This script builds the complete native desktop application

echo "🎵 Building Mixx Club Studio for Desktop..."
echo "🎵 ==============================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Install dependencies if needed
echo "📦 Installing dependencies..."
npm install

# Build the web assets
echo "🔨 Building web assets..."
npm run build

# Build the Tauri desktop application
echo "🖥️ Building Tauri desktop application..."
npm run tauri:build

echo "🎉 Build complete!"
echo "🎉 Your Mixx Club Studio desktop application is ready!"
echo "🎉 Check the src-tauri/target/release/bundle/ directory for the installer"

# Show the bundle directory contents
if [ -d "src-tauri/target/release/bundle" ]; then
    echo "📁 Bundle contents:"
    ls -la src-tauri/target/release/bundle/
fi

echo "🎵 THE VELVET CURVE IS THE KING - PROTECTED IN NATIVE DESKTOP!"
