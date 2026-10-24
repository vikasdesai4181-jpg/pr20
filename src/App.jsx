import { useEffect, useMemo, useState } from 'react'
import './App.css'

const API_URL = 'https://dummyjson.com/users'

const emptyForm = {
  firstName: '',
  lastName: '',
  email: '',
  company: { department: '' },
  companyTitle: '',
  phone: '',
  address: { city: '' },
}

function fullName(employee) {
  return `${employee.firstName} ${employee.lastName}`.trim()
}

function initials(employee) {
  return `${employee.firstName?.[0] ?? ''}${employee.lastName?.[0] ?? ''}`.toUpperCase()
}

function EmployeeDialog({ employee, busy, onClose, onSave }) {
  const [form, setForm] = useState(() => employee ? {
    firstName: employee.firstName ?? '',
    lastName: employee.lastName ?? '',
    email: employee.email ?? '',
    company: { department: employee.company?.department ?? '' },
    companyTitle: employee.company?.title ?? '',
    phone: employee.phone ?? '',
    address: { city: employee.address?.city ?? '' },
  } : emptyForm)

  function updateField(field, value) {
    if (field === 'department') {
      setForm((current) => ({ ...current, company: { ...current.company, department: value } }))
    } else if (field === 'city') {
      setForm((current) => ({ ...current, address: { ...current.address, city: value } }))
    } else if (field === 'title') {
      setForm((current) => ({ ...current, companyTitle: value }))
    } else {
      setForm((current) => ({ ...current, [field]: value }))
    }
  }

  function submitForm(event) {
    event.preventDefault()
    onSave({
      ...form,
      company: { ...form.company, title: form.companyTitle },
      address: { ...form.address },
    })
  }

  return (
    <div className="modal-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !busy) onClose()
    }}>
      <section className="employee-dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
        <header className="dialog-header">
          <div>
            <span className="section-eyebrow">{employee ? 'EMPLOYEE PROFILE' : 'NEW TEAM MEMBER'}</span>
            <h2 id="dialog-title">{employee ? 'Edit employee' : 'Add employee'}</h2>
            <p>{employee ? 'Update employee information.' : 'Add a new person to your organization.'}</p>
          </div>
          <button className="icon-button" type="button" aria-label="Close form" onClick={onClose} disabled={busy}>×</button>
        </header>
        <form className="employee-form" onSubmit={submitForm}>
          <div className="form-grid">
            <label>First name<input required autoFocus value={form.firstName} onChange={(event) => updateField('firstName', event.target.value)} placeholder="e.g. Alex" /></label>
            <label>Last name<input required value={form.lastName} onChange={(event) => updateField('lastName', event.target.value)} placeholder="e.g. Morgan" /></label>
            <label className="form-wide">Work email<input required type="email" value={form.email} onChange={(event) => updateField('email', event.target.value)} placeholder="alex@company.com" /></label>
            <label>Department<input required value={form.company.department} onChange={(event) => updateField('department', event.target.value)} placeholder="e.g. Engineering" /></label>
            <label>Job title<input required value={form.companyTitle} onChange={(event) => updateField('title', event.target.value)} placeholder="e.g. Product designer" /></label>
            <label>Phone<input value={form.phone} onChange={(event) => updateField('phone', event.target.value)} placeholder="+1 555 0100" /></label>
            <label>City<input value={form.address.city} onChange={(event) => updateField('city', event.target.value)} placeholder="e.g. Portland" /></label>
          </div>
          <div className="dialog-actions">
            <button className="button button-secondary" type="button" onClick={onClose} disabled={busy}>Cancel</button>
            <button className="button button-primary" type="submit" disabled={busy}>
              {busy ? 'Saving…' : employee ? 'Save changes' : 'Add employee'}
              {!busy && <span aria-hidden="true">↗</span>}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

function EmployeeRow({ employee, onEdit, onDelete, busy }) {
  return (
    <tr>
      <td>
        <div className="person-cell">
          <span className={`person-avatar tone-${Math.abs(employee.id) % 6}`}>{initials(employee)}</span>
          <span><strong>{fullName(employee)}</strong><small>{employee.email}</small></span>
        </div>
      </td>
      <td><span className="department-tag">{employee.company?.department || 'Unassigned'}</span></td>
      <td><span className="job-title">{employee.company?.title || '—'}</span></td>
      <td><span className="location-cell"><span aria-hidden="true">⌖</span>{employee.address?.city || '—'}</span></td>
      <td className="row-actions">
        <button className="row-action edit-action" type="button" onClick={() => onEdit(employee)} disabled={busy} aria-label={`Edit ${fullName(employee)}`} title="Edit employee">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 5 4 4M4 20l4-.8L19 8a2.1 2.1 0 0 0-3-3L5 16l-1 4Z" /></svg>
        </button>
        <button className="row-action delete-action" type="button" onClick={() => onDelete(employee)} disabled={busy} aria-label={`Delete ${fullName(employee)}`} title="Delete employee">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M10 11v6m4-6v6M5.5 7l1 13h11l1-13M9 7V4h6v3" /></svg>
        </button>
      </td>
    </tr>
  )
}

