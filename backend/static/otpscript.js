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
const OTP_VALID_DURATION = 120; // OTP validity in seconds

// Initialize EmailJS on page load
window.addEventListener("load", () => {
  emailjs.init("97QXoBVPWll2ClMVw");
  step2.style.display = "none";
  step3.style.display = "none";
});

// Generate a 4-digit OTP
const generateOTP = () => Math.floor(1000 + Math.random() * 9000);

// Start OTP countdown timer
const startOTPTimer = () => {
  let timeLeft = OTP_VALID_DURATION;
  clearInterval(timer);

  timer = setInterval(() => {
    if (timeLeft > 0) {
      timeLeft--;
      timerDisplay.textContent = `OTP valid for: ${timeLeft}s`;

      let enteredOTP = "";
      inputs.forEach((input) => {
        enteredOTP += input.value;
      });

      if (enteredOTP.length === 4) {
        verifyButton.classList.remove("disable");
      } else {
        verifyButton.classList.add("disable");
      }
    } else {
      clearInterval(timer);
      timerDisplay.textContent = "OTP expired. Please request a new one.";
      verifyButton.classList.add("disable");
    }
  }, 1000);
};

// Auto-focus for OTP inputs
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

const serviceID = "service_xqg3gel";
const templateID = "template_h0re6g7";

// Handle "Next" button (Send OTP)
nextButton.addEventListener("click", () => {
  if (!emailAddress.value || !emailAddress.value.includes("@")) {
    alert("Please enter a valid email address.");
    return;
  }

  OTP = generateOTP();
  nextButton.innerHTML = "&#9889; Sending....";

  const templateParams = {
    from_name: "Face Login System",
    OTP: OTP,
    reply_to: emailAddress.value,
  };

  emailjs.send(serviceID, templateID, templateParams).then(
    (res) => {
      console.log("✅ Email sent successfully:", res);
      verifyEmail.textContent = emailAddress.value;

      step1.style.display = "none";
      step2.style.display = "block";
      step3.style.display = "none";
      nextButton.innerHTML = "Next →";

      startOTPTimer();
    },
    (err) => {
      console.error("❌ Failed to send email:", err);
      alert("Failed to send OTP. Please try again.");
      nextButton.innerHTML = "Next →";
    }
  );
});

// Handle OTP verification
verifyButton.addEventListener("click", () => {
  let enteredOTP = "";
  inputs.forEach((input) => {
    enteredOTP += input.value;
  });

  if (enteredOTP === OTP.toString() && timerDisplay.textContent.includes("valid")) {
    clearInterval(timer);

    // ✅ Send OTP to Flask for final verification before allowing login
    fetch("/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: emailAddress.value }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.status === "success") {
          alert(data.message);
          window.location.href = data.redirect_url; // ✅ Redirect to dashboard
        } else {
          alert(data.message);
        }
      })
      .catch((error) => {
        console.error("❌ Error during OTP verification:", error);
        alert("An error occurred. Please try again.");
      });

    step1.style.display = "none";
    step2.style.display = "none";
    step3.style.display = "block";
  } else if (!timerDisplay.textContent.includes("valid")) {
    alert("OTP has expired. Please request a new one.");
  } else {
    verifyButton.classList.add("error-shake");
    setTimeout(() => verifyButton.classList.remove("error-shake"), 1000);
  }
});

// Handle changing email
function changeMyEmail() {
  step1.style.display = "block";
  step2.style.display = "none";
  step3.style.display = "none";

  inputs.forEach((input) => (input.value = ""));
  emailAddress.value = "";
  clearInterval(timer);
  timerDisplay.textContent = "";
}



