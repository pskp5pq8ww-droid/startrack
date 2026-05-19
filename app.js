const STORAGE_KEY = "depotops.prototype.v2";

const todayISO = () => new Date().toISOString().slice(0, 10);
const dayISO = (offset) => {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
};

const uid = (prefix) =>
  `${prefix}_${Math.random().toString(36).slice(2, 8)}_${Date.now().toString(36)}`;

const h = (value = "") =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const formatName = (user) => `${user.firstName} ${user.lastName}`;

const seedData = () => {
  const today = todayISO();
  const yesterday = dayISO(-1);
  return {
    settings: {
      depotName: "BNPF Depot",
      systemName: "DepotOps",
      cutOffTime: "18:30",
      defaultBreakMinutes: 60,
    },
    users: [
      {
        id: "sup_aaron",
        role: "supervisor",
        firstName: "Aaron",
        lastName: "Lonergan",
        email: "supervisor@depotops.test",
        password: "supervisor123",
        employeeId: "SUP001",
        status: "active",
      },
      {
        id: "sup_ben",
        role: "supervisor",
        firstName: "Ben",
        lastName: "Egan",
        email: "ben@depotops.test",
        password: "supervisor123",
        employeeId: "SUP002",
        status: "active",
      },
      {
        id: "sup_andrew",
        role: "supervisor",
        firstName: "Andrew",
        lastName: "Stevens",
        email: "andrew@depotops.test",
        password: "supervisor123",
        employeeId: "SUP003",
        status: "active",
      },
      {
        id: "sup_marco",
        role: "supervisor",
        firstName: "Marco",
        lastName: "Panebianco",
        email: "marco@depotops.test",
        password: "supervisor123",
        employeeId: "SUP004",
        status: "active",
      },
      {
        id: "sup_craig",
        role: "supervisor",
        firstName: "Craig",
        lastName: "Keogh",
        email: "craig@depotops.test",
        password: "supervisor123",
        employeeId: "SUP005",
        status: "active",
      },
      {
        id: "admin_ops",
        role: "admin",
        firstName: "Depot",
        lastName: "Admin",
        email: "admin@depotops.test",
        password: "admin123",
        employeeId: "ADM001",
        status: "active",
      },
      {
        id: "drv_maya",
        role: "driver",
        firstName: "Maya",
        lastName: "Patel",
        email: "driver@depotops.test",
        password: "driver123",
        employeeId: "DRV104",
        supervisorId: "sup_aaron",
        defaultRouteId: "route_bn12",
        status: "active",
      },
      {
        id: "drv_daniel",
        role: "driver",
        firstName: "Daniel",
        lastName: "Hughes",
        email: "daniel@depotops.test",
        password: "driver123",
        employeeId: "DRV117",
        supervisorId: "sup_aaron",
        defaultRouteId: "route_bn18",
        status: "active",
      },
      {
        id: "drv_sofia",
        role: "driver",
        firstName: "Sofia",
        lastName: "Nguyen",
        email: "sofia@depotops.test",
        password: "driver123",
        employeeId: "DRV122",
        supervisorId: "sup_ben",
        defaultRouteId: "route_n04",
        status: "active",
      },
      {
        id: "drv_owen",
        role: "driver",
        firstName: "Owen",
        lastName: "Reed",
        email: "owen@depotops.test",
        password: "driver123",
        employeeId: "DRV140",
        supervisorId: "sup_ben",
        defaultRouteId: "route_cbd2",
        status: "active",
      },
    ],
    routes: [
      { id: "route_bn12", routeNumber: "BN-12", depot: "BNPF Depot", zone: "North", status: "active" },
      { id: "route_bn18", routeNumber: "BN-18", depot: "BNPF Depot", zone: "North", status: "active" },
      { id: "route_n04", routeNumber: "N-04", depot: "BNPF Depot", zone: "Metro", status: "active" },
      { id: "route_cbd2", routeNumber: "CBD-2", depot: "BNPF Depot", zone: "CBD", status: "active" },
      { id: "route_pm7", routeNumber: "PM-7", depot: "BNPF Depot", zone: "Evening", status: "active" },
    ],
    kpiSubmissions: [
      {
        id: "kpi_001",
        driverId: "drv_maya",
        supervisorId: "sup_aaron",
        date: today,
        driverType: "Company Employee",
        routeId: "route_bn12",
        startTime: "07:15",
        finishTime: "16:45",
        hours: 8.5,
        breakMinutes: 60,
        breakApprovedBy: "",
        offroadDuties: false,
        offroadNotes: "",
        stops: 116,
        parcels: 184,
        incidents: "",
        comments: "Smooth run.",
        status: "submitted",
        createdAt: new Date().toISOString(),
      },
      {
        id: "kpi_002",
        driverId: "drv_daniel",
        supervisorId: "sup_aaron",
        date: today,
        driverType: "Delivery Partners (Contractor)",
        routeId: "route_bn18",
        startTime: "07:00",
        finishTime: "17:10",
        hours: 9.2,
        breakMinutes: 60,
        breakApprovedBy: "",
        offroadDuties: true,
        offroadNotes: "Early sort",
        stops: 132,
        parcels: 211,
        incidents: "Late commercial pickup.",
        comments: "",
        status: "submitted",
        createdAt: new Date().toISOString(),
      },
      {
        id: "kpi_003",
        driverId: "drv_maya",
        supervisorId: "sup_aaron",
        date: yesterday,
        driverType: "Company Employee",
        routeId: "route_bn12",
        startTime: "07:20",
        finishTime: "16:30",
        hours: 8.2,
        breakMinutes: 60,
        breakApprovedBy: "",
        offroadDuties: false,
        offroadNotes: "",
        stops: 108,
        parcels: 172,
        incidents: "",
        comments: "",
        status: "submitted",
        createdAt: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: "kpi_004",
        driverId: "drv_sofia",
        supervisorId: "sup_ben",
        date: yesterday,
        driverType: "Preferred Driver",
        routeId: "route_n04",
        startTime: "06:55",
        finishTime: "16:20",
        hours: 8.4,
        breakMinutes: 30,
        breakApprovedBy: "Radio Room",
        offroadDuties: false,
        offroadNotes: "",
        stops: 121,
        parcels: 198,
        incidents: "",
        comments: "30 min break approved.",
        status: "submitted",
        createdAt: new Date(Date.now() - 86400000).toISOString(),
      },
    ],
    holidayRequests: [
      {
        id: "hol_001",
        driverId: "drv_sofia",
        startDate: dayISO(8),
        endDate: dayISO(12),
        reason: "Family trip",
        status: "pending",
        reviewedBy: "",
        reviewedAt: "",
        createdAt: new Date().toISOString(),
      },
      {
        id: "hol_002",
        driverId: "drv_maya",
        startDate: dayISO(-18),
        endDate: dayISO(-16),
        reason: "Annual leave",
        status: "approved",
        reviewedBy: "sup_aaron",
        reviewedAt: new Date(Date.now() - 20 * 86400000).toISOString(),
        createdAt: new Date(Date.now() - 24 * 86400000).toISOString(),
      },
    ],
  };
};

