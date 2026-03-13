import {
  saveAppState,
  loadAppState,
  clearCurrentMonth,
  clearAllAppData
} from "./storage.js";

const $ = (selector) => document.querySelector(selector);

const monthPicker = $("#monthPicker");
const morningWeight = $("#morningWeight");
const eveningWeight = $("#eveningWeight");
const nightWeight = $("#nightWeight");
const saveWeightsBtn = $("#saveWeightsBtn");
const saveStatus = $("#saveStatus");

const memberForm = $("#memberForm");
const memberName = $("#memberName");
const memberPhone = $("#memberPhone");
const membersList = $("#membersList");
const memberCountPill = $("#memberCountPill");

const mealForm = $("#mealForm");
const mealDate = $("#mealDate");
const mealMember = $("#mealMember");
const morningCount = $("#morningCount");
const eveningCount = $("#eveningCount");
const nightCount = $("#nightCount");
const mealNote = $("#mealNote");
const mealTableBody = $("#mealTableBody");

const bazarForm = $("#bazarForm");
const bazarDate = $("#bazarDate");
const bazarMember = $("#bazarMember");
const bazarAmount = $("#bazarAmount");
const bazarItems = $("#bazarItems");
const bazarNote = $("#bazarNote");
const bazarTableBody = $("#bazarTableBody");

const summaryTableBody = $("#summaryTableBody");

const totalMembersStat = $("#totalMembersStat");
const totalMealsStat = $("#totalMealsStat");
const totalBazarStat = $("#totalBazarStat");
const mealRateStat = $("#mealRateStat");

const resetMonthBtn = $("#resetMonthBtn");
const resetAllBtn = $("#resetAllBtn");

const initialState = {
  currentMonth: getCurrentMonthKey(),
  settings: {
    mealWeights: {
      morning: 1,
      evening: 1,
      night: 1
    }
  },
  months: {}
};

let state = loadAppState() || initialState;

ensureMonth(state.currentMonth);
boot();

function boot() {
  monthPicker.value = state.currentMonth;
  mealDate.value = getTodayDate();
  bazarDate.value = getTodayDate();

  syncWeightInputs();
  bindEvents();
  renderAll();
}

function bindEvents() {
  monthPicker.addEventListener("change", () => {
    state.currentMonth = monthPicker.value || getCurrentMonthKey();
    ensureMonth(state.currentMonth);
    persistAndRender();
  });

  saveWeightsBtn.addEventListener("click", () => {
    state.settings.mealWeights.morning = positiveNumber(morningWeight.value, 1);
    state.settings.mealWeights.evening = positiveNumber(eveningWeight.value, 1);
    state.settings.mealWeights.night = positiveNumber(nightWeight.value, 1);
    persistAndRender("Meal weight update হয়েছে");
  });

  memberForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = memberName.value.trim();
    const phone = memberPhone.value.trim();

    if (!name) {
      alert("সদস্যের নাম দিন");
      return;
    }

    const monthData = getMonthData();
    monthData.members.push({
      id: generateId(),
      name,
      phone
    });

    memberForm.reset();
    persistAndRender("সদস্য যোগ হয়েছে");
  });

  mealForm.addEventListener("submit", (e) => {
    e.preventDefault();

    if (!mealMember.value) {
      alert("আগে সদস্য যোগ করুন");
      return;
    }

    const monthData = getMonthData();

    monthData.mealEntries.push({
      id: generateId(),
      date: mealDate.value,
      memberId: mealMember.value,
      morning: nonNegativeInt(morningCount.value),
      evening: nonNegativeInt(eveningCount.value),
      night: nonNegativeInt(nightCount.value),
      note: mealNote.value.trim()
    });

    mealForm.reset();
    mealDate.value = getTodayDate();
    morningCount.value = 0;
    eveningCount.value = 0;
    nightCount.value = 0;

    persistAndRender("Meal entry save হয়েছে");
  });

  bazarForm.addEventListener("submit", (e) => {
    e.preventDefault();

    if (!bazarMember.value) {
      alert("আগে সদস্য যোগ করুন");
      return;
    }

    const amount = parseFloat(bazarAmount.value || "0");
    if (amount <= 0) {
      alert("সঠিক বাজারের টাকা দিন");
      return;
    }

    const monthData = getMonthData();

    monthData.bazarEntries.push({
      id: generateId(),
      date: bazarDate.value,
      memberId: bazarMember.value,
      amount,
      items: bazarItems.value.trim(),
      note: bazarNote.value.trim()
    });

    bazarForm.reset();
    bazarDate.value = getTodayDate();

    persistAndRender("বাজার entry save হয়েছে");
  });

  resetMonthBtn.addEventListener("click", () => {
    const ok = confirm(`আপনি কি ${state.currentMonth} মাসের সব ডাটা মুছে ফেলতে চান?`);
    if (!ok) return;

    clearCurrentMonth(state, state.currentMonth);
    ensureMonth(state.currentMonth);
    persistAndRender("এই মাসের ডাটা রিসেট হয়েছে");
  });

  resetAllBtn.addEventListener("click", () => {
    const ok = confirm("আপনি কি সব মাসের সব ডাটা delete করতে চান?");
    if (!ok) return;

    clearAllAppData();
    state = JSON.parse(JSON.stringify(initialState));
    ensureMonth(state.currentMonth);
    persistAndRender("সব ডাটা delete হয়েছে");
  });
}

function getCurrentMonthKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function getTodayDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function ensureMonth(monthKey) {
  if (!state.months[monthKey]) {
    state.months[monthKey] = {
      members: [],
      mealEntries: [],
      bazarEntries: []
    };
  }
}

function getMonthData() {
  ensureMonth(state.currentMonth);
  return state.months[state.currentMonth];
}

function syncWeightInputs() {
  morningWeight.value = state.settings.mealWeights.morning;
  eveningWeight.value = state.settings.mealWeights.evening;
  nightWeight.value = state.settings.mealWeights.night;
}

function persistAndRender(message = "ডাটা সেভড") {
  const ok = saveAppState(state);
  showSaveStatus(ok ? message : "সেভে সমস্যা হয়েছে");
  renderAll();
}

function showSaveStatus(message) {
  saveStatus.textContent = message;
  setTimeout(() => {
    saveStatus.textContent = "ডাটা সেভড";
  }, 1800);
}

function renderAll() {
  renderMemberOptions();
  renderMembers();
  renderMealHistory();
  renderBazarHistory();
  renderSummary();
  renderStats();
}

function renderMemberOptions() {
  const members = getMonthData().members;

  const options = members.length
    ? members.map(member => `<option value="${member.id}">${escapeHtml(member.name)}</option>`).join("")
    : `<option value="">আগে সদস্য যোগ করুন</option>`;

  mealMember.innerHTML = options;
  bazarMember.innerHTML = options;
}

function renderMembers() {
  const members = getMonthData().members;
  memberCountPill.textContent = members.length;
  totalMembersStat.textContent = members.length;

  if (!members.length) {
    membersList.innerHTML = `<div class="empty-state">এখনও কোনো সদস্য যোগ করা হয়নি</div>`;
    return;
  }

  membersList.innerHTML = members.map(member => `
    <div class="member-card">
      <h4>${escapeHtml(member.name)}</h4>
      <div class="member-meta">
        মোবাইল: ${escapeHtml(member.phone || "—")}
      </div>
      <div class="member-actions">
        <button class="btn btn-warning" data-action="edit-member" data-id="${member.id}">Edit</button>
        <button class="btn btn-danger" data-action="delete-member" data-id="${member.id}">Delete</button>
      </div>
    </div>
  `).join("");

  membersList.querySelectorAll("[data-action='delete-member']").forEach(btn => {
    btn.addEventListener("click", () => deleteMember(btn.dataset.id));
  });

  membersList.querySelectorAll("[data-action='edit-member']").forEach(btn => {
    btn.addEventListener("click", () => editMember(btn.dataset.id));
  });
}

