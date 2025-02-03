# Post-It Note Detection and SVG Conversion

This project combines two programs to enable real-time detection of a Post-It note, automatic image cropping, and conversion of the cropped image into an SVG file. The system operates smoothly without requiring restarts, allowing multiple drawings to be processed in one session.

The project consists of:
1. **Websocket Program (Python)**: Handles communication and datat transfer between scripts
2. **Post-it Detection Program (Python)**: Detects a Post-It note, monitors for drawing activity, and saves the image when the drawing is complete.
3. **SVG Conversion Program (JavaScript)**: Automatically converts the saved Post-It image into an SVG file.

---

## WebSocket Server  
The WebSocket server handles communication between the different scripts (Python, Node.js, and the browser). It ensures smooth data transfer, allowing real-time updates between the components.  

### How to Run:  
1. Start the WebSocket server first:  
   ```bash
   python websocket_server.py
   ```  
2. Then, start the other scripts as needed:  
   - **Python Detection Script:** `python postitDetection.py`  
   - **JavaScript SVG Converter:** `node svgConverter.js`  

This ensures that all components can communicate properly.

---

## **Post-it Detection Program**

### **Description**
The Python program detects a yellow Post-It note in a webcam feed. It checks for drawing activity on the note and saves a cropped image of the Post-It when drawing stops. The image is stored in a shared directory and a notification file is created to trigger the SVG conversion program.

### **Requirements**
Make sure the following libraries are installed:
```bash
pip install opencv-python numpy
```

### **How to Run**
1. Ensure your webcam is connected and the projection is in frame (Note: There should be a clear visual distinction from the projection area to the rest of the captured area).
2. Run the Python script:
   ```bash
   python postitDetection.py
   ```
3. Start drawing on the Post-It (with a red marker). The program will automatically detect it as soon as you place it in the projection area and save the image.
4. Press `c` to reset and allow for new drawings without restarting the program.
5. Press `q` to quit the program.

### **Key Features**
- **Post-It Detection**: Automatically detects a yellow Post-It note and aligns it even if tilted.
- **Drawing Detection**: Monitors activity and saves the image when a postit is detected.
- **Shared Directory**: Saves the cropped image into a shared folder (`shared/`).
- **Notification File**: Creates a text file `shared/ready_for_svg.txt` with the path of the new image for the SVG conversion program.

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

## **JavaScript Program: SVG Conversion**

### **Description**
The JavaScript program watches the shared directory for new Post-It images. When a new image is detected, it processes the image to extract only the red parts of the image (the drawing), then converts it into an SVG file.

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
- **Image Preprocessing**: Extracts Red parts of Image, isolating only the drawing.
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
1. Start the Websocket Server
   ```bash
   python websocket_server.py
   ```
3. Start the Python program:
   ```bash
   python postitDetection.py
   ```
4. In a separate terminal, start the JavaScript program:
   ```bash
   node svgConverter.js
   ```
5. Begin drawing on the Post-It note. When you place the drawing, the SVG file will be generated automatically in the shared folder.

---

## **Troubleshooting**
- **Post-It Not Detected**: Adjust the HSV color range in `postit_detection.py` to better match your Post-It note.
- **Low Image Resolution**: Ensure your webcam supports higher resolutions.
- **SVG Not Generated**: Check that the notification file and `detected_postit.png` are being saved to the shared directory.

---



