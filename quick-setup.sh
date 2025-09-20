#!/bin/bash
# Quick setup script for Akkasah Archive
# Run this for a fast setup without detailed output

echo "🏛️  Akkasah Archive - Quick Setup"
echo "================================="

# Check if we're on macOS/Linux or Windows
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    echo "Windows detected. Please run setup.bat or setup.ps1 instead."
    exit 1
fi

# Run the main setup script
chmod +x setup.sh
./setup.sh
