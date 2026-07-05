import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  updatePassword,
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBX77Cw7S3BzGK4BjCi9g8Pe6Kg7WmMY8k",
  authDomain: "gate-database-84r.firebaseapp.com",
  projectId: "gate-database-84r",
  storageBucket: "gate-database-84r.firebasestorage.app",
  messagingSenderId: "404594568504",
  appId: "1:404594568504:web:c67ee2f9e7530ffb14a5cd",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// === 1. User & Global Database ===
let currentUserId = null;
let globalsData = {
  users: {
    "parasfworld07@gmail.com": { displayName: "Paras" },
    "subhashreesatapathy119@gmail.com": { displayName: "Subhashree" },
  },
  usefulLinks: [
    { id: "l1", name: "Gemini", url: "https://gemini.google.com" },
    { id: "l2", name: "YouTube", url: "https://youtube.com" },
  ],
  appTitle: "Project",
};

// === 2. DOM Elements ===
const loginForm = document.getElementById("login-form");
const loginBtnEl = document.getElementById("login-btn-el");
const loginBtnText = loginBtnEl.querySelector(".btn-text");
const loginSpinner = loginBtnEl.querySelector(".loader-spinner");
const loginPage = document.getElementById("login-page");
const dashboardPage = document.getElementById("dashboard-page");
const errorMsg = document.getElementById("error-msg");
const userGreeting = document.getElementById("user-greeting");
const profileInitial = document.getElementById("profile-initial");
const themeBtn = document.getElementById("theme-btn");
const themeIcon = document.getElementById("theme-icon");

// Sidebar Elements
const sidebarWrapper = document.getElementById("sidebar-wrapper");
const toggleSidebarBtn = document.getElementById("toggle-sidebar");
const mobileMenuBtn = document.getElementById("mobile-menu-btn");
const navLinks = document.querySelectorAll(".nav-link[data-target]");
const pageSections = document.querySelectorAll(".page-section");

// Modal Elements

// Dashboard Modal Elements
const dashItemModal = document.getElementById("dash-item-modal");
const cancelDashItemBtn = document.getElementById("cancel-dash-item-btn");
const confirmDashItemBtn = document.getElementById("confirm-dash-item-btn");
const dashItemTitleInput = document.getElementById("dash-item-title-input");
const dashItemDescInput = document.getElementById("dash-item-desc-input");
const dashItemPageTitleInput = document.getElementById(
  "dash-item-page-title-input",
);
const dashItemPageDescInput = document.getElementById(
  "dash-item-page-desc-input",
);
const dashItemModalTitle = document.getElementById("dash-item-modal-title");
const logoutTrigger = document.getElementById("logout-trigger");
const logoutModal = document.getElementById("logout-modal");
const cancelLogoutBtn = document.getElementById("cancel-logout");
const confirmLogoutBtn = document.getElementById("confirm-logout");

// === 3. Login & Logout Logic ===
async function checkSavedLogin() {
  const savedUserId = localStorage.getItem("studyWebUserId");
  if (!savedUserId) return;
  document.getElementById("login-page").style.display = "none";

  try {
    const globalsRef = doc(db, "globals", "data");
    const globalsSnap = await getDoc(globalsRef);
    if (globalsSnap.exists()) {
      globalsData = globalsSnap.data();
    }
  } catch (e) {
    console.error("Failed to load saved login:", e);
  }

  if (globalsData.users && globalsData.users[savedUserId]) {
    currentUserId = savedUserId;
    let modifiedGlobals = false;
    if (!globalsData.users[savedUserId].editPassword) {
      globalsData.users[savedUserId].editPassword = "7890";
      modifiedGlobals = true;
    }
    if (!globalsData.users[savedUserId].usefulLinks) {
      globalsData.users[savedUserId].usefulLinks = globalsData.usefulLinks
        ? [...globalsData.usefulLinks]
        : [
            { id: "l1", name: "Gemini", url: "https://gemini.google.com" },
            { id: "l2", name: "YouTube", url: "https://youtube.com" },
          ];
      modifiedGlobals = true;
    }
    if (modifiedGlobals) {
      updateDoc(doc(db, "globals", "data"), globalsData).catch((e) =>
        console.error(e),
      );
    }

    const userName = globalsData.users[savedUserId].displayName;

    userGreeting.textContent = `Hi, ${userName}`;
    profileInitial.textContent = userName.charAt(0);
    document.getElementById("nav-logo-text").textContent =
      globalsData.appTitle || "Project";

    renderUsefulLinks();
    renderSettingsPage();
    await fetchAndRenderAllSubItems();

    const savedPage = localStorage.getItem("activePage") || "page-item1";
    activatePage(savedPage);

    loginPage.style.display = "none";
    dashboardPage.style.display = "flex";
  } else {
    localStorage.removeItem("studyWebUserId");
    document.getElementById("login-page").style.display = "flex";
  }
}
checkSavedLogin();

async function performLogin() {
  errorMsg.style.display = "none";

  const useridInput = document.getElementById("uid-input").value.trim();
  const passwordInput = document.getElementById("pwd-input").value;

  if (!useridInput || !passwordInput) {
    errorMsg.textContent = "Please fill in all fields.";
    errorMsg.style.display = "block";
    return;
  }

  // Trigger Loading State
  loginBtnText.style.display = "none";
  loginSpinner.style.display = "block";
  loginBtnEl.disabled = true;

  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      useridInput,
      passwordInput,
    );

    const globalsRef = doc(db, "globals", "data");
    const globalsSnap = await getDoc(globalsRef);
    if (globalsSnap.exists()) {
      globalsData = globalsSnap.data();
      if (!globalsData.users) {
        globalsData.users = {
          "parasfworld07@gmail.com": { displayName: "Paras" },
          "subhashreesatapathy119@gmail.com": { displayName: "Subhashree" },
        };
      }
      if (!globalsData.usefulLinks) globalsData.usefulLinks = [];
      if (!globalsData.appTitle) globalsData.appTitle = "Project";
    } else {
      await setDoc(globalsRef, globalsData);
    }

    if (!globalsData.users[useridInput]) {
      globalsData.users[useridInput] = {
        displayName: useridInput.split("@")[0],
      };
    }

    let modifiedGlobals = false;
    if (!globalsData.users[useridInput].editPassword) {
      globalsData.users[useridInput].editPassword = "7890";
      modifiedGlobals = true;
    }
    if (!globalsData.users[useridInput].usefulLinks) {
      globalsData.users[useridInput].usefulLinks = globalsData.usefulLinks
        ? [...globalsData.usefulLinks]
        : [
            { id: "l1", name: "Gemini", url: "https://gemini.google.com" },
            { id: "l2", name: "YouTube", url: "https://youtube.com" },
          ];
      modifiedGlobals = true;
    }

    // Clean up plaintext passwords from globals if they exist (migration step)
    if (globalsData.users[useridInput].password) {
      delete globalsData.users[useridInput].password;
      modifiedGlobals = true;
    }

    if (modifiedGlobals) {
      updateDoc(doc(db, "globals", "data"), globalsData).catch((e) =>
        console.error(e),
      );
    }

    currentUserId = useridInput;
    localStorage.setItem("studyWebUserId", useridInput);
    const userName = globalsData.users[useridInput].displayName;
    userGreeting.textContent = `Hi, ${userName}`;
    profileInitial.textContent = userName.charAt(0);
    document.getElementById("nav-logo-text").textContent =
      globalsData.appTitle;

    renderUsefulLinks();
    renderSettingsPage();
    await fetchAndRenderAllSubItems();

    const savedPage = localStorage.getItem("activePage") || "page-item1";
    activatePage(savedPage);

    loginPage.style.display = "none";
    dashboardPage.style.display = "flex";

    // Reset Button
    loginBtnText.style.display = "block";
    loginSpinner.style.display = "none";
    loginBtnEl.disabled = false;
  } catch (error) {
    console.error("Login failed:", error);
    errorMsg.textContent = "Invalid email or password.";
    errorMsg.style.display = "block";
    loginBtnText.style.display = "block";
    loginSpinner.style.display = "none";
    loginBtnEl.disabled = false;
  }
}

loginBtnEl.addEventListener("click", performLogin);

document.getElementById("uid-input").addEventListener("keydown", (e) => {
  if (e.key === "Enter") performLogin();
});

document.getElementById("pwd-input").addEventListener("keydown", (e) => {
  if (e.key === "Enter") performLogin();
});

// Logout Modal Logic
logoutTrigger.addEventListener("click", () => {
  logoutModal.classList.add("show");
});

cancelLogoutBtn.addEventListener("click", () => {
  logoutModal.classList.remove("show");
});

