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

  // === Sidebar Toggle ===
  const toggleSidebar = document.getElementById("toggleSidebar");
  const closeSidebar = document.getElementById("closeSidebar");
  const sidebar = document.getElementById("sidebar");

  toggleSidebar?.addEventListener("click", () => {
    sidebar?.classList.toggle("show");
  });

  closeSidebar?.addEventListener("click", () => {
    sidebar?.classList.remove("show");
  });

  document.addEventListener("click", (e) => {
    const isClickInside = sidebar?.contains(e.target);
    const isClickOnToggle = toggleSidebar?.contains(e.target);
    if (!isClickInside && !isClickOnToggle && sidebar?.classList.contains("show")) {
      sidebar.classList.remove("show");
    }
  });

  // === Chart.js Line Chart ===
  const ctx = document.getElementById("activityChart");

  if (ctx && window.Chart) {
    const isDarkTheme = body.classList.contains("dark-theme");
    const textColor = isDarkTheme ? "#f8fafc" : "#0f172a";
    const gridColor = isDarkTheme ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)";

    new Chart(ctx, {
      type: "line",
      data: {
        labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        datasets: [{
          label: "Successful Logins",
          data: [3, 1, 2, 1, 2, 1, 1],
          borderColor: "#8b5cf6",
          backgroundColor: "rgba(139, 92, 246, 0.1)",
          tension: 0.4,
          fill: true,
          pointBackgroundColor: "#8b5cf6",
          pointBorderColor: isDarkTheme ? "#1e293b" : "#ffffff",
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: isDarkTheme ? "#1e293b" : "#fff",
            titleColor: isDarkTheme ? "#f8fafc" : "#2d3748",
            bodyColor: isDarkTheme ? "#94a3b8" : "#718096",
            bodyFont: { size: 13 },
            titleFont: { size: 15, weight: "bold" },
            padding: 12,
            boxWidth: 10,
            boxHeight: 10,
            boxPadding: 3,
            usePointStyle: true,
            borderColor: isDarkTheme ? "#334155" : "#e2e8f0",
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
            grid: { color: gridColor, drawBorder: false },
            ticks: { stepSize: 1, color: textColor },
          },
          x: {
            grid: { display: false },
            ticks: { color: textColor },
          },
        },
      },
    });
  }

  // === Notification Mark All as Read ===
  const markAllBtn = document.querySelector(".mark-all");
  const unreadNotifications = document.querySelectorAll(".notification-item.unread");

  markAllBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    unreadNotifications.forEach(notification => {
      notification.classList.remove("unread");
    });

    const badge = document.querySelector(".btn-notification .badge");
    if (badge) {
      badge.textContent = "0";
      badge.style.display = "none";
    }
  });
});