function editMember(memberId) {
  const monthData = getMonthData();
  const member = monthData.members.find(m => m.id === memberId);
  if (!member) return;

  const newName = prompt("নতুন নাম দিন", member.name);
  if (newName === null) return;

  const trimmedName = newName.trim();
  if (!trimmedName) {
    alert("নাম ফাঁকা রাখা যাবে না");
    return;
  }

  const newPhone = prompt("নতুন মোবাইল দিন", member.phone || "");
  if (newPhone === null) return;

  member.name = trimmedName;
  member.phone = newPhone.trim();

  persistAndRender("সদস্য update হয়েছে");
}

function deleteMember(memberId) {
  const monthData = getMonthData();

  const usedInMeals = monthData.mealEntries.some(entry => entry.memberId === memberId);
  const usedInBazar = monthData.bazarEntries.some(entry => entry.memberId === memberId);

  if (usedInMeals || usedInBazar) {
    const forceDelete = confirm("এই সদস্যের meal/bazar history আছে। ডিলিট করলে সংশ্লিষ্ট সব entry-ও মুছে যাবে। চালিয়ে যাবেন?");
    if (!forceDelete) return;
  }

  monthData.members = monthData.members.filter(m => m.id !== memberId);
  monthData.mealEntries = monthData.mealEntries.filter(entry => entry.memberId !== memberId);
  monthData.bazarEntries = monthData.bazarEntries.filter(entry => entry.memberId !== memberId);

  persistAndRender("সদস্য delete হয়েছে");
}

function renderMealHistory() {
  const monthData = getMonthData();
  const membersMap = makeMembersMap(monthData.members);

  const sorted = [...monthData.mealEntries].sort((a, b) => a.date.localeCompare(b.date));

  if (!sorted.length) {
    mealTableBody.innerHTML = `<tr><td colspan="7"><div class="empty-state">এই মাসে কোনো meal entry নেই</div></td></tr>`;
    return;
  }

  mealTableBody.innerHTML = sorted.map(entry => `
    <tr>
      <td>${escapeHtml(entry.date)}</td>
      <td>${escapeHtml(membersMap[entry.memberId] || "Unknown")}</td>
      <td>${entry.morning}</td>
      <td>${entry.evening}</td>
      <td>${entry.night}</td>
      <td>${escapeHtml(entry.note || "—")}</td>
      <td>
        <button class="danger-link" data-delete-meal="${entry.id}">Delete</button>
      </td>
    </tr>
  `).join("");

  mealTableBody.querySelectorAll("[data-delete-meal]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.deleteMeal;
      deleteMealEntry(id);
    });
  });
}

function deleteMealEntry(entryId) {
  const ok = confirm("এই meal entry delete করতে চান?");
  if (!ok) return;

  const monthData = getMonthData();
  monthData.mealEntries = monthData.mealEntries.filter(entry => entry.id !== entryId);
  persistAndRender("Meal entry delete হয়েছে");
}

function renderBazarHistory() {
  const monthData = getMonthData();
  const membersMap = makeMembersMap(monthData.members);

  const sorted = [...monthData.bazarEntries].sort((a, b) => a.date.localeCompare(b.date));

  if (!sorted.length) {
    bazarTableBody.innerHTML = `<tr><td colspan="6"><div class="empty-state">এই মাসে কোনো বাজার entry নেই</div></td></tr>`;
    return;
  }

  bazarTableBody.innerHTML = sorted.map(entry => `
    <tr>
      <td>${escapeHtml(entry.date)}</td>
      <td>${escapeHtml(membersMap[entry.memberId] || "Unknown")}</td>
      <td>${formatCurrency(entry.amount)}</td>
      <td>${escapeHtml(entry.items || "—")}</td>
      <td>${escapeHtml(entry.note || "—")}</td>
      <td>
        <button class="danger-link" data-delete-bazar="${entry.id}">Delete</button>
      </td>
    </tr>
  `).join("");

  bazarTableBody.querySelectorAll("[data-delete-bazar]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.deleteBazar;
      deleteBazarEntry(id);
    });
  });
}

