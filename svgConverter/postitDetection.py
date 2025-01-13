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

def notify_svg_conversion(file_path, detected_color):
    """
    Writes a .txt file to notify about the SVG conversion.

    Parameters:
        file_path (str): The path to the cropped image file.
        detected_color (str): The detected color of the Post-it.
        position (tuple): The position of the Post-it (x, y coordinates).
        output_directory (str): Directory to save the .txt file.
        file_name (str): Name of the .txt file to save (default is 'conversion_info.txt').

    Returns:
        str: The file path where the .txt file was saved, or None if the save failed.
    """
    if not file_path:
        print("Error: Image file path is invalid, cannot write conversion info.")
        return None

    try:
        with open(notification_file, 'w') as f:
           with open(notification_file, 'w') as f:
                f.write(f"{file_path},{detected_color}")

        print(f"SVG conversion info saved at {notification_file}")
        
        return notification_file
    except Exception as e:
        print(f"Error writing SVG notification info: {e}")
        return None

def save_cropped_image(cropped, file_name="detected_postit.png"):
    """
    Saves the cropped Post-it image to disk.

    Parameters:
        cropped (ndarray): The cropped image to save.
        output_directory (str): Directory to save the image in.
        file_name (str): Name of the file to save 

    Returns:
        str: The file path where the image was saved, or None if the save failed.
    """
    if cropped is None:
        print("Error: Cropped image is None, cannot save.")
        return None
    
    file_path = os.path.join(output_directory, file_name)
    try:
        cv2.imwrite(file_path, cropped)
        print(f"Cropped image saved at {file_path}")
        return file_path
    except Exception as e:
        print(f"Error saving cropped image: {e}")
        return None

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
    lower_yellow = np.array([20, 30, 70])
    upper_yellow = np.array([50, 255, 255])

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
    return None, detected_color

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
    min_edge_count = 100  # Adjust based on experimentation

    # Check if the edge count exceeds the minimum threshold
    if edge_count > min_edge_count:
        return True
    else:
        print("Validation failed: No significant drawing detected.")
        return False

def contains_red_content(image):
    """
    Checks if the image contains significant red content.

    Parameters:
        image (ndarray): The image to check.

    Returns:
        bool: True if red content is detected, False otherwise.
    """
    # Convert to HSV for better color segmentation
    hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)

    # Define HSV range for red
    lower_red1 = np.array([0, 50, 50])
    upper_red1 = np.array([10, 255, 255])
    lower_red2 = np.array([170, 50, 50])
    upper_red2 = np.array([180, 255, 255])

    # Create masks for red
    mask_red1 = cv2.inRange(hsv, lower_red1, upper_red1)
    mask_red2 = cv2.inRange(hsv, lower_red2, upper_red2)
    mask_red = cv2.bitwise_or(mask_red1, mask_red2)

    # Count the number of red pixels
    red_pixel_count = cv2.countNonZero(mask_red)

    # Define a threshold for significant red content
    min_red_pixel_count = 90  # Adjust based on experimentation

    if red_pixel_count >= min_red_pixel_count:
        print("not enough red detected :(")

    return red_pixel_count > min_red_pixel_count

def detect_drawing(prev_frame, current_frame):
    diff = cv2.absdiff(prev_frame, current_frame)
    _, thresh = cv2.threshold(diff, 25, 255, cv2.THRESH_BINARY)
    non_zero_pixels = cv2.countNonZero(thresh)
    return non_zero_pixels > 1500


def main():
    cap = cv2.VideoCapture(2) #Webcam
    prev_frame = None
    drawing_detected = False
    no_movement_counter = 0
    movement_threshold = 60

    postit_detected = False
    postit_removed = False
    drawing_completed = False
    drawing_validated = False
     # Tolerance for temporary obstructions


     # Initialize smoothing variables for relative position
    alpha = 0.2  # Smoothing factor for EMA (0 < alpha <= 1)
    smoothed_position = None  # To store the smoothed position
    stored_position = None  # To store the position that updates only on significant movement
    movement_threshold_distance = 0.05  # Threshold for significant movement in relative position (normalized units)

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        frame = cv2.resize(frame, (640, 480))

         # Detect the projection area
        projection_area = detect_projection_area(frame)

        # Detect Post-it note and crop the region
        cropped, detected_color = detect_postit_and_draw(frame, projection_area=projection_area)

        if projection_area is not None:
            # Reset the missing counter when the projection area is detected
            projection_area_missing_counter = 0
            # Draw the projection area as a blue polygon
            cv2.polylines(frame, [projection_area.astype(int)], True, (255, 0, 0), 2)

            # Display debug text
            cv2.putText(frame, "Projection Area Detected", (10, 50),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)


            if cropped is not None:
                
                # Post-it detected
                if not postit_detected:
                    print("Post-it detected for the first time.")
                    postit_detected = True
                    postit_removed = False

                elif postit_detected and drawing_detected and drawing_validated:
                    postit_removed = False
                   #  print("Post-it detected after valid drawing.")
                    # print("awaiting trigger.")

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

                gray_cropped = cv2.cvtColor(cropped, cv2.COLOR_BGR2GRAY)
                gray_cropped = cv2.GaussianBlur(gray_cropped, (11, 11), 0)

                if prev_frame is None:
                    prev_frame = gray_cropped
                    continue

                if detect_drawing(prev_frame, gray_cropped) and not drawing_detected:
                    drawing_detected = True
                    no_movement_counter = 0
                    drawing_completed = True
                    print("Drawing detected on Post-it, verifying...")
                    if validate_postit_with_drawing(cropped):
                        print("Validation passed.")
                        drawing_validated = True
                        save_cropped_image(cropped)
                        write_position_to_json(stored_position[0], stored_position[1], detected_color)

                        file_path = os.path.join(output_directory, f"detected_postit.png")
                        notify_svg_conversion(file_path, detected_color)
                else:
                    if drawing_detected:
                        no_movement_counter += 1

                if no_movement_counter >= movement_threshold and not drawing_validated:
                    print("Drawing completed! Validating image...")
                    if validate_postit_with_drawing(cropped):
                        print("Validation passed.")
                        drawing_detected = True
                        drawing_completed = True
                        drawing_validated = True
                        
                        

                    else:
                        print("Validation failed. Discarding image.")
                        drawing_detected = False
                        drawing_completed = False
                        no_movement_counter = 0

                prev_frame = gray_cropped
                
            elif postit_detected and drawing_completed and drawing_validated and not postit_removed:
                # Post-it was previously detected but is now missing
                print("Post-it removed from the projection area.")
                postit_removed = True
                postit_detected = False
                drawing_completed = False
                drawing_validated = False
                
               
                """ file_path = os.path.join(output_directory, f"detected_postit.png")
                
                write_position_to_json(stored_position[0], stored_position[1], "yellow")
                # Notify SVG converter
                notify_svg_conversion(file_path, "yellow")
               
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
                        return """
                
             

            elif postit_removed and cropped is not None:
                # Post-it is detected again after removal
                print("New Post-it detected.")
               
                postit_detected = True
                postit_removed = False
                # drawing_completed = False  # Reset drawing state for new Post-it

            

        
            

        # Display the status on the frame
            status_text = f"Post-it Detected: {postit_detected}, Removed: {postit_removed}, Drawing: {drawing_completed}"
            cv2.putText(frame, status_text, (10, 110), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)

        cv2.imshow("Webcam", frame)

        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    main()