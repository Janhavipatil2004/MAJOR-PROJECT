const step1 = document.querySelector(".step1"),
  step2 = document.querySelector(".step2"),
  step3 = document.querySelector(".step3"),
  emailAddress = document.getElementById("emailAddress"),
  verifyEmail = document.querySelector(".verifyEmail"),
  inputs = document.querySelectorAll(".otp-group input"),
  nextButton = document.querySelector(".nextButton"),
  verifyButton = document.querySelector(".verifyButton"),
  timerDisplay = document.querySelector(".timer-display");

let OTP = "";
let timer;
const OTP_VALID_DURATION = 120; // seconds

window.addEventListener("load", () => {
  // ✅ Pull session email from <body data-session-email="">
  const emailFromServer = document.body.dataset.sessionEmail || "";

  if (emailFromServer) {
    step1 && (step1.style.display = "none");
    step2 && (step2.style.display = "block");
    step3 && (step3.style.display = "none");

    if (verifyEmail) verifyEmail.textContent = emailFromServer;

    // ✅ Send OTP on page load if session email is present
    fetch("/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: emailFromServer }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "success") {
          startOTPTimer();
        } else {
          console.error("❌ OTP send failed:", data.message);
          alert("Failed to send OTP: " + data.message);
        }
      })
      .catch((err) => {
        console.error("❌ OTP send error:", err);
        alert("Error sending OTP. Please try again.");
      });

  } else {
    step2 && (step2.style.display = "none");
    step3 && (step3.style.display = "none");
  }
});

// Generate OTP countdown
const startOTPTimer = () => {
  let timeLeft = OTP_VALID_DURATION;
  clearInterval(timer);

  timer = setInterval(() => {
    if (timeLeft > 0) {
      timeLeft--;
      timerDisplay.textContent = `OTP valid for: ${timeLeft}s`;
    } else {
      clearInterval(timer);
      timerDisplay.textContent = "OTP expired. Please request a new one.";
      verifyButton.classList.add("disable");
    }
  }, 1000);
};

// Auto-focus logic for OTP boxes
inputs.forEach((input, index) => {
  input.addEventListener("input", function (e) {
    if (this.value.length > 1) this.value = this.value.slice(0, 1);
    if (this.value.length === 1) {
      const nextInput = inputs[index + 1];
      if (nextInput) nextInput.focus();
    }
    if (e.inputType === "deleteContentBackward" && this.value.length === 0) {
      const prevInput = inputs[index - 1];
      if (prevInput) prevInput.focus();
    }
  });
});

// "Next" button — only used when email entry is shown
if (nextButton) {
  nextButton.addEventListener("click", () => {
    if (!emailAddress.value || !emailAddress.value.includes("@")) {
      alert("Please enter a valid email address.");
      return;
    }

    nextButton.innerHTML = "⚡ Sending...";

    fetch("/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: emailAddress.value }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.status === "success") {
          verifyEmail.textContent = emailAddress.value;
          step1.style.display = "none";
          step2.style.display = "block";
          step3.style.display = "none";
          nextButton.innerHTML = "Next →";

          startOTPTimer();
        } else {
          throw new Error(data.message);
        }
      })
      .catch((err) => {
        console.error("❌ Failed to send OTP:", err);
        alert("Failed to send OTP. Please try again.");
        nextButton.innerHTML = "Next →";
      });
  });
}

// "Verify" OTP
verifyButton.addEventListener("click", () => {
  let enteredOTP = "";
  inputs.forEach((input) => {
    enteredOTP += input.value;
  });

  if (!enteredOTP || enteredOTP.length !== 4) {
    alert("Please enter a valid 4-digit OTP.");
    return;
  }

  const email = verifyEmail?.textContent?.trim();

  Swal.fire({
    title: "Verifying OTP...",
    text: "Please wait while we verify your OTP.",
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading();
    }
  });
  
  fetch("/verify-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otp: enteredOTP }),
  })
    .then((response) => response.json())
    .then((data) => {
      Swal.close(); // Close the loading indicator
  
      if (data.status === "success") {
        Swal.fire({
          icon: "success",
          title: "Verification Successful",
          text: data.message,
          confirmButtonText: "Continue",
          confirmButtonColor: "#28a745",
        }).then(() => {
          window.location.href = data.redirect_url;
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Verification Failed",
          text: data.message,
          confirmButtonColor: "#d33",
        });
      }
    })
    .catch((error) => {
      console.error("❌ Error during OTP verification:", error);
      Swal.close();
      Swal.fire({
        icon: "error",
        title: "Network Error",
        text: "An error occurred during OTP verification. Please try again.",
        confirmButtonColor: "#d33",
      });
    });
  
});

// Change email handler
function changeMyEmail() {
  step1.style.display = "block";
  step2.style.display = "none";
  step3.style.display = "none";

  inputs.forEach((input) => (input.value = ""));
  if (emailAddress) emailAddress.value = "";
  clearInterval(timer);
  timerDisplay.textContent = "";
}

// Back button handler to force logout
window.addEventListener("pageshow", function (event) {
  if (event.persisted || (window.performance && window.performance.navigation.type === 2)) {
    fetch("/force-logout", { method: "POST" }).then(() => {
      window.location.href = "/signin";
    });
  }
});
