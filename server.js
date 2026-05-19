const http = require('http')
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

const PORT = process.env.PORT || 3000
const ROOT = __dirname
const STORAGE_DIR = path.join(ROOT, 'storage')
const KPIS_DIR = path.join(STORAGE_DIR, 'kpis')
const DASHBOARD_DIR = path.join(STORAGE_DIR, 'dashboard')

const BRISBANE_TOLLS = [
  { id: 'gateway', name: 'Gateway Motorway / Gateway Bridge', price: 0 },
  { id: 'go-between', name: 'Go Between Bridge', price: 0 },
  { id: 'clem7', name: 'Clem7 Tunnel', price: 0 },
  { id: 'airportlinkm7', name: 'AirportlinkM7', price: 0 },
  { id: 'legacy-way', name: 'Legacy Way', price: 0 },
  { id: 'logan-motorway', name: 'Logan Motorway', price: 0 },
  { id: 'toowoomba-bypass', name: 'Toowoomba Bypass', price: 0 },
]

const MIME = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

function readJSON(file, fallback = null) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')) } catch { return fallback }
}

function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2))
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

function verifyPassword(password, stored) {
  try {
    const [salt, hash] = stored.split(':')
    const attempt = crypto.scryptSync(password, salt, 64).toString('hex')
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(attempt, 'hex'))
  } catch { return false }
}

function parseTimeToMinutes(time = '') {
  const [hours, minutes] = String(time).split(':').map(Number)
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null
  return hours * 60 + minutes
}

function calculateWorkedHours(startTime, finishTime) {
  const start = parseTimeToMinutes(startTime)
  let finish = parseTimeToMinutes(finishTime)
  if (start === null || finish === null) return 0
  if (finish < start) finish += 24 * 60
  return Math.round(((finish - start) / 60) * 100) / 100
}

function normalizeTolls(tolls = [], config = BRISBANE_TOLLS) {
  if (!Array.isArray(tolls)) return []
  return tolls.map(item => {
    const configured = config.find(t => t.id === item.id) || item
    const quantity = Math.max(1, Number(item.quantity || 1))
    const price = Number(configured.price || item.price || 0)
    return {
      id: configured.id || item.id,
      name: configured.name || item.name,
      price,
      quantity,
      total: Math.round(price * quantity * 100) / 100,
    }
  }).filter(t => t.id && t.name)
}

const sessions = new Map()

function createSession(userId) {
  const token = crypto.randomBytes(32).toString('hex')
  sessions.set(token, userId)
  return token
}

function destroySession(token) { sessions.delete(token) }

function getAuthUser(req) {
  const token = req.headers['x-token']
  if (!token) return null
  const userId = sessions.get(token)
  if (!userId) return null
  const users = readJSON(path.join(STORAGE_DIR, 'users.json'), [])
  return users.find(u => u.id === userId) || null
}

function safeUser(u) {
  if (!u) return null
  const { passwordHash, ...rest } = u
  return rest
}

function loadAllKpis() {
  const result = []
  if (!fs.existsSync(KPIS_DIR)) return result
  for (const dateDir of fs.readdirSync(KPIS_DIR)) {
    const full = path.join(KPIS_DIR, dateDir)
    if (!fs.statSync(full).isDirectory()) continue
    for (const file of fs.readdirSync(full)) {
      if (!file.endsWith('.json')) continue
      const kpi = readJSON(path.join(full, file))
      if (kpi) result.push(kpi)
    }
  }
  return result.sort((a, b) => b.date.localeCompare(a.date))
}