confirmLogoutBtn.addEventListener("click", () => {
  logoutModal.classList.remove("show");
  dashboardPage.style.display = "none";
  loginPage.style.display = "flex";
  document.getElementById("uid-input").value = "";
  document.getElementById("pwd-input").value = "";
  currentUserId = null;
  localStorage.removeItem("studyWebUserId");
  currentPagesData = {};

  // Reset Edit Mode
  isEditMode = false;
  document.getElementById("edit-mode-banner").style.display = "none";
  renderDashboardItems();
  currentDashboardItems.forEach((item) => renderSubPage(item.id));
  ["page-item2", "page-item3"].forEach(renderResourcePage);
  renderUsefulLinks();
  renderSettingsPage();
});

// === 4. Dark Mode Logic ===
let isDarkMode = localStorage.getItem("darkMode") === "true";
if (isDarkMode) {
  document.body.classList.add("dark-mode");
  themeIcon.innerHTML = `<circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>`;
}

themeBtn.addEventListener("click", () => {
  isDarkMode = !isDarkMode;
  localStorage.setItem("darkMode", isDarkMode);
  document.body.classList.toggle("dark-mode", isDarkMode);
  if (isDarkMode) {
    themeIcon.innerHTML = `<circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>`;
  } else {
    themeIcon.innerHTML = `<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>`;
  }
});

// === 5. Sidebar Toggle Logic ===
let isExpanded = window.innerWidth > 768;
if (!isExpanded) sidebarWrapper.classList.remove("expanded");

function toggleSidebar() {
  isExpanded = !isExpanded;
  if (isExpanded) {
    sidebarWrapper.classList.add("expanded");
  } else {
    sidebarWrapper.classList.remove("expanded");
  }
}

toggleSidebarBtn.addEventListener("click", toggleSidebar);
if (mobileMenuBtn) {
  mobileMenuBtn.addEventListener("click", toggleSidebar);
}

// Close sidebar when clicking outside on mobile
document.addEventListener("click", (e) => {
  if (window.innerWidth <= 768 && isExpanded) {
    if (
      e.target === sidebarWrapper ||
      (!sidebarWrapper.contains(e.target) && !mobileMenuBtn.contains(e.target))
    ) {
      isExpanded = false;
      sidebarWrapper.classList.remove("expanded");
    }
  }

  // Close edit mode banner if expanded and clicked outside
  const editModeBanner = document.getElementById("edit-mode-banner");
  if (
    editModeBanner &&
    editModeBanner.classList.contains("expanded") &&
    !editModeBanner.contains(e.target)
  ) {
    editModeBanner.classList.remove("expanded");
  }
});

// Swipe to open sidebar logic
let touchStartX = 0;
let touchEndX = 0;

document.addEventListener(
  "touchstart",
  (e) => {
    touchStartX = e.changedTouches[0].clientX;
  },
  { passive: true },
);

document.addEventListener(
  "touchend",
  (e) => {
    touchEndX = e.changedTouches[0].clientX;
    handleSwipeGesture();
  },
  { passive: true },
);

function handleSwipeGesture() {
  if (window.innerWidth <= 768) {
    // Swipe Right from the left 40% of the screen to open (avoids native edge back gestures)
    if (touchStartX < window.innerWidth * 0.4 && touchEndX - touchStartX > 50) {
      if (!isExpanded) toggleSidebar();
    }
    // Swipe Left to close
    if (isExpanded && touchStartX - touchEndX > 50) {
      toggleSidebar();
    }
  }
}

let iframeClicked = false;
let isFloating = false;

window.addEventListener("blur", function () {
  setTimeout(() => {
    if (document.activeElement && document.activeElement.tagName === "IFRAME") {
      iframeClicked = true;
    }
  }, 100);
});

// === 6. Dynamic Page Routing ===
function activatePage(targetId, pushState = true) {
  if (targetId && !targetId.startsWith("template-")) {
    localStorage.setItem("activePage", targetId);
  }

  if (pushState) {
    history.pushState({ page: targetId }, "", `#${targetId}`);
  }

  if (window.innerWidth <= 768) {
    isExpanded = false;
    sidebarWrapper.classList.remove("expanded");
  }

  const currentActive = document.querySelector(".page-section.active");
  const wasWatchActive = currentActive && currentActive.id === "template-watch";

  if (wasWatchActive && targetId !== "template-watch" && iframeClicked) {
    isFloating = true;
  }

  // Clear players if navigating away
  if (targetId !== "template-watch") {
    if (isFloating) {
      document
        .getElementById("template-watch")
        .classList.add("floating-active");
      const floatingWrapper = document.getElementById("floating-wrapper");
      if (floatingWrapper) floatingWrapper.classList.add("floating-mode");
    } else {
      document.getElementById("watch-player-container").innerHTML = "";
      document
        .getElementById("template-watch")
        .classList.remove("floating-active");
      const floatingWrapper = document.getElementById("floating-wrapper");
      if (floatingWrapper) {
        floatingWrapper.classList.remove("floating-mode");
        floatingWrapper.style.left = "";
        floatingWrapper.style.top = "";
        floatingWrapper.style.bottom = "";
        floatingWrapper.style.right = "";
      }
    }
  } else {
    isFloating = false;
    iframeClicked = false;
    document
      .getElementById("template-watch")
      .classList.remove("floating-active");
    const floatingWrapper = document.getElementById("floating-wrapper");
    if (floatingWrapper) {
      floatingWrapper.classList.remove("floating-mode");
      floatingWrapper.style.left = "";
      floatingWrapper.style.top = "";
      floatingWrapper.style.bottom = "";
      floatingWrapper.style.right = "";
    }
  }
  if (targetId !== "template-pdf") {
    document.getElementById("pdf-viewer-container").innerHTML = "";
  }

  // Hide all pages
  document
    .querySelectorAll(".page-section")
    .forEach((section) => section.classList.remove("active"));

  // Remove active classes from all nav links
  document.querySelectorAll(".nav-link[data-target]").forEach((link) => {
    link.classList.remove("active");
    link.classList.remove("active-parent");
  });

  // Show target page
  const targetSection = document.getElementById(targetId);
  if (targetSection) targetSection.classList.add("active");

  // Highlight active link
  const activeLink = document.querySelector(
    `.nav-link[data-target="${targetId}"]`,
  );
  if (activeLink) {
    activeLink.classList.add("active");

    // Highlight parent icon if a sub-item is clicked
    const parentId = activeLink.getAttribute("data-parent");
    if (parentId) {
      const parentItem = document.getElementById(parentId);
      parentItem.classList.add("active-parent");
    }
    // Note: The logic that used to close the menus has been entirely deleted here.
  }
}

// Add click events to all sidebar links
// Add click events to all sidebar links AND dashboard cards
let hasNavigatedInApp = false;
// Routing is dynamically attached using reattachNavTriggers()
reattachNavTriggers();

// === 7. Accordion Logic ===
const accordionHeaders = document.querySelectorAll(".accordion-header");

accordionHeaders.forEach((header) => {
  header.addEventListener("click", function () {
    const item = this.parentElement;

    // Prevent action if item is locked
    if (item.classList.contains("locked")) return;

    // Toggle the active state
    item.classList.toggle("active");
  });
});

// === 8. Dynamic Content Actions (Watch & PDF) ===
const actionButtons = document.querySelectorAll(".action-btn");
const dynamicWatchTitle = document.getElementById("dynamic-watch-title");
const dynamicPdfTitle = document.getElementById("dynamic-pdf-title");
const templateBackButtons = document.querySelectorAll(".btn-back-template");

actionButtons.forEach((btn) => {
  btn.addEventListener("click", function () {
    // Read data attached to the specific button
    const actionType = this.getAttribute("data-action");
    const contentTitle = this.getAttribute("data-title");

    // Smart Memory: Find which sub-page the user clicked from
    const parentPageId = this.closest(".page-section").id;

    // Update the Back buttons on the templates to return to that exact page
    templateBackButtons.forEach((backBtn) => {
      backBtn.setAttribute("data-target", parentPageId);
    });

    // Route to the correct template
    if (actionType === "watch") {
      dynamicWatchTitle.textContent = contentTitle;
      hasNavigatedInApp = true;
      activatePage("template-watch");
    } else if (actionType === "pdf") {
      dynamicPdfTitle.textContent = contentTitle;
      hasNavigatedInApp = true;
      activatePage("template-pdf");
    }
  });
});

// === 9. Firebase Edit Mode and Dynamic Sub-Items ===
let isEditMode = false;