const depotRepository = {
  load() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      const seeded = seedData();
      this.save(seeded);
      return seeded;
    }
    try {
      return JSON.parse(stored);
    } catch {
      const seeded = seedData();
      this.save(seeded);
      return seeded;
    }
  },
  save(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  },
};

const state = {
  data: depotRepository.load(),
  currentUserId: sessionStorage.getItem("depotops.currentUserId") || "",
  view: "home",
  intent: "",
  loginRole: "driver",
  loginError: "",
  toast: "",
  filters: { date: todayISO(), driverId: "all", routeId: "all" },
  adminTab: "users",
  editingUserId: "",
};

const app = document.querySelector("#app");

const persist = () => depotRepository.save(state.data);
const currentUser = () => state.data.users.find((user) => user.id === state.currentUserId);
const drivers = () => state.data.users.filter((user) => user.role === "driver" && user.status === "active");
const supervisors = () => state.data.users.filter((user) => user.role === "supervisor" && user.status === "active");
const routeById = (id) => state.data.routes.find((route) => route.id === id);
const userById = (id) => state.data.users.find((user) => user.id === id);

const toast = (message) => {
  state.toast = message;
  render();
  window.setTimeout(() => {
    state.toast = "";
    render();
  }, 2800);
};

const setView = (view, options = {}) => {
  state.view = view;
  Object.assign(state, options);
  window.scrollTo({ top: 0, behavior: "smooth" });
  render();
};

const requireRole = (role, targetView, intent = "") => {
  const user = currentUser();
  if (user && user.role === role) {
    setView(targetView);
    return;
  }
  setView("login", { loginRole: role, intent, loginError: "" });
};

const signOut = () => {
  state.currentUserId = "";
  sessionStorage.removeItem("depotops.currentUserId");
  setView("home");
};

const header = () => {
  const user = currentUser();
  return `
    <header class="topbar">
      <a class="brand" href="#" data-action="home" aria-label="DepotOps home">
        <span class="brand-mark">DO</span>
        <span>
          <span class="brand-name">${h(state.data.settings.systemName)}</span>
          <span class="brand-sub">${h(state.data.settings.depotName)} internal</span>
        </span>
      </a>
      <nav class="top-actions" aria-label="Role access">
        ${
          user
            ? `<span class="chip">${h(user.role)} · ${h(user.firstName)}</span>
               <button class="text-link" data-action="logout">Sign out</button>`
            : `<button class="text-link" data-action="login-driver">Driver Login</button>
               <button class="text-link" data-action="login-supervisor">Supervisor Login</button>
               <button class="text-link" data-action="login-admin">Admin Login</button>`
        }
      </nav>
    </header>
  `;
};

const homeView = () => `
  ${header()}
  <main class="shell home">
    <section class="home-head">
      <p class="eyebrow">${h(state.data.settings.depotName)}</p>
      <h1>Depot KPI System</h1>
      <p class="lede">Fast daily submissions for drivers, live depot visibility for supervisors, and clean administration for internal operations.</p>
      <div class="home-meta">
        <span class="chip">Mobile-first driver flow</span>
        <span class="chip">Supervisor dashboard</span>
        <span class="chip">Backend-ready data model</span>
      </div>
    </section>
    <section class="launch-grid" aria-label="Main actions">
      <button class="launch-button primary" data-action="open-kpi">
        <strong>Fill KPI</strong>
        <span>Daily route, hours, stops, parcels and incidents.</span>
      </button>
      <button class="launch-button" data-action="open-holiday">
        <strong>Holiday Request</strong>
        <span>Submit leave dates and track approval status.</span>
      </button>
    </section>
  </main>
`;

const roleLabel = (role) =>
  ({ driver: "Driver", supervisor: "Supervisor", admin: "Admin" })[role] || "User";

const loginView = () => {
  const demoUsers = state.data.users.filter((user) => user.role === state.loginRole).slice(0, 3);
  return `
    ${header()}
    <main class="shell login-wrap">
      <section class="login-panel">
        <form class="form" data-form="login">
          <div class="view-title">
            <p class="eyebrow">${roleLabel(state.loginRole)} access</p>
            <h2>Sign in</h2>
            <p>${state.intent === "holiday" ? "Continue to holiday request." : state.intent === "kpi" ? "Continue to daily KPI." : "Access your role workspace."}</p>
          </div>
          <label class="field">
            <span>Email</span>
            <input class="input" name="email" type="email" autocomplete="username" value="${state.loginRole === "driver" ? "driver@depotops.test" : state.loginRole === "supervisor" ? "supervisor@depotops.test" : "admin@depotops.test"}" required />
          </label>
          <label class="field">
            <span>Password</span>
            <input class="input" name="password" type="password" autocomplete="current-password" value="${state.loginRole === "driver" ? "driver123" : state.loginRole === "supervisor" ? "supervisor123" : "admin123"}" required />
          </label>
          ${state.loginError ? `<p class="error-text">${h(state.loginError)}</p>` : ""}
          <button class="button" type="submit">Sign in</button>
        </form>
        <div class="demo-list" aria-label="Demo accounts">
          ${demoUsers
            .map(
              (user) => `
                <button class="demo-account" data-action="demo-login" data-id="${h(user.id)}">
                  <span>${h(formatName(user))}</span>
                  <small>${h(user.employeeId || user.role)}</small>
                </button>
              `,
            )
            .join("")}
        </div>
      </section>
    </main>
  `;
};

