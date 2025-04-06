import { Chart } from "@/components/ui/chart"
// Toggle Sidebar
document.addEventListener("DOMContentLoaded", () => {
  const toggleSidebar = document.getElementById("toggleSidebar")
  const closeSidebar = document.getElementById("closeSidebar")
  const sidebar = document.getElementById("sidebar")

  if (toggleSidebar) {
    toggleSidebar.addEventListener("click", () => {
      sidebar.classList.toggle("show")
    })
  }

  if (closeSidebar) {
    closeSidebar.addEventListener("click", () => {
      sidebar.classList.remove("show")
    })
  }

  // Close sidebar when clicking outside on mobile
  document.addEventListener("click", (event) => {
    const isClickInsideSidebar = sidebar.contains(event.target)
    const isClickOnToggle = toggleSidebar && toggleSidebar.contains(event.target)

    if (!isClickInsideSidebar && !isClickOnToggle && sidebar.classList.contains("show")) {
      sidebar.classList.remove("show")
    }
  })
})

// Initialize Chart.js
const ctx = document.getElementById("activityChart")

if (ctx) {
  new Chart(ctx, {
    type: "line",
    data: {
      labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      datasets: [
        {
          label: "Successful Logins",
          data: [3, 1, 2, 1, 2, 1, 1],
          borderColor: "#4361ee",
          backgroundColor: "rgba(67, 97, 238, 0.1)",
          tension: 0.4,
          fill: true,
          pointBackgroundColor: "#4361ee",
          pointBorderColor: "#fff",
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          backgroundColor: "#fff",
          titleColor: "#2d3748",
          bodyColor: "#718096",
          bodyFont: {
            size: 13,
          },
          titleFont: {
            size: 15,
            weight: "bold",
          },
          padding: 12,
          boxWidth: 10,
          boxHeight: 10,
          boxPadding: 3,
          usePointStyle: true,
          borderColor: "#e2e8f0",
          borderWidth: 1,
          displayColors: true,
          caretSize: 6,
          caretPadding: 10,
          cornerRadius: 6,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: "rgba(0, 0, 0, 0.05)",
            drawBorder: false,
          },
          ticks: {
            stepSize: 1,
          },
        },
        x: {
          grid: {
            display: false,
          },
        },
      },
    },
  })
}

// Notification Functionality
document.addEventListener("DOMContentLoaded", () => {
  const markAllBtn = document.querySelector(".mark-all")
  const unreadNotifications = document.querySelectorAll(".notification-item.unread")

  if (markAllBtn) {
    markAllBtn.addEventListener("click", (e) => {
      e.preventDefault()
      unreadNotifications.forEach((notification) => {
        notification.classList.remove("unread")
      })

      // Update badge count
      const badge = document.querySelector(".btn-notification .badge")
      if (badge) {
        badge.textContent = "0"
        badge.style.display = "none"
      }
    })
  }
})

