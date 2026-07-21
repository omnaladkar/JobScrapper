#!/bin/bash
python -m playwright install chromium --with-deps 2>/dev/null
python run_daily.py
