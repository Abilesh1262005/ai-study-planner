let chart;

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

let plans = loadJSON("plans", []);
let activity = loadJSON("activity", {});

function addSubject() {
  const subjectInput = document.getElementById("subject");
  const examDateInput = document.getElementById("examDate");

  const subject = (subjectInput?.value || "").trim();
  const examDate = examDateInput?.value || "";

  if (!subject || !examDate) {
    alert("Please fill all fields");
    return;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [year, month, day] = examDate.split("-").map(Number);
  const exam = new Date(year, month - 1, day);

  const msPerDay = 1000 * 60 * 60 * 24;
  const diffDays = Math.ceil((exam - today) / msPerDay);

  if (!Number.isFinite(diffDays) || diffDays <= 0) {
    alert("Exam date must be in the future.");
    return;
  }

  // AI-like logic
  let dailyHours;

  if (diffDays > 30) dailyHours = 1;
  else if (diffDays > 15) dailyHours = 2;
  else dailyHours = 3;

  const plan = {
    subject,
    examDate,
    dailyHours,
    done: false
  };

  plans.push(plan);
  localStorage.setItem("plans", JSON.stringify(plans));

  if (subjectInput) subjectInput.value = "";
  if (examDateInput) examDateInput.value = "";
  subjectInput?.focus();

  renderPlans();
}
function toggleDone(index) {
  const today = new Date().toISOString().split("T")[0];

  // toggle state
  plans[index].done = !plans[index].done;

  // initialize day if not exists
  if (!activity[today]) activity[today] = 0;

  if (plans[index].done) {
    // ✅ checked → increase
    activity[today] += 1;
  } else {
    // ✅ unchecked → decrease safely
    activity[today] = Math.max(0, activity[today] - 1);
  }

  localStorage.setItem("activity", JSON.stringify(activity));
  localStorage.setItem("plans", JSON.stringify(plans));

  renderPlans();
}
function updateStreak() {
  const streakEl = document.getElementById("streak");
  if (!streakEl) return;

  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  while (true) {
    const key = cursor.toISOString().split("T")[0];
    const count = activity[key] || 0;
    if (count > 0) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }

  streakEl.innerText = `🔥 Streak: ${streak} day${streak === 1 ? "" : "s"}`;
}
function deletePlan(index) {
  plans.splice(index, 1);
  localStorage.setItem("plans", JSON.stringify(plans));
  renderPlans();
}
const quotes = [
  "Success starts with self-discipline.",
  "Small progress is still progress.",
  "Consistency beats motivation.",
  "Study now, shine later.",
  "Your future self will thank you."
];

function showQuote() {
  const random = Math.floor(Math.random() * quotes.length);
  document.getElementById("quote").innerText = quotes[random];
}

showQuote();
function clearAll() {
  if (confirm("Delete all plans?")) {
    plans = [];
    activity = {};
    localStorage.removeItem("plans");
    localStorage.removeItem("activity");
    renderPlans();
  }
}
function renderPlans() {
  const list = document.getElementById("planList");
  list.innerHTML = "";

  plans.forEach((p, index) => {
  const li = document.createElement("li");

  if (p.done) li.classList.add("completed"); // 👈 move here

  li.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center;">
      <div>
        <strong>${p.subject}</strong><br>
        Study ${p.dailyHours} hrs/day until ${p.examDate}
      </div>

      <div>
        <input type="checkbox" ${p.done ? "checked" : ""} 
          onchange="toggleDone(${index})" />
        <button onclick="deletePlan(${index})">❌</button>
      </div>
    </div>
  `;

  list.appendChild(li);
});
renderChart();
updateStreak();
renderHeatmap();
}
function renderChart() {
  const completed = plans.filter(p => p.done).length;
  const pending = plans.length - completed;

  const ctx = document.getElementById("progressChart");
  if (!ctx) return;

  if (chart) {
    chart.destroy(); // prevent duplicate charts
  }

  chart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Completed", "Pending"],
      datasets: [{
        data: [completed, pending],
        backgroundColor: ["#22c55e", "#ef4444"],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          labels: {
            color: document.body.classList.contains("light")
              ? "#0f172a"
              : "white"
          }
        }
      }
    }
  });
}
function renderHeatmap() {
  const heatmap = document.getElementById("heatmap");
  if (!heatmap) return;

  heatmap.innerHTML = "";

  const today = new Date();

  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    const key = d.toISOString().split("T")[0];

    const cell = document.createElement("div");
    cell.className = "day";

    const count = activity[key] || 0;

    // 🎨 multi intensity
    if (count >= 4) cell.classList.add("level-4");
    else if (count === 3) cell.classList.add("level-3");
    else if (count === 2) cell.classList.add("level-2");
    else if (count === 1) cell.classList.add("level-1");

    // 🧠 TOOLTIP TEXT (NEW)
    cell.setAttribute(
      "data-tooltip",
      `${key} • ${count} task${count !== 1 ? "s" : ""}`
    );

    heatmap.appendChild(cell);
  }
}
const toggleBtn = document.getElementById("themeToggle");

// Apply saved theme early so the first render matches.
if (localStorage.getItem("theme") === "light") {
  document.body.classList.add("light");
}

if (toggleBtn) {
  // load saved theme icon
  if (document.body.classList.contains("light")) {
    toggleBtn.innerText = "🌙"; // moon in light mode
  } else {
    toggleBtn.innerText = "☀️"; // sun in dark mode
  }

  toggleBtn.addEventListener("click", () => {
    document.body.classList.toggle("light");

    const isLight = document.body.classList.contains("light");

    localStorage.setItem("theme", isLight ? "light" : "dark");

    // icon switch
    toggleBtn.innerText = isLight ? "🌙" : "☀️";

    // refresh chart so legend colors match the theme
    renderChart();
  });
}

renderPlans();