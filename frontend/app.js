// UniTrade Campus Marketplace Frontend Engine
let allListings = [];
let currentListing = null;
let editingListing = null;
let currentUser = null;
let authMode = "login";
const API_BASE = window.location.port === "5000" ? "/api/v1" : "http://localhost:5000/api/v1";

const state = {
  category: "",
  status: "available",
  condition: "",
  search: "",
};

// DOM Elements
const listingsGrid = document.getElementById("listingsGrid");
const emptyState = document.getElementById("emptyState");
const resultsCountLabel = document.getElementById("resultsCountLabel");
const totalListingsCount = document.getElementById("totalListingsCount");
const searchInput = document.getElementById("searchInput");
const clearSearchBtn = document.getElementById("clearSearchBtn");
const categoryPills = document.getElementById("categoryPills");
const statusFilter = document.getElementById("statusFilter");
const conditionFilter = document.getElementById("conditionFilter");
const activeFilterBar = document.getElementById("activeFilterBar");
const activeFilterTags = document.getElementById("activeFilterTags");
const resetFiltersBtn = document.getElementById("resetFiltersBtn");
const emptyResetBtn = document.getElementById("emptyResetBtn");

// Create Modal Elements
const createModal = document.getElementById("createModal");
const openCreateModalBtn = document.getElementById("openCreateModalBtn");
const closeCreateModalBtn = document.getElementById("closeCreateModalBtn");
const cancelCreateBtn = document.getElementById("cancelCreateBtn");
const createListingForm = document.getElementById("createListingForm");
const titleInput = document.getElementById("listingTitle");
const priceInput = document.getElementById("listingPrice");
const categoryInput = document.getElementById("listingCategory");
const conditionInput = document.getElementById("listingCondition");
const sellerInput = document.getElementById("listingSeller");
const createModalTitle = document.getElementById("createModalTitle");
const titleCounter = document.getElementById("titleCounter");
const descInput = document.getElementById("listingDescription");
const descCounter = document.getElementById("descCounter");
const fileDropzone = document.getElementById("fileDropzone");
const fileInput = document.getElementById("listingImageInput");
const dropzonePrompt = document.getElementById("dropzonePrompt");
const dropzonePreview = document.getElementById("dropzonePreview");
const previewImg = document.getElementById("previewImg");
const removePreviewBtn = document.getElementById("removePreviewBtn");

// Detail Modal Elements
const detailModal = document.getElementById("detailModal");
const closeDetailModalBtn = document.getElementById("closeDetailModalBtn");
const detailImg = document.getElementById("detailImg");
const detailStatusPill = document.getElementById("detailStatusPill");
const detailCategory = document.getElementById("detailCategory");
const detailCondition = document.getElementById("detailCondition");
const detailTitle = document.getElementById("detailTitle");
const detailPrice = document.getElementById("detailPrice");
const detailSeller = document.getElementById("detailSeller");
const detailDescription = document.getElementById("detailDescription");
const detailTimestamp = document.getElementById("detailTimestamp");
const setAvailableBtn = document.getElementById("setAvailableBtn");
const setReservedBtn = document.getElementById("setReservedBtn");
const setSoldBtn = document.getElementById("setSoldBtn");
const deleteListingBtn = document.getElementById("deleteListingBtn");
const buyListingBtn = document.getElementById("buyListingBtn");
const editListingBtn = document.getElementById("editListingBtn");
const openAuthModalBtn = document.getElementById("openAuthModalBtn");
const authModal = document.getElementById("authModal");
const closeAuthModalBtn = document.getElementById("closeAuthModalBtn");
const authForm = document.getElementById("authForm");
const registerFields = document.getElementById("registerFields");
const authModalTitle = document.getElementById("authModalTitle");
const toggleAuthModeBtn = document.getElementById("toggleAuthModeBtn");
const submitAuthBtn = document.getElementById("submitAuthBtn");
const accountSummary = document.getElementById("accountSummary");
const openDashboardBtn = document.getElementById("openDashboardBtn");
const logoutBtn = document.getElementById("logoutBtn");
const dashboardModal = document.getElementById("dashboardModal");
const closeDashboardModalBtn = document.getElementById("closeDashboardModalBtn");
const dashboardWelcome = document.getElementById("dashboardWelcome");
const dashboardBalance = document.getElementById("dashboardBalance");
const myListingsList = document.getElementById("myListingsList");
const purchaseHistoryList = document.getElementById("purchaseHistoryList");