function initStorage() {
  ensureDir(STORAGE_DIR)
  ensureDir(KPIS_DIR)
  ensureDir(DASHBOARD_DIR)

  const usersFile = path.join(STORAGE_DIR, 'users.json')
  if (!fs.existsSync(usersFile)) {
    console.log('Seeding users...')
    writeJSON(usersFile, [
      { id: 'sup_aaron', role: 'supervisor', firstName: 'Aaron', lastName: 'Lonergan', email: 'supervisor@depotops.test', passwordHash: hashPassword('supervisor123'), employeeId: 'SUP001', status: 'active' },
      { id: 'sup_ben', role: 'supervisor', firstName: 'Ben', lastName: 'Egan', email: 'ben@depotops.test', passwordHash: hashPassword('supervisor123'), employeeId: 'SUP002', status: 'active' },
      { id: 'sup_andrew', role: 'supervisor', firstName: 'Andrew', lastName: 'Stevens', email: 'andrew@depotops.test', passwordHash: hashPassword('supervisor123'), employeeId: 'SUP003', status: 'active' },
      { id: 'sup_marco', role: 'supervisor', firstName: 'Marco', lastName: 'Panebianco', email: 'marco@depotops.test', passwordHash: hashPassword('supervisor123'), employeeId: 'SUP004', status: 'active' },
      { id: 'sup_craig', role: 'supervisor', firstName: 'Craig', lastName: 'Keogh', email: 'craig@depotops.test', passwordHash: hashPassword('supervisor123'), employeeId: 'SUP005', status: 'active' },
      { id: 'admin_ops', role: 'admin', firstName: 'Depot', lastName: 'Admin', email: 'admin@depotops.test', passwordHash: hashPassword('admin123'), employeeId: 'ADM001', status: 'active' },
      { id: 'drv_maya', role: 'driver', firstName: 'Maya', lastName: 'Patel', email: 'driver@depotops.test', passwordHash: hashPassword('driver123'), employeeId: 'DRV104', supervisorId: 'sup_aaron', defaultRouteId: 'route_bn12', status: 'active' },
      { id: 'drv_daniel', role: 'driver', firstName: 'Daniel', lastName: 'Hughes', email: 'daniel@depotops.test', passwordHash: hashPassword('driver123'), employeeId: 'DRV117', supervisorId: 'sup_aaron', defaultRouteId: 'route_bn18', status: 'active' },
      { id: 'drv_sofia', role: 'driver', firstName: 'Sofia', lastName: 'Nguyen', email: 'sofia@depotops.test', passwordHash: hashPassword('driver123'), employeeId: 'DRV122', supervisorId: 'sup_ben', defaultRouteId: 'route_n04', status: 'active' },
      { id: 'drv_owen', role: 'driver', firstName: 'Owen', lastName: 'Reed', email: 'owen@depotops.test', passwordHash: hashPassword('driver123'), employeeId: 'DRV140', supervisorId: 'sup_ben', defaultRouteId: 'route_cbd2', status: 'active' },
    ])
  }

  const settingsFile = path.join(STORAGE_DIR, 'settings.json')
  if (!fs.existsSync(settingsFile)) {
    writeJSON(settingsFile, { depotName: 'BNPF Depot', systemName: 'StarTrack', cutOffTime: '18:30', defaultBreakMinutes: 60, tolls: BRISBANE_TOLLS })
  } else {
    const settings = readJSON(settingsFile, {})
    if (!Array.isArray(settings.tolls)) writeJSON(settingsFile, { ...settings, tolls: BRISBANE_TOLLS })
  }

  const routesFile = path.join(STORAGE_DIR, 'routes.json')
  if (!fs.existsSync(routesFile)) {
    writeJSON(routesFile, [
      { id: 'route_bn12', routeNumber: 'BN-12', depot: 'BNPF Depot', zone: 'North', status: 'active' },
      { id: 'route_bn18', routeNumber: 'BN-18', depot: 'BNPF Depot', zone: 'North', status: 'active' },
      { id: 'route_n04', routeNumber: 'N-04', depot: 'BNPF Depot', zone: 'Metro', status: 'active' },
      { id: 'route_cbd2', routeNumber: 'CBD-2', depot: 'BNPF Depot', zone: 'CBD', status: 'active' },
      { id: 'route_pm7', routeNumber: 'PM-7', depot: 'BNPF Depot', zone: 'Evening', status: 'active' },
    ])
  }

  const holidaysFile = path.join(STORAGE_DIR, 'holidays.json')
  if (!fs.existsSync(holidaysFile)) writeJSON(holidaysFile, [])
}

function parseBody(req) {
  return new Promise((resolve) => {
    let body = ''
    req.on('data', chunk => { body += chunk })
    req.on('end', () => { try { resolve(JSON.parse(body || '{}')) } catch { resolve({}) } })
    req.on('error', () => resolve({}))
  })
}

function respond(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' })
  res.end(JSON.stringify(data))
}

function serveStatic(res, pathname) {
  const filePath = path.join(ROOT, pathname === '/' ? 'index.html' : pathname)
  if (!filePath.startsWith(ROOT)) { res.writeHead(403); res.end('Forbidden'); return }
  const ext = path.extname(filePath)
  const contentType = MIME[ext] || 'text/plain'
  fs.readFile(filePath, (err, data) => {
    if (err) {
      fs.readFile(path.join(ROOT, 'index.html'), (e, d) => {
        res.writeHead(e ? 404 : 200, { 'Content-Type': 'text/html' })
        res.end(e ? 'Not found' : d)
      })
      return
    }
    const noCache = ['.css', '.js'].includes(ext)
    res.writeHead(200, {
      'Content-Type': contentType,
      ...(noCache ? { 'Cache-Control': 'no-store, must-revalidate', 'Pragma': 'no-cache' } : {}),
    })
    res.end(data)
  })
}

initStorage()

