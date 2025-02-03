#Responsible for detection of Post-it and capturing Image of drawing
#Notifies svgConverter.js as soon as Postit is detected
#Stores relative position of Post-it in JSON-file

import cv2
import numpy as np
import os
import json



# Define the shared directory and notification file paths
output_directory = "./shared"
notification_file = os.path.join(output_directory, "ready_for_svg.txt")
metadata_file = os.path.join(output_directory, "metadata.json")

# Ensure the shared directory exists
if not os.path.exists(output_directory):
    os.makedirs(output_directory)




def notify_svg_conversion(cropped_file, color, smoothed_position):
    """
    Write a notification to the SVG conversion file indicating a new image is ready.
    """
    with open(notification_file, "w") as f:
        f.write(f"{cropped_file}, {color}")
    print(f"Notification written to {notification_file} - Color: {color}")
    write_position_to_json(smoothed_position[0], smoothed_position[1], color)

def detect_projection_area(frame):
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    edges = cv2.Canny(blurred, 50, 150)
    contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    for contour in contours:
        if cv2.contourArea(contour) > 1000:
            epsilon = 0.02 * cv2.arcLength(contour, True)
            approx = cv2.approxPolyDP(contour, epsilon, True)
            if len(approx) == 4:
                def order_points(pts):
                    rect = np.zeros((4, 2), dtype="float32")
                    s = pts.sum(axis=1)
                    rect[0] = pts[np.argmin(s)]
                    rect[2] = pts[np.argmax(s)]
                    diff = np.diff(pts, axis=1)
                    rect[1] = pts[np.argmin(diff)]
                    rect[3] = pts[np.argmax(diff)]
                    return rect
                return order_points(approx.reshape(4, 2))
    return None

def detect_postit_and_draw(frame, projection_area=None):
    hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)

    # Define HSV ranges for yellow and blue Post-its
    lower_yellow = np.array([20, 30, 60])
    upper_yellow = np.array([80, 255, 255])

    lower_blue = np.array([90, 50, 50])
    upper_blue = np.array([130, 255, 255])

    # Create masks for both colors
    mask_yellow = cv2.inRange(hsv, lower_yellow, upper_yellow)
    mask_blue = cv2.inRange(hsv, lower_blue, upper_blue)
   
    # Process both masks separately
    detected_color = None

    # If a projection area is provided, mask everything outside of it
    if projection_area is not None:
        mask_shape = frame.shape[:2]
        projection_mask = np.zeros(mask_shape, dtype=np.uint8)
        cv2.fillPoly(projection_mask, [projection_area.astype(int)], 255)
        mask_yellow = cv2.bitwise_and(mask_yellow, projection_mask)
        mask_blue = cv2.bitwise_and(mask_blue, projection_mask)

    for mask, color in zip([mask_yellow, mask_blue], ["yellow", "blue"]):
        contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        for contour in contours:
            if cv2.contourArea(contour) > 1000:
                epsilon = 0.02 * cv2.arcLength(contour, True)
                approx = cv2.approxPolyDP(contour, epsilon, True)
                if len(approx) == 4:
                    pts = np.array([point[0] for point in approx], dtype='float32')

                    def order_points(pts):
                        rect = np.zeros((4, 2), dtype='float32')
                        s = pts.sum(axis=1)
                        rect[0] = pts[np.argmin(s)]
                        rect[2] = pts[np.argmax(s)]
                        diff = np.diff(pts, axis=1)
                        rect[1] = pts[np.argmin(diff)]
                        rect[3] = pts[np.argmax(diff)]
                        return rect

                    rect = order_points(pts)
                    width, height = 200, 200
                    dst = np.array([
                        [0, 0],
                        [width - 1, 0],
                        [width - 1, height - 1],
                        [0, height - 1]
                    ], dtype='float32')
                    M = cv2.getPerspectiveTransform(rect, dst)
                    warped = cv2.warpPerspective(frame, M, (width, height))
                    cv2.polylines(frame, [approx], True, (0, 255, 0), 2)
                    detected_color = color
                    detect_postit_and_draw.last_contour = approx
                    return warped, detected_color
    return None, None

def enhance_contrast(image):
    """
    Enhance the contrast of the input image using CLAHE.
    """
    # Convert the image to LAB color space
    lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
    
    # Split the LAB image into L, A, and B channels
    l, a, b = cv2.split(lab)
    
    # Apply CLAHE to the L (lightness) channel
    clahe = cv2.createCLAHE(clipLimit=1.0, tileGridSize=(8, 8))
    l = clahe.apply(l)
    
    # Merge the enhanced L channel back with A and B channels
    enhanced_lab = cv2.merge((l, a, b))
    
    # Convert the LAB image back to BGR color space
    enhanced_image = cv2.cvtColor(enhanced_lab, cv2.COLOR_LAB2BGR)
    
    return enhanced_image

