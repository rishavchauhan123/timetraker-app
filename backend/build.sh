#!/usr/bin/env bash
set -o errexit

pip install --upgrade pip
pip install --upgrade certifi
pip install -r requirements.txt