// Price Formatting Helper
function formatEGP(price) {
  const num = Number(price);
  if (isNaN(num)) return "0 EGP";
  return `${num.toLocaleString("en-US")} EGP`;
}

// Toast Notifications
const toastContainer = document.getElementById("toastContainer");

function showToast(message, type = "success") {
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${type === "success" ? "✓" : "⚠"}</span> <span>${message}</span>`;
  toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(20px)";
    toast.style.transition = "all 0.3s ease";
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

function authHeaders(headers = {}) {
  const token = localStorage.getItem("unitradeToken");
  return token ? { ...headers, Authorization: `Bearer ${token}` } : headers;
}

function updateAccountUI() {
  const loggedIn = Boolean(currentUser);
  accountSummary.style.display = loggedIn ? "flex" : "none";
  openAuthModalBtn.style.display = loggedIn ? "none" : "inline-flex";
  if (loggedIn) {
    const balance = formatEGP(currentUser.balance || 0);
    openDashboardBtn.textContent = balance;
    dashboardBalance.textContent = balance;
    dashboardWelcome.textContent = `Welcome, ${currentUser.name}`;
  }
}

async function loadCurrentUser() {
  const token = localStorage.getItem("unitradeToken");
  if (!token) return updateAccountUI();
  try {
    const res = await fetch(`${API_BASE}/auth/me`, { headers: authHeaders() });
    const data = await res.json();
    if (data.status === "success") currentUser = data.data.user;
    else localStorage.removeItem("unitradeToken");
  } catch {
    localStorage.removeItem("unitradeToken");
  }
  updateAccountUI();
}

// Fetch Listings from API
async function loadListings() {
  try {
    const params = new URLSearchParams();
    if (state.category) params.append("category", state.category);
    if (state.status) params.append("status", state.status);

    const res = await fetch(`${API_BASE}/listings?${params.toString()}`);
    const data = await res.json();

    if (data.status === "success") {
      allListings = data.data.listings;
      renderFiltered();
    } else {
      showToast("Error loading listings: " + data.message, "error");
    }
  } catch (err) {
    console.error("Failed to load listings:", err);
    showToast("Network error connecting to API", "error");
  }
}

// Render Listings
function renderFiltered() {
  let filtered = [...allListings];

  // Apply condition filter (client-side)
  if (state.condition) {
    filtered = filtered.filter((item) => item.condition === state.condition);
  }

  // Apply search query (client-side)
  if (state.search.trim()) {
    const query = state.search.toLowerCase().trim();
    filtered = filtered.filter((item) => {
      const matchTitle = item.title && item.title.toLowerCase().includes(query);
      const matchDesc = item.description && item.description.toLowerCase().includes(query);
      const matchSeller = item.sellerName && item.sellerName.toLowerCase().includes(query);
      return matchTitle || matchDesc || matchSeller;
    });
  }

  // Update total counts
  totalListingsCount.textContent = allListings.length;
  resultsCountLabel.textContent = `Showing ${filtered.length} of ${allListings.length} items`;

  updateActiveFilterIndicator();

  if (filtered.length === 0) {
    listingsGrid.innerHTML = "";
    emptyState.style.display = "block";
    return;
  }

  emptyState.style.display = "none";
  listingsGrid.innerHTML = filtered.map((item) => createCardHTML(item)).join("");

  // Attach card click handlers
  document.querySelectorAll(".listing-card").forEach((card) => {
    card.addEventListener("click", () => {
      const id = card.getAttribute("data-id");
      openDetailModal(id);
    });
  });
}

function createCardHTML(item) {
  const imgUrl = item.imageUrl
    ? `${API_BASE}/uploads/listings/${item.imageUrl}`
    : "data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22400%22%20height%3D%22300%22%20viewBox%3D%220%200%20400%20300%22%3E%3Crect%20fill%3D%22%23f1f5f9%22%20width%3D%22400%22%20height%3D%22300%22%2F%3E%3Ctext%20fill%3D%22%2394a3b8%22%20font-family%3D%22sans-serif%22%20font-size%3D%2218%22%20x%3D%2250%25%22%20y%3D%2250%25%22%20text-anchor%3D%22middle%22%20dominant-baseline%3D%22middle%22%3ENo%20Image%20Available%3C%2Ftext%3E%3C%2Fsvg%3E";

  const dateFormatted = item.createdAt ? new Date(item.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "Recently";

  return `
    <article class="listing-card" data-id="${item._id}">
      <div class="card-media-wrapper">
        <img class="card-image" src="${imgUrl}" alt="${escapeHtml(item.title)}" loading="lazy" />
        <span class="card-status-badge status-${item.status}">${item.status}</span>
        <span class="card-price-tag">${formatEGP(item.price)}</span>
      </div>
      <div class="card-body">
        <div class="card-meta">
          <span class="tag-category">${escapeHtml(item.category)}</span>
          <span class="tag-condition">${escapeHtml(item.condition)}</span>
        </div>
        <h3 class="card-title">${escapeHtml(item.title)}</h3>
        <p class="card-desc">${escapeHtml(item.description)}</p>
        <div class="card-footer">
          <span class="card-seller">👤 ${escapeHtml(item.sellerName)}</span>
          <span class="card-date">${dateFormatted}</span>
        </div>
      </div>
    </article>
  `;
}

function updateActiveFilterIndicator() {
  const tags = [];
  if (state.category) tags.push(`Category: <strong>${state.category}</strong>`);
  if (state.status) tags.push(`Status: <strong>${state.status}</strong>`);
  if (state.condition) tags.push(`Condition: <strong>${state.condition}</strong>`);
  if (state.search) tags.push(`Query: "<em>${escapeHtml(state.search)}</em>"`);

  if (tags.length > 0) {
    activeFilterBar.style.display = "flex";
    activeFilterTags.innerHTML = tags.map((t) => `<span class="filter-tag">${t}</span>`).join(" ");
  } else {
    activeFilterBar.style.display = "none";
  }
}

// Detail Modal
function openDetailModal(id) {
  const item = allListings.find((x) => String(x._id) === String(id));
  if (!item) return;

  currentListing = item;
  detailTitle.textContent = item.title;
  detailPrice.textContent = formatEGP(item.price);
  detailCategory.textContent = item.category;
  detailCondition.textContent = item.condition;
  detailSeller.textContent = item.sellerName;
  detailDescription.textContent = item.description;

  const date = item.createdAt ? new Date(item.createdAt).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" }) : "Recently";
  detailTimestamp.textContent = `Posted on ${date}`;

  detailStatusPill.textContent = item.status;
  detailStatusPill.className = `detail-status-pill status-${item.status}`;

  const isOwner = currentUser && item.user && String(item.user) === String(currentUser._id);
  buyListingBtn.style.display = item.status === "available" && !isOwner ? "inline-flex" : "none";
  document.querySelector(".detail-actions-panel h4").style.display = isOwner ? "block" : "none";
  document.querySelector(".status-action-buttons").style.display = isOwner ? "flex" : "none";
  document.querySelector(".danger-zone").style.display = isOwner ? "block" : "none";

  if (item.imageUrl) {
    detailImg.src = `${API_BASE}/uploads/listings/${item.imageUrl}`;
    detailImg.style.display = "block";
  } else {
    detailImg.style.display = "none";
  }

  detailModal.style.display = "flex";
}

function closeDetailModal() {
  detailModal.style.display = "none";
  currentListing = null;
}

async function buyCurrentListing() {
  if (!currentListing) return;
  if (!currentUser) return openAuthModal();
  if (!confirm(`Buy "${currentListing.title}" for ${formatEGP(currentListing.price)}?`)) return;
  try {
    const res = await fetch(`${API_BASE}/listings/${currentListing._id}/buy`, {
      method: "POST",
      headers: authHeaders(),
    });
    const data = await res.json();
    if (data.status === "success") {
      showToast("Purchase complete. The seller was credited in EGP.");
      closeDetailModal();
      await loadCurrentUser();
      await loadListings();
    } else showToast(data.message, "error");
  } catch {
    showToast("Failed to complete purchase", "error");
  }
}

// Status Updates via PATCH
async function updateListingStatus(newStatus) {
  if (!currentListing) return;
  try {
    const res = await fetch(`${API_BASE}/listings/${currentListing._id}`, {
      method: "PATCH",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ status: newStatus }),
    });
    const data = await res.json();
    if (data.status === "success") {
      showToast(`Listing marked as ${newStatus}!`);
      closeDetailModal();
      await loadListings();
    } else {
      showToast(data.message, "error");
    }
  } catch (err) {
    showToast("Failed to update status", "error");
  }
}

// Delete Listing
async function deleteCurrentListing() {
  if (!currentListing) return;
  if (!confirm(`Are you sure you want to delete "${currentListing.title}"?`)) return;

  try {
    const res = await fetch(`${API_BASE}/listings/${currentListing._id}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    const data = await res.json();
    if (data.status === "success") {
      showToast("Listing deleted successfully");
      closeDetailModal();
      await loadListings();
    } else {
      showToast(data.message, "error");
    }
  } catch (err) {
    showToast("Failed to delete listing", "error");
  }
}

