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

def notify_svg_conversion(cropped_file, color, stored_position):
    """
    Write a notification to the SVG conversion file indicating a new image is ready.
    """
    with open(notification_file, "w") as f:
        f.write(f"{cropped_file}, {color}")
    print(f"Notification written to {notification_file} - Color: {color}")
    write_position_to_json(stored_position[0], stored_position[1], color)

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
    return None, None

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
    return non_zero_pixels > 1500


def main():
    cap = cv2.VideoCapture(0)
    smoothed_position = None  # To store the smoothed position
    stored_position = None  # To store the position that updates only on significant movement
    movement_threshold_distance = 0.05  # Threshold for significant movement in relative position (normalized units)
    alpha = 0.2 

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
            # Draw the projection area as a blue polygon
            cv2.polylines(frame, [projection_area.astype(int)], True, (255, 0, 0), 2)

        if cropped is not None and projection_area is not None:
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

            # Check if Post-it is outside the projection area
            postit_center = np.mean(postit_rect, axis=0).reshape(-1, 1, 2)
            in_projection = cv2.pointPolygonTest(projection_area.astype(int), tuple(postit_center[0]), False) >= 0

            if not in_projection:
                print("Post-it moved out of projection area. Triggering action...")
                if validate_postit_with_drawing(cropped):
                    print("Validation passed. Saving image...")
                    
                    file_path = os.path.join(output_directory, f"detected_postit.png")
                    cv2.imwrite(file_path, cropped)
                    print(f"Cropped {detected_color.capitalize()} Post-it note saved as {file_path}")

                    # Notify SVG converter
                    notify_svg_conversion(file_path, detected_color, stored_position)

                    while True:
                        print("Press 'c' to continue or 'q' to quit...")
                        key = cv2.waitKey(0) & 0xFF
                        if key == ord('c'):
                            stored_position = None  # Reset position
                            break
                        elif key == ord('q'):
                            cap.release()
                            cv2.destroyAllWindows()
                            return

        cv2.imshow("Webcam", frame)

        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    main()