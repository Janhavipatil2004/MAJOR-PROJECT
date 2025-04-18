document.addEventListener("DOMContentLoaded", () => {

  // === Theme Toggle ===
const themeToggle = document.getElementById("themeToggle");
const body = document.body;

const updateThemeIcon = (icon, isDark) => {
  if (!icon) return;
  icon.classList.toggle("fa-sun", !isDark);
  icon.classList.toggle("fa-moon", isDark);
};

if (themeToggle) {
  const icon = themeToggle.querySelector("i");
  const savedTheme = localStorage.getItem("theme");

  if (savedTheme) {
    const isDark = savedTheme === "dark";
    body.classList.toggle("dark-theme", isDark);
    updateThemeIcon(icon, isDark);
  }

  themeToggle.addEventListener("click", () => {
    const isDark = body.classList.toggle("dark-theme");
    localStorage.setItem("theme", isDark ? "dark" : "light");
    updateThemeIcon(themeToggle.querySelector("i"), isDark);
  });
}



    // Profile avatar upload
    const avatarUpload = document.getElementById("avatarUpload")
    const profileAvatar = document.querySelector(".profile-avatar")
    const avatarIcon = profileAvatar.querySelector("i")
    const avatarUploadBtn = document.querySelector(".profile-avatar-upload")
  
    if (avatarUploadBtn) {
      avatarUploadBtn.addEventListener("click", () => {
        avatarUpload.click()
      })
    }
  
    if (avatarUpload) {
      avatarUpload.addEventListener("change", (e) => {
        const file = e.target.files[0]
        if (file) {
          const reader = new FileReader()
          reader.onload = (e) => {
            // Create an image element
            const img = document.createElement("img")
            img.src = e.target.result
            img.style.width = "100%"
            img.style.height = "100%"
            img.style.objectFit = "cover"
            img.style.borderRadius = "50%"
  
            // Remove the icon and append the image
            avatarIcon.style.display = "none"
            profileAvatar.appendChild(img)
          }
          reader.readAsDataURL(file)
        }
      })
    }
  
    // Webcam functionality
    const startCameraBtn = document.getElementById("startCamera")
    const webcamContainer = document.getElementById("webcamContainer")
    const webcamElement = document.getElementById("webcam")
    const captureBtn = document.getElementById("captureBtn")
    const retakeBtn = document.getElementById("retakeBtn")
    const capturedImage = document.getElementById("capturedImage")
  
    let stream = null
  
    if (startCameraBtn) {
      startCameraBtn.addEventListener("click", async () => {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: 640 },
              height: { ideal: 480 },
              facingMode: "user",
            },
          })
  
          webcamElement.srcObject = stream
          webcamContainer.style.display = "block"
          startCameraBtn.style.display = "none"
          capturedImage.style.display = "none"
        } catch (err) {
          console.error("Error accessing camera:", err)
          alert("Could not access the camera. Please make sure you have granted permission.")
        }
      })
    }
  
    if (captureBtn) {
      captureBtn.addEventListener("click", () => {
        // Create a canvas element
        const canvas = document.createElement("canvas")
        canvas.width = webcamElement.videoWidth
        canvas.height = webcamElement.videoHeight
  
        // Draw the current video frame on the canvas
        const ctx = canvas.getContext("2d")
        ctx.drawImage(webcamElement, 0, 0, canvas.width, canvas.height)
  
        // Convert the canvas to a data URL and set it as the source of the captured image
        const imageDataURL = canvas.toDataURL("image/png")
        capturedImage.src = imageDataURL
        capturedImage.style.display = "block"
  
        // Hide the video element and show the retake button
        webcamElement.style.display = "none"
        captureBtn.style.display = "none"
        retakeBtn.style.display = "inline-block"
  
        // Stop the camera stream
        if (stream) {
          stream.getTracks().forEach((track) => track.stop())
        }
      })
    }
  
    if (retakeBtn) {
      retakeBtn.addEventListener("click", async () => {
        try {
          // Restart the camera
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: 640 },
              height: { ideal: 480 },
              facingMode: "user",
            },
          })
  
          webcamElement.srcObject = stream
          webcamElement.style.display = "block"
          capturedImage.style.display = "none"
          captureBtn.style.display = "inline-block"
          retakeBtn.style.display = "none"
        } catch (err) {
          console.error("Error restarting camera:", err)
        }
      })
    }
  
    // Form submission
    const profileForm = document.getElementById("profileForm")
  
if (profileForm) {
  profileForm.addEventListener("submit", async (e) => {
    e.preventDefault();
  
    // Get form values
    const username = document.getElementById("username").value;
    const fullName = document.getElementById("fullName").value;
    const email = document.getElementById("email").value;
    const phone = document.getElementById("phone").value;
    const dob = document.getElementById("dob").value;

  
    // Get captured image if available
    const capturedImg = document.getElementById("capturedImage");
    const faceDataUrl = (capturedImg && capturedImg.src && !capturedImg.src.includes("placeholder"))
      ? capturedImg.src
      : null;
  
    try {
      const response = await fetch("/updateprofile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          name: fullName,
          email,
          phone,
          dob,
          faceImage: faceDataUrl,
        }),
      });
  
      const result = await response.json();
  
      if (response.ok) {
        alert("✅ " + result.message);
        // 👇 Redirect to dashboard after successful update
        window.location.href = "/dashboard";
        // OR, if you want to use backend-provided redirect:
        // if (result.redirect) window.location.href = result.redirect;
      } else {
        alert("❌ Error: " + result.message);
      }
    } catch (error) {
      console.error("Error submitting profile:", error);
      alert("Something went wrong while updating the profile.");
    }
  });
  
}




  })
  