// Create Listing Submission
createListingForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const submitBtn = document.getElementById("submitCreateBtn");
  submitBtn.disabled = true;
  submitBtn.textContent = "Publishing...";

  try {
    const formData = new FormData(createListingForm);
    const res = await fetch(editingListing ? `${API_BASE}/listings/${editingListing._id}` : `${API_BASE}/listings`, {
      method: editingListing ? "PATCH" : "POST",
      headers: authHeaders(),
      body: formData,
    });
    const data = await res.json();

    if (data.status === "success") {
      showToast(editingListing ? "Listing updated successfully" : "🎉 Listing published to campus marketplace!");
      editingListing = null;
      createListingForm.reset();
      clearImagePreview();
      titleCounter.textContent = "0";
      descCounter.textContent = "0";
      closeCreateModal();
      // Switch status to available if needed to view the new item
      state.status = "available";
      statusFilter.value = "available";
      await loadListings();
    } else {
      showToast(data.message || "Failed to publish listing", "error");
    }
  } catch (err) {
    showToast("Network error publishing listing", "error");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = editingListing ? "Save Changes" : "Publish Listing";
  }
});

// Image preview handlers
fileDropzone.addEventListener("click", () => fileInput.click());
fileInput.addEventListener("change", () => {
  const file = fileInput.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      previewImg.src = e.target.result;
      dropzonePrompt.style.display = "none";
      dropzonePreview.style.display = "block";
    };
    reader.readAsDataURL(file);
  }
});

removePreviewBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  clearImagePreview();
});

function clearImagePreview() {
  fileInput.value = "";
  previewImg.src = "";
  dropzonePreview.style.display = "none";
  dropzonePrompt.style.display = "flex";
}

// Character Counters
titleInput.addEventListener("input", () => {
  titleCounter.textContent = titleInput.value.length;
});
descInput.addEventListener("input", () => {
  descCounter.textContent = descInput.value.length;
});

// Category Pills Handlers
categoryPills.addEventListener("click", (e) => {
  const pill = e.target.closest(".pill");
  if (!pill) return;

  document.querySelectorAll(".pill").forEach((p) => p.classList.remove("active"));
  pill.classList.add("active");

  state.category = pill.getAttribute("data-category") || "";
  loadListings();
});

// Search Input Handler
let searchDebounce = null;
searchInput.addEventListener("input", (e) => {
  const val = e.target.value;
  clearSearchBtn.style.display = val ? "block" : "none";
  clearTimeout(searchDebounce);
  searchDebounce = setTimeout(() => {
    state.search = val;
    renderFiltered();
  }, 200);
});

clearSearchBtn.addEventListener("click", () => {
  searchInput.value = "";
  clearSearchBtn.style.display = "none";
  state.search = "";
  renderFiltered();
});

// Dropdown Filters
statusFilter.addEventListener("change", (e) => {
  state.status = e.target.value;
  loadListings();
});

conditionFilter.addEventListener("change", (e) => {
  state.condition = e.target.value;
  renderFiltered();
});

// Reset Filter Buttons
function resetAllFilters() {
  state.category = "";
  state.status = "";
  state.condition = "";
  state.search = "";
  searchInput.value = "";
  clearSearchBtn.style.display = "none";
  statusFilter.value = "";
  conditionFilter.value = "";
  document.querySelectorAll(".pill").forEach((p) => {
    p.classList.toggle("active", p.getAttribute("data-category") === "");
  });
  loadListings();
}

resetFiltersBtn.addEventListener("click", resetAllFilters);
emptyResetBtn.addEventListener("click", resetAllFilters);

// Modal Controls
openCreateModalBtn.addEventListener("click", () => {
  if (!currentUser) return openAuthModal();
  createModal.style.display = "flex";
});

function closeCreateModal() {
  createModal.style.display = "none";
  editingListing = null;
  createModalTitle.textContent = "Post a New Campus Listing";
  document.getElementById("submitCreateBtn").textContent = "Publish Listing";
}