function deleteBazarEntry(entryId) {
  const ok = confirm("এই বাজার entry delete করতে চান?");
  if (!ok) return;

  const monthData = getMonthData();
  monthData.bazarEntries = monthData.bazarEntries.filter(entry => entry.id !== entryId);
  persistAndRender("বাজার entry delete হয়েছে");
}

function renderSummary() {
  const monthData = getMonthData();
  const members = monthData.members;
  const weights = state.settings.mealWeights;

  if (!members.length) {
    summaryTableBody.innerHTML = `<tr><td colspan="8"><div class="empty-state">Summary দেখার জন্য আগে সদস্য যোগ করুন</div></td></tr>`;
    return;
  }

  const summary = members.map(member => {
    const memberMeals = monthData.mealEntries.filter(entry => entry.memberId === member.id);
    const memberBazar = monthData.bazarEntries.filter(entry => entry.memberId === member.id);

    const totalMorning = memberMeals.reduce((sum, entry) => sum + entry.morning, 0);
    const totalEvening = memberMeals.reduce((sum, entry) => sum + entry.evening, 0);
    const totalNight = memberMeals.reduce((sum, entry) => sum + entry.night, 0);

    const countedMeals =
      totalMorning * weights.morning +
      totalEvening * weights.evening +
      totalNight * weights.night;

    const bazarPaid = memberBazar.reduce((sum, entry) => sum + entry.amount, 0);

    return {
      memberId: member.id,
      memberName: member.name,
      totalMorning,
      totalEvening,
      totalNight,
      countedMeals,
      bazarPaid
    };
  });

  const totalCountedMeals = summary.reduce((sum, row) => sum + row.countedMeals, 0);
  const totalBazar = summary.reduce((sum, row) => sum + row.bazarPaid, 0);
  const mealRate = totalCountedMeals > 0 ? totalBazar / totalCountedMeals : 0;

  summaryTableBody.innerHTML = summary.map(row => {
    const foodCost = row.countedMeals * mealRate;
    const balance = row.bazarPaid - foodCost;

    return `
      <tr>
        <td>${escapeHtml(row.memberName)}</td>
        <td>${row.totalMorning}</td>
        <td>${row.totalEvening}</td>
        <td>${row.totalNight}</td>
        <td>${round2(row.countedMeals)}</td>
        <td>${formatCurrency(row.bazarPaid)}</td>
        <td>${formatCurrency(foodCost)}</td>
        <td class="${balance >= 0 ? "positive" : "negative"}">
          ${balance >= 0 ? "পাবে " : "দেবে "}
          ${formatCurrency(Math.abs(balance))}
        </td>
      </tr>
    `;
  }).join("");
}

function renderStats() {
  const monthData = getMonthData();
  const weights = state.settings.mealWeights;

  const totalMeals = monthData.mealEntries.reduce((sum, entry) => {
    return sum + (entry.morning * weights.morning) + (entry.evening * weights.evening) + (entry.night * weights.night);
  }, 0);

  const totalBazar = monthData.bazarEntries.reduce((sum, entry) => sum + entry.amount, 0);
  const mealRate = totalMeals > 0 ? totalBazar / totalMeals : 0;

  totalMembersStat.textContent = monthData.members.length;
  totalMealsStat.textContent = round2(totalMeals);
  totalBazarStat.textContent = formatCurrency(totalBazar);
  mealRateStat.textContent = formatCurrency(mealRate);
}

function makeMembersMap(members) {
  return members.reduce((acc, member) => {
    acc[member.id] = member.name;
    return acc;
  }, {});
}

function formatCurrency(amount) {
  return `৳${round2(amount)}`;
}

function round2(num) {
  return Number(num || 0).toFixed(2);
}

function positiveNumber(value, fallback = 1) {
  const n = parseFloat(value);
  if (isNaN(n) || n < 0) return fallback;
  return n;
}

function nonNegativeInt(value) {
  const n = parseInt(value || "0", 10);
  if (isNaN(n) || n < 0) return 0;
  return n;
}

function generateId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function escapeHtml(str = "") {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}