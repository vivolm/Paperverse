# Post-It Note Detection and SVG Conversion

This project combines two programs to enable real-time detection of a Post-It note, automatic image cropping, and conversion of the cropped image into an SVG file. The system operates smoothly without requiring restarts, allowing multiple drawings to be processed in one session.

The project consists of:
1. **Python Program**: Detects a Post-It note, monitors for drawing activity, and saves the image when the drawing is complete.
2. **JavaScript Program**: Automatically converts the saved Post-It image into an SVG file.

---

## **Python Program: Post-It Note Detection**

### **Description**
The Python program detects a yellow Post-It note in a webcam feed. It checks for drawing activity on the note and saves a cropped image of the Post-It when drawing stops. The image is stored in a shared directory and a notification file is created to trigger the SVG conversion program.

### **Requirements**
Make sure the following libraries are installed:
```bash
pip install opencv-python numpy
```

### **How to Run**
1. Ensure your webcam is connected.
2. Place a yellow Post-It note in the camera's view.
3. Run the Python script:
   ```bash
   python postitDetection.py
   ```
4. Start drawing on the Post-It. The program will automatically detect when you stop drawing and save the image.
5. Press `c` to reset and allow for new drawings without restarting the program.
6. Press `q` to quit the program.

### **Key Features**
- **Post-It Detection**: Automatically detects a yellow Post-It note and aligns it even if tilted.
- **Drawing Detection**: Monitors drawing activity and saves the image only when movement stops.
- **Shared Directory**: Saves the cropped image into a shared folder (`shared/`).
- **Notification File**: Creates a text file `shared/ready_for_svg.txt` with the path of the new image for the SVG conversion program.

### **File Structure**
```
project_root/
├── shared/                    # Shared directory for images and notification files
│   ├── detected_postit.png    # Cropped Post-It image
│   └── ready_for_svg.txt      # Notification file for SVG conversion
├── postit_detection.py        # Python program (Post-It detection)
└── svg_converter.js           # JavaScript program (SVG conversion)
```

---

## **JavaScript Program: SVG Conversion**

### **Description**
The JavaScript program watches the shared directory for new Post-It images. When a new image is detected, it processes the image to enhance its contrast and brightness, then converts it into an SVG file.

### **Requirements**
Make sure the following libraries are installed:
```bash
npm install sharp potrace fs
```

### **How to Run**
1. Ensure Node.js is installed on your system.
2. Run the JavaScript script:
   ```bash
   node svgConverter.js
   ```
3. The program will monitor the shared directory. When a new `detected_postit.png` appears, it will process the image and create an SVG.

### **Key Features**
- **Automatic Detection**: Watches for new images in the shared folder.
- **Image Preprocessing**: Enhances the image contrast, brightness, and removes saturation.
- **SVG Conversion**: Converts the processed image into an SVG file using Potrace.
- **File Management**: Saves the resulting SVG in the `shared/` directory.

### **How It Works**
1. The Python script detects a Post-It note and saves the image to `shared/detected_postit.png`.
2. It also creates `shared/ready_for_svg.txt` as a notification for the JavaScript program.
3. The JavaScript script reads the notification file, processes the image, and converts it into `shared/output.svg`.

### **File Structure**
```

Paperverse/
├── output/ 
│   ├── output.svg                # Generated SVG file
├── svgConverter/ 
   ├── shared/                    # Shared directory for images and SVGs
   │   ├── detected_postit.png    # Input image (saved by Python script)
   │   ├── ready_for_svg.txt      # Notification file
   ├── postit_detection.py        # Python program (Post-It detection)
   └── svg_converter.js           # JavaScript program (SVG conversion)
```

---

## **Workflow**
The two programs work together as follows:
1. **Python Program**:
   - Detects a Post-It note.
   - Monitors for drawing activity.
   - Saves the cropped image and creates a notification file.
2. **JavaScript Program**:
   - Reads the notification file.
   - Converts the new image into an SVG.
3. The workflow allows multiple images to be processed in a single session.

---

## **Run Both Programs**
1. Start the Python program:
   ```bash
   python postit_detection.py
   ```
2. In a separate terminal, start the JavaScript program:
   ```bash
   node svg_converter.js
   ```
3. Begin drawing on the Post-It note. When you finish drawing, the SVG file will be generated automatically in the shared folder.

---

## **Troubleshooting**
- **Post-It Not Detected**: Adjust the HSV color range in `postit_detection.py` to better match your Post-It note.
- **Low Image Resolution**: Ensure your webcam supports higher resolutions.
- **SVG Not Generated**: Check that the notification file and `detected_postit.png` are being saved to the shared directory.

---

## **Conclusion**
This project integrates Python and JavaScript programs to create a seamless system for detecting a Post-It note, tracking drawings, and converting them into SVG files. It allows for continuous use without restarting the programs, making it efficient and user-friendly.


