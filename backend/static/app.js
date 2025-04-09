
// document.addEventListener("DOMContentLoaded", function () {
//   // Elements for toggling between sign-in and sign-up forms
//   const sign_in_btn = document.querySelector("#sign-in-btn");
//   const sign_up_btn = document.querySelector("#sign-up-btn");
//   const container = document.querySelector(".container");

//   // Toggle to Sign-Up Mode
//   sign_up_btn.addEventListener("click", () => {
//     container.classList.add("sign-up-mode");
//   });

//   // Toggle to Sign-In Mode
//   sign_in_btn.addEventListener("click", () => {
//     container.classList.remove("sign-up-mode");
//   });

//   document.querySelectorAll(".toggle-password").forEach((toggle) => {
//     toggle.addEventListener("click", function () {
//         let input = this.previousElementSibling;
//         if (input.type === "password") {
//             input.type = "text";
//             this.innerHTML = "🙈"; // Eye closed emoji
//         } else {
//             input.type = "password";
//             this.innerHTML = "👁️"; // Eye open emoji
//         }
//     });
// });

// // Camera setup and functionality for capturing face image
//   function setupCamera(videoElement, captureButton, snapshotCanvas, imageInputField) {
//     navigator.mediaDevices
//       .getUserMedia({ video: true })
//       .then((stream) => {
//         videoElement.srcObject = stream;
//         videoElement.play();
//       })
//       .catch((err) => {
//         console.error("Error accessing camera: ", err);
//         alert("Unable to access the camera. Please check your permissions.");
//       });

//     captureButton.addEventListener("click", () => {
//       const context = snapshotCanvas.getContext("2d");
//       snapshotCanvas.width = videoElement.videoWidth;
//       snapshotCanvas.height = videoElement.videoHeight;

//       // Draw the current frame from the video to the canvas
//       context.drawImage(videoElement, 0, 0, snapshotCanvas.width, snapshotCanvas.height);
//       snapshotCanvas.classList.remove("hidden");

//       // Convert canvas to image and store it in the hidden input field
//       let imageData = snapshotCanvas.toDataURL("image/jpeg");
//       imageInputField.value = imageData;
//     });
//   }

//   // Setup cameras for both Sign-In and Sign-Up forms
//   setupCamera(
//     document.getElementById("signin-camera"),
//     document.getElementById("signin-capture"),
//     document.getElementById("signin-snapshot"),
//     document.getElementById("signin-image")
//   );

//   setupCamera(
//     document.getElementById("signup-camera"),
//     document.getElementById("signup-capture"),
//     document.getElementById("signup-snapshot"),
//     document.getElementById("signup-image")
//   );

//   const registerForm = document.querySelector(".sign-up-form");
//   registerForm.addEventListener("submit", function (e) {
//     e.preventDefault();

//     const formData = new FormData();
//     formData.append("name", document.getElementById("name").value);
//     formData.append("username", document.getElementById("signup-username").value);
//     formData.append("email", document.getElementById("signup-email").value);
//     formData.append("phone", document.getElementById("phone").value);
//     formData.append("dob", document.getElementById("dob").value);
//     formData.append("password", document.getElementById("signup-password").value);

//     const imageBase64 = document.getElementById("signup-image").value;
//     if (!imageBase64) {
//       alert("Please capture an image before signing up.");
//       return;
//     }

//     // Convert Base64 to Blob
//     const blob = dataURItoBlob(imageBase64);
//     formData.append("face_image", blob, "face_image.jpg");

//     fetch("/register", {
//       method: "POST",
//       body: formData, 
//     })
//       .then((response) => response.json())
//       .then((data) => {
//         alert(data.message);
//         if (data.status === "success") {
//           window.location.href = "/signin";
//         }
//       })
//       .catch((error) => {
//         console.error("Error during registration:", error);
//         alert("An error occurred during registration. Please try again.");
//       });
//   });

