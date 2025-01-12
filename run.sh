#!/bin/bash

#RUN THIS SCRIPT WITH: ./run.sh

#Shell Script for easy running of svgConverter and postitDetection without many efforts!

# Navigate to svgConverter directory and run svgConverter.js
cd svgConverter

# Run the Python script
python3 postitDetection.py

node svgConverter.js

#go back
cd ..

#end with Ctrl+C

