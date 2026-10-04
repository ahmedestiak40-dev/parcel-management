// ---------- MULTI-USER LOGIN ----------
const loginScreen = document.getElementById("loginScreen");
const mainApp = document.getElementById("mainApp");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const themeToggle = document.getElementById("themeToggle");

const users = [
  { username: "admin", password: "12345", role: "Admin" },
  { username: "staff", password: "1234", role: "Staff" },
  { username: "viewer", password: "0000", role: "Viewer" }
];

let currentUser = null;

// ---------- LOGIN ----------
loginBtn.addEventListener("click", () => {
  const user = document.getElementById("username").value.trim();
  const pass = document.getElementById("password").value.trim();
  const found = users.find(u => u.username === user && u.password === pass);

  if (found) {
    currentUser = found;
    localStorage.setItem("loggedIn", JSON.stringify(currentUser));
    showApp();
    logActivity(`${currentUser.username} logged in`);
  } else alert("Invalid login!");
});

function showApp() {
  loginScreen.classList.add("hidden");
  mainApp.classList.remove("hidden");
  saveParcels();
  renderParcels();
}

// ---------- LOGOUT ----------
logoutBtn.addEventListener("click", () => {
  logActivity(`${currentUser.username} logged out`);
  localStorage.removeItem("loggedIn");
  currentUser = null;
  mainApp.classList.add("hidden");
  loginScreen.classList.remove("hidden");
});

// ---------- PERSIST LOGIN SECURELY ----------
if (localStorage.getItem("loggedIn")) {
  const storedUser = JSON.parse(localStorage.getItem("loggedIn"));
  const validUser = users.find(
    u => u.username === storedUser.username && u.password === storedUser.password
  );
  if (validUser) {
    currentUser = validUser;
    showApp();
  } else {
    localStorage.removeItem("loggedIn"); // Remove invalid data
  }
}

// ---------- DARK MODE ----------
themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
});

// ---------- PARCEL MANAGEMENT ----------
let parcels = JSON.parse(localStorage.getItem("parcels")) || [];

const parcelForm = document.getElementById("parcelForm");
const parcelTable = document.getElementById("parcelTable");
const search = document.getElementById("search");
const filterStatus = document.getElementById("filterStatus");
const exportBtn = document.getElementById("exportBtn");
const importBtn = document.getElementById("importBtn");
const importFile = document.getElementById("importFile");
const printBtn = document.getElementById("printBtn");
const activityLog = document.getElementById("activityLog");

let chart;

// ---------- LOG ACTIVITY ----------
function logActivity(text) {
  const time = new Date().toLocaleString();
  const entry = document.createElement("div");
  entry.textContent = `[${time}] ${text}`;
  activityLog.prepend(entry);
}

// ---------- SAVE & RENDER ----------
function saveParcels() {
  localStorage.setItem("parcels", JSON.stringify(parcels));
  updateDashboard();
  renderParcels();
  updateChart();
}

// ---------- FORM SUBMIT ----------
parcelForm.addEventListener("submit", (e) => {
  e.preventDefault();
  if (!currentUser || currentUser.role === "Viewer") return alert("You cannot add parcels!");

  const id = document.getElementById("parcelId").value.trim();
  const sender = document.getElementById("sender").value.trim();
  const receiver = document.getElementById("receiver").value.trim();
  const destination = document.getElementById("destination").value.trim();
  const status = document.getElementById("status").value;
  const editIndex = document.getElementById("editIndex").value;

  if (editIndex === "") {
    parcels.push({ id, sender, receiver, destination, status });
    logActivity(`${currentUser.username} added parcel ${id}`);
  } else {
    parcels[editIndex].id = id;
    parcels[editIndex].sender = sender;
    parcels[editIndex].receiver = receiver;
    parcels[editIndex].destination = destination;
    parcels[editIndex].status = status;
    logActivity(`${currentUser.username} updated parcel ${id}`);
  }

  parcelForm.reset();
  document.getElementById("editIndex").value = "";
  saveParcels();
});

// ---------- RENDER TABLE ----------
function renderParcels() {
  const filter = filterStatus.value;
  const query = search.value.toLowerCase();
  parcelTable.innerHTML = "";

  parcels
    .filter(p =>
      (filter === "All" || p.status === filter) &&
      Object.values(p).some(v => v.toString().toLowerCase().includes(query))
    )
    .forEach((p, i) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${p.id}</td>
        <td>${p.sender}</td>
        <td>${p.receiver}</td>
        <td>${p.destination}</td>
        <td>${p.status}</td>
        <td>
          ${(currentUser.role !== "Viewer") ? `<button class="action-btn edit" onclick="editParcel(${i})">✏️</button>` : ''}
          ${(currentUser.role === "Admin") ? `<button class="action-btn delete" onclick="deleteParcel(${i})">🗑️</button>` : ''}
        </td>
      `;
      parcelTable.appendChild(row);
    });
}

function editParcel(i) {
  const p = parcels[i];
  document.getElementById("editIndex").value = i;
  document.getElementById("parcelId").value = p.id;
  document.getElementById("sender").value = p.sender;
  document.getElementById("receiver").value = p.receiver;
  document.getElementById("destination").value = p.destination;
  document.getElementById("status").value = p.status;
}

function deleteParcel(i) {
  if (!currentUser || currentUser.role !== "Admin") return;
  if (confirm("Delete this parcel?")) {
    logActivity(`${currentUser.username} deleted parcel ${parcels[i].id}`);
    parcels.splice(i, 1);
    saveParcels();
  }
}

// ---------- DASHBOARD ----------
function updateDashboard() {
  document.getElementById("totalParcels").innerText = parcels.length;
  document.getElementById("pendingParcels").innerText = parcels.filter(p => p.status === "Pending").length;
  document.getElementById("deliveredParcels").innerText = parcels.filter(p => p.status === "Delivered").length;
}

// ---------- CHART ----------
function updateChart() {
  const pending = parcels.filter(p => p.status === "Pending").length;
  const transit = parcels.filter(p => p.status === "In Transit").length;
  const delivered = parcels.filter(p => p.status === "Delivered").length;

  if (chart) chart.destroy();
  const ctx = document.getElementById("parcelChart").getContext("2d");
  chart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Pending", "In Transit", "Delivered"],
      datasets: [{ data: [pending, transit, delivered], backgroundColor: ["#f1c40f", "#3498db", "#2ecc71"] }]
    },
    options: { plugins: { legend: { labels: { color: "#fff" } } } }
  });
}

// ---------- SEARCH & FILTER ----------
search.addEventListener("input", renderParcels);
filterStatus.addEventListener("change", renderParcels);

// ---------- EXPORT / IMPORT / PRINT ----------
exportBtn.addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(parcels, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "parcels.json";
  a.click();
});

importBtn.addEventListener("click", () => importFile.click());
importFile.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      parcels = JSON.parse(event.target.result);
      saveParcels();
      alert("Parcels imported successfully!");
      logActivity(`${currentUser.username} imported parcels`);
    } catch {
      alert("Invalid JSON file!");
    }
  };
  reader.readAsText(file);
});

printBtn.addEventListener("click", () => window.print());

// ---------- INITIAL LOAD ----------
saveParcels();