//   // Function to handle form submission for Sign-In with OTP verification
//   const signInForm = document.querySelector(".sign-in-form");
//   signInForm.addEventListener("submit", function (e) {
//     e.preventDefault();

//     const formData = new FormData();
//     formData.append("username", document.getElementById("signin-username").value);
//     formData.append("password", document.getElementById("signin-password").value);

//     const imageBase64 = document.getElementById("signin-image").value;
//     if (!imageBase64) {
//       alert("Please capture an image before signing in.");
//       return;
//     }

//     // Convert Base64 to Blob
//     const blob = dataURItoBlob(imageBase64);
//     formData.append("face_image", blob, "face_image.jpg");

//     fetch("/login", {
//       method: "POST",
//       body: formData, // ✅ Do not set "Content-Type" manually
//     })
//       .then((response) => response.json())
//       .then((data) => {
//         if (data.status === "otp_required") {
//           alert(data.message);
//           window.location.href = data.redirect_url; // Redirect to OTP page
//         } else {
//           alert(data.message);
//         }
//       })
//       .catch((error) => {
//         console.error("Error during sign-in:", error);
//         alert("An error occurred during sign-in. Please try again.");
//       });
//   });

//   // Function to convert Base64 to Blob
//   function dataURItoBlob(dataURI) {
//     let byteString = atob(dataURI.split(",")[1]);
//     let arrayBuffer = new ArrayBuffer(byteString.length);
//     let intArray = new Uint8Array(arrayBuffer);
//     for (let i = 0; i < byteString.length; i++) {
//       intArray[i] = byteString.charCodeAt(i);
//     }
//     return new Blob([intArray], { type: "image/jpeg" });
//   }

  
// // Detect back button press and log out
// window.addEventListener("pageshow", function (event) {
//   if (event.persisted) {
//       fetch("/logout", { method: "GET" }).then(() => {
//           window.location.href = "/signin";  // Redirect to sign-in page
//       });
//   }
// });




// });


