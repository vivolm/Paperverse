import cv2
import numpy as np

def detect_postit_and_draw(frame):
    # Convert the frame to HSV for better color detection
    hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)

    # Define the color range for yellow (adjust as needed for your Post-It note color)
    lower_yellow = np.array([20, 30, 70])
    upper_yellow = np.array([50, 255, 255])

    # Create a mask for the yellow color
    mask = cv2.inRange(hsv, lower_yellow, upper_yellow)

    # Find contours in the mask
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    for contour in contours:
        # Filter small contours
        if cv2.contourArea(contour) > 1000:
            # Approximate the contour to get a polygon
            epsilon = 0.02 * cv2.arcLength(contour, True)
            approx = cv2.approxPolyDP(contour, epsilon, True)

            # If the polygon has four sides, we assume it is the Post-It note
            if len(approx) == 4:
                # Perform a perspective transformation to align the Post-It
                pts = np.array([point[0] for point in approx], dtype='float32')

                # Order points in consistent order: top-left, top-right, bottom-right, bottom-left
                def order_points(pts):
                    rect = np.zeros((4, 2), dtype='float32')
                    s = pts.sum(axis=1)
                    rect[0] = pts[np.argmin(s)]  # Top-left
                    rect[2] = pts[np.argmax(s)]  # Bottom-right
                    diff = np.diff(pts, axis=1)
                    rect[1] = pts[np.argmin(diff)]  # Top-right
                    rect[3] = pts[np.argmax(diff)]  # Bottom-left
                    return rect

                rect = order_points(pts)

                # Define the width and height of the Post-It note (adjust as needed)
                width = 200
                height = 200
                dst = np.array([
                    [0, 0],
                    [width - 1, 0],
                    [width - 1, height - 1],
                    [0, height - 1]
                ], dtype='float32')

                # Compute the perspective transform matrix and apply it
                M = cv2.getPerspectiveTransform(rect, dst)
                warped = cv2.warpPerspective(frame, M, (width, height))

                # Draw the bounding polygon on the original frame
                cv2.polylines(frame, [approx], True, (0, 255, 0), 2)

                return warped

    return None

def detect_drawing(prev_frame, current_frame):
    # Compute absolute difference between frames
    diff = cv2.absdiff(prev_frame, current_frame)

    # Apply a more sensitive threshold to highlight changes
    _, thresh = cv2.threshold(diff, 25, 255, cv2.THRESH_BINARY)

    # Count non-zero pixels in the thresholded image
    non_zero_pixels = cv2.countNonZero(thresh)

    # Return True if changes exceed a reduced threshold
    return non_zero_pixels > 1500

def main():
    cap = cv2.VideoCapture(0)


    prev_frame = None
    drawing_detected = False
    no_movement_counter = 0  # Counter for consecutive frames with no movement
    movement_threshold = 10  # Number of consecutive no-movement frames to confirm drawing is done

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
                print("Drawing completed! Capturing image...")
                cv2.imwrite("detected_postit.png", cropped)
                print("Cropped Post-It note saved as detected_postit.png")
                break

            # Update the previous frame for the cropped region
            prev_frame = gray_cropped

        # Show the video feed with the detected Post-It
        cv2.imshow("Webcam", frame)

        # Press 'q' to quit
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    main()