def get_relative_position(postit_rect, projection_rect):
    width, height = 1.0, 1.0
    M = cv2.getPerspectiveTransform(projection_rect, np.array([
        [0, 0],
        [width, 0],
        [width, height],
        [0, height]
    ], dtype='float32'))
    postit_center = np.mean(postit_rect, axis=0).reshape(-1, 1, 2)
    normalized_center = cv2.perspectiveTransform(postit_center, M)
    return tuple(normalized_center[0][0])


def write_position_to_json(x, y, color, filename="position_color.json"):
    
    xpos = float(x)
    ypos = float(y)

    # Create a dictionary with the data
    data = {
        "position": {
            "x": xpos,
            "y": ypos
        },
        "color": color
    }
    
    file_path = os.path.join(output_directory, filename)

    # Write the dictionary to a JSON file
    with open(file_path, "w") as json_file:
        json.dump(data, json_file, indent=4)
    
    print(f"Data written to {file_path}")


def validate_postit_with_drawing(image):
    """
    Validate whether the captured image is a Post-It note with a drawing.
    Returns True if valid, False otherwise.
    """
    # Convert to grayscale for processing
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    # Apply Canny Edge Detection
    edges = cv2.Canny(gray, 50, 150)

    # Count the number of edge pixels
    edge_count = cv2.countNonZero(edges)

    # Define thresholds for a valid drawing
    min_edge_count = 500  # Adjust based on experimentation

    # Check if the edge count exceeds the minimum threshold
    if edge_count > min_edge_count:
        return True
    else:
        print("Validation failed: No significant drawing detected.")
        return False


def detect_drawing(prev_frame, current_frame):
    diff = cv2.absdiff(prev_frame, current_frame)
    _, thresh = cv2.threshold(diff, 25, 255, cv2.THRESH_BINARY)
    non_zero_pixels = cv2.countNonZero(thresh)
    return non_zero_pixels > 100