document.addEventListener("DOMContentLoaded", () => {
    // Theme Toggle Functionality
    const themeToggle = document.getElementById("theme-toggle")
    const htmlElement = document.documentElement
  
    // Check for saved theme preference or use default
    const savedTheme = localStorage.getItem("theme") || "dark"
    htmlElement.setAttribute("data-theme", savedTheme)
  
    // Toggle theme when button is clicked
    themeToggle.addEventListener("click", () => {
      const currentTheme = htmlElement.getAttribute("data-theme")
      const newTheme = currentTheme === "dark" ? "light" : "dark"
  
      htmlElement.setAttribute("data-theme", newTheme)
      localStorage.setItem("theme", newTheme)
  
      // Add animation effect on theme change
      document.body.style.transition = "background-color 0.5s ease"
      document
        .querySelectorAll(".auth-container, .form-control, .input-group-text")
        .forEach((el) => (el.style.transition = "background-color 0.5s ease, border-color 0.5s ease, color 0.5s ease"))
    })
  
    const signinToggle = document.getElementById("signin-toggle")
    const signupToggle = document.getElementById("signup-toggle")
    const signinContainer = document.querySelector(".sign-in-container")
    const signupContainer = document.querySelector(".sign-up-container")
  
    // Toggle based on query parameter ?mode=signup or ?mode=signin
    const urlParams = new URLSearchParams(window.location.search)
    const mode = urlParams.get("mode")
  
    if (mode === "signup") {
      // fallback toggle
      signinContainer.style.display = "none"
      signupContainer.style.display = "block"
      signinToggle.classList.remove("active")
      signupToggle.classList.add("active")
    } else {
      signinToggle.click()
    }
  
    // Toggle between Sign In and Sign Up forms
    signinToggle.addEventListener("click", () => {
      signinContainer.style.display = "block"
      signupContainer.style.display = "none"
      signinToggle.classList.add("active")
      signupToggle.classList.remove("active")
    })
  
    signupToggle.addEventListener("click", () => {
      signinContainer.style.display = "none"
      signupContainer.style.display = "block"
      signinToggle.classList.remove("active")
      signupToggle.classList.add("active")
    })
  
    // Toggle password visibility
    const togglePasswordButtons = document.querySelectorAll(".toggle-password")
    togglePasswordButtons.forEach((button) => {
      button.addEventListener("click", function () {
        const passwordInput = this.previousElementSibling
        const icon = this.querySelector("i")
  
        if (passwordInput.type === "password") {
          passwordInput.type = "text"
          icon.classList.remove("fa-eye")
          icon.classList.add("fa-eye-slash")
        } else {
          passwordInput.type = "password"
          icon.classList.remove("fa-eye-slash")
          icon.classList.add("fa-eye")
        }
      })
    })
  
    // Password Strength Meter
    const passwordInput = document.getElementById("signup-password")
    const strengthMeter = document.querySelector(".password-strength-meter")
    const strengthText = document.getElementById("password-strength-value")
  
    passwordInput.addEventListener("input", function () {
      const password = this.value
      const strength = calculatePasswordStrength(password)
      updatePasswordStrengthUI(strength)
    })
  
    function calculatePasswordStrength(password) {
      // Return 0 if password is empty
      if (!password) return 0
  
      let score = 0
  
      // Length check
      if (password.length >= 8) score += 1
      if (password.length >= 12) score += 1
  
      // Complexity checks
      if (/[A-Z]/.test(password)) score += 1 // Has uppercase
      if (/[a-z]/.test(password)) score += 1 // Has lowercase
      if (/[0-9]/.test(password)) score += 1 // Has number
      if (/[^A-Za-z0-9]/.test(password)) score += 1 // Has special char
  
      // Normalize score to 0-4 range
      return Math.min(4, Math.floor(score / 1.5))
    }
  
    function updatePasswordStrengthUI(strength) {
      // Remove all classes first
      strengthMeter.classList.remove("strength-weak", "strength-medium", "strength-good", "strength-strong")
  
      // Add appropriate class based on strength
      let strengthClass = ""
      let strengthLabel = ""
  
      switch (strength) {
        case 0:
          strengthLabel = "None"
          break
        case 1:
          strengthClass = "strength-weak"
          strengthLabel = "Weak"
          break
        case 2:
          strengthClass = "strength-medium"
          strengthLabel = "Medium"
          break
        case 3:
          strengthClass = "strength-good"
          strengthLabel = "Good"
          break
        case 4:
          strengthClass = "strength-strong"
          strengthLabel = "Strong"
          break
      }
  
      strengthMeter.classList.add(strengthClass)
      strengthText.textContent = strengthLabel
    }
  
    // Face capture functionality for Sign In
    setupFaceCapture("signin")
  
    // Face capture functionality for Sign Up
    setupFaceCapture("signup")
  
    function setupFaceCapture(formType) {
      const video = document.getElementById(`${formType}-video`)
      const canvas = document.getElementById(`${formType}-canvas`)
      const captureBtn = document.getElementById(`${formType}-capture`)
      const startCameraBtn = document.getElementById(`${formType}-start-camera`)
      const imageInput = document.getElementById(`${formType}-image`)
      const previewContainer = document.getElementById(`${formType}-preview-container`)
      const preview = document.getElementById(`${formType}-preview`)
  
      let stream = null
  
      // Start camera
      startCameraBtn.addEventListener("click", async () => {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: 640 },
              height: { ideal: 480 },
              facingMode: "user",
            },
          })
          video.srcObject = stream
          startCameraBtn.disabled = true
          captureBtn.disabled = false
        } catch (err) {
          console.error("Error accessing camera:", err)
          alert("Could not access the camera. Please make sure you have granted camera permissions.")
        }
      })
  
      // Capture image
      captureBtn.addEventListener("click", () => {
        if (!stream) return
  
        const ctx = canvas.getContext("2d")
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
  
        // Convert to base64
        const imageData = canvas.toDataURL("image/jpeg")
        imageInput.value = imageData
  
        // Show preview
        preview.src = imageData
        previewContainer.style.display = "block"
  
        // Stop camera
        if (stream) {
          stream.getTracks().forEach((track) => track.stop())
          stream = null
          video.srcObject = null
          startCameraBtn.disabled = false
        }
      })
    }
  
    // Form validation for username (must contain alphabets and numbers, length 6)
    const signupUsername = document.getElementById("signup-username")
    signupUsername.addEventListener("input", function () {
      const value = this.value
      const regex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/
  
      if (value.length > 0) {
        if (regex.test(value)) {
          this.setCustomValidity("")
          this.classList.remove("is-invalid")
          this.classList.add("is-valid")
        } else {
          this.setCustomValidity("Username must be at least 6 characters and contain both letters and numbers")
          this.classList.remove("is-valid")
          this.classList.add("is-invalid")
        }
      } else {
        this.setCustomValidity("")
        this.classList.remove("is-valid", "is-invalid")
      }
    })
  
    // Form submission for Sign Up
    const registerForm = document.querySelector(".sign-up-form")
    registerForm.addEventListener("submit", (e) => {
      e.preventDefault()
  
      const formData = new FormData()
      formData.append("name", document.getElementById("name").value)
      formData.append("username", document.getElementById("signup-username").value)
      formData.append("email", document.getElementById("signup-email").value)
      formData.append("phone", document.getElementById("phone").value)
      formData.append("dob", document.getElementById("dob").value)
      formData.append("password", document.getElementById("signup-password").value)
  
      const imageBase64 = document.getElementById("signup-image").value
      if (!imageBase64) {
        alert("Please capture an image before signing up.")
        return
      }
  
      // Convert Base64 to Blob
      const blob = dataURItoBlob(imageBase64)
      formData.append("face_image", blob, "face_image.jpg")
  
      fetch("/register", {
        method: "POST",
        body: formData,
      })
        .then((response) => response.json())
        .then((data) => {
          alert(data.message)
          if (data.status === "success") {
            window.location.href = "/signin"
          }
        })
        .catch((error) => {
          console.error("Error during registration:", error)
          alert("An error occurred during registration. Please try again.")
        })
    })
  
    // Function to handle form submission for Sign-In with OTP verification
    const signInForm = document.querySelector(".sign-in-form")
    signInForm.addEventListener("submit", (e) => {
      e.preventDefault()
  
      const formData = new FormData()
      formData.append("username", document.getElementById("signin-username").value)
      formData.append("password", document.getElementById("signin-password").value)
  
      const imageBase64 = document.getElementById("signin-image").value
      if (!imageBase64) {
        alert("Please capture an image before signing in.")
        return
      }
  
      // Convert Base64 to Blob
      const blob = dataURItoBlob(imageBase64)
      formData.append("face_image", blob, "face_image.jpg")
  
      fetch("/login", {
        method: "POST",
        body: formData,
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.status === "otp_required") {
            alert(data.message)
            window.location.href = data.redirect_url // Redirect to OTP page
          } else {
            alert(data.message)
          }
        })
        .catch((error) => {
          console.error("Error during sign-in:", error)
          alert("An error occurred during sign-in. Please try again.")
        })
    })
  
    // Function to convert Base64 to Blob
    function dataURItoBlob(dataURI) {
      const byteString = atob(dataURI.split(",")[1])
      const arrayBuffer = new ArrayBuffer(byteString.length)
      const intArray = new Uint8Array(arrayBuffer)
      for (let i = 0; i < byteString.length; i++) {
        intArray[i] = byteString.charCodeAt(i)
      }
      return new Blob([intArray], { type: "image/jpeg" })
    }
  
    // Detect back button press and log out
    window.addEventListener("pageshow", (event) => {
      if (event.persisted) {
        fetch("/logout", { method: "GET" }).then(() => {
          window.location.href = "/signin" // Redirect to sign-in page
        })
      }
    })
  })
  
