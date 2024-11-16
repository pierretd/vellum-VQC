#!/bin/bash
# Activate virtual environment
source venv/bin/activate

# Install/update dependencies
pip install -r requirements.txt

# Start the server
python3.10 -m uvicorn main:app --reload 