import cv2
import numpy as np
import os


# Define the shared directory and notification file paths
output_directory = "./shared"
notification_file = os.path.join(output_directory, "ready_for_svg.txt")

# Ensure the shared directory exists
if not os.path.exists(output_directory):
    os.makedirs(output_directory)

def notify_svg_conversion(cropped_file):
    """
    Write a notification to the SVG conversion file indicating a new image is ready.
    """
    with open(notification_file, "w") as f:
        f.write(cropped_file)
    print(f"Notification written to {notification_file}")

def detect_postit_and_draw(frame):
    hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
    lower_yellow = np.array([20, 30, 70])
    upper_yellow = np.array([50, 255, 255])
    mask = cv2.inRange(hsv, lower_yellow, upper_yellow)
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
                return warped
    return None

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
    prev_frame = None
    drawing_detected = False
    no_movement_counter = 0  # Counter for consecutive frames with no movement
    movement_threshold = 10  # Number of consecutive no-movement frames to confirm drawing is done

    notification_file = os.path.join(output_directory, "ready_for_svg.txt")
    if not os.path.exists(output_directory):
        os.makedirs(output_directory)

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        # Resize frame for faster processing
        frame = cv2.resize(frame, (640, 480))

        # Detect Post-It note and crop the region
        cropped = detect_postit_and_draw(frame)

        if cropped is not None:
            # Convert cropped Post-It note region to grayscale
            gray_cropped = cv2.cvtColor(cropped, cv2.COLOR_BGR2GRAY)
            gray_cropped = cv2.GaussianBlur(gray_cropped, (11, 11), 0)

            # Initialize previous frame for the cropped region
            if prev_frame is None:
                prev_frame = gray_cropped
                continue

            # Detect drawing activity within the cropped Post-It region
            if detect_drawing(prev_frame, gray_cropped):
                drawing_detected = True
                no_movement_counter = 0  # Reset counter when movement is detected
            else:
                if drawing_detected:
                    no_movement_counter += 1

            # Capture image if no movement is detected for the threshold
            if no_movement_counter >= movement_threshold:
                print("Drawing completed! Validating image...")
                if validate_postit_with_drawing(cropped):
                    print("Validation passed. Saving image...")
                    
                    file_path = os.path.join(output_directory, f"detected_postit.png")
                    cv2.imwrite(file_path, cropped)
                    print(f"Cropped Post-It note saved as {file_path}")

                    # Notify SVG converter
                    with open(notification_file, "w") as f:
                        f.write(file_path)
                    print(f"Notification written to {notification_file}")

                    # Prompt user to continue or quit
                    while True:
                        print("Press 'c' to continue or 'q' to quit...")
                        key = cv2.waitKey(0) & 0xFF
                        if key == ord('c'):
                            print("Continuing to next drawing...")
                            drawing_detected = False
                            no_movement_counter = 0  # Reset counters
                            prev_frame = None  # Reset the previous frame
                            break
                        elif key == ord('q'):
                            print("Exiting program.")
                            cap.release()
                            cv2.destroyAllWindows()
                            return
                else:
                    print("Validation failed. Discarding image.")
                    drawing_detected = False
                    no_movement_counter = 0  # Reset counters

            # Update the previous frame for the cropped region
            prev_frame = gray_cropped

        # Show the video feed with the detected Post-It
        cv2.imshow("Webcam", frame)

        # Press 'q' to quit directly from live feed
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    main()
