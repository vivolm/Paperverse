import cv2
import numpy as np
import time

def detect_postit_and_draw(frame):
    # Convert the frame to HSV (better for color detection)
    hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)

    # Define the color range for yellow (adjust as needed for your post-it note color)
    lower_yellow = np.array([20, 100, 100])
    upper_yellow = np.array([30, 255, 255])

    # Create a mask for the yellow color
    mask = cv2.inRange(hsv, lower_yellow, upper_yellow)

    # Find contours in the mask
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    for contour in contours:
        # Filter small contours
        if cv2.contourArea(contour) > 1000:
            # Get the bounding box for the post-it note
            x, y, w, h = cv2.boundingRect(contour)
            cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 255, 0), 2)

            # Return the cropped post-it note region
            cropped = frame[y:y+h, x:x+w]
            return cropped

    return None

def detect_drawing(prev_frame, current_frame):
    # Compute absolute difference between frames
    diff = cv2.absdiff(prev_frame, current_frame)

    # Apply a more sensitive threshold to highlight changes
    _, thresh = cv2.threshold(diff, 25, 255, cv2.THRESH_BINARY)

    # Count non-zero pixels in the thresholded image
    non_zero_pixels = cv2.countNonZero(thresh)

    # Return True if changes exceed a reduced threshold
    return non_zero_pixels > 1500  # Lowered sensitivity threshold

def main():
    cap = cv2.VideoCapture(0)
    prev_frame = None
    change_counter = 0  # Counter for persistent changes
    threshold_frames = 5  # Number of frames with changes before taking a picture
    capture_time = None  # Time when we start the delay for capturing
    capture_delay = 4  # Delay (in seconds) before capturing after detecting drawing

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        # Resize frame for faster processing
        frame = cv2.resize(frame, (640, 480))

        # Detect post-it note and crop the region
        cropped = detect_postit_and_draw(frame)

        if cropped is not None:
            # Convert cropped post-it note region to grayscale
            gray_cropped = cv2.cvtColor(cropped, cv2.COLOR_BGR2GRAY)
            gray_cropped = cv2.GaussianBlur(gray_cropped, (11, 11), 0)  # Smaller blur kernel

            # Standardize the size of the cropped frames
            gray_cropped = cv2.resize(gray_cropped, (200, 200))  # Resize to fixed size (200x200)

            # Initialize previous frame for the cropped region
            if prev_frame is None:
                prev_frame = gray_cropped
                continue

            # Detect drawing activity within the cropped post-it region
            if detect_drawing(prev_frame, gray_cropped):
                change_counter += 1
            else:
                change_counter = 0  # Reset counter if no persistent change

            # Start capture delay once the change counter meets the threshold
            if change_counter >= threshold_frames:
                if capture_time is None:
                    print("Drawing detected! Starting delay before capture...")
                    capture_time = time.time() + capture_delay  # Set capture time with delay

            # Capture image only if the delay has passed
            if capture_time is not None and time.time() >= capture_time:
                print("Capturing image...")
                cv2.imwrite("detected_postit.png", cropped)
                print("Cropped post-it note saved as detected_postit.png")
                break

            # Update the previous frame for the cropped region
            prev_frame = gray_cropped

        # Show the video feed with the detected post-it
        cv2.imshow("Webcam", frame)

        # Press 'q' to quit
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    main()