def main():
    cap = cv2.VideoCapture(2)
    prev_frame = None
    drawing_detected = False
    no_movement_counter = 0
    movement_threshold = 5
    

     # Initialize smoothing variables for relative position
    alpha = 0.2  # Smoothing factor for EMA (0 < alpha <= 1)
    smoothed_position = None  # To store the smoothed position
    stored_position = None  # To store the position that updates only on significant movement
    movement_threshold_distance = 0.05  # Threshold for significant movement in relative position (normalized units)
    stored_projection_area = None
    

    
    


    while True:
        ret, frame = cap.read()
        if not ret:
            break

        frame = cv2.resize(frame, (640, 480))
        
        # Enhance contrast using CLAHE
        frame = enhance_contrast(frame)
         # Detect the projection area
        

        

        if stored_projection_area is None:
            projection_area = detect_projection_area(frame)
            if projection_area is not None:
                stored_projection_area = projection_area  # Store the detected area
                print("Projection area detected and stored.")
        else:
            projection_area = stored_projection_area  # Use the stored area

        if projection_area is not None:
            # Draw the projection area as a blue polygon
            cv2.polylines(frame, [projection_area.astype(int)], True, (255, 0, 0), 2)

            # Display debug text
            cv2.putText(frame, "Projection Area Detected", (10, 50),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
            
        # Detect Post-it note and crop the region
        cropped, detected_color = detect_postit_and_draw(frame, projection_area=projection_area)

        if cropped is not None and projection_area is not None:
            
            gray_cropped = cv2.cvtColor(cropped, cv2.COLOR_BGR2GRAY)
            gray_cropped = cv2.GaussianBlur(gray_cropped, (11, 11), 0)


            # Calculate relative position
            postit_rect = np.array([point[0] for point in detect_postit_and_draw.last_contour], dtype="float32")
            relative_position = get_relative_position(postit_rect, projection_area)

            # Smooth the relative position using EMA
            if smoothed_position is None:
                smoothed_position = relative_position  # Initialize with the first value
            else:
                smoothed_position = alpha * np.array(relative_position) + (1 - alpha) * np.array(smoothed_position)

            # Check for significant movement
            if stored_position is None:
                stored_position = smoothed_position  # Initialize stored position
            else:
                distance = np.linalg.norm(np.array(smoothed_position) - np.array(stored_position))
                if distance > movement_threshold_distance:
                    stored_position = smoothed_position  # Update stored position if movement is significant

            # Draw the Post-it center
            postit_center = np.mean(postit_rect, axis=0).astype(int)
            cv2.circle(frame, tuple(postit_center), 5, (0, 0, 255), -1)
           
            # Display the smoothed and stored relative positions
            smoothed_text = f"Smoothed Pos: ({smoothed_position[0]:.2f}, {smoothed_position[1]:.2f})"
            stored_text = f"Stored Pos: ({stored_position[0]:.2f}, {stored_position[1]:.2f})"
            cv2.putText(frame, smoothed_text, (10, 30),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
            cv2.putText(frame, stored_text, (10, 70),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)

            

            if prev_frame is None:
                prev_frame = gray_cropped
                drawing_detected = True  
                no_movement_counter = 0
                continue

            if detect_drawing(prev_frame, gray_cropped):
                drawing_detected = True
                no_movement_counter = 0
            else:
                if drawing_detected:
                    no_movement_counter += 1
            
            if no_movement_counter >= movement_threshold:
                """ print("Drawing detected! Validating image...")
                if validate_postit_with_drawing(cropped): 
                print("Validation passed. Saving image...")"""
                

                
                #Save cropped Image of Post-it
                file_path = os.path.join(output_directory, f"detected_postit.png")
                cv2.imwrite(file_path, cropped) 
    
                print(f"Cropped {detected_color.capitalize()} Post-it note saved as {file_path}")

                #Notify SVG converter
                notify_svg_conversion(file_path, detected_color, relative_position)

                
                #Stop detection
                #On Keypress "c" -> Capture new Post-it
                #On Keypress "q" quit programm
                while True:
                    print("Press 'c' to continue or 'q' to quit...")
                    key = cv2.waitKey(0) & 0xFF
                    if key == ord('c'):
                        drawing_detected = False
                        no_movement_counter = 0
                        prev_frame = None
                        break
                    elif key == ord('q'):
                        cap.release()
                        cv2.destroyAllWindows()
                        return 


            prev_frame = gray_cropped

        # Failsafe key 'h' to save cropped image and notify SVG conversion
        key = cv2.waitKey(1) & 0xFF
        if key == ord('h') and cropped is not None and detected_color is not None:
            file_path = os.path.join(output_directory, "detected_postit.png")
            cv2.imwrite(file_path, cropped)
            print(f"Failsafe: Cropped {detected_color.capitalize()} Post-it note saved as {file_path}")

            # Notify SVG converter
            notify_svg_conversion(file_path, detected_color, relative_position)
            print("Failsafe: SVG conversion triggered.")
        
        # Failsafe key 'w' to place Cube if detection failed
        elif key == ord('w') and cropped is not None and detected_color is not None:
            file_path = os.path.join(output_directory, "detected_postit_bc.png")
            print(f"Failsafe: Big Cube")

            # Notify SVG converter
            notify_svg_conversion(file_path, detected_color, relative_position)
            print("Failsafe: SVG conversion triggered.")
        
        # Failsafe key 'r' to place small Cube if detection failed
        elif key == ord('r') and cropped is not None and detected_color is not None:
            file_path = os.path.join(output_directory, "detected_postit_sc.png")
            print(f"Failsafe: Small Cube")

            # Notify SVG converter
            notify_svg_conversion(file_path, detected_color, relative_position)
            print("Failsafe: SVG conversion triggered.")
        
        # Failsafe key 's' to place Triangle if detection failed
        elif key == ord('s') and cropped is not None and detected_color is not None:
            file_path = os.path.join(output_directory, "detected_postit_bt.png")
            print(f"Failsafe: Big triangle")

            # Notify SVG converter
            notify_svg_conversion(file_path, detected_color, relative_position)
            print("Failsafe: SVG conversion triggered.")
        
        # Failsafe key 'f' to place small Triangle if detection failed
        elif key == ord('f') and cropped is not None and detected_color is not None:
            file_path = os.path.join(output_directory, "detected_postit_st.png")
            print(f"Failsafe: Small triangle")

            # Notify SVG converter
            notify_svg_conversion(file_path, detected_color, relative_position)
            print("Failsafe: SVG conversion triggered.")
        
        # Failsafe key 'z' to place Circle if detection failed
        elif key == ord('z') and cropped is not None and detected_color is not None:
            file_path = os.path.join(output_directory, "detected_postit_bci.png")
            print(f"Failsafe: Big circle")

            # Notify SVG converter
            notify_svg_conversion(file_path, detected_color, relative_position)
            print("Failsafe: SVG conversion triggered.")

        # Failsafe key 'i' to place small Circle if detection failed
        elif key == ord('i') and cropped is not None and detected_color is not None:
            file_path = os.path.join(output_directory, "detected_postit_sci.png")
            print(f"Failsafe: Small circle")

            # Notify SVG converter
            notify_svg_conversion(file_path, detected_color, relative_position)
            print("Failsafe: SVG conversion triggered.")

        # Failsafe key 'j' to place Rectangle if detection failed
        elif key == ord('j') and cropped is not None and detected_color is not None:
            file_path = os.path.join(output_directory, "detected_postit_br.png")
            print(f"Failsafe: Big rectangle")

            # Notify SVG converter
            notify_svg_conversion(file_path, detected_color, relative_position)
            print("Failsafe: SVG conversion triggered.")

        # Failsafe key 'l' to place small rectangle if detection failed
        elif key == ord('l') and cropped is not None and detected_color is not None:
            file_path = os.path.join(output_directory, "detected_postit_sr.png")
            print(f"Failsafe: Small rectangle")

            # Notify SVG converter
            notify_svg_conversion(file_path, detected_color, relative_position)
            print("Failsafe: SVG conversion triggered.")
        
        # Press "p" to reset projection area
        elif key == ord('p'):  
            stored_projection_area = None
            print("Projection area reset.")
        if key == ord('q'):
            break

        cv2.imshow("Webcam", frame)


    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    main()