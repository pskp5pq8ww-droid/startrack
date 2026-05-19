// ── Utilities ──────────────────────────────────────────────────────────────
const todayISO = () => new Date().toISOString().slice(0, 10)
const dayISO = (offset) => {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return d.toISOString().slice(0, 10)
}
const h = (value = '') =>
  String(value)
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#039;')
const formatName = (user) => `${user.firstName} ${user.lastName}`

const BRISBANE_TOLLS = [
  { id: 'gateway', name: 'Gateway Motorway / Gateway Bridge', price: 0 },
  { id: 'go-between', name: 'Go Between Bridge', price: 0 },
  { id: 'clem7', name: 'Clem7 Tunnel', price: 0 },
  { id: 'airportlinkm7', name: 'AirportlinkM7', price: 0 },
  { id: 'legacy-way', name: 'Legacy Way', price: 0 },
  { id: 'logan-motorway', name: 'Logan Motorway', price: 0 },
  { id: 'toowoomba-bypass', name: 'Toowoomba Bypass', price: 0 },
]

const createKpiDraft = () => ({ hasTolls: false, tolls: [], breakMinutes: 60 })

const parseTimeToMinutes = (time = '') => {
  const [hours, minutes] = String(time).split(':').map(Number)
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null
  return hours * 60 + minutes
}

const calculateWorkedHours = (startTime, finishTime) => {
  const start = parseTimeToMinutes(startTime)
  let finish = parseTimeToMinutes(finishTime)
  if (start === null || finish === null) return 0
  if (finish < start) finish += 24 * 60
  return Math.round(((finish - start) / 60) * 100) / 100
}

const formatHours = (hours) => Number(hours || 0).toFixed(1)
const formatMoney = (value) => `$${Number(value || 0).toFixed(2)}`

// ── API client ─────────────────────────────────────────────────────────────
const apiToken = () => sessionStorage.getItem('st.token') || ''
const apiFetch = (url, opts = {}) =>
  fetch(url, {
    ...opts,
    headers: { 'Content-Type': 'application/json', 'X-Token': apiToken(), ...(opts.headers || {}) },
  }).then(r => r.json())
const api = {
  get: (url) => apiFetch(url),
  post: (url, data) => apiFetch(url, { method: 'POST', body: JSON.stringify(data) }),
  put: (url, data) => apiFetch(url, { method: 'PUT', body: JSON.stringify(data) }),
  del: (url) => apiFetch(url, { method: 'DELETE' }),
}

// ── State ──────────────────────────────────────────────────────────────────
const state = {
  data: {
    users: [],
    kpiSubmissions: [],
    holidayRequests: [],
    alerts: [],
    sickLeaves: [],
    routes: [],
    settings: { depotName: 'BNPF Depot', systemName: 'StarTrack', cutOffTime: '18:30', defaultBreakMinutes: 60 },
  },
  currentUser: null,
  view: 'home',
  intent: '',
  loginRole: 'driver',
  loginError: '',
  toast: '',
  filters: { date: todayISO(), driverId: 'all', routeId: 'all' },
  adminTab: 'users',
  editingUserId: '',
  kpiDraft: createKpiDraft(),
}

// ── Live tracking ──────────────────────────────────────────────────────────
const notifications = []
let prevKpiCount = 0
let prevHolidayCount = 0
let clockTimer = null

const brisbaneClock = () => new Date().toLocaleTimeString('en-AU', {
  timeZone: 'Australia/Brisbane',
  hour12: false,
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
})

const brisbaneDate = () => new Date().toLocaleDateString('en-AU', {
  timeZone: 'Australia/Brisbane',
  weekday: 'short',
  day: 'numeric',
  month: 'short',
})

function startClock() {
  if (clockTimer) return
  clockTimer = setInterval(() => {
    const el = document.getElementById('brisbane-clock')
    if (!el) { clearInterval(clockTimer); clockTimer = null; return }
    el.textContent = brisbaneClock()
  }, 1000)
}

function stopClock() {
  if (clockTimer) { clearInterval(clockTimer); clockTimer = null }
}

function pushNotification(message, type = 'info') {
  const time = brisbaneClock()
  notifications.unshift({ id: Date.now(), message, time, type })
  if (notifications.length > 8) notifications.pop()
  const bar = document.getElementById('notif-list')
  if (bar) bar.innerHTML = renderNotifList()
}

function renderNotifList() {
  if (!notifications.length) return `<span class="notif-empty">No new activity</span>`
  return notifications.map(n => `
    <div class="notif-item notif-${h(n.type)}">
      <span class="notif-time">${h(n.time)}</span>
      <span class="notif-msg">${h(n.message)}</span>
    </div>
  `).join('')
}

const getRefreshInterval = () => {
  try {
    const type = navigator.connection?.effectiveType
    if (type === '3g' || type === '2g' || type === 'slow-2g') return 30000
  } catch {}
  return 15000
}

const app = document.querySelector('#app')

const currentUser = () => state.currentUser
const drivers = () => state.data.users.filter(u => u.role === 'driver' && u.status === 'active')
const supervisors = () => state.data.users.filter(u => u.role === 'supervisor' && u.status === 'active')
const routeById = (id) => state.data.routes.find(r => r.id === id)
const userById = (id) => state.data.users.find(u => u.id === id)
const tollConfig = () => Array.isArray(state.data.settings?.tolls) && state.data.settings.tolls.length
  ? state.data.settings.tolls
  : BRISBANE_TOLLS
const tollById = (id) => tollConfig().find(t => t.id === id)
const normalizeTollList = (tolls = []) => (Array.isArray(tolls) ? tolls : [])
  .map(t => ({
    id: t.id,
    name: t.name,
    price: Number(t.price || 0),
    quantity: Math.max(1, Number(t.quantity || 1)),
  }))
  .map(t => ({ ...t, total: Math.round(t.price * t.quantity * 100) / 100 }))
const tollTotal = (tolls = []) => normalizeTollList(tolls).reduce((sum, t) => sum + Number(t.total || 0), 0)
const tollConfigText = () => tollConfig().map(t => `${t.id}|${t.name}|${Number(t.price || 0)}`).join('\n')
const parseTollConfigText = (value = '') => String(value).split('\n')
  .map(line => line.trim())
  .filter(Boolean)
  .map(line => {
    const [id, name, price = 0] = line.split('|').map(part => part.trim())
    return { id, name, price: Number(price || 0) }
  })
  .filter(t => t.id && t.name && Number.isFinite(t.price))

// ── Data loading ───────────────────────────────────────────────────────────
async function loadData() {
  try {
    const user = currentUser()
    const isSupervisorOrAdmin = user?.role === 'supervisor' || user?.role === 'admin'
    const [users, kpis, holidays, routes, settings, alerts] = await Promise.all([
      api.get('/api/users'),
      api.get('/api/kpi'),
      api.get('/api/holidays'),
      api.get('/api/routes'),
      api.get('/api/settings'),
      isSupervisorOrAdmin ? api.get('/api/alerts') : Promise.resolve([]),
    ])
    state.data.users = Array.isArray(users) ? users : []
    state.data.kpiSubmissions = Array.isArray(kpis) ? kpis : []
    state.data.holidayRequests = Array.isArray(holidays) ? holidays : []
    state.data.alerts = Array.isArray(alerts) ? alerts : []
    state.data.routes = Array.isArray(routes) ? routes : []
    if (settings && !settings.error) state.data.settings = settings

    // Detect and notify new submissions
    const kpiCount = state.data.kpiSubmissions.length
    if (prevKpiCount > 0 && kpiCount > prevKpiCount) {
      const n = kpiCount - prevKpiCount
      pushNotification(`${n} new KPI submission${n > 1 ? 's' : ''} received`, 'kpi')
    }
    prevKpiCount = kpiCount

    const holCount = state.data.holidayRequests.length
    if (prevHolidayCount > 0 && holCount > prevHolidayCount) {
      pushNotification('New holiday request submitted', 'holiday')
    }
    prevHolidayCount = holCount
  } catch (e) {
    console.error('Failed to load data', e)
  }
}

