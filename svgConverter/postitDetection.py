import cv2
import numpy as np
import os

# Define shared directory and notification file paths
SHARED_DIR = "shared"
NOTIFICATION_FILE = os.path.join(SHARED_DIR, "ready_for_svg.txt")

# Ensure the shared directory exists
os.makedirs(SHARED_DIR, exist_ok=True)

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

def detect_drawing(prev_frame, current_frame):
    diff = cv2.absdiff(prev_frame, current_frame)
    _, thresh = cv2.threshold(diff, 25, 255, cv2.THRESH_BINARY)
    non_zero_pixels = cv2.countNonZero(thresh)
    return non_zero_pixels > 1500

def notify_svg_conversion(cropped_file):
    with open(NOTIFICATION_FILE, "w") as f:
        f.write(cropped_file)
    print(f"Notification written to {NOTIFICATION_FILE}")

def main():
    cap = cv2.VideoCapture(0)

    while True:
        prev_frame = None
        drawing_detected = False
        no_movement_counter = 0
        movement_threshold = 10

        print("Ready to detect a new drawing...")

        while True:
            ret, frame = cap.read()
            if not ret:
                break

            frame = cv2.resize(frame, (640, 480))
            cropped = detect_postit_and_draw(frame)

            if cropped is not None:
                gray_cropped = cv2.cvtColor(cropped, cv2.COLOR_BGR2GRAY)
                gray_cropped = cv2.GaussianBlur(gray_cropped, (11, 11), 0)

                if prev_frame is None:
                    prev_frame = gray_cropped
                    continue

                if detect_drawing(prev_frame, gray_cropped):
                    drawing_detected = True
                    no_movement_counter = 0
                else:
                    if drawing_detected:
                        no_movement_counter += 1

                if no_movement_counter >= movement_threshold:
                    print("Drawing completed! Capturing image...")
                    cropped_file = os.path.join(SHARED_DIR, "detected_postit.png")
                    cv2.imwrite(cropped_file, cropped)
                    print(f"Cropped Post-It note saved as {cropped_file}")
                    notify_svg_conversion(cropped_file)
                    break

                prev_frame = gray_cropped

            cv2.imshow("Webcam", frame)

            key = cv2.waitKey(1) & 0xFF
            if key == ord('q'):
                cap.release()
                cv2.destroyAllWindows()
                return

        print("Press 'c' to capture another drawing, or 'q' to quit.")
        while True:
            key = cv2.waitKey(1) & 0xFF
            if key == ord('c'):
                print("Starting new drawing session...")
                break
            elif key == ord('q'):
                print("Exiting program.")
                cap.release()
                cv2.destroyAllWindows()
                return

if __name__ == "__main__":
    main()