const defaultDashboardItems = [
  {
    id: "page-sub1",
    title: "Sub Item 1",
    desc: "View detailed reports and manage your primary objectives for this week.",
    pageTitle: "Sub Item 1: Core Mechanics",
    pageDesc:
      "Master the foundational pillars of mechanics. Focus on theoretical rigor and numerical proficiency.",
  },
  {
    id: "page-sub2",
    title: "Sub Item 2",
    desc: "Access your split-view documents, tables, and ongoing drafts.",
    pageTitle: "Sub Item 2: Operations",
    pageDesc: "Access your operational documents, tables, and ongoing drafts.",
  },
  {
    id: "page-sub3",
    title: "Sub Item 3",
    desc: "Check circular analytics, progress rings, and team performance metrics.",
    pageTitle: "Sub Item 3: Analytics",
    pageDesc:
      "Check circular analytics, progress rings, and team performance metrics.",
  },
  {
    id: "page-sub4",
    title: "Sub Item 4",
    desc: "Review lists, forms, and check off pending tasks from the backlog.",
    pageTitle: "Sub Item 4: Task List",
    pageDesc:
      "Review lists, forms, and check off pending tasks from the backlog.",
  },
];
let currentDashboardItems = [];
let targetDashIndexForAdd = -1;

let currentPagesData = {};
let targetPageForAdd = "";
let targetHIndexForAdd = -1;
let itemToDelete = null;
let itemToEdit = null;

const defaultData = {
  "page-sub1": [
    {
      id: "h1",
      title: "Thermodynamics",
      subtitle: "12 Modules • 45 Questions",
      badge: "HIGH WEIGHTAGE",
      subheadings: [
        {
          id: "sh1",
          title: "Laws of Thermodynamics",
          description: "First and Second Law, Entropy.",
          watch: "Laws of Thermodynamics - Lecture",
          pdf: "Laws of Thermodynamics - Notes",
        },
        {
          id: "sh2",
          title: "Pure Substances",
          description: "P-V-T surfaces, ideal gases.",
          watch: "Pure Substances - Lecture",
          pdf: "Pure Substances - Notes",
        },
      ],
    },
    {
      id: "h2",
      title: "Fluid Mechanics",
      subtitle: "8 Modules • 32 Questions",
      badge: "NUMERICAL",
      subheadings: [
        {
          id: "sh3",
          title: "Fluid Kinematics",
          description: "Velocity and acceleration, stream lines.",
          watch: "Fluid Kinematics - Lecture",
          pdf: "Fluid Kinematics - Notes",
        },
      ],
    },
    {
      id: "h3",
      title: "Strength of Materials",
      subtitle: "10 Modules • 50 Questions",
      badge: "",
      subheadings: [
        {
          id: "sh4",
          title: "Stress and Strain",
          description: "Elastic constants, thermal stresses.",
          watch: "Stress and Strain - Lecture",
          pdf: "Stress and Strain - Notes",
        },
      ],
    },
  ],
  "page-sub2": [
    {
      id: "h4",
      title: "Project Planning",
      subtitle: "5 Modules",
      badge: "",
      subheadings: [
        {
          id: "sh5",
          title: "Drafting Standards",
          description: "ISO Guidelines.",
          watch: "Drafting - Lecture",
          pdf: "Drafting - PDF",
        },
      ],
    },
  ],
  "page-sub3": [
    {
      id: "h5",
      title: "Performance Metrics",
      subtitle: "Data Science",
      badge: "",
      subheadings: [
        {
          id: "sh6",
          title: "Data Visuals",
          description: "Reading charts.",
          watch: "Visuals - Lecture",
          pdf: "Visuals - PDF",
        },
      ],
    },
  ],
  "page-sub4": [
    {
      id: "h6",
      title: "Backlog Management",
      subtitle: "Agile Forms",
      badge: "",
      subheadings: [
        {
          id: "sh7",
          title: "Form Handling",
          description: "Input fields.",
          watch: "Forms - Lecture",
          pdf: "Forms - PDF",
        },
      ],
    },
  ],
  "page-item2": [
    {
      id: "r1",
      title: "Complete Formula Book",
      description: "Comprehensive list of formulas for quick revision.",
      pdf: "Formula Book",
    },
    {
      id: "r2",
      title: "Engineering Mechanics Notes",
      description: "Handwritten notes for core mechanics concepts.",
      pdf: "Mechanics Notes",
    },
  ],
  "page-item3": [
    {
      id: "r3",
      title: "GATE 2023 - Official Paper",
      description: "Afternoon session with complete answer key.",
      pdf: "GATE 2023 Paper",
    },
    {
      id: "r4",
      title: "GATE 2022 - Official Paper",
      description: "Morning session with complete answer key.",
      pdf: "GATE 2022 Paper",
    },
  ],
};

async function fetchAndRenderAllSubItems() {
  if (!currentUserId) return;

  // Fetch Dashboard Items
  try {
    const dashRef = doc(db, "subItems", currentUserId + "_dashboard");
    const dashSnap = await getDoc(dashRef);
    if (dashSnap.exists()) {
      currentDashboardItems = dashSnap.data().items || [];
    } else {
      const clonedDash = JSON.parse(JSON.stringify(defaultDashboardItems));
      await setDoc(dashRef, { items: clonedDash });
      currentDashboardItems = clonedDash;
    }
    renderDashboardItems();
  } catch (e) {
    console.error("Error loading dashboard items", e);
  }

  const pages = [
    "page-sub1",
    "page-sub2",
    "page-sub3",
    "page-sub4",
    "page-item2",
    "page-item3",
  ];
  for (const pageId of pages) {
    try {
      const docRef = doc(db, "subItems", currentUserId + "_" + pageId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        currentPagesData[pageId] = docSnap.data().headings || [];
      } else {
        const clonedData = JSON.parse(JSON.stringify(defaultData[pageId]));
        await setDoc(docRef, { headings: clonedData });
        currentPagesData[pageId] = clonedData;
      }
      if (pageId.startsWith("page-item")) {
        renderResourcePage(pageId);
      } else {
        renderSubPage(pageId);
      }
    } catch (e) {
      console.error("Error loading Firebase data", e);
    }
  }
}

function renderDashboardItems() {
  const sidebarNav = document.getElementById("sidebar-sub-nav");
  const dashboardGrid = document.getElementById("dashboard-grid-container");
  const pagesContainer = document.getElementById("dynamic-pages-container");

  if (sidebarNav) sidebarNav.innerHTML = "";
  if (dashboardGrid) dashboardGrid.innerHTML = "";
  if (pagesContainer) pagesContainer.innerHTML = "";

  currentDashboardItems.forEach((item, index) => {
    // 1. Sidebar Links
    if (sidebarNav) {
      sidebarNav.innerHTML += `
        <li>
          <div class="nav-link sub-link" data-target="${item.id}" data-parent="parent-item1">
            <svg viewBox="0 0 24 24"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>
            <span class="nav-text">${item.title}</span>
          </div>
        </li>
      `;
    }

    // 2. Dashboard Cards
    if (dashboardGrid) {
      let actionsHTML = "";
      if (isEditMode) {
        actionsHTML = `
          <div style="position: absolute; top: 10px; right: 10px; display: flex; gap: 8px; z-index: 10;">
            <button class="btn-cancel action-btn edit-dash-btn" style="padding: 6px 12px; background:#e8f0fe; color:#1a73e8;" data-index="${index}">Edit</button>
            <button class="btn-cancel action-btn del-dash-btn" style="padding: 6px 12px; background:#fce8e8; color:#d9534f;" data-index="${index}">Delete</button>
          </div>
        `;
      }

      dashboardGrid.innerHTML += `
        <div class="dash-card nav-trigger" data-target="${item.id}" data-parent="parent-item1" style="position:relative;">
          ${actionsHTML}
          <div class="card-icon">
            <svg viewBox="0 0 24 24"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>
          </div>
          <h3>${item.title}</h3>
          <p>${item.desc}</p>
          <div class="card-arrow">
            <svg viewBox="0 0 24 24" width="20" height="20"><path d="M5 13h11.17l-4.88 4.88c-.39.39-.39 1.03 0 1.42.39.39 1.02.39 1.41 0l6.59-6.59c.39-.39.39-1.02 0-1.41l-6.58-6.6a.995.995 0 0 0-1.41 0c-.39.39-.39 1.02 0 1.41L16.17 11H5c-.55 0-1 .45-1 1s.45 1 1 1z"/></svg>
          </div>
        </div>
      `;
    }

    // 3. Dynamic Page Sections
    if (pagesContainer) {
      pagesContainer.innerHTML += `
        <section class="page-section" id="${item.id}">
          <button class="nav-trigger btn-back-course" data-target="page-item1">← Back to Dashboard</button>
          <div class="page-header" style="margin-bottom: 30px">
            <h2 style="font-size: 32px; margin-bottom: 10px">${item.pageTitle}</h2>
            <p style="font-size: 16px; max-width: 800px">${item.pageDesc}</p>
          </div>
          <div class="accordion-container" id="container-${item.id}"></div>
        </section>
      `;

      // Also fetch content for this page dynamically if not already loaded
      if (!currentPagesData[item.id] && currentUserId) {
        getDoc(doc(db, "subItems", currentUserId + "_" + item.id)).then(
          (docSnap) => {
            if (docSnap.exists()) {
              currentPagesData[item.id] = docSnap.data().headings || [];
              renderSubPage(item.id);
            }
          },
        );
      }
    }
  });

  if (isEditMode && dashboardGrid) {
    dashboardGrid.innerHTML += `
      <div class="dash-card" id="add-dash-item-btn" style="display:flex; flex-direction:column; align-items:center; justify-content:center; border: 2px dashed var(--border-color); cursor:pointer; min-height: 200px;">
        <div style="font-size: 40px; color: var(--primary); margin-bottom: 10px;">+</div>
        <h3 style="color: var(--primary);">Add Sub Item</h3>
      </div>
    `;
  }

  reattachNavTriggers();

  // Render sub page contents inside the dynamically created sections
  currentDashboardItems.forEach((item) => {
    if (currentPagesData[item.id]) {
      renderSubPage(item.id);
    }
  });

  // Restore the active page since we recreated the dynamic page sections
  const activePageId = localStorage.getItem("activePage") || "page-item1";
  activatePage(activePageId, false);
}

