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
      alert("Unable to access the camera. Please check your permissions.");
    });

  // Freeze the video frame on canvas (optional visualization)
  captureButton.addEventListener("click", () => {
    const context = snapshotCanvas.getContext("2d");
    snapshotCanvas.width = videoElement.videoWidth;
    snapshotCanvas.height = videoElement.videoHeight;

    // Draw the video feed onto the canvas
    context.drawImage(videoElement, 0, 0, snapshotCanvas.width, snapshotCanvas.height);
    snapshotCanvas.classList.remove("hidden"); // Optional: Show canvas

    alert("Camera frame captured (not saved).");
  });
}

// Set up camera for Sign-In form
setupCamera(
  document.getElementById("signin-camera"),
  document.getElementById("signin-capture"),
  document.getElementById("signin-snapshot")
);

// Set up camera for Sign-Up form
setupCamera(
  document.getElementById("signup-camera"),
  document.getElementById("signup-capture"),
  document.getElementById("signup-snapshot")
);

// Function to handle form submission for registration
const registerForm = document.querySelector(".sign-up-form");
registerForm.addEventListener("submit", function (e) {
  e.preventDefault();

  // Collect user input data for registration
  const name = document.getElementById("name").value;
  const email = document.getElementById("signup-email").value;
  const phone = document.getElementById("phone").value;
  const dob = document.getElementById("dob").value;
  const password = document.getElementById("signup-password").value;

  // Create FormData to send the data
  const formData = new FormData();
  formData.append("name", name);
  formData.append("email", email);
  formData.append("phone", phone);
  formData.append("dob", dob);
  formData.append("password", password);

  // Send data to backend via fetch API
  fetch("/register", {
    method: "POST",
    body: formData,
  })
    .then((response) => response.json())
    .then((data) => {
      alert(data.message);
      if (data.status === "success") {
        window.location.href = "/signin";
      }
    })
    .catch((error) => {
      console.error("Error during registration:", error);
      alert("An error occurred during registration. Please try again.");
    });
});

// Function to handle form submission for sign-in
const signInForm = document.querySelector(".sign-in-form");
signInForm.addEventListener("submit", function (e) {
  e.preventDefault();

  // Collect user input data for sign-in
  const email = document.getElementById("signin-email").value;
  const password = document.getElementById("signin-password").value;

  // Create FormData to send the data
  const formData = new FormData();
  formData.append("email", email);
  formData.append("password", password);

  // Send data to backend via fetch API
  fetch("/signin", {
    method: "POST",
    body: formData,
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.status === "success") {
        alert("Sign-in successful!");
        window.location.href = "/dashboard";
      } else {
        alert(data.message);
      }
    })
    .catch((error) => {
      console.error("Error during sign-in:", error);
      alert("An error occurred during sign-in. Please try again.");
    });
});

