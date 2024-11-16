// Original functionality for toggling sign-in and sign-up modes
const sign_in_btn = document.querySelector("#sign-in-btn");
const sign_up_btn = document.querySelector("#sign-up-btn");
const container = document.querySelector(".container");

sign_up_btn.addEventListener("click", () => {
  container.classList.add("sign-up-mode");
});

sign_in_btn.addEventListener("click", () => {
  container.classList.remove("sign-up-mode");
});

// Function to set up the camera and capture functionality
function setupCamera(videoElement, captureButton, snapshotCanvas) {
  // Access the user's camera
  navigator.mediaDevices
    .getUserMedia({ video: true })
    .then((stream) => {
      videoElement.srcObject = stream;
      videoElement.play(); // Ensure video feed starts playing
    })
    .catch((err) => {
      console.error("Error accessing camera: ", err);
    });

  // Capture image and display on canvas
  captureButton.addEventListener("click", () => {
    const context = snapshotCanvas.getContext("2d");
    snapshotCanvas.width = videoElement.videoWidth;
    snapshotCanvas.height = videoElement.videoHeight;

    // Draw the video feed onto the canvas
    context.drawImage(videoElement, 0, 0, snapshotCanvas.width, snapshotCanvas.height);

    // Show the canvas (freeze the frame)
    snapshotCanvas.classList.remove("hidden");

    // Show a success message
    alert("Image captured successfully!");
  });
}

// Set up camera for Sign-In form
setupCamera(
  document.getElementById("signin-camera"), // Video element for sign-in
  document.getElementById("signin-capture"), // Capture button for sign-in
  document.getElementById("signin-snapshot") // Canvas for displaying snapshot in sign-in
);

// Set up camera for Sign-Up form
setupCamera(
  document.getElementById("signup-camera"), // Video element for sign-up
  document.getElementById("signup-capture"), // Capture button for sign-up
  document.getElementById("signup-snapshot") // Canvas for displaying snapshot in sign-up
);