function reattachNavTriggers() {
  const newRoutingTriggers = document.querySelectorAll(
    ".nav-link[data-target]:not(.routed), .nav-trigger[data-target]:not(.routed)",
  );
  newRoutingTriggers.forEach((trigger) => {
    trigger.classList.add("routed");
    trigger.addEventListener("click", function (e) {
      if (e.target.closest(".action-btn")) return; // Prevent navigation if clicking edit/delete buttons
      if (this.style.cursor === "not-allowed") return;
      const target = this.getAttribute("data-target");

      if (
        this.classList.contains("btn-back-course") ||
        this.classList.contains("btn-back-template")
      ) {
        if (hasNavigatedInApp) {
          window.history.back();
          return;
        } else {
          activatePage(target, false);
          history.replaceState({ page: target }, "", `#${target}`);
          return;
        }
      }

      hasNavigatedInApp = true;
      activatePage(target);
    });
  });
}

function renderSubPage(pageId) {
  const container = document.getElementById(`container-${pageId}`);
  if (!container) return;

  const openAccordions = Array.from(
    container.querySelectorAll(".accordion-item"),
  ).map((item) => item.classList.contains("active"));

  container.innerHTML = "";

  const headings = currentPagesData[pageId] || [];

  headings.forEach((heading, hIndex) => {
    const accItem = document.createElement("div");
    accItem.className = "accordion-item";

    let badgeHTML = "";
    if (heading.badge) {
      const isMuted = heading.badge === "NUMERICAL" ? "muted" : "";
      badgeHTML = `<div class="acc-badge ${isMuted}">${heading.badge}</div>`;
    }

    let subheadingsHTML = "";
    (heading.subheadings || []).forEach((sh, shIndex) => {
      subheadingsHTML += `
        <div class="sub-heading-row" style="position:relative; margin-bottom:8px;">
          <div class="sub-heading-info">
            <div class="dot"></div>
            <div>
              <h4>${sh.title}</h4>
              <p>${sh.description}</p>
            </div>
          </div>
          <div class="sub-heading-actions">
            <button class="btn-watch action-btn dyn-action-btn" data-action="watch" data-title="${sh.watch}" data-pdf="${sh.pdf}" data-page="${pageId}">WATCH</button>
            <button class="btn-pdf action-btn dyn-action-btn" data-action="pdf" data-title="${sh.pdf}" data-page="${pageId}">PDF</button>
            ${isEditMode ? `<button class="btn-cancel action-btn edit-sh-btn" style="background:#e8f0fe; color:#1a73e8;" data-page="${pageId}" data-hindex="${hIndex}" data-shindex="${shIndex}">EDIT</button><button class="btn-cancel action-btn del-sh-btn" style="background:#fce8e8; color:#d9534f;" data-page="${pageId}" data-hindex="${hIndex}" data-shindex="${shIndex}">DELETE</button>` : ""}
          </div>
        </div>
      `;
    });

    accItem.innerHTML = `
      <div class="accordion-header">
        <div class="acc-icon-box">
          <svg viewBox="0 0 24 24"><path d="M15 13V5c0-1.66-1.34-3-3-3S9 3.34 9 5v8c-1.21.91-2 2.37-2 4 0 2.76 2.24 5 5 5s5-2.24 5-5c0-1.63-.79-3.09-2-4zm-4-8c0-.55.45-1 1-1s1 .45 1 1v4h-2V5z"/></svg>
        </div>
        <div class="acc-title-group">
          <h3>${heading.title}</h3>
          <span>${heading.subtitle}</span>
        </div>
        ${badgeHTML}
        ${isEditMode ? `<button class="btn-cancel action-btn edit-h-btn" style="background:#e8f0fe; color:#1a73e8; margin-right:5px;" data-page="${pageId}" data-hindex="${hIndex}">EDIT</button><button class="btn-cancel action-btn del-h-btn" style="background:#fce8e8; color:#d9534f; margin-right:15px;" data-page="${pageId}" data-hindex="${hIndex}">DELETE</button>` : ""}
        <div class="acc-toggle">
          <svg viewBox="0 0 24 24"><path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z"/></svg>
        </div>
      </div>
      <div class="accordion-body">
        <div class="accordion-content-inner">
          ${subheadingsHTML}
          ${
            isEditMode
              ? `
          <div style="margin-top:10px;">
            <button class="btn-watch action-btn add-sh-btn" style="background:var(--primary); border:none; width:100%; justify-content:center; color:white;" data-page="${pageId}" data-hindex="${hIndex}">+ Add Sub Heading</button>
          </div>`
              : ""
          }
        </div>
      </div>
    `;

    const accHeader = accItem.querySelector(".accordion-header");
    accHeader.addEventListener("click", function (e) {
      if (e.target.closest("button")) return;
      accItem.classList.toggle("active");
    });

    container.appendChild(accItem);
  });

  container.querySelectorAll(".accordion-item").forEach((item, index) => {
    if (openAccordions[index]) item.classList.add("active");
  });

  if (isEditMode) {
    const addHeadingDiv = document.createElement("div");
    addHeadingDiv.style.marginTop = "20px";
    addHeadingDiv.innerHTML = `<button class="btn-watch action-btn add-h-btn" style="background:var(--primary); border:none; width:100%; justify-content:center; padding:15px; font-size:14px; color:white;" data-page="${pageId}">+ Add Heading</button>`;
    container.appendChild(addHeadingDiv);
  }
}

function renderResourcePage(pageId) {
  const container = document.getElementById(`container-${pageId}`);
  if (!container) return;
  container.innerHTML = "";

  const resources = currentPagesData[pageId] || [];

  resources.forEach((res, rIndex) => {
    const row = document.createElement("div");
    row.className = "sub-heading-row";
    row.innerHTML = `
      <div class="sub-heading-info">
        <div class="dot"></div>
        <div>
          <h4 style="font-size: 18px">${res.title}</h4>
          <p>${res.description}</p>
        </div>
      </div>
      <div class="sub-heading-actions">
        <button class="btn-pdf action-btn dyn-action-btn" data-action="pdf" data-title="${res.pdf}" data-page="${pageId}">
          <svg viewBox="0 0 24 24"><path d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8.5 7.5c0 .83-.67 1.5-1.5 1.5H9v2H7.5V7H10c.83 0 1.5.67 1.5 1.5v1zm5 2c0 .83-.67 1.5-1.5 1.5h-2.5V7H15c.83 0 1.5.67 1.5 1.5v3zm4-3H19v1h1.5V11H19v2h-1.5V7h3v1.5zM9 9.5h1v-1H9v1zM14 11.5h1v-3h-1v3zM4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6z"/></svg>
          VIEW PDF
        </button>
        ${isEditMode ? `<button class="btn-cancel action-btn edit-res-btn" style="background:#e8f0fe; color:#1a73e8;" data-page="${pageId}" data-rindex="${rIndex}">EDIT</button><button class="btn-cancel action-btn del-res-btn" style="background:#fce8e8; color:#d9534f;" data-page="${pageId}" data-rindex="${rIndex}">DELETE</button>` : ""}
      </div>
    `;
    container.appendChild(row);
  });

  if (isEditMode) {
    const addResDiv = document.createElement("div");
    addResDiv.style.marginTop = "20px";
    addResDiv.innerHTML = `<button class="btn-watch action-btn add-res-btn" style="background:var(--primary); border:none; width:100%; justify-content:center; padding:15px; font-size:14px; color:white;" data-page="${pageId}">+ Add Resource</button>`;
    container.appendChild(addResDiv);
  }
}