closeCreateModalBtn.addEventListener("click", closeCreateModal);
cancelCreateBtn.addEventListener("click", closeCreateModal);
closeDetailModalBtn.addEventListener("click", closeDetailModal);

function openAuthModal() {
  authModal.style.display = "flex";
}

function closeAuthModal() {
  authModal.style.display = "none";
}

function setAuthMode(mode) {
  authMode = mode;
  const registering = mode === "register";
  registerFields.style.display = registering ? "block" : "none";
  authModalTitle.textContent = registering ? "Create Student Account" : "Student Login";
  submitAuthBtn.textContent = registering ? "Create account" : "Log in";
  toggleAuthModeBtn.textContent = registering ? "I already have an account" : "Create account";
  document.getElementById("authName").required = registering;
  document.getElementById("authStudentId").required = registering;
}

authForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  submitAuthBtn.disabled = true;
  try {
    const body = Object.fromEntries(new FormData(authForm));
    const res = await fetch(`${API_BASE}/auth/${authMode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (data.status !== "success") return showToast(data.message, "error");
    localStorage.setItem("unitradeToken", data.token);
    currentUser = data.data.user;
    updateAccountUI();
    closeAuthModal();
    authForm.reset();
    showToast(authMode === "register" ? "Student account created" : "Welcome back");
  } catch {
    showToast("Unable to connect to the account service", "error");
  } finally {
    submitAuthBtn.disabled = false;
  }
});

openAuthModalBtn.addEventListener("click", openAuthModal);
closeAuthModalBtn.addEventListener("click", closeAuthModal);
toggleAuthModeBtn.addEventListener("click", () => setAuthMode(authMode === "login" ? "register" : "login"));
logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("unitradeToken");
  currentUser = null;
  updateAccountUI();
  showToast("You have been logged out");
});

async function openDashboard() {
  if (!currentUser) return openAuthModal();
  dashboardModal.style.display = "flex";
  const res = await fetch(`${API_BASE}/listings?myListings=true`, { headers: authHeaders() });
  const data = await res.json();
  const listings = data.data?.listings || [];
  myListingsList.innerHTML = listings.length
    ? listings.map((item) => `<div class="my-listing-row"><span>${escapeHtml(item.title)}</span><strong>${formatEGP(item.price)}</strong><em>${item.status}</em></div>`).join("")
    : "<p>No listings yet. Post your first item to start earning.</p>";
  const purchases = currentUser.purchaseHistory || [];
  purchaseHistoryList.innerHTML = purchases.length
    ? purchases.map((item) => `<div class="my-listing-row"><span>${escapeHtml(item.title)}<small>Seller: ${escapeHtml(item.sellerName)}</small></span><strong>${formatEGP(item.price)}</strong><em>Purchased</em></div>`).join("")
    : "<p>No purchases yet.</p>";
}

openDashboardBtn.addEventListener("click", openDashboard);
closeDashboardModalBtn.addEventListener("click", () => { dashboardModal.style.display = "none"; });

// Close on click outside modal
window.addEventListener("click", (e) => {
  if (e.target === createModal) closeCreateModal();
  if (e.target === detailModal) closeDetailModal();
  if (e.target === authModal) closeAuthModal();
  if (e.target === dashboardModal) dashboardModal.style.display = "none";
});

// Detail Status Buttons
setAvailableBtn.addEventListener("click", () => updateListingStatus("available"));
setReservedBtn.addEventListener("click", () => updateListingStatus("reserved"));
setSoldBtn.addEventListener("click", () => updateListingStatus("sold"));
deleteListingBtn.addEventListener("click", deleteCurrentListing);
buyListingBtn.addEventListener("click", buyCurrentListing);
editListingBtn.addEventListener("click", () => {
  if (!currentListing || !currentUser) return;
  editingListing = currentListing;
  titleInput.value = currentListing.title;
  priceInput.value = currentListing.price;
  categoryInput.value = currentListing.category;
  conditionInput.value = currentListing.condition;
  sellerInput.value = currentListing.sellerName;
  descInput.value = currentListing.description;
  titleCounter.textContent = titleInput.value.length;
  descCounter.textContent = descInput.value.length;
  createModalTitle.textContent = "Edit Campus Listing";
  document.getElementById("submitCreateBtn").textContent = "Save Changes";
  closeDetailModal();
  createModal.style.display = "flex";
});

// Helper to sanitize HTML text
function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Initial Boot
setAuthMode("login");
loadCurrentUser();
loadListings();
