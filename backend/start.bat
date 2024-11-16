@echo off
call venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn main:app --reload 