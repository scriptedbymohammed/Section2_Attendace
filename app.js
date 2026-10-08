const STORAGE_KEY = "section2_attendance_v1";
const INSTRUCTOR_KEY = "section2_instructor_v1";

const todayEl = document.getElementById("today");
const tableEl = document.getElementById("studentsTable");
const totalEl = document.getElementById("totalCount");
const presentEl = document.getElementById("presentCount");
const absentEl = document.getElementById("absentCount");
const instructorEl = document.getElementById("instructorName");
const searchEl = document.getElementById("searchInput");

const now = new Date();
todayEl.textContent = now.toLocaleDateString("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric"
});


// Disable Right Click
document.addEventListener("contextmenu", (event) => {
  event.preventDefault();
});

// Disable common DevTools shortcuts
document.addEventListener("keydown", (event) => {
  if (
    event.key === "F12" ||
    (event.ctrlKey && event.shiftKey && ["I", "J", "C"].includes(event.key)) ||
    (event.ctrlKey && event.key.toLowerCase() === "u")
  ) {
    event.preventDefault();
  }
});

let attendance = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
instructorEl.value = localStorage.getItem(INSTRUCTOR_KEY) || "";

instructorEl.addEventListener("input", () => {
  localStorage.setItem(INSTRUCTOR_KEY, instructorEl.value.trim());
});

function saveAttendance() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(attendance));
}

function render() {
  const query = searchEl.value.trim().toLowerCase();

  const filtered = students.filter(student =>
    student.name.toLowerCase().includes(query) ||
    String(student.id).toLowerCase().includes(query)
  );

  tableEl.innerHTML = "";

  if (!students.length) {
    tableEl.innerHTML = `
      <tr>
        <td colspan="4" class="empty">
          No students have been added yet. Send me the Section 2 names and IDs.
        </td>
      </tr>`;
  } else if (!filtered.length) {
    tableEl.innerHTML = `
      <tr><td colspan="4" class="empty">No matching student found.</td></tr>`;
  } else {
    filtered.forEach((student) => {
      const present = Boolean(attendance[student.id]);
      const row = document.createElement("tr");

      row.innerHTML = `
        <td>${students.indexOf(student) + 1}</td>
        <td><strong>${escapeHtml(student.name)}</strong></td>
        <td>${escapeHtml(student.id)}</td>
        <td>
          <button class="status-btn ${present ? "present" : ""}"
                  data-id="${escapeHtml(student.id)}">
            ${present ? "✓ Present" : "Mark Present"}
          </button>
        </td>
      `;

      row.querySelector(".status-btn").addEventListener("click", () => {
        if (attendance[student.id]) {
          delete attendance[student.id];
        } else {
          attendance[student.id] = {
            time: new Date().toLocaleTimeString("en-GB", {
              hour: "2-digit",
              minute: "2-digit"
            })
          };
        }

        saveAttendance();
        render();
      });

      tableEl.appendChild(row);
    });
  }

  updateStats();
}

function updateStats() {
  const total = students.length;
  const present = students.filter(s => attendance[s.id]).length;

  totalEl.textContent = total;
  presentEl.textContent = present;
  absentEl.textContent = total - present;
}

document.getElementById("clearBtn").addEventListener("click", () => {

  const presentCount = students.filter(
    student => attendance[student.id]
  ).length;

  // Nothing to clear
  if (presentCount === 0) {
    alert("There is no attendance to clear.");
    return;
  }

  const confirmed = confirm(
    `You have marked ${presentCount} student(s) as present.\n\n` +
    `Are you sure you want to clear today's attendance?`
  );

  if (!confirmed) {
    return;
  }

  attendance = {};

  saveAttendance();

  render();
});

document.getElementById("pdfBtn").addEventListener("click", async () => {
  if (!students.length) {
    alert("Add the Section 2 students first.");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  // Load Arabic font
  const fontResponse = await fetch("fonts/Amiri-Regular.ttf");
  const fontBuffer = await fontResponse.arrayBuffer();

  // Convert ArrayBuffer to Base64
  const fontBytes = new Uint8Array(fontBuffer);
  let binary = "";

  fontBytes.forEach(byte => {
    binary += String.fromCharCode(byte);
  });

  const fontBase64 = btoa(binary);

  // Add Arabic font
  doc.addFileToVFS("Amiri-Regular.ttf", fontBase64);
  doc.addFont("Amiri-Regular.ttf", "Amiri", "normal");
  doc.setFont("Amiri");

  const presentStudents = students.filter(s => attendance[s.id]);
  const instructor = instructorEl.value.trim();

  // Title
  doc.setFontSize(18);
  doc.text("Section 2 - Attendance Report", 196, 18, {
    align: "right"
  });

  doc.setFontSize(11);

  doc.text(
    `Date: ${todayEl.textContent}`,
    196,
    28,
    { align: "right" }
  );

  doc.text(
    `Present: ${presentStudents.length} / ${students.length}`,
    196,
    35,
    { align: "right" }
  );

  if (instructor) {
    doc.text(
      `Instructor: ${instructor}`,
      196,
      42,
      { align: "right" }
    );
  }

  const startY = instructor ? 50 : 43;

  doc.autoTable({
    startY,

    head: [
      ["#", "Student Name", "Student ID", "Status", "Time"]
    ],

    body: presentStudents.map((student, index) => [
      index + 1,
      student.name,
      student.id,
      "Present",
      attendance[student.id].time
    ]),

    styles: {
      font: "Amiri",
      fontStyle: "normal",
      fontSize: 9,
      halign: "right"
    },

    headStyles: {
      font: "Amiri",
      fontStyle: "normal",
      halign: "right"
    },

    columnStyles: {
      0: { halign: "center" },
      1: { halign: "right" },
      2: { halign: "center" },
      3: { halign: "center" },
      4: { halign: "center" }
    },

    theme: "grid"
  });

  const safeDate = new Date().toISOString().slice(0, 10);

  doc.save(`Section-2-Attendance-${safeDate}.pdf`);
});


searchEl.addEventListener("input", render);

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

render();
