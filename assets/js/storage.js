const COOKIE_NAME = "mess_management_data";
const STORAGE_KEY = "mess_management_full_data_v1";

export function setCookie(name, value, days = 365) {
  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${date.toUTCString()}; path=/; SameSite=Lax`;
}

export function getCookie(name) {
  const target = `${name}=`;
  const cookies = document.cookie.split(";");

  for (let cookie of cookies) {
    cookie = cookie.trim();
    if (cookie.indexOf(target) === 0) {
      return decodeURIComponent(cookie.substring(target.length));
    }
  }
  return null;
}

export function deleteCookie(name) {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax`;
}

export function saveAppState(state) {
  try {
    const fullJson = JSON.stringify(state);
    localStorage.setItem(STORAGE_KEY, fullJson);

    const tinySnapshot = {
      currentMonth: state.currentMonth,
      monthKeys: Object.keys(state.months || {}),
      membersCount: state.months?.[state.currentMonth]?.members?.length || 0,
      updatedAt: new Date().toISOString()
    };

    setCookie(COOKIE_NAME, JSON.stringify(tinySnapshot), 365);
    return true;
  } catch (error) {
    console.error("Save failed:", error);
    return false;
  }
}

export function loadAppState() {
  try {
    const fullJson = localStorage.getItem(STORAGE_KEY);
    if (fullJson) {
      return JSON.parse(fullJson);
    }

    const cookie = getCookie(COOKIE_NAME);
    if (cookie) {
      console.warn("Only cookie snapshot found, full data missing.");
    }
  } catch (error) {
    console.error("Load failed:", error);
  }
  return null;
}

export function clearCurrentMonth(state, monthKey) {
  if (!state.months[monthKey]) return state;
  state.months[monthKey] = {
    members: [],
    mealEntries: [],
    bazarEntries: []
  };
  saveAppState(state);
  return state;
}

export function clearAllAppData() {
  localStorage.removeItem(STORAGE_KEY);
  deleteCookie(COOKIE_NAME);
}