const driverDashboard = () => {
  const user = currentUser();
  const submissions = state.data.kpiSubmissions
    .filter((item) => item.driverId === user.id)
    .sort((a, b) => b.date.localeCompare(a.date));
  const holidays = state.data.holidayRequests
    .filter((item) => item.driverId === user.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const todaySubmission = submissions.find((item) => item.date === todayISO());
  return `
    ${header()}
    <main class="shell driver-shell">
      <section class="view-head">
        <div class="view-title">
          <p class="eyebrow">Driver workspace</p>
          <h2>Hi, ${h(user.firstName)}</h2>
          <p>${todaySubmission ? "Your KPI for today has been submitted." : "Your daily KPI is still pending."}</p>
        </div>
      </section>
      <section class="launch-grid">
        <button class="launch-button primary" data-action="open-kpi">
          <strong>Fill KPI</strong>
          <span>${todaySubmission ? "Submit an updated run if required." : "Takes around one minute."}</span>
        </button>
        <button class="launch-button" data-action="open-holiday">
          <strong>Holiday Request</strong>
          <span>Create and track leave requests.</span>
        </button>
      </section>
      <section class="grid-2" style="margin-top:14px">
        <div class="panel panel-pad stack">
          <div class="view-title">
            <h3>KPI history</h3>
            <p>Recent submissions</p>
          </div>
          <div class="history-list">
            ${
              submissions.length
                ? submissions
                    .slice(0, 5)
                    .map((item) => historyKpiItem(item))
                    .join("")
                : `<div class="empty">No KPI submissions yet.</div>`
            }
          </div>
        </div>
        <div class="panel panel-pad stack">
          <div class="view-title">
            <h3>Holiday history</h3>
            <p>Approval status</p>
          </div>
          <div class="history-list">
            ${
              holidays.length
                ? holidays
                    .slice(0, 5)
                    .map((item) => holidayItem(item))
                    .join("")
                : `<div class="empty">No holiday requests yet.</div>`
            }
          </div>
        </div>
      </section>
    </main>
  `;
};

const historyKpiItem = (item) => `
  <article class="history-item">
    <header>
      <strong>${h(item.date)} · ${h(routeById(item.routeId)?.routeNumber || "No route")}</strong>
      <span class="status submitted">${h(item.status)}</span>
    </header>
    <div class="history-meta">
      <span>${h(item.hours)}h</span>
      <span>${h(item.stops)} stops</span>
      <span>${h(item.parcels)} parcels</span>
    </div>
  </article>
`;

const holidayItem = (item) => `
  <article class="history-item">
    <header>
      <strong>${h(item.startDate)} to ${h(item.endDate)}</strong>
      <span class="status ${h(item.status)}">${h(item.status)}</span>
    </header>
    <div class="history-meta">
      <span>${h(item.reason || "No reason supplied")}</span>
    </div>
  </article>
`;

const routeOptions = (selected = "") =>
  state.data.routes
    .filter((route) => route.status === "active")
    .map(
      (route) =>
        `<option value="${h(route.id)}" ${route.id === selected ? "selected" : ""}>${h(route.routeNumber)} · ${h(route.zone)}</option>`,
    )
    .join("");

const supervisorOptions = (selected = "") =>
  supervisors()
    .map(
      (user) =>
        `<option value="${h(user.id)}" ${user.id === selected ? "selected" : ""}>${h(formatName(user))}</option>`,
    )
    .join("");

const stepperField = (name, label, value, min, step, hint = "") => `
  <label class="field">
    <span>${h(label)}</span>
    <div class="stepper" data-stepper="${h(name)}" data-min="${h(min)}" data-step="${h(step)}">
      <button type="button" data-action="step-down" aria-label="Decrease ${h(label)}">−</button>
      <input name="${h(name)}" inputmode="decimal" value="${h(value)}" required />
      <button type="button" data-action="step-up" aria-label="Increase ${h(label)}">+</button>
    </div>
    ${hint ? `<small class="hint">${h(hint)}</small>` : ""}
  </label>
`;

const kpiView = () => {
  const user = currentUser();
  return `
    ${header()}
    <main class="shell driver-shell">
      <section class="view-head">
        <div class="view-title">
          <p class="eyebrow">Daily time sheet</p>
          <h2>Fill KPI</h2>
          <p>Date and driver details are automatic from your account.</p>
        </div>
      </section>
      <form class="form panel panel-pad" data-form="kpi">
        <div class="grid-2">
          <label class="field">
            <span>Date</span>
            <input class="input" name="date" type="date" value="${todayISO()}" readonly />
          </label>
          <label class="field">
            <span>Driver</span>
            <input class="input" value="${h(formatName(user))}" readonly />
          </label>
        </div>
        <div class="field">
          <span>Please select one option</span>
          <div class="segmented three">
            ${radio("driverType", "Company Employee", "Company Employee", true)}
            ${radio("driverType", "Delivery Partners (Contractor)", "Delivery Partners (Contractor)")}
            ${radio("driverType", "Outside Hire", "Outside Hire")}
            ${radio("driverType", "Preferred Driver", "Preferred Driver")}
          </div>
        </div>
        <div class="grid-2">
          <label class="field">
            <span>Supervisor</span>
            <select class="select" name="supervisorId" required>
              ${supervisorOptions(user.supervisorId)}
            </select>
          </label>
          <label class="field">
            <span>Route number</span>
            <select class="select" name="routeId" required>
              ${routeOptions(user.defaultRouteId)}
            </select>
          </label>
        </div>
        <div class="grid-2">
          <label class="field">
            <span>Start time</span>
            <input class="input" name="startTime" type="time" value="07:00" required />
          </label>
          <label class="field">
            <span>Finish time</span>
            <input class="input" name="finishTime" type="time" value="17:00" required />
          </label>
        </div>
        <div class="field">
          <span>Additional off-road duties</span>
          <div class="segmented">
            ${radio("offroadDuties", "yes", "Yes")}
            ${radio("offroadDuties", "no", "No", true)}
          </div>
        </div>
        <label class="field">
          <span>Off-road duty notes</span>
          <input class="input" name="offroadNotes" placeholder="Early sort, PM close, WHS audit, leading hand..." />
        </label>
        <div class="field">
          <span>Break taken</span>
          <div class="segmented">
            ${radio("breakMinutes", "30", "30 minutes")}
            ${radio("breakMinutes", "60", "60 minutes", true)}
          </div>
          <small class="hint">If break is shorter than 60 minutes, Radio Room approval is required.</small>
        </div>
        <label class="field">
          <span>Break approved by</span>
          <select class="select" name="breakApprovedBy">
            <option value="">Not required</option>
            <option value="Radio Room">Radio Room</option>
          </select>
        </label>
        <div class="grid-3">
          ${stepperField("hours", "Hours", 8, 0, 0.5)}
          ${stepperField("stops", "Stops", 0, 0, 1)}
          ${stepperField("parcels", "Parcels", 0, 0, 1)}
        </div>
        <label class="field">
          <span>Incidents</span>
          <textarea class="textarea" name="incidents" placeholder="Delays, unsafe access, failed pickup, vehicle issue..."></textarea>
        </label>
        <label class="field">
          <span>Comments</span>
          <textarea class="textarea" name="comments" placeholder="Optional notes for supervisor"></textarea>
        </label>
        <button class="button" type="submit" data-submit-label="Submit KPI">Submit KPI</button>
      </form>
    </main>
  `;
};

const radio = (name, value, label, checked = false) => `
  <label class="segment">
    <input type="radio" name="${h(name)}" value="${h(value)}" ${checked ? "checked" : ""} />
    <span>${h(label)}</span>
  </label>
`;

const holidayView = () => {
  const user = currentUser();
  const holidays = state.data.holidayRequests
    .filter((item) => item.driverId === user.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return `
    ${header()}
    <main class="shell driver-shell">
      <section class="view-head">
        <div class="view-title">
          <p class="eyebrow">Leave request</p>
          <h2>Holiday Request</h2>
          <p>Submit dates for supervisor review.</p>
        </div>
      </section>
      <section class="grid-2">
        <form class="form panel panel-pad" data-form="holiday">
          <label class="field">
            <span>Start date</span>
            <input class="input" name="startDate" type="date" min="${todayISO()}" required />
          </label>
          <label class="field">
            <span>End date</span>
            <input class="input" name="endDate" type="date" min="${todayISO()}" required />
          </label>
          <label class="field">
            <span>Reason</span>
            <textarea class="textarea" name="reason" placeholder="Optional"></textarea>
          </label>
          <button class="button" type="submit">Submit request</button>
        </form>
        <div class="panel panel-pad stack">
          <div class="view-title">
            <h3>Your requests</h3>
            <p>Pending, approved and rejected.</p>
          </div>
          <div class="history-list">
            ${holidays.length ? holidays.map((item) => holidayItem(item)).join("") : `<div class="empty">No holiday requests yet.</div>`}
          </div>
        </div>
      </section>
    </main>
  `;
};

const dashboardMetrics = (date, driverId = "all", routeId = "all") => {
  const activeDrivers = drivers();
  const filtered = state.data.kpiSubmissions.filter((item) => {
    const dateMatch = item.date === date;
    const driverMatch = driverId === "all" || item.driverId === driverId;
    const routeMatch = routeId === "all" || item.routeId === routeId;
    return dateMatch && driverMatch && routeMatch;
  });
  const submittedIds = new Set(filtered.map((item) => item.driverId));
  const pendingDrivers =
    driverId === "all" && routeId === "all"
      ? activeDrivers.filter((driver) => !submittedIds.has(driver.id))
      : [];
  const totalStops = filtered.reduce((sum, item) => sum + Number(item.stops || 0), 0);
  const totalParcels = filtered.reduce((sum, item) => sum + Number(item.parcels || 0), 0);
  const totalHours = filtered.reduce((sum, item) => sum + Number(item.hours || 0), 0);
  return {
    filtered,
    totalStops,
    totalParcels,
    totalHours,
    driversSubmitted: submittedIds.size,
    driversPending: pendingDrivers.length,
    averageStops: submittedIds.size ? Math.round(totalStops / submittedIds.size) : 0,
  };
};

const stat = (label, value, helper = "") => `
  <article class="stat">
    <span>${h(label)}</span>
    <strong>${h(value)}</strong>
    ${helper ? `<small>${h(helper)}</small>` : ""}
  </article>
`;

const supervisorDashboard = () => {
  const user = currentUser();
  const m = dashboardMetrics(state.filters.date, state.filters.driverId, state.filters.routeId);
  const previous = dashboardMetrics(dayISO(-1));
  const lastUpdated = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  return `
    ${header()}
    <main class="shell">
      <section class="view-head">
        <div class="view-title">
          <p class="eyebrow">Supervisor dashboard</p>
          <h2>Daily depot metrics</h2>
          <p>Signed in as ${h(formatName(user))}. Live view refreshed ${h(lastUpdated)}.</p>
        </div>
        <div class="toolbar">
          <button class="ghost-button" data-action="export-csv">Export CSV</button>
        </div>
      </section>
      <section class="dashboard">
        ${filters()}
        <div class="stat-grid">
          ${stat("Total stops today", m.totalStops)}
          ${stat("Total parcels today", m.totalParcels)}
          ${stat("Total hours submitted", m.totalHours.toFixed(1))}
          ${stat("Drivers submitted", m.driversSubmitted, `${m.driversPending} pending`)}
          ${stat("Drivers pending", m.driversPending)}
          ${stat("Average stops per driver", m.averageStops)}
          ${stat("Yesterday stops", previous.totalStops)}
          ${stat("Yesterday parcels", previous.totalParcels)}
        </div>
        <div class="dashboard-main">
          <section class="stack">
            <div class="panel panel-pad stack">
              <div class="view-title">
                <h3>KPI trend</h3>
                <p>Last seven days by total stops.</p>
              </div>
              <div class="trend">${trendSvg()}</div>
            </div>
            ${driverTable(m.filtered)}
          </section>
          <section class="stack">
            ${pendingDriversPanel(m)}
            ${holidayApprovalPanel()}
          </section>
        </div>
      </section>
    </main>
  `;
};

const filters = () => `
  <form class="filters" data-form="filters">
    <label class="field">
      <span>Date</span>
      <input class="input" name="date" type="date" value="${h(state.filters.date)}" />
    </label>
    <label class="field">
      <span>Driver</span>
      <select class="select" name="driverId">
        <option value="all">All drivers</option>
        ${drivers()
          .map((driver) => `<option value="${h(driver.id)}" ${state.filters.driverId === driver.id ? "selected" : ""}>${h(formatName(driver))}</option>`)
          .join("")}
      </select>
    </label>
    <label class="field">
      <span>Route</span>
      <select class="select" name="routeId">
        <option value="all">All routes</option>
        ${state.data.routes
          .map((route) => `<option value="${h(route.id)}" ${state.filters.routeId === route.id ? "selected" : ""}>${h(route.routeNumber)}</option>`)
          .join("")}
      </select>
    </label>
    <button class="button" type="submit">Apply</button>
  </form>
`;

const trendSvg = () => {
  const days = Array.from({ length: 7 }, (_, index) => dayISO(index - 6));
  const values = days.map((date) => dashboardMetrics(date).totalStops);
  const max = Math.max(1, ...values);
  const points = values
    .map((value, index) => {
      const x = 40 + index * 82;
      const y = 175 - (value / max) * 125;
      return `${x},${y}`;
    })
    .join(" ");
  const labels = days
    .map((date, index) => `<text x="${40 + index * 82}" y="205" text-anchor="middle" font-size="11" fill="#64748b">${date.slice(5)}</text>`)
    .join("");
  const dots = points
    .split(" ")
    .map((pair) => {
      const [x, y] = pair.split(",");
      return `<circle cx="${x}" cy="${y}" r="4" fill="#0f4c81"></circle>`;
    })
    .join("");
  return `
    <svg viewBox="0 0 560 230" role="img" aria-label="KPI trend chart">
      <line x1="32" y1="175" x2="535" y2="175" stroke="#e2e8f0" />
      <line x1="32" y1="50" x2="535" y2="50" stroke="#f1f5f9" />
      <polyline points="${points}" fill="none" stroke="#0f4c81" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
      ${dots}
      ${labels}
    </svg>
  `;
};

const driverTable = (rows) => `
  <section class="panel panel-pad stack">
    <div class="view-title">
      <h3>Driver submissions</h3>
      <p>Status and route details for selected filters.</p>
    </div>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Driver</th>
            <th>Route</th>
            <th>Hours</th>
            <th>Stops</th>
            <th>Parcels</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${
            rows.length
              ? rows
                  .map((item) => {
                    const driver = userById(item.driverId);
                    return `
                      <tr>
                        <td>${h(driver ? formatName(driver) : "Unknown")}</td>
                        <td>${h(routeById(item.routeId)?.routeNumber || "No route")}</td>
                        <td>${h(item.hours)}</td>
                        <td>${h(item.stops)}</td>
                        <td>${h(item.parcels)}</td>
                        <td><span class="status submitted">${h(item.status)}</span></td>
                      </tr>
                    `;
                  })
                  .join("")
              : `<tr><td colspan="6">No KPI submissions for this filter.</td></tr>`
          }
        </tbody>
      </table>
    </div>
  </section>
`;

const pendingDriversPanel = (m) => {
  const submittedIds = new Set(m.filtered.map((item) => item.driverId));
  const pending = drivers().filter((driver) => !submittedIds.has(driver.id));
  return `
    <section class="panel panel-pad stack">
      <div class="view-title">
        <h3>Drivers pending</h3>
        <p>For ${h(state.filters.date)}.</p>
      </div>
      <div class="history-list">
        ${
          pending.length
            ? pending
                .map(
                  (driver) => `
                    <article class="history-item">
                      <header>
                        <strong>${h(formatName(driver))}</strong>
                        <span class="status pending">pending</span>
                      </header>
                      <div class="history-meta">
                        <span>${h(routeById(driver.defaultRouteId)?.routeNumber || "No route")}</span>
                      </div>
                    </article>
                  `,
                )
                .join("")
            : `<div class="empty">All active drivers are submitted.</div>`
        }
      </div>
    </section>
  `;
};

const holidayApprovalPanel = () => {
  const requests = state.data.holidayRequests
    .slice()
    .sort((a, b) => {
      if (a.status === "pending" && b.status !== "pending") return -1;
      if (a.status !== "pending" && b.status === "pending") return 1;
      return b.createdAt.localeCompare(a.createdAt);
    })
    .slice(0, 7);
  return `
    <section class="panel panel-pad stack">
      <div class="view-title">
        <h3>Holiday approvals</h3>
        <p>Supervisor and admin review queue.</p>
      </div>
      <div class="history-list">
        ${
          requests.length
            ? requests
                .map((request) => {
                  const driver = userById(request.driverId);
                  return `
                    <article class="history-item">
                      <header>
                        <strong>${h(driver ? formatName(driver) : "Unknown driver")}</strong>
                        <span class="status ${h(request.status)}">${h(request.status)}</span>
                      </header>
                      <div class="history-meta">
                        <span>${h(request.startDate)} to ${h(request.endDate)}</span>
                        <span>${h(request.reason || "No reason")}</span>
                      </div>
                      ${
                        request.status === "pending"
                          ? `<div class="row-actions">
                              <button class="mini-button approve" data-action="holiday-approve" data-id="${h(request.id)}">Approve</button>
                              <button class="mini-button reject" data-action="holiday-reject" data-id="${h(request.id)}">Reject</button>
                            </div>`
                          : ""
                      }
                    </article>
                  `;
                })
                .join("")
            : `<div class="empty">No holiday requests.</div>`
        }
      </div>
    </section>
  `;
};

const adminView = () => `
  ${header()}
  <main class="shell">
    <section class="view-head">
      <div class="view-title">
        <p class="eyebrow">Admin console</p>
        <h2>System management</h2>
        <p>Users, routes, submissions, exports and general settings.</p>
      </div>
      <div class="toolbar">
        <button class="ghost-button" data-action="export-json">Export JSON</button>
        <button class="danger-button" data-action="reset-demo">Reset demo</button>
      </div>
    </section>
    <section class="stack">
      <div class="admin-tabs" role="tablist">
        ${adminTab("users", "Users")}
        ${adminTab("data", "All data")}
        ${adminTab("settings", "Settings")}
      </div>
      ${state.adminTab === "users" ? adminUsers() : state.adminTab === "data" ? adminData() : adminSettings()}
    </section>
  </main>
`;

const adminTab = (id, label) => `
  <button class="tab-button ${state.adminTab === id ? "active" : ""}" data-action="admin-tab" data-id="${h(id)}" role="tab">${h(label)}</button>
`;

const adminUsers = () => {
  const editing = state.data.users.find((user) => user.id === state.editingUserId);
  return `
    <section class="split">
      <form class="form panel panel-pad" data-form="user">
        <div class="view-title">
          <h3>${editing ? "Edit user" : "Create user"}</h3>
          <p>Drivers, supervisors and admins use the same account structure.</p>
        </div>
        <input type="hidden" name="id" value="${h(editing?.id || "")}" />
        <div class="grid-2">
          <label class="field">
            <span>First name</span>
            <input class="input" name="firstName" value="${h(editing?.firstName || "")}" required />
          </label>
          <label class="field">
            <span>Last name</span>
            <input class="input" name="lastName" value="${h(editing?.lastName || "")}" required />
          </label>
        </div>
        <label class="field">
          <span>Email</span>
          <input class="input" name="email" type="email" value="${h(editing?.email || "")}" required />
        </label>
        <div class="grid-2">
          <label class="field">
            <span>Employee ID</span>
            <input class="input" name="employeeId" value="${h(editing?.employeeId || "")}" />
          </label>
          <label class="field">
            <span>Password</span>
            <input class="input" name="password" value="${h(editing?.password || "driver123")}" required />
          </label>
        </div>
        <div class="grid-2">
          <label class="field">
            <span>Role</span>
            <select class="select" name="role">
              ${["driver", "supervisor", "admin"]
                .map((role) => `<option value="${role}" ${editing?.role === role ? "selected" : ""}>${role}</option>`)
                .join("")}
            </select>
          </label>
          <label class="field">
            <span>Status</span>
            <select class="select" name="status">
              ${["active", "inactive"]
                .map((status) => `<option value="${status}" ${editing?.status === status ? "selected" : ""}>${status}</option>`)
                .join("")}
            </select>
          </label>
        </div>
        <div class="grid-2">
          <label class="field">
            <span>Supervisor</span>
            <select class="select" name="supervisorId">
              <option value="">None</option>
              ${supervisorOptions(editing?.supervisorId || "")}
            </select>
          </label>
          <label class="field">
            <span>Default route</span>
            <select class="select" name="defaultRouteId">
              <option value="">None</option>
              ${routeOptions(editing?.defaultRouteId || "")}
            </select>
          </label>
        </div>
        <div class="row-actions">
          <button class="button" type="submit">${editing ? "Save user" : "Create user"}</button>
          ${editing ? `<button class="ghost-button" type="button" data-action="cancel-edit">Cancel</button>` : ""}
        </div>
      </form>
      <section class="panel panel-pad stack">
        <div class="view-title">
          <h3>User directory</h3>
          <p>${state.data.users.length} accounts</p>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Email</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${state.data.users
                .map(
                  (user) => `
                    <tr>
                      <td>${h(formatName(user))}</td>
                      <td>${h(user.role)}</td>
                      <td>${h(user.email)}</td>
                      <td><span class="status ${h(user.status)}">${h(user.status)}</span></td>
                      <td>
                        <div class="row-actions">
                          <button class="mini-button" data-action="edit-user" data-id="${h(user.id)}">Edit</button>
                          <button class="mini-button reject" data-action="delete-user" data-id="${h(user.id)}">Delete</button>
                        </div>
                      </td>
                    </tr>
                  `,
                )
                .join("")}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  `;
};

const adminData = () => {
  const m = dashboardMetrics(todayISO());
  return `
    <section class="stack">
      <div class="stat-grid">
        ${stat("Users", state.data.users.length)}
        ${stat("Routes", state.data.routes.length)}
        ${stat("KPI submissions", state.data.kpiSubmissions.length)}
        ${stat("Holiday requests", state.data.holidayRequests.length)}
      </div>
      <section class="panel panel-pad stack">
        <div class="view-title">
          <h3>All KPI data</h3>
          <p>Today: ${h(m.totalStops)} stops, ${h(m.totalParcels)} parcels, ${h(m.totalHours.toFixed(1))} hours.</p>
        </div>
        ${driverTable(state.data.kpiSubmissions.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 20))}
      </section>
      ${holidayApprovalPanel()}
    </section>
  `;
};

const adminSettings = () => `
  <form class="form panel panel-pad" data-form="settings">
    <div class="view-title">
      <h3>General settings</h3>
      <p>Presentation-level settings for a future backend configuration screen.</p>
    </div>
    <div class="grid-2">
      <label class="field">
        <span>System name</span>
        <input class="input" name="systemName" value="${h(state.data.settings.systemName)}" required />
      </label>
      <label class="field">
        <span>Depot name</span>
        <input class="input" name="depotName" value="${h(state.data.settings.depotName)}" required />
      </label>
    </div>
    <div class="grid-2">
      <label class="field">
        <span>Daily cut-off time</span>
        <input class="input" name="cutOffTime" type="time" value="${h(state.data.settings.cutOffTime)}" required />
      </label>
      <label class="field">
        <span>Default break minutes</span>
        <input class="input" name="defaultBreakMinutes" type="number" min="0" step="5" value="${h(state.data.settings.defaultBreakMinutes)}" required />
      </label>
    </div>
    <label class="field">
      <span>Active route numbers</span>
      <textarea class="textarea" name="routes">${h(state.data.routes.map((route) => route.routeNumber).join(", "))}</textarea>
      <small class="hint">Comma-separated route numbers. Existing route IDs are preserved where possible.</small>
    </label>
    <button class="button" type="submit">Save settings</button>
  </form>
`;

const render = () => {
  const user = currentUser();
  let html = "";
  if (state.view === "login") html = loginView();
  else if (state.view === "driver") html = user?.role === "driver" ? driverDashboard() : homeView();
  else if (state.view === "kpi") html = user?.role === "driver" ? kpiView() : loginView();
  else if (state.view === "holiday") html = user?.role === "driver" ? holidayView() : loginView();
  else if (state.view === "supervisor") html = user?.role === "supervisor" || user?.role === "admin" ? supervisorDashboard() : loginView();
  else if (state.view === "admin") html = user?.role === "admin" ? adminView() : loginView();
  else html = user?.role === "driver" ? driverDashboard() : homeView();

  app.innerHTML = `${html}${state.toast ? `<div class="toast">${h(state.toast)}</div>` : ""}`;
};

const formData = (form) => Object.fromEntries(new FormData(form).entries());

const handleLogin = (form) => {
  const data = formData(form);
  const user = state.data.users.find(
    (item) =>
      item.email.toLowerCase() === String(data.email).toLowerCase() &&
      item.password === data.password &&
      item.role === state.loginRole &&
      item.status === "active",
  );
  if (!user) {
    state.loginError = "Those details do not match an active account for this role.";
    render();
    return;
  }
  state.currentUserId = user.id;
  sessionStorage.setItem("depotops.currentUserId", user.id);
  state.loginError = "";
  if (user.role === "driver") setView(state.intent === "holiday" ? "holiday" : state.intent === "kpi" ? "kpi" : "driver");
  if (user.role === "supervisor") setView("supervisor");
  if (user.role === "admin") setView("admin");
};

const validateKpi = (data) => {
  const errors = [];
  if (!data.routeId) errors.push("Route is required.");
  if (!data.supervisorId) errors.push("Supervisor is required.");
  if (!data.startTime || !data.finishTime) errors.push("Start and finish time are required.");
  if (Number(data.hours) <= 0) errors.push("Hours must be greater than zero.");
  if (Number(data.breakMinutes) === 30 && data.breakApprovedBy !== "Radio Room") {
    errors.push("Radio Room approval is required for a 30 minute break.");
  }
  return errors;
};

const handleKpi = (form) => {
  const user = currentUser();
  const data = formData(form);
  const errors = validateKpi(data);
  if (errors.length) {
    toast(errors[0]);
    return;
  }
  const submit = form.querySelector("[data-submit-label]");
  submit.disabled = true;
  submit.textContent = "Submitting...";
  window.setTimeout(() => {
    state.data.kpiSubmissions.unshift({
      id: uid("kpi"),
      driverId: user.id,
      supervisorId: data.supervisorId,
      date: data.date,
      driverType: data.driverType,
      routeId: data.routeId,
      startTime: data.startTime,
      finishTime: data.finishTime,
      hours: Number(data.hours),
      breakMinutes: Number(data.breakMinutes),
      breakApprovedBy: data.breakApprovedBy,
      offroadDuties: data.offroadDuties === "yes",
      offroadNotes: data.offroadNotes,
      stops: Number(data.stops),
      parcels: Number(data.parcels),
      incidents: data.incidents,
      comments: data.comments,
      status: "submitted",
      createdAt: new Date().toISOString(),
    });
    persist();
    toast("KPI submitted successfully.");
    setView("driver");
  }, 650);
};

const handleHoliday = (form) => {
  const user = currentUser();
  const data = formData(form);
  if (!data.startDate || !data.endDate) {
    toast("Start and end dates are required.");
    return;
  }
  if (data.endDate < data.startDate) {
    toast("End date must be after the start date.");
    return;
  }
  state.data.holidayRequests.unshift({
    id: uid("hol"),
    driverId: user.id,
    startDate: data.startDate,
    endDate: data.endDate,
    reason: data.reason,
    status: "pending",
    reviewedBy: "",
    reviewedAt: "",
    createdAt: new Date().toISOString(),
  });
  persist();
  toast("Holiday request sent.");
  setView("holiday");
};

const handleFilters = (form) => {
  const data = formData(form);
  state.filters = { date: data.date, driverId: data.driverId, routeId: data.routeId };
  render();
};

const handleUser = (form) => {
  const data = formData(form);
  const duplicate = state.data.users.find(
    (user) => user.email.toLowerCase() === data.email.toLowerCase() && user.id !== data.id,
  );
  if (duplicate) {
    toast("Email is already used by another account.");
    return;
  }
  if (data.id) {
    const index = state.data.users.findIndex((user) => user.id === data.id);
    state.data.users[index] = { ...state.data.users[index], ...data };
    state.editingUserId = "";
    toast("User updated.");
  } else {
    state.data.users.push({
      id: uid(data.role.slice(0, 3)),
      ...data,
      createdAt: new Date().toISOString(),
    });
    toast("User created.");
  }
  persist();
  render();
};

const handleSettings = (form) => {
  const data = formData(form);
  state.data.settings = {
    ...state.data.settings,
    systemName: data.systemName,
    depotName: data.depotName,
    cutOffTime: data.cutOffTime,
    defaultBreakMinutes: Number(data.defaultBreakMinutes),
  };
  const routeNumbers = data.routes
    .split(",")
    .map((route) => route.trim())
    .filter(Boolean);
  state.data.routes = routeNumbers.map((routeNumber) => {
    const existing = state.data.routes.find((route) => route.routeNumber === routeNumber);
    return existing || { id: uid("route"), routeNumber, depot: data.depotName, zone: "General", status: "active" };
  });
  persist();
  toast("Settings saved.");
  render();
};

const updateHolidayStatus = (id, status) => {
  const request = state.data.holidayRequests.find((item) => item.id === id);
  if (!request) return;
  request.status = status;
  request.reviewedBy = currentUser()?.id || "";
  request.reviewedAt = new Date().toISOString();
  persist();
  toast(`Holiday request ${status}.`);
  render();
};

const exportJson = () => downloadFile("depotops-export.json", JSON.stringify(state.data, null, 2), "application/json");

const exportCsv = () => {
  const rows = [["date", "driver", "route", "hours", "stops", "parcels", "status"]];
  state.data.kpiSubmissions.forEach((item) => {
    const driver = userById(item.driverId);
    rows.push([
      item.date,
      driver ? formatName(driver) : "",
      routeById(item.routeId)?.routeNumber || "",
      item.hours,
      item.stops,
      item.parcels,
      item.status,
    ]);
  });
  const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
  downloadFile("depotops-kpi.csv", csv, "text/csv");
};

const downloadFile = (filename, content, type) => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

app.addEventListener("submit", (event) => {
  event.preventDefault();
  const form = event.target;
  const name = form.dataset.form;
  if (name === "login") handleLogin(form);
  if (name === "kpi") handleKpi(form);
  if (name === "holiday") handleHoliday(form);
  if (name === "filters") handleFilters(form);
  if (name === "user") handleUser(form);
  if (name === "settings") handleSettings(form);
});

app.addEventListener("click", (event) => {
  const target = event.target.closest("[data-action]");
  if (!target) return;
  const action = target.dataset.action;
  if (action === "home") {
    event.preventDefault();
    setView("home");
  }
  if (action === "logout") signOut();
  if (action === "login-driver") setView("login", { loginRole: "driver", intent: "", loginError: "" });
  if (action === "login-supervisor") setView("login", { loginRole: "supervisor", intent: "", loginError: "" });
  if (action === "login-admin") setView("login", { loginRole: "admin", intent: "", loginError: "" });
  if (action === "open-kpi") requireRole("driver", "kpi", "kpi");
  if (action === "open-holiday") requireRole("driver", "holiday", "holiday");
  if (action === "demo-login") {
    const user = userById(target.dataset.id);
    if (user) {
      state.currentUserId = user.id;
      sessionStorage.setItem("depotops.currentUserId", user.id);
      if (user.role === "driver") setView(state.intent === "holiday" ? "holiday" : state.intent === "kpi" ? "kpi" : "driver");
      if (user.role === "supervisor") setView("supervisor");
      if (user.role === "admin") setView("admin");
    }
  }
  if (action === "step-up" || action === "step-down") {
    const stepper = target.closest("[data-stepper]");
    const input = stepper.querySelector("input");
    const step = Number(stepper.dataset.step);
    const min = Number(stepper.dataset.min);
    const next = Number(input.value || 0) + (action === "step-up" ? step : -step);
    input.value = Math.max(min, next).toFixed(step % 1 ? 1 : 0);
  }
  if (action === "holiday-approve") updateHolidayStatus(target.dataset.id, "approved");
  if (action === "holiday-reject") updateHolidayStatus(target.dataset.id, "rejected");
  if (action === "export-json") exportJson();
  if (action === "export-csv") exportCsv();
  if (action === "reset-demo") {
    state.data = seedData();
    state.editingUserId = "";
    persist();
    toast("Demo data reset.");
    setView("admin");
  }
  if (action === "admin-tab") {
    state.adminTab = target.dataset.id;
    render();
  }
  if (action === "edit-user") {
    state.editingUserId = target.dataset.id;
    state.adminTab = "users";
    render();
  }
  if (action === "cancel-edit") {
    state.editingUserId = "";
    render();
  }
  if (action === "delete-user") {
    const id = target.dataset.id;
    if (id === state.currentUserId) {
      toast("You cannot delete the signed-in account.");
      return;
    }
    state.data.users = state.data.users.filter((user) => user.id !== id);
    state.data.kpiSubmissions = state.data.kpiSubmissions.filter((item) => item.driverId !== id);
    state.data.holidayRequests = state.data.holidayRequests.filter((item) => item.driverId !== id);
    persist();
    toast("User deleted.");
    render();
  }
});

window.setInterval(() => {
  if (state.view === "supervisor") render();
}, 10000);

render();