function App() {
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [reloadKey, setReloadKey] = useState(0)
  const [loadError, setLoadError] = useState('')
  const [actionError, setActionError] = useState('')
  const [notice, setNotice] = useState('')
  const [query, setQuery] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('All departments')
  const [dialogEmployee, setDialogEmployee] = useState(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let active = true
    async function loadEmployees() {
      try {
        const response = await fetch(`${API_URL}?limit=12&select=id,firstName,lastName,email,phone,company,address`)
        if (!response.ok) throw new Error(`Employee request failed (${response.status}).`)
        const data = await response.json()
        if (!Array.isArray(data.users)) throw new Error('The employee service returned an unexpected response.')
        if (active) setEmployees(data.users.map((employee) => ({ ...employee, apiBacked: true })))
      } catch (error) {
        if (active) setLoadError(error instanceof Error ? error.message : 'Could not load employees. Please try again.')
      } finally {
        if (active) setLoading(false)
      }
    }
    loadEmployees()
    return () => { active = false }
  }, [reloadKey])

  function retryLoad() {
    setLoading(true)
    setLoadError('')
    setReloadKey((current) => current + 1)
  }

  const departments = useMemo(
    () => ['All departments', ...new Set(employees.map((employee) => employee.company?.department).filter(Boolean))],
    [employees],
  )

  const filteredEmployees = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return employees.filter((employee) => {
      const matchesDepartment = departmentFilter === 'All departments' || employee.company?.department === departmentFilter
      const searchable = [
        fullName(employee),
        employee.email,
        employee.company?.department,
        employee.company?.title,
        employee.address?.city,
      ].join(' ').toLowerCase()
      return matchesDepartment && searchable.includes(normalizedQuery)
    })
  }, [departmentFilter, employees, query])

  const departmentCount = new Set(employees.map((employee) => employee.company?.department).filter(Boolean)).size

  async function saveEmployee(form) {
    setBusy(true)
    setActionError('')
    setNotice('')
    const isEditing = Boolean(dialogEmployee)
    try {
      let result = {}
      if (!isEditing || dialogEmployee.apiBacked) {
        const response = await fetch(isEditing ? `${API_URL}/${dialogEmployee.id}` : `${API_URL}/add`, {
          method: isEditing ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        if (!response.ok) throw new Error(`Could not ${isEditing ? 'update' : 'add'} employee (${response.status}).`)
        result = await response.json()
      }
      if (isEditing) {
        setEmployees((current) => current.map((employee) => employee.id === dialogEmployee.id ? { ...employee, ...form, id: employee.id } : employee))
      } else {
        const createdEmployee = { ...form, id: result.id ?? -Date.now(), apiBacked: false }
        setEmployees((current) => [createdEmployee, ...current])
      }
      setDialogOpen(false)
      setNotice(`${fullName(form)} was ${isEditing ? 'updated' : 'added'} successfully.`)
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'The employee could not be saved. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  async function deleteEmployee(employee) {
    setBusy(true)
    setActionError('')
    setNotice('')
    try {
      if (employee.apiBacked) {
        const response = await fetch(`${API_URL}/${employee.id}`, { method: 'DELETE' })
        if (!response.ok) throw new Error(`Could not delete employee (${response.status}).`)
      }
      setEmployees((current) => current.filter((item) => item.id !== employee.id))
      setNotice(`${fullName(employee)} was removed from the team.`)
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'The employee could not be deleted. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  function openAddDialog() {
    setDialogEmployee(null)
    setDialogOpen(true)
    setActionError('')
  }

  function openEditDialog(employee) {
    setDialogEmployee(employee)
    setDialogOpen(true)
    setActionError('')
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#dashboard" aria-label="Forma home">
          <span className="brand-symbol"><span /><span /><span /><span /></span>
          <span>forma<span className="brand-period">.</span><small>PEOPLE, IN GOOD FORM</small></span>
        </a>
        <span className="nav-heading">WORKSPACE</span>
        <nav aria-label="Main navigation">
          <a className="nav-item current" href="#employees"><span className="nav-symbol">▦</span>Employees<span className="nav-number">{employees.length}</span></a>
          <a className="nav-item" href="#dashboard"><span className="nav-symbol">◫</span>Overview</a>
          <a className="nav-item" href="#departments"><span className="nav-symbol">⌘</span>Departments</a>
        </nav>
        <div className="sidebar-bottom">
          <div className="workspace-card"><span className="workspace-logo">F</span><span><strong>Forma Studio</strong><small>Business workspace</small></span><span className="workspace-menu">···</span></div>
          <div className="user-card"><span className="user-avatar">JD</span><span><strong>Jordan Davis</strong><small>Workspace admin</small></span><span className="user-chevron">⌄</span></div>
        </div>
      </aside>

      <main>
        <header className="topbar">
          <div className="breadcrumbs"><span>Workspace</span><b>/</b><strong>Employees</strong></div>
          <div className="topbar-right"><span className="api-indicator"><i /> Live directory</span><button className="top-avatar" type="button" aria-label="Account menu">JD</button></div>
        </header>

        <div className="page-content" id="dashboard">
          <section className="hero-row">
            <div>
              <div className="eyebrow">PEOPLE OPERATIONS <span>·</span> DIRECTORY</div>
              <h1>Good people, <em>great work.</em></h1>
              <p>A little space to look after the people who make it happen.</p>
            </div>
            <button className="button button-primary add-button" type="button" onClick={openAddDialog} disabled={busy}>
              <span className="plus" aria-hidden="true">+</span>Add employee
            </button>
          </section>

          <section className="metrics-grid" aria-label="Employee statistics">
            <article className="metric-card">
              <div className="metric-top"><span>People on the team</span><span className="metric-icon purple-icon">♙</span></div>
              <strong>{employees.length.toString().padStart(2, '0')}</strong>
              <small><span className="metric-dot purple-dot" />Active employee records</small>
            </article>
            <article className="metric-card">
              <div className="metric-top"><span>Departments</span><span className="metric-icon amber-icon">⌘</span></div>
              <strong>{departmentCount.toString().padStart(2, '0')}</strong>
              <small>Across our organization</small>
            </article>
            <article className="metric-card highlight-card">
              <div className="metric-top"><span>Directory status</span><span className="metric-icon green-icon">↗</span></div>
              <strong className="status-value">{loading ? 'Connecting' : loadError ? 'Offline' : 'Looking good'}</strong>
              <small><span className={`metric-dot ${loadError ? 'red-dot' : 'green-dot'}`} />{loadError ? 'Check your connection' : 'Synced with employee API'}</small>
            </article>
          </section>

          <section className="directory-card" id="employees" aria-labelledby="directory-title">
            <header className="directory-toolbar">
              <div className="directory-title">
                <span className="section-eyebrow">YOUR ORGANIZATION</span>
                <h2 id="directory-title">Employee directory <span>{employees.length}</span></h2>
                <p>Meet the people behind the work.</p>
              </div>
              <div className="directory-controls">
                <label className="search-control">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 5 5" /></svg>
                  <input type="search" aria-label="Search employees" placeholder="Find someone..." value={query} onChange={(event) => setQuery(event.target.value)} />
                  <kbd>⌘ K</kbd>
                </label>
                <label className="department-control">
                  <span className="sr-only">Filter department</span>
                  <select value={departmentFilter} onChange={(event) => setDepartmentFilter(event.target.value)}>
                    {departments.map((department) => <option key={department}>{department}</option>)}
                  </select>
                </label>
              </div>
            </header>

            {actionError && <div className="feedback feedback-error" role="alert"><span aria-hidden="true">!</span><span>{actionError}</span><button type="button" onClick={() => setActionError('')} aria-label="Dismiss error">×</button></div>}
            {notice && <div className="feedback feedback-success" role="status"><span aria-hidden="true">✓</span>{notice}</div>}

            {loading ? (
              <div className="loading-state" role="status"><span className="spinner" />Loading employee directory…</div>
            ) : loadError ? (
              <div className="empty-state">
                <span className="empty-symbol">!</span><strong>We couldn't reach the directory</strong><p>{loadError}</p>
                <button className="button button-secondary" type="button" onClick={retryLoad}>Try again</button>
              </div>
            ) : filteredEmployees.length ? (
              <div className="table-wrap">
                <table>
                  <thead><tr><th scope="col">EMPLOYEE</th><th scope="col">DEPARTMENT</th><th scope="col">JOB TITLE</th><th scope="col">LOCATION</th><th scope="col"><span className="sr-only">ACTIONS</span></th></tr></thead>
                  <tbody>{filteredEmployees.map((employee) => <EmployeeRow key={employee.id} employee={employee} onEdit={openEditDialog} onDelete={deleteEmployee} busy={busy} />)}</tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state">
                <span className="empty-symbol">⌕</span>
                <strong>{employees.length ? 'No matching employees' : 'No employees yet'}</strong>
                <p>{employees.length ? 'Try another name or choose a different department.' : 'Add your first employee to get the directory started.'}</p>
                {employees.length === 0 && <button className="button button-primary" type="button" onClick={openAddDialog}>Add employee</button>}
              </div>
            )}

            <footer className="directory-footer">
              <span>Showing <strong>{loading ? '—' : filteredEmployees.length}</strong> of <strong>{employees.length}</strong> employees</span>
              <span className="footer-live"><i /> Employee data by DummyJSON</span>
            </footer>
          </section>

          <footer className="page-footer"><span>© 2026 Forma Studio</span><span>People first, always <b>✳</b></span></footer>
        </div>
      </main>

      {dialogOpen && <EmployeeDialog employee={dialogEmployee} busy={busy} onClose={() => setDialogOpen(false)} onSave={saveEmployee} />}
    </div>
  )
}

export default App
