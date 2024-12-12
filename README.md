# Paperverse

## SVG Converter for Post-It Note Drawings
> sngConverter.js

This JavaScript script processes an image of a Post-It note, adjusts its appearance, and converts it to an SVG file. It uses the `sharp` library for image processing and the `potrace` library for SVG conversion.

---

### Features
- Preprocesses an image by enhancing brightness, contrast, and desaturation.
- Converts the processed image to an SVG using Potrace.
- Outputs the processed image and SVG file to specified directories.

---

### Requirements

#### Node.js and NPM
- Ensure Node.js and NPM are installed on your system.
- Install them from [Node.js official site](https://nodejs.org/).

#### Install Dependencies
Run the following command to install the required libraries:
```bash
npm install sharp potrace fs
```

---

### How to Use

#### 1. Setup
- Place your input image in the `input` folder and name it `detected_postit.png` (or modify the script to use your desired filename).
- Create an `output` folder to store the processed image and SVG.

#### 2. Run the Script
Run the script using the following command:
```bash
node svgConverter.js
```

#### 3. Outputs
- **Processed Image:** Saved as `processedtest0.png` in the `output` folder.
- **SVG File:** Saved as `outputtest0.svg` in the `output` folder.

---

### Script Workflow

1. **Preprocessing the Image:**
   - Converts the image to greyscale.
   - Enhances brightness, maximizes contrast, and removes color saturation.
   - Saves the processed image to the output directory.

2. **SVG Conversion:**
   - Uses the Potrace library to trace the processed image and generate an SVG.
   - Saves the SVG to the output directory.

---

### Customization

#### Input and Output Paths
Update these variables to use different filenames or directories:
```javascript
const inputImage = 'input/detected_postit.png';
const processedImage = 'output/processedtest0.png';
const outputSvg = 'output/outputtest0.svg';
```

#### Image Processing Settings
Modify the preprocessing parameters in the `sharp` pipeline:
```javascript
sharp(inputImage)
    .greyscale()  // Converts image to greyscale
    .modulate({ brightness: 1.7 })  // Adjust brightness (e.g., 1.7 = increase by 70%)
    .normalise();  // Maximizes contrast
```

#### SVG Conversion Settings
Customize the Potrace settings:
```javascript
const trace = new Potrace({ ...options });
```
Refer to the Potrace library documentation for available options.

---

### Troubleshooting

1. **Input Image Not Found:**
   - Ensure the input image exists in the specified directory and matches the filename.

2. **Output Not Generated:**
   - Check for errors during the script execution.
   - Ensure the output directory exists and the script has write permissions.

3. **SVG Conversion Fails:**
   - Verify the processed image is correctly generated.
   - Adjust the preprocessing parameters to improve image clarity.

---

### License
This project is open-source and can be freely modified and distributed.

---

### Additional Notes
- **Dependencies:** Ensure you have the correct versions of `sharp` and `potrace` installed for compatibility with your Node.js version.
- **Image Quality:** High-contrast and clear images produce better SVG results.







### Post-It Note Drawing Detection and Cropping
> postitDetection.py

This Python script detects drawing activity on a Post-It note using a webcam and captures an image of the note after a slight delay. The program is designed to identify changes in the drawn area and save the cropped Post-It note as an image.

#### Features

Detects yellow Post-It notes in the webcam feed.

Monitors for drawing activity on the detected Post-It note.

Captures and crops the Post-It note region after detecting persistent drawing changes.

Introduces a short delay to allow users to finish their drawing before capturing.

#### Requirements

Python 3.6 or later

OpenCV library

NumPy library

##### Install Dependencies

To install the required libraries, run:

pip install opencv-python numpy

#### How to Use

##### 1. Setup

Ensure your webcam is connected and working properly. Place a yellow Post-It note within the webcam’s view. Adjust lighting conditions for better detection of the note.

##### 2. Run the Script

Run the script using the following command:

python postitDetection.py

##### 3. Operating Instructions

###### Starting the Script:

The webcam feed will open in a new window titled "Webcam."

Ensure a yellow Post-It note is visible in the webcam feed. A green rectangle will appear around the detected Post-It note.

###### Drawing Detection:

Begin drawing on the Post-It note. The program detects changes in the note's content.

If drawing activity is detected, the program waits for a short delay (default is 2 seconds) to allow you to finish your drawing.

###### Image Capture:

After the delay, the program captures and saves the image of the Post-It note as detected_postit.png in the current working directory.

###### Exiting the Program:

To exit at any time, press the q key in the webcam feed window.

#### Notes

Post-It Note Color: This script is optimized for yellow Post-It notes. To use other colors, adjust the HSV color range in the detect_postit_and_draw function.

Drawing Sensitivity: The script uses pixel changes to detect drawing activity. You can adjust the sensitivity by modifying the detect_drawing function's pixel threshold.

Capture Delay: The default delay before capturing is 2 seconds. You can adjust this value by changing the capture_delay variable in the main() function.

#### Troubleshooting

Post-It Note Not Detected:

Ensure the note is well-lit and the webcam can see it clearly.

Adjust the HSV range in the script to better match the color of your Post-It note.

Drawing Not Detected:

Ensure the drawing is visible and the webcam can clearly capture the changes.

Adjust the non_zero_pixels threshold in the detect_drawing function to make the detection more or less sensitive.

No Image Saved:

Ensure the drawing activity is persistent (detected over several frames) to trigger the capture.

Check if the script has permission to write to the current working directory.

#### Customization

##### Change Post-It Note Color:
Modify the lower_yellow and upper_yellow HSV values in the detect_postit_and_draw function to detect different colors.

##### Adjust Drawing Sensitivity:
Update the non_zero_pixels threshold in the detect_drawing function to fine-tune how much change is required to detect drawing.

##### Delay Before Capture:
Change the capture_delay variable in the main() function to adjust the time before the image is captured.