function renderUsefulLinks() {
  const container = document.getElementById("useful-links-grid");
  if (!container) return;
  container.innerHTML = "";

  const links = globalsData.users[currentUserId]?.usefulLinks || [];
  links.forEach((link, index) => {
    const a = document.createElement("a");
    a.href = link.url;
    a.target = "_blank";
    a.className = "useful-link-item";
    a.innerHTML = `
      <svg viewBox="0 0 24 24"><path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/></svg>
      <span>${link.name}</span>
    `;
    if (isEditMode) {
      const actions = document.createElement("div");
      actions.style.position = "absolute";
      actions.style.top = "5px";
      actions.style.right = "5px";
      actions.style.display = "flex";
      actions.style.gap = "5px";
      actions.innerHTML = `
        <button class="btn-cancel action-btn edit-link-btn" style="padding: 6px; background:#e8f0fe; color:#1a73e8; border-radius: 50%; min-width:unset; height:auto; display:flex; align-items:center; justify-content:center; box-shadow: 0 2px 4px rgba(0,0,0,0.1);" data-index="${index}" title="Edit Link">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" style="pointer-events: none;"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
        </button>
      `;
      a.style.position = "relative";
      a.appendChild(actions);

      // Prevent link navigation if clicking buttons
      a.addEventListener("click", (e) => {
        if (e.target.closest("button")) e.preventDefault();
      });
    }
    container.appendChild(a);
  });

  if (isEditMode) {
    const addBtn = document.createElement("button");
    addBtn.className = "btn-watch action-btn add-link-btn add-useful-link-btn";
    addBtn.style =
      "background:var(--primary); border:none; justify-content:center; color:white; grid-column: 1 / -1; padding: 12px; margin-bottom: 80px;";
    addBtn.textContent = "+ Add Useful Link";
    container.appendChild(addBtn);
  }
}

function renderSettingsPage() {
  const container = document.getElementById("settings-container");
  if (!container) return;

  if (!isEditMode) {
    container.innerHTML = `
      <div class="input-group" style="text-align: left;">
        <label>App Title (Projects)</label>
        <div style="padding: 10px; background: var(--bg-color); border: 1px solid var(--border-color); border-radius: 8px; color: var(--text-main);">${globalsData.appTitle}</div>
      </div>
      <div class="input-group" style="text-align: left;">
        <label>Your Email ID</label>
        <div style="padding: 10px; background: var(--bg-color); border: 1px solid var(--border-color); border-radius: 8px; color: var(--text-main);">${currentUserId || ""}</div>
      </div>
      <div class="input-group" style="text-align: left;">
        <label>Your Display Name</label>
        <div style="padding: 10px; background: var(--bg-color); border: 1px solid var(--border-color); border-radius: 8px; color: var(--text-main);">${globalsData.users[currentUserId]?.displayName || ""}</div>
      </div>
      <div class="input-group" style="text-align: left;">
        <label>Your Edit Password</label>
        <div style="padding: 10px; background: var(--bg-color); border: 1px solid var(--border-color); border-radius: 8px; color: var(--text-main);">••••••</div>
      </div>
    `;
  } else {
    container.innerHTML = `
      <div class="input-group" style="text-align: left;">
        <label>App Title (Projects)</label>
        <input type="text" id="setting-app-title" value="${globalsData.appTitle}" style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid var(--border-color); background-color: var(--bg-color); color: var(--text-main);" />
      </div>
      <div class="input-group" style="text-align: left;">
        <label>Your Email ID</label>
        <input type="text" id="setting-user-id" value="${currentUserId || ""}" style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid var(--border-color); background-color: var(--bg-color); color: var(--text-main);" readonly title="Email cannot be changed here." />
      </div>
      <div class="input-group" style="text-align: left;">
        <label>Your Display Name</label>
        <input type="text" id="setting-display-name" value="${globalsData.users[currentUserId]?.displayName || ""}" style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid var(--border-color); background-color: var(--bg-color); color: var(--text-main);" />
      </div>
      <div class="input-group" style="text-align: left;">
        <label>Change Login Password (optional)</label>
        <input type="text" id="setting-password" placeholder="Leave blank to keep current" style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid var(--border-color); background-color: var(--bg-color); color: var(--text-main);" />
      </div>
      <div class="input-group" style="text-align: left;">
        <label>Your Edit Password</label>
        <input type="text" id="setting-edit-password" value="${globalsData.users[currentUserId]?.editPassword || ""}" style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid var(--border-color); background-color: var(--bg-color); color: var(--text-main);" />
      </div>
      <button id="save-settings-btn" class="btn-confirm" style="background: var(--primary); color: white; padding: 12px; margin-top: 10px;">Save Settings</button>
      <div id="settings-error-msg" style="color: var(--error-text); display: none; margin-top: 10px; font-size: 14px;"></div>
    `;

    document
      .getElementById("save-settings-btn")
      .addEventListener("click", async () => {
        const errorMsgEl = document.getElementById("settings-error-msg");
        errorMsgEl.style.display = "none";

        const newTitle = document
          .getElementById("setting-app-title")
          .value.trim();
        const newName = document
          .getElementById("setting-display-name")
          .value.trim();
        const newPass = document
          .getElementById("setting-password")
          .value.trim();
        const newEditPass = document
          .getElementById("setting-edit-password")
          .value.trim();

        if (newTitle) globalsData.appTitle = newTitle;
        if (newName) globalsData.users[currentUserId].displayName = newName;
        if (newEditPass)
          globalsData.users[currentUserId].editPassword = newEditPass;

        try {
          if (newPass) {
            await updatePassword(auth.currentUser, newPass);
          }
          await updateDoc(doc(db, "globals", "data"), globalsData);

          // Update UI elements
          document.getElementById("nav-logo-text").textContent =
            globalsData.appTitle;
          const userGreeting = document.getElementById("user-greeting");
          const profileInitial = document.getElementById("profile-initial");
          userGreeting.textContent = `Hi, ${globalsData.users[currentUserId].displayName}`;
          profileInitial.textContent =
            globalsData.users[currentUserId].displayName.charAt(0);

          const btn = document.getElementById("save-settings-btn");
          btn.textContent = "Saved!";
          document.getElementById("setting-password").value = ""; // clear password field
          setTimeout(() => (btn.textContent = "Save Settings"), 2000);
        } catch (error) {
          errorMsgEl.textContent = "Failed to save: " + error.message;
          errorMsgEl.style.display = "block";
        }
      });
  }
}