function navigateAfterLogin(user) {
  if (user.role === 'driver') setView(state.intent === 'holiday' ? 'holiday' : state.intent === 'kpi' ? 'kpi' : 'driver')
  else if (user.role === 'supervisor') setView('supervisor')
  else if (user.role === 'admin') setView('admin')
}

// ── Navigation ─────────────────────────────────────────────────────────────
const showToast = (message) => {
  state.toast = message
  render()
  window.setTimeout(() => { state.toast = ''; render() }, 2800)
}

const setView = (view, options = {}) => {
  state.view = view
  Object.assign(state, options)
  if (view === 'supervisor') {
    api.get(`/api/dashboard/${state.filters.date}`).catch(() => {})
    setTimeout(startClock, 100)
  } else {
    stopClock()
  }
  window.scrollTo({ top: 0, behavior: 'smooth' })
  render()
}

const requireRole = (role, targetView, intent = '') => {
  const user = currentUser()
  if (user && user.role === role) { setView(targetView); return }
  setView('login', { loginRole: role, intent, loginError: '' })
}

const signOut = async () => {
  await api.post('/api/auth/logout', {}).catch(() => {})
  sessionStorage.removeItem('st.token')
  state.currentUser = null
  state.data = { users: [], kpiSubmissions: [], holidayRequests: [], alerts: [], sickLeaves: [], routes: state.data.routes, settings: state.data.settings }
  setView('home')
}

// ── Header ─────────────────────────────────────────────────────────────────
const header = () => {
  const user = currentUser()
  return `
    <header class="topbar">
      <button class="brand" data-action="home" aria-label="StarTrack home">
        <img src="./startrack.png" alt="StarTrack" class="brand-logo" />
        <span class="brand-sub">${h(state.data.settings.depotName)}</span>
      </button>
      <nav class="top-actions" aria-label="Role access">
        ${user
          ? `<span class="chip">${h(user.role)} · ${h(user.firstName)}</span>
             <button class="text-link" data-action="logout">Sign out</button>`
          : `<button class="text-link" data-action="login-supervisor">Staff Login</button>`
        }
      </nav>
    </header>
  `
}

// ── Home view ──────────────────────────────────────────────────────────────
const homeView = () => `
  <main class="home-screen">
    <button class="logo-admin-btn" data-action="admin-access" aria-label="StarTrack staff login">
      <img src="./startrack.png" alt="StarTrack" />
    </button>
    <div class="home-actions">
      <button class="home-card primary" data-action="open-kpi">
        <span class="home-card-title">Fill KPI</span>
      </button>
      <button class="home-card secondary" data-action="open-holiday">
        <span class="home-card-title">Holiday Request</span>
      </button>
      <button class="home-card tertiary" data-action="open-sick-leave">
        <span class="home-card-title">Sick Leave</span>
      </button>
    </div>
  </main>
`

// ── Login view ─────────────────────────────────────────────────────────────
const roleLabel = (role) => ({ driver: 'Driver', supervisor: 'Supervisor', admin: 'Admin' })[role] || 'User'

const loginView = () => {
  const demoUsers = state.data.users.filter(u => u.role === state.loginRole).slice(0, 3)
  const defaultEmail = state.loginRole === 'driver' ? 'driver@depotops.test' : state.loginRole === 'supervisor' ? 'supervisor@depotops.test' : 'admin@depotops.test'
  const defaultPass = state.loginRole === 'driver' ? 'driver123' : state.loginRole === 'supervisor' ? 'supervisor123' : 'admin123'
  const isStaff = state.loginRole === 'supervisor' || state.loginRole === 'admin'
  return `
    ${header()}
    <main class="shell login-wrap">
      <section class="login-panel">
        <form class="form" data-form="login">
          <div class="view-title">
            <p class="eyebrow">StarTrack · ${roleLabel(state.loginRole)}</p>
            <h2>Sign in</h2>
          </div>
          ${isStaff ? `
            <div class="role-toggle">
              <button type="button" class="role-pill ${state.loginRole === 'supervisor' ? 'active' : ''}" data-action="login-supervisor">Supervisor</button>
              <button type="button" class="role-pill ${state.loginRole === 'admin' ? 'active' : ''}" data-action="login-admin">Admin</button>
            </div>
          ` : ''}
          <label class="field">
            <span>Email</span>
            <input class="input" name="email" type="email" autocomplete="username" value="${h(defaultEmail)}" required />
          </label>
          <label class="field">
            <span>Password</span>
            <input class="input" name="password" type="password" autocomplete="current-password" value="${h(defaultPass)}" required />
          </label>
          ${state.loginError ? `<p class="error-text">${h(state.loginError)}</p>` : ''}
          <button class="button" type="submit">Sign in</button>
        </form>
        ${demoUsers.length ? `
          <div class="demo-list" aria-label="Demo accounts">
            ${demoUsers.map(u => `
              <button class="demo-account" data-action="demo-login" data-id="${h(u.id)}">
                <span>${h(formatName(u))}</span>
                <small>${h(u.employeeId || u.role)}</small>
              </button>
            `).join('')}
          </div>
        ` : ''}
      </section>
    </main>
  `
}

