const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'app.js');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add Dashboard Modal Elements
const elementsToInsert = `
// Dashboard Modal Elements
const dashItemModal = document.getElementById("dash-item-modal");
const cancelDashItemBtn = document.getElementById("cancel-dash-item-btn");
const confirmDashItemBtn = document.getElementById("confirm-dash-item-btn");
const dashItemTitleInput = document.getElementById("dash-item-title-input");
const dashItemDescInput = document.getElementById("dash-item-desc-input");
const dashItemPageTitleInput = document.getElementById("dash-item-page-title-input");
const dashItemPageDescInput = document.getElementById("dash-item-page-desc-input");
const dashItemModalTitle = document.getElementById("dash-item-modal-title");
`;
content = content.replace('// Modal Elements\n', '// Modal Elements\n' + elementsToInsert);

// 2. Default Dashboard Data
const defaultDataToInsert = `
const defaultDashboardItems = [
  { id: "page-sub1", title: "Sub Item 1", desc: "View detailed reports and manage your primary objectives for this week.", pageTitle: "Sub Item 1: Core Mechanics", pageDesc: "Master the foundational pillars of mechanics. Focus on theoretical rigor and numerical proficiency." },
  { id: "page-sub2", title: "Sub Item 2", desc: "Access your split-view documents, tables, and ongoing drafts.", pageTitle: "Sub Item 2: Operations", pageDesc: "Access your operational documents, tables, and ongoing drafts." },
  { id: "page-sub3", title: "Sub Item 3", desc: "Check circular analytics, progress rings, and team performance metrics.", pageTitle: "Sub Item 3: Analytics", pageDesc: "Check circular analytics, progress rings, and team performance metrics." },
  { id: "page-sub4", title: "Sub Item 4", desc: "Review lists, forms, and check off pending tasks from the backlog.", pageTitle: "Sub Item 4: Task List", pageDesc: "Review lists, forms, and check off pending tasks from the backlog." }
];
let currentDashboardItems = [];
let targetDashIndexForAdd = -1;
`;
content = content.replace('let isEditMode = false;', 'let isEditMode = false;\n' + defaultDataToInsert);

// 3. Update fetchAndRenderAllSubItems
const fetchDashboardCode = `
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
  } catch(e) { console.error("Error loading dashboard items", e); }
`;
content = content.replace('const pages = [', fetchDashboardCode + '\n  const pages = [');

// 4. Add renderDashboardItems function
const renderDashboardItemsCode = `
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
      sidebarNav.innerHTML += \`
        <li>
          <div class="nav-link sub-link" data-target="\${item.id}" data-parent="parent-item1">
            <svg viewBox="0 0 24 24"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>
            <span class="nav-text">\${item.title}</span>
          </div>
        </li>
      \`;
    }

    // 2. Dashboard Cards
    if (dashboardGrid) {
      let actionsHTML = "";
      if (isEditMode) {
        actionsHTML = \`
          <div style="position: absolute; top: 10px; right: 10px; display: flex; gap: 8px; z-index: 10;">
            <button class="btn-cancel action-btn edit-dash-btn" style="padding: 6px 12px; background:#e8f0fe; color:#1a73e8;" data-index="\${index}">Edit</button>
            <button class="btn-cancel action-btn del-dash-btn" style="padding: 6px 12px; background:#fce8e8; color:#d9534f;" data-index="\${index}">Delete</button>
          </div>
        \`;
      }

      dashboardGrid.innerHTML += \`
        <div class="dash-card nav-trigger" data-target="\${item.id}" data-parent="parent-item1" style="position:relative;">
          \${actionsHTML}
          <div class="card-icon">
            <svg viewBox="0 0 24 24"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>
          </div>
          <h3>\${item.title}</h3>
          <p>\${item.desc}</p>
          <div class="card-arrow">
            <svg viewBox="0 0 24 24" width="20" height="20"><path d="M5 13h11.17l-4.88 4.88c-.39.39-.39 1.03 0 1.42.39.39 1.02.39 1.41 0l6.59-6.59c.39-.39.39-1.02 0-1.41l-6.58-6.6a.995.995 0 0 0-1.41 0c-.39.39-.39 1.02 0 1.41L16.17 11H5c-.55 0-1 .45-1 1s.45 1 1 1z"/></svg>
          </div>
        </div>
      \`;
    }

    // 3. Dynamic Page Sections
    if (pagesContainer) {
      pagesContainer.innerHTML += \`
        <section class="page-section" id="\${item.id}">
          <button class="nav-trigger btn-back-course" data-target="page-item1">← Back to Dashboard</button>
          <div class="page-header" style="margin-bottom: 30px">
            <h2 style="font-size: 32px; margin-bottom: 10px">\${item.pageTitle}</h2>
            <p style="font-size: 16px; max-width: 800px">\${item.pageDesc}</p>
          </div>
          <div class="accordion-container" id="container-\${item.id}"></div>
        </section>
      \`;
      
      // Also fetch content for this page dynamically if not already loaded
      if (!currentPagesData[item.id] && currentUserId) {
        getDoc(doc(db, "subItems", currentUserId + "_" + item.id)).then(docSnap => {
          if (docSnap.exists()) {
            currentPagesData[item.id] = docSnap.data().headings || [];
            renderSubPage(item.id);
          }
        });
      }
    }
  });

  if (isEditMode && dashboardGrid) {
    dashboardGrid.innerHTML += \`
      <div class="dash-card" id="add-dash-item-btn" style="display:flex; flex-direction:column; align-items:center; justify-content:center; border: 2px dashed var(--border-color); cursor:pointer; min-height: 200px;">
        <div style="font-size: 40px; color: var(--primary); margin-bottom: 10px;">+</div>
        <h3 style="color: var(--primary);">Add Sub Item</h3>
      </div>
    \`;
  }

  reattachNavTriggers();
  
  // Render sub page contents inside the dynamically created sections
  currentDashboardItems.forEach(item => {
    if (currentPagesData[item.id]) {
      renderSubPage(item.id);
    }
  });
}

function reattachNavTriggers() {
  const newRoutingTriggers = document.querySelectorAll(".nav-link[data-target], .nav-trigger[data-target]");
  newRoutingTriggers.forEach((trigger) => {
    // Remove old listeners to avoid duplicates if any
    const clone = trigger.cloneNode(true);
    trigger.parentNode.replaceChild(clone, trigger);
    
    clone.addEventListener("click", function (e) {
      if (e.target.closest("button")) return; // Prevent navigation if clicking edit/delete buttons
      if (this.style.cursor === "not-allowed") return;
      const target = this.getAttribute("data-target");

      if (this.classList.contains("btn-back-course") || this.classList.contains("btn-back-template")) {
        if (hasNavigatedInApp) {
          window.history.back();
          return;
        } else {
          activatePage(target, false);
          history.replaceState({ page: target }, "", \`#\${target}\`);
          return;
        }
      }

      hasNavigatedInApp = true;
      activatePage(target);
    });
  });
}
`;
content = content.replace('function renderSubPage(pageId) {', renderDashboardItemsCode + '\n\nfunction renderSubPage(pageId) {');