http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,X-Token',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    })
    res.end()
    return
  }

  const url = new URL(req.url, 'http://localhost')
  const pathname = url.pathname

  if (!pathname.startsWith('/api/')) return serveStatic(res, pathname)

  const body = (req.method === 'POST' || req.method === 'PUT') ? await parseBody(req) : {}
  const auth = getAuthUser(req)

  // POST /api/auth/login
  if (pathname === '/api/auth/login' && req.method === 'POST') {
    const users = readJSON(path.join(STORAGE_DIR, 'users.json'), [])
    const user = users.find(u =>
      u.email.toLowerCase() === (body.email || '').toLowerCase() &&
      u.role === body.role && u.status === 'active'
    )
    if (!user || !verifyPassword(body.password || '', user.passwordHash))
      return respond(res, 401, { error: 'Invalid credentials' })
    const token = createSession(user.id)
    return respond(res, 200, { token, user: safeUser(user) })
  }

  // POST /api/auth/logout
  if (pathname === '/api/auth/logout' && req.method === 'POST') {
    const token = req.headers['x-token']
    if (token) destroySession(token)
    return respond(res, 200, { ok: true })
  }

  // GET /api/me
  if (pathname === '/api/me' && req.method === 'GET') {
    if (!auth) return respond(res, 401, { error: 'Unauthorized' })
    return respond(res, 200, safeUser(auth))
  }

  // GET /api/users
  if (pathname === '/api/users' && req.method === 'GET') {
    const users = readJSON(path.join(STORAGE_DIR, 'users.json'), [])
    return respond(res, 200, users.map(safeUser))
  }

  // POST /api/users
  if (pathname === '/api/users' && req.method === 'POST') {
    if (!auth || auth.role !== 'admin') return respond(res, 403, { error: 'Forbidden' })
    const users = readJSON(path.join(STORAGE_DIR, 'users.json'), [])
    if (users.find(u => u.email.toLowerCase() === (body.email || '').toLowerCase()))
      return respond(res, 400, { error: 'Email already in use' })
    const id = `${(body.role || 'usr').slice(0, 3)}_${crypto.randomBytes(3).toString('hex')}`
    const newUser = { id, ...body, passwordHash: hashPassword(body.password || 'changeme'), createdAt: new Date().toISOString() }
    delete newUser.password
    users.push(newUser)
    writeJSON(path.join(STORAGE_DIR, 'users.json'), users)
    return respond(res, 201, safeUser(newUser))
  }

  // /api/users/:id
  const userIdMatch = pathname.match(/^\/api\/users\/([^/]+)$/)
  if (userIdMatch) {
    const uid = userIdMatch[1]
    if (req.method === 'PUT') {
      if (!auth || auth.role !== 'admin') return respond(res, 403, { error: 'Forbidden' })
      const users = readJSON(path.join(STORAGE_DIR, 'users.json'), [])
      const idx = users.findIndex(u => u.id === uid)
      if (idx === -1) return respond(res, 404, { error: 'Not found' })
      const updated = { ...users[idx], ...body }
      if (body.password) { updated.passwordHash = hashPassword(body.password); delete updated.password }
      users[idx] = updated
      writeJSON(path.join(STORAGE_DIR, 'users.json'), users)
      return respond(res, 200, safeUser(updated))
    }
    if (req.method === 'DELETE') {
      if (!auth || auth.role !== 'admin') return respond(res, 403, { error: 'Forbidden' })
      const users = readJSON(path.join(STORAGE_DIR, 'users.json'), [])
      writeJSON(path.join(STORAGE_DIR, 'users.json'), users.filter(u => u.id !== uid))
      return respond(res, 200, { ok: true })
    }
  }

  // GET /api/kpi
  if (pathname === '/api/kpi' && req.method === 'GET') {
    if (!auth) return respond(res, 401, { error: 'Unauthorized' })
    return respond(res, 200, loadAllKpis())
  }

  // POST /api/kpi
  if (pathname === '/api/kpi' && req.method === 'POST') {
    if (!auth || auth.role !== 'driver') return respond(res, 403, { error: 'Forbidden' })
    const date = body.date || new Date().toISOString().slice(0, 10)
    const hours = calculateWorkedHours(body.startTime, body.finishTime)
    if (hours <= 0) return respond(res, 400, { error: 'Invalid start or finish time' })
    const settings = readJSON(path.join(STORAGE_DIR, 'settings.json'), {})
    const tolls = normalizeTolls(body.tolls, Array.isArray(settings.tolls) ? settings.tolls : BRISBANE_TOLLS)
    const tollTotal = tolls.reduce((sum, toll) => sum + Number(toll.total || 0), 0)
    const ts = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-')
    const id = `kpi_${crypto.randomBytes(3).toString('hex')}_${Date.now().toString(36)}`
    const kpi = { id, driverId: auth.id, ...body, hours, tolls, tollTotal, status: 'submitted', createdAt: new Date().toISOString() }
    const dir = path.join(KPIS_DIR, date)
    ensureDir(dir)
    writeJSON(path.join(dir, `${ts}_${id}.json`), kpi)
    return respond(res, 201, kpi)
  }

  // GET /api/holidays
  if (pathname === '/api/holidays' && req.method === 'GET') {
    if (!auth) return respond(res, 401, { error: 'Unauthorized' })
    return respond(res, 200, readJSON(path.join(STORAGE_DIR, 'holidays.json'), []))
  }

  // POST /api/holidays
  if (pathname === '/api/holidays' && req.method === 'POST') {
    if (!auth || auth.role !== 'driver') return respond(res, 403, { error: 'Forbidden' })
    const holidays = readJSON(path.join(STORAGE_DIR, 'holidays.json'), [])
    const id = `hol_${crypto.randomBytes(3).toString('hex')}_${Date.now().toString(36)}`
    const holiday = { id, driverId: auth.id, ...body, status: 'pending', reviewedBy: '', reviewedAt: '', createdAt: new Date().toISOString() }
    holidays.unshift(holiday)
    writeJSON(path.join(STORAGE_DIR, 'holidays.json'), holidays)
    return respond(res, 201, holiday)
  }

  // PUT /api/holidays/:id
  const holIdMatch = pathname.match(/^\/api\/holidays\/([^/]+)$/)
  if (holIdMatch && req.method === 'PUT') {
    if (!auth || !['supervisor', 'admin'].includes(auth.role)) return respond(res, 403, { error: 'Forbidden' })
    const holidays = readJSON(path.join(STORAGE_DIR, 'holidays.json'), [])
    const idx = holidays.findIndex(h => h.id === holIdMatch[1])
    if (idx === -1) return respond(res, 404, { error: 'Not found' })
    holidays[idx] = { ...holidays[idx], ...body, reviewedBy: auth.id, reviewedAt: new Date().toISOString() }
    writeJSON(path.join(STORAGE_DIR, 'holidays.json'), holidays)
    return respond(res, 200, holidays[idx])
  }

  // GET /api/routes
  if (pathname === '/api/routes' && req.method === 'GET')
    return respond(res, 200, readJSON(path.join(STORAGE_DIR, 'routes.json'), []))

  // GET /api/settings
  if (pathname === '/api/settings' && req.method === 'GET')
    return respond(res, 200, readJSON(path.join(STORAGE_DIR, 'settings.json'), {}))

  // PUT /api/settings
  if (pathname === '/api/settings' && req.method === 'PUT') {
    if (!auth || auth.role !== 'admin') return respond(res, 403, { error: 'Forbidden' })
    const current = readJSON(path.join(STORAGE_DIR, 'settings.json'), {})
    const { routes: routeNumbers, ...rest } = body
    const updated = { ...current, ...rest }
    writeJSON(path.join(STORAGE_DIR, 'settings.json'), updated)
    if (Array.isArray(routeNumbers)) {
      const existing = readJSON(path.join(STORAGE_DIR, 'routes.json'), [])
      const newRoutes = routeNumbers.map(rn => {
        const ex = existing.find(r => r.routeNumber === rn)
        return ex || { id: `route_${crypto.randomBytes(3).toString('hex')}`, routeNumber: rn, depot: updated.depotName, zone: 'General', status: 'active' }
      })
      writeJSON(path.join(STORAGE_DIR, 'routes.json'), newRoutes)
    }
    return respond(res, 200, updated)
  }

  // GET /api/dashboard/:date — save daily snapshot
  const dashMatch = pathname.match(/^\/api\/dashboard\/(\d{4}-\d{2}-\d{2})$/)
  if (dashMatch && req.method === 'GET') {
    if (!auth) return respond(res, 401, { error: 'Unauthorized' })
    const date = dashMatch[1]
    const kpis = loadAllKpis().filter(k => k.date === date)
    const snapshot = { date, kpis, generatedAt: new Date().toISOString() }
    const dir = path.join(DASHBOARD_DIR, date)
    ensureDir(dir)
    const ts = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-')
    writeJSON(path.join(dir, `snapshot_${ts}.json`), snapshot)
    return respond(res, 200, snapshot)
  }

  // POST /api/admin/reset
  if (pathname === '/api/admin/reset' && req.method === 'POST') {
    if (!auth || auth.role !== 'admin') return respond(res, 403, { error: 'Forbidden' })
    const files = ['users.json', 'settings.json', 'routes.json', 'holidays.json']
    for (const f of files) {
      const fp = path.join(STORAGE_DIR, f)
      if (fs.existsSync(fp)) fs.unlinkSync(fp)
    }
    initStorage()
    return respond(res, 200, { ok: true })
  }

  return respond(res, 404, { error: 'Not found' })
}).listen(PORT, () => console.log(`StarTrack KPI server running on port ${PORT}`))