// ── Driver dashboard ───────────────────────────────────────────────────────
const driverDashboard = () => {
  const user = currentUser()
  const submissions = state.data.kpiSubmissions.filter(k => k.driverId === user.id).sort((a, b) => b.date.localeCompare(a.date))
  const holidays = state.data.holidayRequests.filter(h => h.driverId === user.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const todaySubmission = submissions.find(k => k.date === todayISO())
  return `
    ${header()}
    <main class="shell driver-shell">
      <section class="view-head">
        <div class="view-title">
          <p class="eyebrow">StarTrack · Driver</p>
          <h2>Hi, ${h(user.firstName)}</h2>
          <p>${todaySubmission ? 'KPI submitted for today.' : 'Daily KPI pending.'}</p>
        </div>
      </section>
      <section class="launch-grid">
        <button class="launch-button primary" data-action="open-kpi">
          <strong>Fill KPI</strong>
          <span>${todaySubmission ? 'Submit an updated run if required.' : 'Takes around one minute.'}</span>
        </button>
        <button class="launch-button" data-action="open-holiday">
          <strong>Holiday Request</strong>
          <span>Create and track leave requests.</span>
        </button>
      </section>
      <section class="grid-2" style="margin-top:14px">
        <div class="panel panel-pad stack">
          <div class="view-title"><h3>KPI history</h3><p>Recent submissions</p></div>
          <div class="history-list">
            ${submissions.length ? submissions.slice(0, 5).map(historyKpiItem).join('') : '<div class="empty">No KPI submissions yet.</div>'}
          </div>
        </div>
        <div class="panel panel-pad stack">
          <div class="view-title"><h3>Holiday history</h3><p>Approval status</p></div>
          <div class="history-list">
            ${holidays.length ? holidays.slice(0, 5).map(holidayItem).join('') : '<div class="empty">No holiday requests yet.</div>'}
          </div>
        </div>
      </section>
    </main>
  `
}

const historyKpiItem = (item) => `
  <article class="history-item">
    <header>
      <strong>${h(item.date)} · ${h(routeById(item.routeId)?.routeNumber || 'No route')}</strong>
      <span class="status submitted">${h(item.status)}</span>
    </header>
    <div class="history-meta">
      <span>${h(item.hours)}h</span>
      <span>${h(item.stops)} stops</span>
      <span>${h(item.parcels)} parcels</span>
      <span>${h(formatMoney(item.tollTotal || tollTotal(item.tolls)))} tolls</span>
    </div>
  </article>
`

const holidayItem = (item) => `
  <article class="history-item">
    <header>
      <strong>${h(item.startDate)} to ${h(item.endDate)}</strong>
      <span class="status ${h(item.status)}">${h(item.status)}</span>
    </header>
    <div class="history-meta"><span>${h(item.reason || 'No reason supplied')}</span></div>
  </article>
`

// ── KPI form ───────────────────────────────────────────────────────────────
const routeOptions = (selected = '') =>
  state.data.routes.filter(r => r.status === 'active')
    .map(r => `<option value="${h(r.id)}" ${r.id === selected ? 'selected' : ''}>${h(r.routeNumber)} · ${h(r.zone)}</option>`)
    .join('')

const supervisorOptions = (selected = '') =>
  supervisors().map(u => `<option value="${h(u.id)}" ${u.id === selected ? 'selected' : ''}>${h(formatName(u))}</option>`).join('')

const stepperField = (name, label, value, min, step, hint = '') => `
  <label class="field">
    <span>${h(label)}</span>
    <div class="stepper" data-stepper="${h(name)}" data-min="${h(min)}" data-step="${h(step)}">
      <button type="button" data-action="step-down" aria-label="Decrease ${h(label)}">−</button>
      <input name="${h(name)}" inputmode="decimal" value="${h(value)}" required />
      <button type="button" data-action="step-up" aria-label="Increase ${h(label)}">+</button>
    </div>
    ${hint ? `<small class="hint">${h(hint)}</small>` : ''}
  </label>
`

const radio = (name, value, label, checked = false) => `
  <label class="segment">
    <input type="radio" name="${h(name)}" value="${h(value)}" ${checked ? 'checked' : ''} />
    <span>${h(label)}</span>
  </label>
`

const renderTollList = () => {
  const tolls = normalizeTollList(state.kpiDraft.tolls)
  if (!tolls.length) return '<div class="empty compact-empty">No tolls added.</div>'
  return tolls.map(t => `
    <article class="toll-row">
      <div>
        <strong>${h(t.name)}</strong>
        <span>${h(t.quantity)} × ${h(formatMoney(t.price))}</span>
      </div>
      <div class="toll-row-end">
        <strong>${h(formatMoney(t.total))}</strong>
        <button class="mini-button reject" type="button" data-action="remove-toll" data-id="${h(t.id)}">Remove</button>
      </div>
    </article>
  `).join('')
}

const tollsSection = () => {
  const hasTolls = state.kpiDraft.hasTolls
  return `
    <section class="tolls-section">
      <div class="field">
        <span>Tolls</span>
        <div class="segmented">
          ${radio('hasTolls', 'yes', 'Yes', hasTolls)}
          ${radio('hasTolls', 'no', 'No', !hasTolls)}
        </div>
      </div>
      <div class="toll-details ${hasTolls ? '' : 'is-hidden'}" data-toll-details>
        <div class="toll-picker">
          <label class="field">
            <span>Select toll</span>
            <select class="select" name="tollSelect" data-toll-select>
              ${tollConfig().map(t => `<option value="${h(t.id)}">${h(t.name)} · ${h(formatMoney(t.price))}</option>`).join('')}
            </select>
          </label>
          <button class="ghost-button" type="button" data-action="add-toll">Add toll</button>
        </div>
        <div class="toll-list" data-toll-list>${renderTollList()}</div>
        <div class="toll-total">
          <span>Tolls subtotal</span>
          <strong data-toll-total>${h(formatMoney(tollTotal(state.kpiDraft.tolls)))}</strong>
        </div>
      </div>
    </section>
  `
}

const kpiView = () => {
  const user = currentUser()
  const defaultStart = '07:00'
  const defaultFinish = '17:00'
  const defaultHours = calculateWorkedHours(defaultStart, defaultFinish)
  return `
    ${header()}
    <main class="shell driver-shell">
      <section class="view-head">
        <div class="view-title">
          <p class="eyebrow">StarTrack · KPI</p>
          <h2>Fill KPI</h2>
          <p>Date and driver pre-filled from your account.</p>
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
            ${radio('driverType', 'Company Employee', 'Company Employee', true)}
            ${radio('driverType', 'Delivery Partners (Contractor)', 'Delivery Partners (Contractor)')}
            ${radio('driverType', 'Outside Hire', 'Outside Hire')}
            ${radio('driverType', 'Preferred Driver', 'Preferred Driver')}
          </div>
        </div>
        <div class="grid-2">
          <label class="field">
            <span>Supervisor</span>
            <select class="select" name="supervisorId" required>${supervisorOptions(user.supervisorId)}</select>
          </label>
          <label class="field">
            <span>Route number</span>
            <select class="select" name="routeId" required>${routeOptions(user.defaultRouteId)}</select>
          </label>
        </div>
        <div class="grid-2">
          <label class="field">
            <span>Start time</span>
            <input class="input" name="startTime" type="time" value="${defaultStart}" data-hours-source required />
          </label>
          <label class="field">
            <span>Finish time</span>
            <input class="input" name="finishTime" type="time" value="${defaultFinish}" data-hours-source required />
          </label>
        </div>
        <div class="calculated-hours" aria-live="polite">
          <span>Total hours</span>
          <strong data-hours-output>${h(formatHours(defaultHours))}</strong>
          <small>Calculated automatically from start and finish time.</small>
        </div>
        <div class="field">
          <span>Additional off-road duties</span>
          <div class="segmented">
            ${radio('offroadDuties', 'yes', 'Yes')}
            ${radio('offroadDuties', 'no', 'No', true)}
          </div>
        </div>
        <label class="field">
          <span>Off-road duty notes</span>
          <input class="input" name="offroadNotes" placeholder="Early sort, PM close, WHS audit, leading hand..." />
        </label>
        <div class="field">
          <span>Break taken</span>
          <div class="segmented">
            ${radio('breakMinutes', '30', '30 minutes', state.kpiDraft.breakMinutes === 30)}
            ${radio('breakMinutes', '60', '60 minutes', state.kpiDraft.breakMinutes !== 30)}
          </div>
          <small class="hint">If break is shorter than 60 minutes, Radio Room must be notified.</small>
        </div>
        <div class="radio-room-box ${state.kpiDraft.breakMinutes === 30 ? '' : 'is-hidden'}" data-radio-room-box>
          <p class="radio-room-prompt">Did you notify Radio Room?</p>
          <div class="segmented">
            ${radio('radioRoomNotified', 'yes', 'Yes')}
            ${radio('radioRoomNotified', 'no', 'No')}
          </div>
        </div>
        <div class="grid-2">
          ${stepperField('stops', 'Stops', 0, 0, 1)}
          ${stepperField('parcels', 'Parcels', 0, 0, 1)}
        </div>
        ${tollsSection()}
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
  `
}

// ── Holiday view ───────────────────────────────────────────────────────────
const holidayView = () => {
  const user = currentUser()
  const holidays = state.data.holidayRequests.filter(h => h.driverId === user.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
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
          <div class="view-title"><h3>Your requests</h3><p>Pending, approved and rejected.</p></div>
          <div class="history-list">
            ${holidays.length ? holidays.map(holidayItem).join('') : '<div class="empty">No holiday requests yet.</div>'}
          </div>
        </div>
      </section>
    </main>
  `
}

// ── Sick leave view ────────────────────────────────────────────────────────
const sickLeaveView = () => {
  const user = currentUser()
  return `
    ${header()}
    <main class="shell driver-shell">
      <section class="view-head">
        <div class="view-title">
          <p class="eyebrow">Leave request</p>
          <h2>Sick Leave</h2>
          <p>Submit your sick leave request for supervisor review.</p>
        </div>
      </section>
      <form class="form panel panel-pad" data-form="sick-leave">
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
          <textarea class="textarea" name="reason" placeholder="Brief description of your illness or condition" required></textarea>
        </label>
        <div class="upload-area">
          <div class="upload-icon">📄</div>
          <p class="upload-title">Medical certificate</p>
          <p class="upload-sub">PDF, JPG or PNG · Max 5 MB</p>
          <button type="button" class="ghost-button upload-btn" disabled>Choose file</button>
          <small class="hint">File upload coming soon.</small>
        </div>
        <button class="button" type="submit">Submit sick leave</button>
      </form>
    </main>
  `
}

// ── Supervisor dashboard ───────────────────────────────────────────────────
const dashboardMetrics = (date, driverId = 'all', routeId = 'all') => {
  const activeDrivers = drivers()
  const filtered = state.data.kpiSubmissions.filter(k => {
    const dateMatch = k.date === date
    const driverMatch = driverId === 'all' || k.driverId === driverId
    const routeMatch = routeId === 'all' || k.routeId === routeId
    return dateMatch && driverMatch && routeMatch
  })
  const submittedIds = new Set(filtered.map(k => k.driverId))
  const pendingDrivers = driverId === 'all' && routeId === 'all' ? activeDrivers.filter(d => !submittedIds.has(d.id)) : []
  const totalStops = filtered.reduce((s, k) => s + Number(k.stops || 0), 0)
  const totalParcels = filtered.reduce((s, k) => s + Number(k.parcels || 0), 0)
  const totalHours = filtered.reduce((s, k) => s + Number(k.hours || 0), 0)
  const totalTolls = filtered.reduce((s, k) => s + Number(k.tollTotal || tollTotal(k.tolls) || 0), 0)
  return {
    filtered, totalStops, totalParcels, totalHours, totalTolls,
    driversSubmitted: submittedIds.size,
    driversPending: pendingDrivers.length,
    averageStops: submittedIds.size ? Math.round(totalStops / submittedIds.size) : 0,
  }
}

const stat = (label, value, helper = '') => `
  <article class="stat">
    <span>${h(label)}</span>
    <strong>${h(value)}</strong>
    ${helper ? `<small>${h(helper)}</small>` : ''}
  </article>
`

const buildSupervisorAlerts = (m) => {
  const selectedDate = state.filters.date
  const pendingHolidays = state.data.holidayRequests.filter(h => h.status === 'pending')
  const incidentKpis = m.filtered.filter(k => String(k.incidents || '').trim())
  const overnightKpis = m.filtered.filter(k => parseTimeToMinutes(k.finishTime) !== null && parseTimeToMinutes(k.startTime) !== null && parseTimeToMinutes(k.finishTime) < parseTimeToMinutes(k.startTime))
  const alerts = []
  if (m.driversPending > 0) alerts.push({ level: 'warning', title: `${m.driversPending} drivers pending`, detail: `No KPI submitted for ${selectedDate}.` })
  if (incidentKpis.length) alerts.push({ level: 'critical', title: `${incidentKpis.length} incident report${incidentKpis.length > 1 ? 's' : ''}`, detail: 'Review comments before close of day.' })
  if (pendingHolidays.length) alerts.push({ level: 'info', title: `${pendingHolidays.length} holiday request${pendingHolidays.length > 1 ? 's' : ''}`, detail: 'Awaiting supervisor/admin approval.' })
  if (overnightKpis.length) alerts.push({ level: 'warning', title: `${overnightKpis.length} overnight shift${overnightKpis.length > 1 ? 's' : ''}`, detail: 'Finish time crossed midnight.' })
  return alerts
}

const supervisorAlertBoard = (m) => {
  const systemAlerts = buildSupervisorAlerts(m)
  const radioRoomAlerts = state.data.alerts.filter(a => a.type === 'radio-room' && a.status === 'pending')
  return `
    <section class="panel panel-pad stack">
      <div class="view-title"><h3>Alert board</h3><p>Items needing attention today.</p></div>
      <div class="alert-list">
        ${radioRoomAlerts.map(a => {
          const driver = userById(a.driverId)
          return `
            <article class="alert-item alert-warning radio-room-alert">
              <strong>Radio Room: 30-min break</strong>
              <span>${h(driver ? formatName(driver) : 'Driver')} — ${h(a.message)}</span>
              <div class="row-actions" style="margin-top:6px">
                <button class="mini-button approve" data-action="alert-approve" data-id="${h(a.id)}">Approve</button>
                <button class="mini-button reject" data-action="alert-dismiss" data-id="${h(a.id)}">Dismiss</button>
              </div>
            </article>
          `
        }).join('')}
        ${systemAlerts.length
          ? systemAlerts.map(a => `
              <article class="alert-item alert-${h(a.level)}">
                <strong>${h(a.title)}</strong>
                <span>${h(a.detail)}</span>
              </article>
            `).join('')
          : ''
        }
        ${!radioRoomAlerts.length && !systemAlerts.length ? '<div class="empty">No active alerts.</div>' : ''}
      </div>
    </section>
  `
}

const supervisorDashboard = () => {
  const user = currentUser()
  const m = dashboardMetrics(state.filters.date, state.filters.driverId, state.filters.routeId)
  const previous = dashboardMetrics(dayISO(-1))
  return `
    ${header()}
    <main class="shell">
      <section class="view-head">
        <div class="view-title">
          <p class="eyebrow">StarTrack · Supervisor</p>
          <h2>Daily metrics</h2>
          <p>${h(formatName(user))} · ${h(brisbaneDate())}</p>
        </div>
        <div class="toolbar">
          <div class="live-clock">
            <span class="live-dot"></span>
            <span class="live-label">Brisbane</span>
            <span class="clock-time" id="brisbane-clock">${brisbaneClock()}</span>
          </div>
          <button class="ghost-button" data-action="export-csv">Export CSV</button>
        </div>
      </section>
      <div class="notif-bar">
        <div class="notif-header">
          <span class="live-dot"></span>
          <span>Activity feed</span>
        </div>
        <div class="notif-scroll" id="notif-list">${renderNotifList()}</div>
      </div>
      <section class="dashboard">
        ${filters()}
        <div class="stat-grid">
          ${stat('Total stops today', m.totalStops)}
          ${stat('Total parcels today', m.totalParcels)}
          ${stat('Total hours submitted', m.totalHours.toFixed(1))}
          ${stat('Drivers submitted', m.driversSubmitted, `${m.driversPending} pending`)}
          ${stat('Drivers pending', m.driversPending)}
          ${stat('Average stops per driver', m.averageStops)}
          ${stat('Yesterday stops', previous.totalStops)}
          ${stat('Yesterday parcels', previous.totalParcels)}
        </div>
        <div class="dashboard-main">
          <section class="stack">
            <div class="panel panel-pad stack">
              <div class="view-title"><h3>KPI trend</h3><p>Last seven days by total stops.</p></div>
              <div class="trend">${trendSvg()}</div>
            </div>
            ${driverTable(m.filtered, { showTolls: false })}
          </section>
          <section class="stack">
            ${supervisorAlertBoard(m)}
            ${pendingDriversPanel(m)}
            ${holidayApprovalPanel()}
          </section>
        </div>
      </section>
    </main>
  `
}

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
        ${drivers().map(d => `<option value="${h(d.id)}" ${state.filters.driverId === d.id ? 'selected' : ''}>${h(formatName(d))}</option>`).join('')}
      </select>
    </label>
    <label class="field">
      <span>Route</span>
      <select class="select" name="routeId">
        <option value="all">All routes</option>
        ${state.data.routes.map(r => `<option value="${h(r.id)}" ${state.filters.routeId === r.id ? 'selected' : ''}>${h(r.routeNumber)}</option>`).join('')}
      </select>
    </label>
    <button class="button" type="submit">Apply</button>
  </form>
`

const trendSvg = () => {
  const days = Array.from({ length: 7 }, (_, i) => dayISO(i - 6))
  const values = days.map(date => dashboardMetrics(date).totalStops)
  const max = Math.max(1, ...values)
  const points = values.map((v, i) => `${40 + i * 82},${175 - (v / max) * 125}`).join(' ')
  const labels = days.map((date, i) => `<text x="${40 + i * 82}" y="205" text-anchor="middle" font-size="11" fill="#64748b">${date.slice(5)}</text>`).join('')
  const dots = points.split(' ').map(pair => {
    const [x, y] = pair.split(',')
    return `<circle cx="${x}" cy="${y}" r="4" fill="#009AD5"></circle>`
  }).join('')
  return `
    <svg viewBox="0 0 560 230" role="img" aria-label="KPI trend chart">
      <line x1="32" y1="175" x2="535" y2="175" stroke="#e2e8f0" />
      <line x1="32" y1="50" x2="535" y2="50" stroke="#f1f5f9" />
      <polyline points="${points}" fill="none" stroke="#009AD5" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
      ${dots}
      ${labels}
    </svg>
  `
}

const driverTable = (rows, { showTolls = true } = {}) => `
  <section class="panel panel-pad stack">
    <div class="view-title"><h3>Driver submissions</h3><p>Status and route details for selected filters.</p></div>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Driver</th><th>Route</th><th>Hours</th><th>Stops</th><th>Parcels</th>${showTolls ? '<th>Tolls</th>' : ''}<th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${rows.length
            ? rows.map(item => {
                const driver = userById(item.driverId)
                return `<tr>
                  <td>${h(driver ? formatName(driver) : 'Unknown')}</td>
                  <td>${h(routeById(item.routeId)?.routeNumber || 'No route')}</td>
                  <td>${h(item.hours)}</td>
                  <td>${h(item.stops)}</td>
                  <td>${h(item.parcels)}</td>
                  ${showTolls ? `<td>${h(formatMoney(item.tollTotal || tollTotal(item.tolls)))}</td>` : ''}
                  <td><span class="status submitted">${h(item.status)}</span></td>
                </tr>`
              }).join('')
            : `<tr><td colspan="${showTolls ? 7 : 6}">No KPI submissions for this filter.</td></tr>`
          }
        </tbody>
      </table>
    </div>
  </section>
`

const pendingDriversPanel = (m) => {
  const submittedIds = new Set(m.filtered.map(k => k.driverId))
  const pending = drivers().filter(d => !submittedIds.has(d.id))
  return `
    <section class="panel panel-pad stack">
      <div class="view-title"><h3>Drivers pending</h3><p>For ${h(state.filters.date)}.</p></div>
      <div class="history-list">
        ${pending.length
          ? pending.map(driver => `
              <article class="history-item">
                <header>
                  <strong>${h(formatName(driver))}</strong>
                  <span class="status pending">pending</span>
                </header>
                <div class="history-meta"><span>${h(routeById(driver.defaultRouteId)?.routeNumber || 'No route')}</span></div>
              </article>
            `).join('')
          : '<div class="empty">All active drivers are submitted.</div>'
        }
      </div>
    </section>
  `
}

const holidayApprovalPanel = () => {
  const requests = state.data.holidayRequests.slice().sort((a, b) => {
    if (a.status === 'pending' && b.status !== 'pending') return -1
    if (a.status !== 'pending' && b.status === 'pending') return 1
    return b.createdAt.localeCompare(a.createdAt)
  }).slice(0, 7)
  return `
    <section class="panel panel-pad stack">
      <div class="view-title"><h3>Holiday approvals</h3><p>Supervisor and admin review queue.</p></div>
      <div class="history-list">
        ${requests.length
          ? requests.map(req => {
              const driver = userById(req.driverId)
              return `
                <article class="history-item">
                  <header>
                    <strong>${h(driver ? formatName(driver) : 'Unknown driver')}</strong>
                    <span class="status ${h(req.status)}">${h(req.status)}</span>
                  </header>
                  <div class="history-meta">
                    <span>${h(req.startDate)} to ${h(req.endDate)}</span>
                    <span>${h(req.reason || 'No reason')}</span>
                  </div>
                  ${req.status === 'pending' ? `
                    <div class="row-actions">
                      <button class="mini-button approve" data-action="holiday-approve" data-id="${h(req.id)}">Approve</button>
                      <button class="mini-button reject" data-action="holiday-reject" data-id="${h(req.id)}">Reject</button>
                    </div>` : ''}
                </article>
              `
            }).join('')
          : '<div class="empty">No holiday requests.</div>'
        }
      </div>
    </section>
  `
}

// ── Admin view ─────────────────────────────────────────────────────────────
const adminView = () => `
  ${header()}
  <main class="shell">
    <section class="view-head">
      <div class="view-title">
        <p class="eyebrow">StarTrack · Admin</p>
        <h2>System management</h2>
        <p>Users, routes, submissions and settings.</p>
      </div>
      <div class="toolbar">
        <button class="ghost-button" data-action="export-json">Export JSON</button>
        <button class="danger-button" data-action="reset-demo">Reset demo</button>
      </div>
    </section>
    <section class="stack">
      <div class="admin-tabs" role="tablist">
        ${adminTab('users', 'Users')}
        ${adminTab('data', 'All data')}
        ${adminTab('settings', 'Settings')}
      </div>
      ${state.adminTab === 'users' ? adminUsers() : state.adminTab === 'data' ? adminData() : adminSettings()}
    </section>
  </main>
`

const adminTab = (id, label) =>
  `<button class="tab-button ${state.adminTab === id ? 'active' : ''}" data-action="admin-tab" data-id="${h(id)}" role="tab">${h(label)}</button>`

const adminUsers = () => {
  const editing = state.data.users.find(u => u.id === state.editingUserId)
  return `
    <section class="split">
      <form class="form panel panel-pad" data-form="user">
        <div class="view-title">
          <h3>${editing ? 'Edit user' : 'Create user'}</h3>
          <p>Drivers, supervisors and admins use the same account structure.</p>
        </div>
        <input type="hidden" name="id" value="${h(editing?.id || '')}" />
        <div class="grid-2">
          <label class="field"><span>First name</span><input class="input" name="firstName" value="${h(editing?.firstName || '')}" required /></label>
          <label class="field"><span>Last name</span><input class="input" name="lastName" value="${h(editing?.lastName || '')}" required /></label>
        </div>
        <label class="field"><span>Email</span><input class="input" name="email" type="email" value="${h(editing?.email || '')}" required /></label>
        <div class="grid-2">
          <label class="field"><span>Employee ID</span><input class="input" name="employeeId" value="${h(editing?.employeeId || '')}" /></label>
          <label class="field"><span>Password</span><input class="input" name="password" value="${h(editing ? '' : 'driver123')}" ${editing ? '' : 'required'} placeholder="${editing ? 'Leave blank to keep current' : ''}" /></label>
        </div>
        <div class="grid-2">
          <label class="field">
            <span>Role</span>
            <select class="select" name="role">
              ${['driver', 'supervisor', 'admin'].map(r => `<option value="${r}" ${editing?.role === r ? 'selected' : ''}>${r}</option>`).join('')}
            </select>
          </label>
          <label class="field">
            <span>Status</span>
            <select class="select" name="status">
              ${['active', 'inactive'].map(s => `<option value="${s}" ${editing?.status === s ? 'selected' : ''}>${s}</option>`).join('')}
            </select>
          </label>
        </div>
        <div class="grid-2">
          <label class="field">
            <span>Supervisor</span>
            <select class="select" name="supervisorId">
              <option value="">None</option>
              ${supervisorOptions(editing?.supervisorId || '')}
            </select>
          </label>
          <label class="field">
            <span>Default route</span>
            <select class="select" name="defaultRouteId">
              <option value="">None</option>
              ${routeOptions(editing?.defaultRouteId || '')}
            </select>
          </label>
        </div>
        <div class="row-actions">
          <button class="button" type="submit">${editing ? 'Save user' : 'Create user'}</button>
          ${editing ? '<button class="ghost-button" type="button" data-action="cancel-edit">Cancel</button>' : ''}
        </div>
      </form>
      <section class="panel panel-pad stack">
        <div class="view-title"><h3>User directory</h3><p>${state.data.users.length} accounts</p></div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Name</th><th>Role</th><th>Email</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              ${state.data.users.map(u => `
                <tr>
                  <td>${h(formatName(u))}</td>
                  <td>${h(u.role)}</td>
                  <td>${h(u.email)}</td>
                  <td><span class="status ${h(u.status)}">${h(u.status)}</span></td>
                  <td>
                    <div class="row-actions">
                      <button class="mini-button" data-action="edit-user" data-id="${h(u.id)}">Edit</button>
                      <button class="mini-button reject" data-action="delete-user" data-id="${h(u.id)}">Delete</button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  `
}

const comparisonRows = (count = 7) => Array.from({ length: count }, (_, i) => {
  const date = dayISO(-i)
  const m = dashboardMetrics(date)
  return { date, ...m }
})

const trendDelta = (current, previous) => {
  const diff = Number(current || 0) - Number(previous || 0)
  if (!diff) return 'No change'
  return `${diff > 0 ? '+' : ''}${Number.isInteger(diff) ? diff : diff.toFixed(1)} vs previous day`
}

const adminComparisons = () => {
  const rows = comparisonRows(7)
  const today = rows[0]
  const yesterday = rows[1] || dashboardMetrics(dayISO(-1))
  return `
    <section class="panel panel-pad stack">
      <div class="view-title"><h3>Daily comparisons</h3><p>Last 7 days across KPI submissions.</p></div>
      <div class="stat-grid">
        ${stat('Stops vs yesterday', today.totalStops, trendDelta(today.totalStops, yesterday.totalStops))}
        ${stat('Parcels vs yesterday', today.totalParcels, trendDelta(today.totalParcels, yesterday.totalParcels))}
        ${stat('Hours vs yesterday', today.totalHours.toFixed(1), trendDelta(today.totalHours, yesterday.totalHours))}
        ${stat('Tolls vs yesterday', formatMoney(today.totalTolls), trendDelta(today.totalTolls, yesterday.totalTolls))}
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Date</th><th>Stops</th><th>Parcels</th><th>Hours</th><th>Tolls</th><th>Submitted</th><th>Pending</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map(r => `
              <tr>
                <td>${h(r.date)}</td>
                <td>${h(r.totalStops)}</td>
                <td>${h(r.totalParcels)}</td>
                <td>${h(r.totalHours.toFixed(1))}</td>
                <td>${h(formatMoney(r.totalTolls))}</td>
                <td>${h(r.driversSubmitted)}</td>
                <td>${h(r.driversPending)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </section>
  `
}

const adminData = () => {
  const m = dashboardMetrics(todayISO())
  return `
    <section class="stack">
      <div class="stat-grid">
        ${stat('Users', state.data.users.length)}
        ${stat('Routes', state.data.routes.length)}
        ${stat('KPI submissions', state.data.kpiSubmissions.length)}
        ${stat('Holiday requests', state.data.holidayRequests.length)}
        ${stat('Today tolls', formatMoney(m.totalTolls))}
      </div>
      ${adminComparisons()}
      <section class="panel panel-pad stack">
        <div class="view-title"><h3>All KPI data</h3><p>Today: ${h(m.totalStops)} stops, ${h(m.totalParcels)} parcels, ${h(m.totalHours.toFixed(1))} hours.</p></div>
        ${driverTable(state.data.kpiSubmissions.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 20))}
      </section>
      ${holidayApprovalPanel()}
    </section>
  `
}

const adminSettings = () => `
  <form class="form panel panel-pad" data-form="settings">
    <div class="view-title"><h3>General settings</h3><p>Depot configuration and route management.</p></div>
    <div class="grid-2">
      <label class="field"><span>System name</span><input class="input" name="systemName" value="${h(state.data.settings.systemName)}" required /></label>
      <label class="field"><span>Depot name</span><input class="input" name="depotName" value="${h(state.data.settings.depotName)}" required /></label>
    </div>
    <div class="grid-2">
      <label class="field"><span>Daily cut-off time</span><input class="input" name="cutOffTime" type="time" value="${h(state.data.settings.cutOffTime)}" required /></label>
      <label class="field"><span>Default break minutes</span><input class="input" name="defaultBreakMinutes" type="number" min="0" step="5" value="${h(state.data.settings.defaultBreakMinutes)}" required /></label>
    </div>
    <label class="field">
      <span>Active route numbers</span>
      <textarea class="textarea" name="routes">${h(state.data.routes.map(r => r.routeNumber).join(', '))}</textarea>
      <small class="hint">Comma-separated route numbers.</small>
    </label>
    <label class="field">
      <span>Brisbane tolls config</span>
      <textarea class="textarea code-textarea" name="tolls">${h(tollConfigText())}</textarea>
      <small class="hint">One toll per line: id | name | price. Prices can be updated later without touching the KPI form.</small>
    </label>
    <button class="button" type="submit">Save settings</button>
  </form>
`

// ── Render ─────────────────────────────────────────────────────────────────
const render = () => {
  const user = currentUser()
  let html = ''
  if (state.view === 'login') html = loginView()
  else if (state.view === 'driver') html = user?.role === 'driver' ? driverDashboard() : homeView()
  else if (state.view === 'kpi') html = user?.role === 'driver' ? kpiView() : loginView()
  else if (state.view === 'holiday') html = user?.role === 'driver' ? holidayView() : loginView()
  else if (state.view === 'sick-leave') html = user?.role === 'driver' ? sickLeaveView() : loginView()
  else if (state.view === 'supervisor') html = user?.role === 'supervisor' || user?.role === 'admin' ? supervisorDashboard() : loginView()
  else if (state.view === 'admin') html = user?.role === 'admin' ? adminView() : loginView()
  else html = user?.role === 'driver' ? driverDashboard() : homeView()
  app.innerHTML = `${html}${state.toast ? `<div class="toast">${h(state.toast)}</div>` : ''}`
}

// ── Form helpers ───────────────────────────────────────────────────────────
const formData = (form) => Object.fromEntries(new FormData(form).entries())

const validateKpi = (data) => {
  const errors = []
  if (!data.routeId) errors.push('Route is required.')
  if (!data.supervisorId) errors.push('Supervisor is required.')
  if (!data.startTime || !data.finishTime) errors.push('Start and finish time are required.')
  if (calculateWorkedHours(data.startTime, data.finishTime) <= 0) errors.push('Total hours must be greater than zero.')
  if (data.hasTolls === 'yes' && !state.kpiDraft.tolls.length) errors.push('Add at least one toll or choose No.')
  if (Number(data.breakMinutes) === 30 && !['yes', 'no'].includes(data.radioRoomNotified))
    errors.push('Please confirm whether you notified Radio Room.')
  return errors
}

const updateCalculatedHours = (form) => {
  if (!form || form.dataset.form !== 'kpi') return
  const output = form.querySelector('[data-hours-output]')
  if (!output) return
  const startTime = form.elements.startTime?.value
  const finishTime = form.elements.finishTime?.value
  output.textContent = formatHours(calculateWorkedHours(startTime, finishTime))
}

const refreshTollUi = (form) => {
  if (!form || form.dataset.form !== 'kpi') return
  const details = form.querySelector('[data-toll-details]')
  const list = form.querySelector('[data-toll-list]')
  const total = form.querySelector('[data-toll-total]')
  if (details) details.classList.toggle('is-hidden', !state.kpiDraft.hasTolls)
  if (list) list.innerHTML = renderTollList()
  if (total) total.textContent = formatMoney(tollTotal(state.kpiDraft.tolls))
}

// ── Form handlers ──────────────────────────────────────────────────────────
const handleLogin = async (form) => {
  const data = formData(form)
  const btn = form.querySelector('[type=submit]')
  btn.disabled = true
  btn.textContent = 'Signing in...'

  const res = await api.post('/api/auth/login', { email: data.email, password: data.password, role: state.loginRole })

  if (res.error) {
    state.loginError = 'Those details do not match an active account for this role.'
    btn.disabled = false
    btn.textContent = 'Sign in'
    render()
    return
  }

  sessionStorage.setItem('st.token', res.token)
  state.currentUser = res.user
  state.loginError = ''
  await loadData()
  navigateAfterLogin(res.user)
}

const handleKpi = async (form) => {
  const data = formData(form)
  const errors = validateKpi(data)
  if (errors.length) { showToast(errors[0]); return }
  const hours = calculateWorkedHours(data.startTime, data.finishTime)
  const hasTolls = data.hasTolls === 'yes'
  const selectedTolls = hasTolls ? normalizeTollList(state.kpiDraft.tolls) : []

  const submit = form.querySelector('[data-submit-label]')
  submit.disabled = true
  submit.textContent = 'Submitting...'

  const kpi = await api.post('/api/kpi', {
    date: data.date,
    driverType: data.driverType,
    supervisorId: data.supervisorId,
    routeId: data.routeId,
    startTime: data.startTime,
    finishTime: data.finishTime,
    hours,
    breakMinutes: Number(data.breakMinutes),
    breakApprovedBy: data.breakApprovedBy,
    offroadDuties: data.offroadDuties === 'yes',
    offroadNotes: data.offroadNotes,
    stops: Number(data.stops),
    parcels: Number(data.parcels),
    tolls: selectedTolls,
    tollTotal: tollTotal(selectedTolls),
    incidents: data.incidents,
    comments: data.comments,
  })

  if (kpi.error) {
    showToast('Error submitting KPI. Please try again.')
    submit.disabled = false
    submit.textContent = 'Submit KPI'
    return
  }

  state.data.kpiSubmissions.unshift(kpi)

  if (Number(data.breakMinutes) === 30 && data.radioRoomNotified === 'yes') {
    const user = currentUser()
    await api.post('/api/alerts', {
      type: 'radio-room',
      driverId: user.id,
      kpiId: kpi.id,
      message: `${formatName(user)} notified Radio Room for 30-min break on ${data.date}`,
      status: 'pending',
    }).catch(() => {})
  }

  state.kpiDraft = createKpiDraft()
  showToast('KPI submitted successfully.')
  setView('driver')
}

const handleHoliday = async (form) => {
  const data = formData(form)
  if (!data.startDate || !data.endDate) { showToast('Start and end dates are required.'); return }
  if (data.endDate < data.startDate) { showToast('End date must be after start date.'); return }

  const holiday = await api.post('/api/holidays', { startDate: data.startDate, endDate: data.endDate, reason: data.reason })

  if (holiday.error) { showToast('Error submitting holiday request.'); return }

  state.data.holidayRequests.unshift(holiday)
  showToast('Holiday request sent.')
  setView('holiday')
}

const handleFilters = (form) => {
  const data = formData(form)
  state.filters = { date: data.date, driverId: data.driverId, routeId: data.routeId }
  api.get(`/api/dashboard/${data.date}`).catch(() => {})
  render()
}

const handleUser = async (form) => {
  const data = formData(form)
  if (data.id) {
    const result = await api.put(`/api/users/${data.id}`, data)
    if (result.error) { showToast(result.error); return }
    const idx = state.data.users.findIndex(u => u.id === data.id)
    if (idx !== -1) state.data.users[idx] = result
    state.editingUserId = ''
    showToast('User updated.')
  } else {
    const result = await api.post('/api/users', data)
    if (result.error) { showToast(result.error); return }
    state.data.users.push(result)
    showToast('User created.')
  }
  render()
}

const handleSettings = async (form) => {
  const data = formData(form)
  const routeNumbers = data.routes.split(',').map(r => r.trim()).filter(Boolean)
  const tolls = parseTollConfigText(data.tolls)
  if (!tolls.length) { showToast('Add at least one valid toll config line.'); return }
  const result = await api.put('/api/settings', {
    systemName: data.systemName,
    depotName: data.depotName,
    cutOffTime: data.cutOffTime,
    defaultBreakMinutes: Number(data.defaultBreakMinutes),
    tolls,
    routes: routeNumbers,
  })
  if (result.error) { showToast('Error saving settings.'); return }
  state.data.settings = result
  const routes = await api.get('/api/routes')
  if (Array.isArray(routes)) state.data.routes = routes
  showToast('Settings saved.')
  render()
}

const handleSickLeave = async (form) => {
  const data = formData(form)
  if (!data.startDate || !data.endDate) { showToast('Start and end dates are required.'); return }
  if (data.endDate < data.startDate) { showToast('End date must be after start date.'); return }
  if (!data.reason?.trim()) { showToast('Reason is required.'); return }

  const result = await api.post('/api/sick-leave', {
    startDate: data.startDate,
    endDate: data.endDate,
    reason: data.reason,
  })

  if (result.error) { showToast('Error submitting sick leave request.'); return }
  state.data.sickLeaves = [result, ...state.data.sickLeaves]
  showToast('Sick leave request submitted.')
  setView('driver')
}

const updateAlertStatus = async (id, status) => {
  const result = await api.put(`/api/alerts/${id}`, { status })
  if (result.error) { showToast('Error updating alert.'); return }
  const idx = state.data.alerts.findIndex(a => a.id === id)
  if (idx !== -1) state.data.alerts[idx] = result
  showToast(`Alert ${status}.`)
  render()
}

const updateHolidayStatus = async (id, status) => {
  const result = await api.put(`/api/holidays/${id}`, { status })
  if (result.error) { showToast('Error updating holiday.'); return }
  const idx = state.data.holidayRequests.findIndex(h => h.id === id)
  if (idx !== -1) state.data.holidayRequests[idx] = result
  showToast(`Holiday request ${status}.`)
  render()
}

// ── Exports ────────────────────────────────────────────────────────────────
const downloadFile = (filename, content, type) => {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url; link.download = filename; link.click()
  URL.revokeObjectURL(url)
}

const exportJson = () => downloadFile(`startrack-export-${todayISO()}.json`, JSON.stringify(state.data, null, 2), 'application/json')

const tollSummary = (tolls = []) => normalizeTollList(tolls)
  .map(t => `${t.name} x${t.quantity} @ ${formatMoney(t.price)}`)
  .join('; ')

const exportCsv = () => {
  const rows = [['date', 'driver', 'route', 'start_time', 'finish_time', 'hours', 'stops', 'parcels', 'toll_total', 'tolls', 'status']]
  state.data.kpiSubmissions.forEach(k => {
    const driver = userById(k.driverId)
    rows.push([
      k.date,
      driver ? formatName(driver) : '',
      routeById(k.routeId)?.routeNumber || '',
      k.startTime || '',
      k.finishTime || '',
      k.hours,
      k.stops,
      k.parcels,
      Number(k.tollTotal || tollTotal(k.tolls)).toFixed(2),
      tollSummary(k.tolls),
      k.status,
    ])
  })
  const csv = '\ufeff' + rows.map(r => r.map(c => `"${String(c).replaceAll('"', '""')}"`).join(',')).join('\n')
  downloadFile('startrack-kpi.csv', csv, 'text/csv')
}

// ── Event listeners ────────────────────────────────────────────────────────
app.addEventListener('submit', async (event) => {
  event.preventDefault()
  const form = event.target
  const name = form.dataset.form
  if (name === 'login') await handleLogin(form)
  if (name === 'kpi') await handleKpi(form)
  if (name === 'holiday') await handleHoliday(form)
  if (name === 'sick-leave') await handleSickLeave(form)
  if (name === 'filters') handleFilters(form)
  if (name === 'user') await handleUser(form)
  if (name === 'settings') await handleSettings(form)
})

app.addEventListener('input', (event) => {
  if (event.target.matches('[data-hours-source]')) updateCalculatedHours(event.target.form)
})

app.addEventListener('change', (event) => {
  if (event.target.matches('[data-hours-source]')) updateCalculatedHours(event.target.form)
  if (event.target.name === 'hasTolls') {
    state.kpiDraft.hasTolls = event.target.value === 'yes'
    if (!state.kpiDraft.hasTolls) state.kpiDraft.tolls = []
    refreshTollUi(event.target.form)
  }
  if (event.target.name === 'breakMinutes') {
    const is30 = event.target.value === '30'
    state.kpiDraft.breakMinutes = is30 ? 30 : 60
    const box = event.target.form?.querySelector('[data-radio-room-box]')
    if (box) box.classList.toggle('is-hidden', !is30)
  }
})

app.addEventListener('click', async (event) => {
  const target = event.target.closest('[data-action]')
  if (!target) return
  const action = target.dataset.action

  if (action === 'home') { event.preventDefault(); setView('home') }
  if (action === 'admin-access') setView('login', { loginRole: 'supervisor', intent: '', loginError: '' })
  if (action === 'logout') await signOut()
  if (action === 'login-driver') setView('login', { loginRole: 'driver', intent: '', loginError: '' })
  if (action === 'login-supervisor') setView('login', { loginRole: 'supervisor', intent: '', loginError: '' })
  if (action === 'login-admin') setView('login', { loginRole: 'admin', intent: '', loginError: '' })
  if (action === 'open-kpi') { state.kpiDraft = createKpiDraft(); requireRole('driver', 'kpi', 'kpi') }
  if (action === 'open-holiday') requireRole('driver', 'holiday', 'holiday')
  if (action === 'open-sick-leave') requireRole('driver', 'sick-leave', 'sick-leave')

  if (action === 'demo-login') {
    const user = userById(target.dataset.id)
    if (!user) return
    const passwords = { driver: 'driver123', supervisor: 'supervisor123', admin: 'admin123' }
    state.loginRole = user.role
    const res = await api.post('/api/auth/login', { email: user.email, password: passwords[user.role] || 'driver123', role: user.role })
    if (res.error) { showToast('Demo login failed.'); return }
    sessionStorage.setItem('st.token', res.token)
    state.currentUser = res.user
    await loadData()
    navigateAfterLogin(res.user)
  }

  if (action === 'step-up' || action === 'step-down') {
    const stepper = target.closest('[data-stepper]')
    const input = stepper.querySelector('input')
    const step = Number(stepper.dataset.step)
    const min = Number(stepper.dataset.min)
    const next = Number(input.value || 0) + (action === 'step-up' ? step : -step)
    input.value = Math.max(min, next).toFixed(step % 1 ? 1 : 0)
  }

  if (action === 'add-toll') {
    const form = target.closest('form')
    const toll = tollById(form?.querySelector('[data-toll-select]')?.value)
    if (!toll) return
    const existing = state.kpiDraft.tolls.find(t => t.id === toll.id)
    if (existing) existing.quantity = Number(existing.quantity || 1) + 1
    else state.kpiDraft.tolls.push({ id: toll.id, name: toll.name, price: Number(toll.price || 0), quantity: 1 })
    state.kpiDraft.hasTolls = true
    refreshTollUi(form)
  }

  if (action === 'remove-toll') {
    const form = target.closest('form')
    state.kpiDraft.tolls = state.kpiDraft.tolls.filter(t => t.id !== target.dataset.id)
    refreshTollUi(form)
  }

  if (action === 'holiday-approve') await updateHolidayStatus(target.dataset.id, 'approved')
  if (action === 'holiday-reject') await updateHolidayStatus(target.dataset.id, 'rejected')
  if (action === 'alert-approve') await updateAlertStatus(target.dataset.id, 'approved')
  if (action === 'alert-dismiss') await updateAlertStatus(target.dataset.id, 'dismissed')
  if (action === 'export-json') exportJson()
  if (action === 'export-csv') exportCsv()

  if (action === 'reset-demo') {
    const result = await api.post('/api/admin/reset', {})
    if (result.error) { showToast('Error resetting.'); return }
    await loadData()
    state.editingUserId = ''
    showToast('Demo data reset.')
    setView('admin')
  }

  if (action === 'admin-tab') { state.adminTab = target.dataset.id; render() }
  if (action === 'edit-user') { state.editingUserId = target.dataset.id; state.adminTab = 'users'; render() }
  if (action === 'cancel-edit') { state.editingUserId = ''; render() }

  if (action === 'delete-user') {
    const id = target.dataset.id
    if (id === state.currentUser?.id) { showToast('You cannot delete the signed-in account.'); return }
    const result = await api.del(`/api/users/${id}`)
    if (result.error) { showToast('Error deleting user.'); return }
    state.data.users = state.data.users.filter(u => u.id !== id)
    state.data.kpiSubmissions = state.data.kpiSubmissions.filter(k => k.driverId !== id)
    state.data.holidayRequests = state.data.holidayRequests.filter(h => h.driverId !== id)
    showToast('User deleted.')
    render()
  }
})

// Adaptive refresh — 15s on 4G/WiFi, 30s on slower connections
function scheduleRefresh() {
  setTimeout(async () => {
    if (state.view === 'supervisor') { await loadData(); render() }
    scheduleRefresh()
  }, getRefreshInterval())
}
scheduleRefresh()

// ── Init ───────────────────────────────────────────────────────────────────
async function init() {
  const [routes, settings] = await Promise.all([api.get('/api/routes'), api.get('/api/settings')])
  if (Array.isArray(routes)) state.data.routes = routes
  if (settings && !settings.error) state.data.settings = settings

  const token = sessionStorage.getItem('st.token')
  if (token) {
    const me = await api.get('/api/me')
    if (me && !me.error) {
      state.currentUser = me
      await loadData()
      navigateAfterLogin(me)
      return
    }
    sessionStorage.removeItem('st.token')
  }
  render()
}

init()