// 5. Add Event Listeners for Dash Items
const dashEventsCode = `
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
      pageDesc: pageDesc
    });
    // Initialize empty data for new page
    currentPagesData[newId] = [];
    await setDoc(doc(db, "subItems", currentUserId + "_" + newId), { headings: [] });
  } else {
    currentDashboardItems[targetDashIndexForAdd].title = title;
    currentDashboardItems[targetDashIndexForAdd].desc = desc;
    currentDashboardItems[targetDashIndexForAdd].pageTitle = pageTitle;
    currentDashboardItems[targetDashIndexForAdd].pageDesc = pageDesc;
  }

  try {
    showSaving();
    await setDoc(doc(db, "subItems", currentUserId + "_dashboard"), { items: currentDashboardItems });
    renderDashboardItems();
    dashItemModal.classList.remove("show");
    hideSaving();
  } catch (e) {
    console.error(e);
    hideSaving();
  }
});
`;
content += '\n' + dashEventsCode;

// 6. Update delete confirmation logic for dash items
const delConfirmCodeToReplace = `
  if (itemToDelete.type === "heading") {
    currentPagesData[itemToDelete.page].splice(itemToDelete.hIndex, 1);
  } else if (itemToDelete.type === "subheading") {
    currentPagesData[itemToDelete.page][itemToDelete.hIndex].subheadings.splice(itemToDelete.shIndex, 1);
  } else if (itemToDelete.type === "resource") {
    currentPagesData[itemToDelete.page].splice(itemToDelete.rIndex, 1);
  } else if (itemToDelete.type === "link") {
    globalsData.users[currentUserId].usefulLinks.splice(itemToDelete.index, 1);
  }`;
const delConfirmCodeNew = `
  if (itemToDelete.type === "dash") {
    currentDashboardItems.splice(itemToDelete.idx, 1);
    await setDoc(doc(db, "subItems", currentUserId + "_dashboard"), { items: currentDashboardItems });
    renderDashboardItems();
    document.getElementById("delete-confirm-modal").classList.remove("show");
    hideSaving();
    return;
  } else if (itemToDelete.type === "heading") {
    currentPagesData[itemToDelete.page].splice(itemToDelete.hIndex, 1);
  } else if (itemToDelete.type === "subheading") {
    currentPagesData[itemToDelete.page][itemToDelete.hIndex].subheadings.splice(itemToDelete.shIndex, 1);
  } else if (itemToDelete.type === "resource") {
    currentPagesData[itemToDelete.page].splice(itemToDelete.rIndex, 1);
  } else if (itemToDelete.type === "link") {
    globalsData.users[currentUserId].usefulLinks.splice(itemToDelete.index, 1);
  }`;
content = content.replace(delConfirmCodeToReplace, delConfirmCodeNew);

// 7. Edit mode re-render
content = content.replace('["page-sub1", "page-sub2", "page-sub3", "page-sub4"].forEach(renderSubPage);', 'renderDashboardItems();\n    currentDashboardItems.forEach(item => renderSubPage(item.id));');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated app.js');
