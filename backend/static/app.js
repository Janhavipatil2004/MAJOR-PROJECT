
document.addEventListener("DOMContentLoaded", function () {
  // Elements for toggling between sign-in and sign-up forms
  const sign_in_btn = document.querySelector("#sign-in-btn");
  const sign_up_btn = document.querySelector("#sign-up-btn");
  const container = document.querySelector(".container");

  // Toggle to Sign-Up Mode
  sign_up_btn.addEventListener("click", () => {
    container.classList.add("sign-up-mode");
  });

  // Toggle to Sign-In Mode
  sign_in_btn.addEventListener("click", () => {
    container.classList.remove("sign-up-mode");
  });

  document.querySelectorAll(".toggle-password").forEach((toggle) => {
    toggle.addEventListener("click", function () {
        let input = this.previousElementSibling;
        if (input.type === "password") {
            input.type = "text";
            this.innerHTML = "🙈"; // Eye closed emoji
        } else {
            input.type = "password";
            this.innerHTML = "👁️"; // Eye open emoji
        }
    });
});





  // Camera setup and functionality for capturing face image
  function setupCamera(videoElement, captureButton, snapshotCanvas, imageInputField) {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        videoElement.srcObject = stream;
        videoElement.play();
      })
      .catch((err) => {
        console.error("Error accessing camera: ", err);
        alert("Unable to access the camera. Please check your permissions.");
      });

    captureButton.addEventListener("click", () => {
      const context = snapshotCanvas.getContext("2d");
      snapshotCanvas.width = videoElement.videoWidth;
      snapshotCanvas.height = videoElement.videoHeight;

      // Draw the current frame from the video to the canvas
      context.drawImage(videoElement, 0, 0, snapshotCanvas.width, snapshotCanvas.height);
      snapshotCanvas.classList.remove("hidden");

      // Convert canvas to image and store it in the hidden input field
      let imageData = snapshotCanvas.toDataURL("image/jpeg");
      imageInputField.value = imageData;
    });
  }

  // Setup cameras for both Sign-In and Sign-Up forms
  setupCamera(
    document.getElementById("signin-camera"),
    document.getElementById("signin-capture"),
    document.getElementById("signin-snapshot"),
    document.getElementById("signin-image")
  );

  setupCamera(
    document.getElementById("signup-camera"),
    document.getElementById("signup-capture"),
    document.getElementById("signup-snapshot"),
    document.getElementById("signup-image")
  );

  //   function togglePassword() {
  //     var passwordField = document.getElementById("password");
  //     if (passwordField.type === "password") {
  //         passwordField.type = "text";
  //     } else {
  //         passwordField.type = "password";
  //     }
  // }
  // Function to handle form submission for Sign-Up
  const registerForm = document.querySelector(".sign-up-form");
  registerForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const formData = new FormData();
    formData.append("name", document.getElementById("name").value);
    formData.append("username", document.getElementById("signup-username").value);
    formData.append("email", document.getElementById("signup-email").value);
    formData.append("phone", document.getElementById("phone").value);
    formData.append("dob", document.getElementById("dob").value);
    formData.append("password", document.getElementById("signup-password").value);

    const imageBase64 = document.getElementById("signup-image").value;
    if (!imageBase64) {
      alert("Please capture an image before signing up.");
      return;
    }

    // Convert Base64 to Blob
    const blob = dataURItoBlob(imageBase64);
    formData.append("face_image", blob, "face_image.jpg");

    fetch("/register", {
      method: "POST",
      body: formData, // ✅ Do not set "Content-Type" manually
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

  // Function to handle form submission for Sign-In with OTP verification
  const signInForm = document.querySelector(".sign-in-form");
  signInForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const formData = new FormData();
    formData.append("username", document.getElementById("signin-username").value);
    formData.append("password", document.getElementById("signin-password").value);

    const imageBase64 = document.getElementById("signin-image").value;
    if (!imageBase64) {
      alert("Please capture an image before signing in.");
      return;
    }

    // Convert Base64 to Blob
    const blob = dataURItoBlob(imageBase64);
    formData.append("face_image", blob, "face_image.jpg");

    fetch("/login", {
      method: "POST",
      body: formData, // ✅ Do not set "Content-Type" manually
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.status === "otp_required") {
          alert(data.message);
          window.location.href = data.redirect_url; // Redirect to OTP page
        } else {
          alert(data.message);
        }
      })
      .catch((error) => {
        console.error("Error during sign-in:", error);
        alert("An error occurred during sign-in. Please try again.");
      });
  });

  // Function to convert Base64 to Blob
  function dataURItoBlob(dataURI) {
    let byteString = atob(dataURI.split(",")[1]);
    let arrayBuffer = new ArrayBuffer(byteString.length);
    let intArray = new Uint8Array(arrayBuffer);
    for (let i = 0; i < byteString.length; i++) {
      intArray[i] = byteString.charCodeAt(i);
    }
    return new Blob([intArray], { type: "image/jpeg" });
  }
});