document.addEventListener("click", async (e) => {
  const dynBtn = e.target.closest(".dyn-action-btn");
  if (dynBtn) {
    const actionType = dynBtn.getAttribute("data-action");
    const contentTitle = dynBtn.getAttribute("data-title");
    const parentPageId = dynBtn.getAttribute("data-page");

    document
      .querySelectorAll(".btn-back-template")
      .forEach((btn) => btn.setAttribute("data-target", parentPageId));

    if (actionType === "watch") {
      const playerContainer = document.getElementById("watch-player-container");
      const pdfContainer = document.getElementById("watch-pdf-container");
      const pdfUrl = dynBtn.getAttribute("data-pdf") || "";

      if (pdfUrl && window.innerWidth <= 768) {
        let safePdfUrl = pdfUrl;
        if (
          safePdfUrl.includes("drive.google.com") &&
          safePdfUrl.includes("/view")
        ) {
          safePdfUrl = safePdfUrl.replace(/\/view.*$/, "/preview");
        }
        pdfContainer.innerHTML = `<iframe src="${safePdfUrl}" width="100%" height="100%" style="border:none;" allowfullscreen></iframe>`;
        pdfContainer.classList.add("has-pdf");
      } else {
        if (pdfContainer) {
          pdfContainer.innerHTML = "";
          pdfContainer.classList.remove("has-pdf");
        }
      }
      hasNavigatedInApp = true;
      if (contentTitle.includes("<iframe")) {
        playerContainer.innerHTML = contentTitle;
      } else if (
        contentTitle.includes("youtube.com") ||
        contentTitle.includes("youtu.be")
      ) {
        let videoId = "";
        if (contentTitle.includes("v="))
          videoId = contentTitle.split("v=")[1].split("&")[0];
        else if (contentTitle.includes("youtu.be/"))
          videoId = contentTitle.split("youtu.be/")[1].split("?")[0];
        else if (contentTitle.includes("/embed/"))
          videoId = contentTitle.split("/embed/")[1].split("?")[0];
        else if (contentTitle.includes("/shorts/"))
          videoId = contentTitle.split("/shorts/")[1].split("?")[0];

        if (videoId) {
          const origin =
            window.location.protocol === "file:"
              ? "?origin=http://localhost"
              : "";
          playerContainer.innerHTML = `<iframe width="100%" height="100%" src="https://www.youtube-nocookie.com/embed/${videoId}${origin}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
        } else {
          playerContainer.innerHTML = "Invalid YouTube URL";
        }
      } else if (contentTitle.includes("drive.google.com")) {
        let safeUrl = contentTitle;
        if (safeUrl.includes("/view")) {
          safeUrl = safeUrl.replace(/\/view.*$/, "/preview");
        }
        playerContainer.innerHTML = `<iframe src="${safeUrl}" width="100%" height="100%" style="border:none;" allowfullscreen></iframe>`;
      } else {
        playerContainer.innerHTML = `<p>${contentTitle || "No video linked"}</p>`;
      }
      activatePage("template-watch");
    } else if (actionType === "pdf") {
      const pdfContainer = document.getElementById("pdf-viewer-container");
      const newTabBtn = document.getElementById("pdf-new-tab-btn");
      if (newTabBtn) {
        newTabBtn.href = contentTitle || "#";
      }

      if (!contentTitle) {
        pdfContainer.innerHTML = `<p>No PDF is attached here.</p>`;
      } else {
        let safeUrl = contentTitle;
        if (safeUrl.includes("drive.google.com") && safeUrl.includes("/view")) {
          safeUrl = safeUrl.replace(/\/view.*$/, "/preview");
        }
        pdfContainer.innerHTML = `<iframe src="${safeUrl}" width="100%" height="100%" style="border:none;" allowfullscreen></iframe>`;
      }
      hasNavigatedInApp = true;
      activatePage("template-pdf");
    }
  }

  const delHBtn = e.target.closest(".del-h-btn");
  if (delHBtn) {
    itemToDelete = {
      type: "h",
      pageId: delHBtn.getAttribute("data-page"),
      hIndex: parseInt(delHBtn.getAttribute("data-hindex")),
    };
    document.getElementById("delete-confirm-modal").classList.add("show");
  }

  const delShBtn = e.target.closest(".del-sh-btn");
  if (delShBtn) {
    itemToDelete = {
      type: "sh",
      pageId: delShBtn.getAttribute("data-page"),
      hIndex: parseInt(delShBtn.getAttribute("data-hindex")),
      shIndex: parseInt(delShBtn.getAttribute("data-shindex")),
    };
    document.getElementById("delete-confirm-modal").classList.add("show");
  }

  const delResBtn = e.target.closest(".del-res-btn");
  if (delResBtn) {
    itemToDelete = {
      type: "r",
      pageId: delResBtn.getAttribute("data-page"),
      rIndex: parseInt(delResBtn.getAttribute("data-rindex")),
    };
    document.getElementById("delete-confirm-modal").classList.add("show");
  }

  const addLinkBtn = e.target.closest(".add-link-btn");
  if (addLinkBtn) {
    itemToEdit = null;
    document.getElementById("link-name-input").value = "";
    document.getElementById("link-url-input").value = "";
    document.getElementById("link-modal-title").textContent = "Add Useful Link";
    document.getElementById("delete-link-btn").style.display = "none";
    document.getElementById("link-modal").classList.add("show");
  }

  const editLinkBtn = e.target.closest(".edit-link-btn");
  if (editLinkBtn) {
    const lIndex = parseInt(editLinkBtn.getAttribute("data-index"));
    itemToEdit = { type: "l", lIndex };
    const link = globalsData.users[currentUserId].usefulLinks[lIndex];
    document.getElementById("link-name-input").value = link.name;
    document.getElementById("link-url-input").value = link.url;
    document.getElementById("link-modal-title").textContent =
      "Edit Useful Link";
    document.getElementById("delete-link-btn").style.display = "block";
    document.getElementById("link-modal").classList.add("show");
  }

  const addHBtn = e.target.closest(".add-h-btn");
  if (addHBtn) {
    itemToEdit = null;
    targetPageForAdd = addHBtn.getAttribute("data-page");
    document.getElementById("heading-title-input").value = "";
    document.getElementById("heading-subtitle-input").value = "";
    document.getElementById("heading-modal-title").textContent =
      "Add New Heading";
    document.getElementById("heading-modal").classList.add("show");
  }

  const editHBtn = e.target.closest(".edit-h-btn");
  if (editHBtn) {
    const pageId = editHBtn.getAttribute("data-page");
    const hIndex = parseInt(editHBtn.getAttribute("data-hindex"));
    itemToEdit = { type: "h", pageId, hIndex };
    const hData = currentPagesData[pageId][hIndex];
    document.getElementById("heading-title-input").value = hData.title;
    document.getElementById("heading-subtitle-input").value =
      hData.subtitle || "";
    document.getElementById("heading-modal-title").textContent = "Edit Heading";
    document.getElementById("heading-modal").classList.add("show");
  }

  const addShBtn = e.target.closest(".add-sh-btn");
  if (addShBtn) {
    itemToEdit = null;
    targetPageForAdd = addShBtn.getAttribute("data-page");
    targetHIndexForAdd = parseInt(addShBtn.getAttribute("data-hindex"));
    document.getElementById("subheading-title-input").value = "";
    document.getElementById("subheading-desc-input").value = "";
    document.getElementById("subheading-watch-input").value = "";
    document.getElementById("subheading-pdf-input").value = "";
    document.getElementById("subheading-modal-title").textContent =
      "Add Sub Heading";
    document.getElementById("subheading-modal").classList.add("show");
  }

  const editShBtn = e.target.closest(".edit-sh-btn");
  if (editShBtn) {
    const pageId = editShBtn.getAttribute("data-page");
    const hIndex = parseInt(editShBtn.getAttribute("data-hindex"));
    const shIndex = parseInt(editShBtn.getAttribute("data-shindex"));
    itemToEdit = { type: "sh", pageId, hIndex, shIndex };
    const shData = currentPagesData[pageId][hIndex].subheadings[shIndex];
    document.getElementById("subheading-title-input").value = shData.title;
    document.getElementById("subheading-desc-input").value =
      shData.description || "";
    document.getElementById("subheading-watch-input").value =
      shData.watch || "";
    document.getElementById("subheading-pdf-input").value = shData.pdf || "";
    document.getElementById("subheading-modal-title").textContent =
      "Edit Sub Heading";
    document.getElementById("subheading-modal").classList.add("show");
  }

  const addResBtn = e.target.closest(".add-res-btn");
  if (addResBtn) {
    itemToEdit = null;
    targetPageForAdd = addResBtn.getAttribute("data-page");
    document.getElementById("resource-title-input").value = "";
    document.getElementById("resource-desc-input").value = "";
    document.getElementById("resource-pdf-input").value = "";
    document.getElementById("resource-modal-title").textContent =
      "Add Resource";
    document.getElementById("resource-modal").classList.add("show");
  }

  const editResBtn = e.target.closest(".edit-res-btn");
  if (editResBtn) {
    const pageId = editResBtn.getAttribute("data-page");
    const rIndex = parseInt(editResBtn.getAttribute("data-rindex"));
    itemToEdit = { type: "r", pageId, rIndex };
    const rData = currentPagesData[pageId][rIndex];
    document.getElementById("resource-title-input").value = rData.title;
    document.getElementById("resource-desc-input").value =
      rData.description || "";
    document.getElementById("resource-pdf-input").value = rData.pdf || "";
    document.getElementById("resource-modal-title").textContent =
      "Edit Resource";
    document.getElementById("resource-modal").classList.add("show");
  }
});

const editModeBtn = document.getElementById("edit-mode-btn");
const editPasswordModal = document.getElementById("edit-password-modal");
const cancelEditBtn = document.getElementById("cancel-edit-btn");
const confirmEditBtn = document.getElementById("confirm-edit-btn");
const editPasswordInput = document.getElementById("edit-key-input");
const editErrorMsg = document.getElementById("edit-error-msg");
const editModeBanner = document.getElementById("edit-mode-banner");
const exitEditModeBtn = document.getElementById("exit-edit-mode-btn");

editModeBtn.addEventListener("click", () => {
  if (isEditMode) {
    document.getElementById("alert-modal-title").textContent = "Notice";
    document.getElementById("alert-modal-text").textContent =
      "You are already in Edit Mode.";
    document.getElementById("alert-modal").classList.add("show");
    return;
  }
  editPasswordInput.value = "";
  editErrorMsg.style.display = "none";
  editPasswordModal.classList.add("show");
});

document.getElementById("close-alert-btn").addEventListener("click", () => {
  document.getElementById("alert-modal").classList.remove("show");
});

cancelEditBtn.addEventListener("click", () => {
  editPasswordModal.classList.remove("show");
});

confirmEditBtn.addEventListener("click", () => {
  const userEditPass = globalsData.users[currentUserId]?.editPassword || "7890";
  if (editPasswordInput.value === userEditPass) {
    isEditMode = true;
    editPasswordModal.classList.remove("show");
    editModeBanner.style.display = "flex";
    editModeBanner.classList.remove("expanded");
    renderDashboardItems();
    currentDashboardItems.forEach((item) => renderSubPage(item.id));
    ["page-item2", "page-item3"].forEach(renderResourcePage);
    renderUsefulLinks();
    renderSettingsPage();
  } else {
    editErrorMsg.style.display = "block";
  }
});

document
  .getElementById("edit-mode-banner-icon")
  .addEventListener("click", () => {
    editModeBanner.classList.toggle("expanded");
  });

exitEditModeBtn.addEventListener("click", (e) => {
  e.stopPropagation(); // prevent toggling the banner
  document.getElementById("exit-confirm-modal").classList.add("show");
});

document.getElementById("cancel-exit-btn").addEventListener("click", () => {
  document.getElementById("exit-confirm-modal").classList.remove("show");
});

document.getElementById("confirm-exit-btn").addEventListener("click", () => {
  document.getElementById("exit-confirm-modal").classList.remove("show");

  const overlay = document.getElementById("saving-overlay");
  overlay.style.display = "flex";

  setTimeout(() => {
    overlay.style.display = "none";
    isEditMode = false;
    editModeBanner.style.display = "none";
    editModeBanner.classList.remove("expanded");
    renderDashboardItems();
    currentDashboardItems.forEach((item) => renderSubPage(item.id));
    ["page-item2", "page-item3"].forEach(renderResourcePage);
    renderUsefulLinks();
    renderSettingsPage();
  }, 1500);
});

document.getElementById("cancel-delete-btn").addEventListener("click", () => {
  document.getElementById("delete-confirm-modal").classList.remove("show");
  itemToDelete = null;
});

document
  .getElementById("confirm-delete-btn")
  .addEventListener("click", async () => {
    if (itemToDelete) {
      const { type, pageId, hIndex, shIndex, rIndex } = itemToDelete;
      if (type === "dash") {
        currentDashboardItems.splice(itemToDelete.idx, 1);
        await setDoc(doc(db, "subItems", currentUserId + "_dashboard"), {
          items: currentDashboardItems,
        });
        renderDashboardItems();
        document
          .getElementById("delete-confirm-modal")
          .classList.remove("show");
        return;
      } else if (type === "h") {
        currentPagesData[pageId].splice(hIndex, 1);
      } else if (type === "sh") {
        currentPagesData[pageId][hIndex].subheadings.splice(shIndex, 1);
      } else if (type === "r") {
        currentPagesData[pageId].splice(rIndex, 1);
      } else if (type === "l") {
        globalsData.users[currentUserId].usefulLinks.splice(
          itemToDelete.lIndex,
          1,
        );
        await updateDoc(doc(db, "globals", "data"), {
          users: globalsData.users,
        });
        renderUsefulLinks();
        document
          .getElementById("delete-confirm-modal")
          .classList.remove("show");
        itemToDelete = null;
        return;
      }
      await updateDoc(doc(db, "subItems", currentUserId + "_" + pageId), {
        headings: currentPagesData[pageId],
      });
      if (pageId.startsWith("page-item")) renderResourcePage(pageId);
      else renderSubPage(pageId);
      document.getElementById("delete-confirm-modal").classList.remove("show");
      itemToDelete = null;
    }
  });

document.getElementById("cancel-heading-btn").addEventListener("click", () => {
  document.getElementById("heading-modal").classList.remove("show");
});

document
  .getElementById("confirm-heading-btn")
  .addEventListener("click", async () => {
    const title = document.getElementById("heading-title-input").value.trim();
    const subtitle = document
      .getElementById("heading-subtitle-input")
      .value.trim();
    if (!title) return;

    if (itemToEdit && itemToEdit.type === "h") {
      currentPagesData[itemToEdit.pageId][itemToEdit.hIndex].title = title;
      currentPagesData[itemToEdit.pageId][itemToEdit.hIndex].subtitle =
        subtitle;
      await updateDoc(
        doc(db, "subItems", currentUserId + "_" + itemToEdit.pageId),
        {
          headings: currentPagesData[itemToEdit.pageId],
        },
      );
      document.getElementById("heading-modal").classList.remove("show");
      renderSubPage(itemToEdit.pageId);
      itemToEdit = null;
    } else {
      const newHeading = {
        id: "h" + Date.now(),
        title: title,
        subtitle: subtitle,
        badge: "",
        subheadings: [],
      };
      currentPagesData[targetPageForAdd].push(newHeading);
      await updateDoc(
        doc(db, "subItems", currentUserId + "_" + targetPageForAdd),
        {
          headings: currentPagesData[targetPageForAdd],
        },
      );
      document.getElementById("heading-modal").classList.remove("show");
      renderSubPage(targetPageForAdd);
    }
  });

document
  .getElementById("cancel-subheading-btn")
  .addEventListener("click", () => {
    document.getElementById("subheading-modal").classList.remove("show");
  });

document
  .getElementById("confirm-subheading-btn")
  .addEventListener("click", async () => {
    const title = document
      .getElementById("subheading-title-input")
      .value.trim();
    const desc = document.getElementById("subheading-desc-input").value.trim();
    const watch = document
      .getElementById("subheading-watch-input")
      .value.trim();
    const pdfUrl = document.getElementById("subheading-pdf-input").value.trim();

    if (!title) return;

    if (itemToEdit && itemToEdit.type === "sh") {
      const sh =
        currentPagesData[itemToEdit.pageId][itemToEdit.hIndex].subheadings[
          itemToEdit.shIndex
        ];
      sh.title = title;
      sh.description = desc;
      sh.watch = watch;
      sh.pdf = pdfUrl;
      await updateDoc(
        doc(db, "subItems", currentUserId + "_" + itemToEdit.pageId),
        {
          headings: currentPagesData[itemToEdit.pageId],
        },
      );
      document.getElementById("subheading-modal").classList.remove("show");
      renderSubPage(itemToEdit.pageId);
      itemToEdit = null;
    } else {
      const newSubheading = {
        id: "sh" + Date.now(),
        title: title,
        description: desc,
        watch: watch,
        pdf: pdfUrl,
      };
      currentPagesData[targetPageForAdd][targetHIndexForAdd].subheadings =
        currentPagesData[targetPageForAdd][targetHIndexForAdd].subheadings ||
        [];
      currentPagesData[targetPageForAdd][targetHIndexForAdd].subheadings.push(
        newSubheading,
      );
      await updateDoc(
        doc(db, "subItems", currentUserId + "_" + targetPageForAdd),
        {
          headings: currentPagesData[targetPageForAdd],
        },
      );
      document.getElementById("subheading-modal").classList.remove("show");
      renderSubPage(targetPageForAdd);
    }
  });

document.getElementById("cancel-resource-btn").addEventListener("click", () => {
  document.getElementById("resource-modal").classList.remove("show");
});

document
  .getElementById("confirm-resource-btn")
  .addEventListener("click", async () => {
    const title = document.getElementById("resource-title-input").value.trim();
    const desc = document.getElementById("resource-desc-input").value.trim();
    const pdfUrl = document.getElementById("resource-pdf-input").value.trim();

    if (!title) return;

    if (itemToEdit && itemToEdit.type === "r") {
      const res = currentPagesData[itemToEdit.pageId][itemToEdit.rIndex];
      res.title = title;
      res.description = desc;
      res.pdf = pdfUrl;
      await updateDoc(
        doc(db, "subItems", currentUserId + "_" + itemToEdit.pageId),
        {
          headings: currentPagesData[itemToEdit.pageId],
        },
      );
      document.getElementById("resource-modal").classList.remove("show");
      renderResourcePage(itemToEdit.pageId);
      itemToEdit = null;
    } else {
      const newResource = {
        id: "r" + Date.now(),
        title: title,
        description: desc,
        pdf: pdfUrl,
      };
      currentPagesData[targetPageForAdd].push(newResource);
      await updateDoc(
        doc(db, "subItems", currentUserId + "_" + targetPageForAdd),
        {
          headings: currentPagesData[targetPageForAdd],
        },
      );
      document.getElementById("resource-modal").classList.remove("show");
      renderResourcePage(targetPageForAdd);
    }
  });

document.getElementById("cancel-link-btn").addEventListener("click", () => {
  document.getElementById("link-modal").classList.remove("show");
});

document.getElementById("delete-link-btn").addEventListener("click", () => {
  if (itemToEdit && itemToEdit.type === "l") {
    itemToDelete = { type: "l", lIndex: itemToEdit.lIndex };
    document.getElementById("link-modal").classList.remove("show");
    document.getElementById("delete-confirm-modal").classList.add("show");
  }
});

document
  .getElementById("confirm-link-btn")
  .addEventListener("click", async () => {
    const name = document.getElementById("link-name-input").value.trim();
    const url = document.getElementById("link-url-input").value.trim();
    if (!name || !url) return;

    if (itemToEdit && itemToEdit.type === "l") {
      globalsData.users[currentUserId].usefulLinks[itemToEdit.lIndex].name =
        name;
      globalsData.users[currentUserId].usefulLinks[itemToEdit.lIndex].url = url;
    } else {
      if (!globalsData.users[currentUserId].usefulLinks)
        globalsData.users[currentUserId].usefulLinks = [];
      globalsData.users[currentUserId].usefulLinks.push({
        id: "l" + Date.now(),
        name,
        url,
      });
    }
    await updateDoc(doc(db, "globals", "data"), {
      users: globalsData.users,
    });
    document.getElementById("link-modal").classList.remove("show");
    renderUsefulLinks();
    itemToEdit = null;
  });

// Disable right click
document.addEventListener("contextmenu", (e) => e.preventDefault());

// Back button support via History API
window.addEventListener("popstate", (e) => {
  // Close any open modals on back navigation
  document.querySelectorAll(".modal-overlay.show").forEach((modal) => {
    modal.classList.remove("show");
  });

  if (e.state && e.state.page) {
    activatePage(e.state.page, false);
  } else {
    if (localStorage.getItem("studyWebUserId"))
      activatePage("page-item1", false);
  }
});

function showSaving() {
  const overlay = document.getElementById("saving-overlay");
  if (overlay) overlay.style.display = "flex";
}
function hideSaving() {
  const overlay = document.getElementById("saving-overlay");
  if (overlay) overlay.style.display = "none";
}

// Float Video Button Events
const floatVideoBtn = document.getElementById("float-video-btn");
if (floatVideoBtn) {
  floatVideoBtn.addEventListener("click", () => {
    isFloating = true;
    iframeClicked = true; // force it to float
    // Trigger back button
    const backBtn = document.querySelector(
      ".btn-back-template.nav-trigger[data-target]",
    );
    if (backBtn) {
      backBtn.click();
    }
  });
}

const closeFloatBtn = document.getElementById("close-float-btn");
if (closeFloatBtn) {
  closeFloatBtn.addEventListener("click", () => {
    isFloating = false;
    iframeClicked = false;
    document.getElementById("watch-player-container").innerHTML = "";
    document
      .getElementById("template-watch")
      .classList.remove("floating-active");
    const floatingWrapper = document.getElementById("floating-wrapper");
    if (floatingWrapper) {
      floatingWrapper.classList.remove("floating-mode");
      floatingWrapper.style.left = "";
      floatingWrapper.style.top = "";
      floatingWrapper.style.bottom = "";
      floatingWrapper.style.right = "";
    }
  });
}

const maxFloatBtn = document.getElementById("maximize-float-btn");
if (maxFloatBtn) {
  maxFloatBtn.addEventListener("click", () => {
    isFloating = false;
    iframeClicked = false;
    activatePage("template-watch");
  });
}

const dragHandle = document.getElementById("drag-handle");
const floatingWrapperObj = document.getElementById("floating-wrapper");

let isDragging = false;
let dragOffsetX = 0;
let dragOffsetY = 0;

if (dragHandle && floatingWrapperObj) {
  const startDrag = (clientX, clientY) => {
    isDragging = true;
    const rect = floatingWrapperObj.getBoundingClientRect();
    dragOffsetX = clientX - rect.left;
    dragOffsetY = clientY - rect.top;

    // Overlay over iframe to capture mouse moves without iframe eating them
    let overlay = document.getElementById("drag-iframe-overlay");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = "drag-iframe-overlay";
      overlay.style.position = "absolute";
      overlay.style.top = "0";
      overlay.style.left = "0";
      overlay.style.width = "100%";
      overlay.style.height = "100%";
      overlay.style.zIndex = "100";
      floatingWrapperObj.appendChild(overlay);
    }
  };

  const doDrag = (clientX, clientY) => {
    if (!isDragging) return;

    let newLeft = clientX - dragOffsetX;
    let newTop = clientY - dragOffsetY;

    // Boundaries
    const maxX = window.innerWidth - floatingWrapperObj.offsetWidth;
    const maxY = window.innerHeight - floatingWrapperObj.offsetHeight;

    newLeft = Math.max(0, Math.min(newLeft, maxX));
    newTop = Math.max(0, Math.min(newTop, maxY));

    floatingWrapperObj.style.left = `${newLeft}px`;
    floatingWrapperObj.style.top = `${newTop}px`;
    floatingWrapperObj.style.bottom = "auto";
    floatingWrapperObj.style.right = "auto";
  };

  const endDrag = () => {
    if (isDragging) {
      isDragging = false;
      const overlay = document.getElementById("drag-iframe-overlay");
      if (overlay) overlay.remove();
    }
  };

  dragHandle.addEventListener("mousedown", (e) =>
    startDrag(e.clientX, e.clientY),
  );
  document.addEventListener("mousemove", (e) => doDrag(e.clientX, e.clientY));
  document.addEventListener("mouseup", endDrag);

  dragHandle.addEventListener(
    "touchstart",
    (e) => startDrag(e.touches[0].clientX, e.touches[0].clientY),
    { passive: false },
  );
  document.addEventListener(
    "touchmove",
    (e) => {
      if (isDragging) {
        e.preventDefault(); // prevent scrolling while dragging
        doDrag(e.touches[0].clientX, e.touches[0].clientY);
      }
    },
    { passive: false },
  );
  document.addEventListener("touchend", endDrag);
}

// Dash Item Events
document.addEventListener("click", (e) => {
  if (e.target.closest("#add-dash-item-btn")) {
    targetDashIndexForAdd = -1;
    dashItemTitleInput.value = "";
    dashItemDescInput.value = "";
    dashItemPageTitleInput.value = "";
    dashItemPageDescInput.value = "";
    dashItemModalTitle.textContent = "Add Sub Item";
    dashItemModal.classList.add("show");
  } else if (e.target.closest(".edit-dash-btn")) {
    const btn = e.target.closest(".edit-dash-btn");
    targetDashIndexForAdd = parseInt(btn.getAttribute("data-index"));
    const item = currentDashboardItems[targetDashIndexForAdd];
    dashItemTitleInput.value = item.title;
    dashItemDescInput.value = item.desc;
    dashItemPageTitleInput.value = item.pageTitle;
    dashItemPageDescInput.value = item.pageDesc;
    dashItemModalTitle.textContent = "Edit Sub Item";
    dashItemModal.classList.add("show");
  } else if (e.target.closest(".del-dash-btn")) {
    const btn = e.target.closest(".del-dash-btn");
    const idx = parseInt(btn.getAttribute("data-index"));
    itemToDelete = { type: "dash", idx: idx };
    document.getElementById("delete-confirm-modal").classList.add("show");
  }
});

cancelDashItemBtn.addEventListener("click", () => {
  dashItemModal.classList.remove("show");
});

confirmDashItemBtn.addEventListener("click", async () => {
  const title = dashItemTitleInput.value.trim();
  const desc = dashItemDescInput.value.trim();
  const pageTitle = dashItemPageTitleInput.value.trim();
  const pageDesc = dashItemPageDescInput.value.trim();

  if (!title) return;

  if (targetDashIndexForAdd === -1) {
    const newId = "page-sub" + Date.now();
    currentDashboardItems.push({
      id: newId,
      title: title,
      desc: desc,
      pageTitle: pageTitle,
      pageDesc: pageDesc,
    });
    // Initialize empty data for new page
    currentPagesData[newId] = [];
    await setDoc(doc(db, "subItems", currentUserId + "_" + newId), {
      headings: [],
    });
  } else {
    currentDashboardItems[targetDashIndexForAdd].title = title;
    currentDashboardItems[targetDashIndexForAdd].desc = desc;
    currentDashboardItems[targetDashIndexForAdd].pageTitle = pageTitle;
    currentDashboardItems[targetDashIndexForAdd].pageDesc = pageDesc;
  }

  try {
    showSaving();
    await setDoc(doc(db, "subItems", currentUserId + "_dashboard"), {
      items: currentDashboardItems,
    });
    renderDashboardItems();
    dashItemModal.classList.remove("show");
    hideSaving();
  } catch (e) {
    console.error(e);
    hideSaving();
  }
});
