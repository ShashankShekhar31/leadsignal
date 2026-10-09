import { parseCsv, scoreLeads, toLead } from './leadEngine'
import type { Lead } from './leadEngine'
import { useMemo, useRef, useState } from 'react'
import {
  Activity,
  ArrowDownUp,
  ArrowUpRight,
  Building2,
  CheckCircle2,
  ChevronDown,
  Download,
  FileSpreadsheet,
  Filter,
  LayoutDashboard,
  Search,
  ShieldCheck,
  Target,
  Upload,
  Users,
  X,
} from 'lucide-react'
import './App.css'

const sampleLeads: Lead[] = [
  { id: '1', company: 'Northstar Analytics', industry: 'Software', location: 'New York, US', employees: 145, revenue: 12, website: 'northstaranalytics.example', email: 'hello@northstaranalytics.example', score: 0, priority: 'Low', reasons: [], duplicate: false },
  { id: '2', company: 'BrightPath Logistics', industry: 'Logistics', location: 'Chicago, US', employees: 280, revenue: 32, website: 'brightpathlogistics.example', email: 'contact@brightpathlogistics.example', score: 0, priority: 'Low', reasons: [], duplicate: false },
  { id: '3', company: 'Cloudline Systems', industry: 'Software', location: 'Austin, US', employees: 85, revenue: 8, website: 'cloudlinesystems.example', email: 'team@cloudlinesystems.example', score: 0, priority: 'Low', reasons: [], duplicate: false },
  { id: '4', company: 'Evergreen Manufacturing', industry: 'Manufacturing', location: 'Dallas, US', employees: 420, revenue: 55, website: 'evergreenmanufacturing.example', email: 'info@evergreenmanufacturing.example', score: 0, priority: 'Low', reasons: [], duplicate: false },
  { id: '5', company: 'Summit Advisory Group', industry: 'Consulting', location: 'Boston, US', employees: 62, revenue: 6, website: 'summitadvisory.example', email: 'hello@summitadvisory.example', score: 0, priority: 'Low', reasons: [], duplicate: false },
  { id: '6', company: 'HarborTech Solutions', industry: 'Software', location: 'Seattle, US', employees: 210, revenue: 24, website: 'harbortech.example', email: 'sales@harbortech.example', score: 0, priority: 'Low', reasons: [], duplicate: false },
  { id: '7', company: 'Redwood Supply Co', industry: 'Manufacturing', location: 'Denver, US', employees: 175, revenue: 18, website: 'redwoodsupply.example', email: 'info@redwoodsupply.example', score: 0, priority: 'Low', reasons: [], duplicate: false },
  { id: '8', company: 'Pioneer Health Group', industry: 'Healthcare', location: 'Atlanta, US', employees: 330, revenue: 40, website: 'pioneerhealth.example', email: 'contact@pioneerhealth.example', score: 0, priority: 'Low', reasons: [], duplicate: false },
]

function downloadCsv(leads: Lead[]) {
  const headers = ['Company', 'Industry', 'Location', 'Employees', 'Revenue (M)', 'Website', 'Email', 'Score', 'Priority', 'Duplicate', 'Score reasons']
  const escape = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`
  const csv = [
    headers.map(escape).join(','),
    ...leads.map((lead) =>
      [
        lead.company, lead.industry, lead.location, lead.employees, lead.revenue,
        lead.website, lead.email, lead.score, lead.priority,
        lead.duplicate ? 'Yes' : 'No', lead.reasons.join('; '),
      ].map(escape).join(','),
    ),
  ].join('\r\n')

  const url = URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' }))
  const link = document.createElement('a')
  link.href = url
  link.download = 'leadsignal-qualified-leads.csv'
  link.click()
  URL.revokeObjectURL(url)
}

export default function App() {
  const [leads, setLeads] = useState(() => scoreLeads(sampleLeads))
  const [search, setSearch] = useState('')
  const [priority, setPriority] = useState('All priorities')
  const [sortByScore, setSortByScore] = useState(true)
  const [notice, setNotice] = useState('')
  const fileInput = useRef<HTMLInputElement>(null)

  const filteredLeads = useMemo(() => {
    const query = search.trim().toLowerCase()

    return leads
      .filter((lead) => {
        const matchesSearch = [lead.company, lead.industry, lead.location, lead.email]
          .some((value) => value.toLowerCase().includes(query))
        return matchesSearch && (priority === 'All priorities' || lead.priority === priority)
      })
      .sort((a, b) => sortByScore ? b.score - a.score : a.company.localeCompare(b.company))
  }, [leads, search, priority, sortByScore])

  const highPriority = leads.filter((lead) => lead.priority === 'High').length
  const duplicates = leads.filter((lead) => lead.duplicate).length
  const averageScore = leads.length
    ? Math.round(leads.reduce((sum, lead) => sum + lead.score, 0) / leads.length)
    : 0

  async function handleImport(file?: File) {
    if (!file) return
    try {
      if (!file.name.toLowerCase().endsWith('.csv')) {
        throw new Error('Please select a .csv file.')
      }

      const text = await file.text()
      const rows = parseCsv(text)
      const imported = rows.map(toLead)
      setLeads(scoreLeads(imported))
      setSearch('')
      setPriority('All priorities')
      setNotice(`Imported ${imported.length} leads successfully.`)
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Unable to import this CSV.')
    } finally {
      if (fileInput.current) fileInput.current.value = ''
    }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#" aria-label="LeadSignal home">
          <span className="brand-mark"><Activity size={22} /></span>
          <span>lead<span className="brand-accent">signal</span><small>INTELLIGENCE PLATFORM</small></span>
        </a>

        <div className="workspace-label">WORKSPACE</div>
        <nav className="side-nav">
          <a className="nav-item active" href="#dashboard"><LayoutDashboard size={18} /> Overview</a>
          <a className="nav-item" href="#leads"><Users size={18} /> Lead database <span className="nav-count">{leads.length}</span></a>
        </nav>

        <div className="sidebar-bottom">
          <div className="secure-note"><ShieldCheck size={18} /><span><strong>Private by design</strong><small>CSV processed in your browser</small></span></div>
          <div className="profile"><div className="avatar">LS</div><span><strong>Sales workspace</strong><small>Lead qualification</small></span></div>
        </div>
      </aside>

      <main className="main-content" id="dashboard">
        <header className="topbar">
          <div><span className="breadcrumb">Workspace</span><span className="breadcrumb-divider">/</span><strong>Lead intelligence</strong></div>
          <div className="topbar-right"><span className="status-dot" /> Local workspace <span className="avatar small">LS</span></div>
        </header>

        <section className="page-content">
          <div className="page-heading">
            <div><div className="eyebrow"><Target size={14} /> SALES INTELLIGENCE</div><h1>Lead qualification</h1><p>Find the prospects most aligned with your ideal customer profile.</p></div>
            <div className="heading-actions">
              <button className="button button-secondary" onClick={() => fileInput.current?.click()}><Upload size={16} /> Import CSV</button>
              <button className="button button-primary" onClick={() => downloadCsv(filteredLeads)} disabled={!filteredLeads.length}><Download size={16} /> Export leads</button>
              <input ref={fileInput} type="file" accept=".csv,text/csv" hidden onChange={(event) => void handleImport(event.target.files?.[0])} />
            </div>
          </div>

          {notice && <div className="notice" role="status"><span>{notice}</span><button aria-label="Dismiss notification" onClick={() => setNotice('')}><X size={16} /></button></div>}

          <div className="metrics-grid">
            <article className="metric-card"><div className="metric-top"><span>Total prospects</span><span className="metric-icon blue"><Building2 size={18} /></span></div><div className="metric-value">{leads.length}</div><div className="metric-foot">Companies in current dataset</div></article>
            <article className="metric-card"><div className="metric-top"><span>High-priority leads</span><span className="metric-icon green"><Target size={18} /></span></div><div className="metric-value">{highPriority}</div><div className="metric-foot"><span className="positive"><ArrowUpRight size={14} /> {leads.length ? Math.round(highPriority / leads.length * 100) : 0}%</span> of current prospects</div></article>
            <article className="metric-card"><div className="metric-top"><span>Average fit score</span><span className="metric-icon purple"><Activity size={18} /></span></div><div className="metric-value">{averageScore}<span className="metric-suffix">/100</span></div><div className="metric-foot">Based on the current scoring rules</div></article>
            <article className="metric-card"><div className="metric-top"><span>Duplicate records</span><span className="metric-icon amber"><FileSpreadsheet size={18} /></span></div><div className="metric-value">{duplicates}</div><div className="metric-foot">{duplicates ? 'Review repeated company names' : 'No repeated company names'}</div></article>
          </div>

          <section className="insight-banner">
            <div className="insight-icon"><Target size={20} /></div>
            <div className="insight-copy"><strong>Prioritize fit over volume</strong><p>Scores reflect industry, company size, revenue, and contact-data completeness. They are heuristic estimates, not verified buying intent.</p></div>
            <div className="insight-tag"><CheckCircle2 size={15} /> Explainable scoring</div>
          </section>

          <section className="leads-panel" id="leads">
            <div className="panel-heading"><div><h2>Prospect database</h2><p>Review, qualify and export your best-fit companies.</p></div><div className="panel-total">{filteredLeads.length} records</div></div>
            <div className="toolbar">
              <label className="search-box"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search companies, industries, locations..." /><kbd>⌘ K</kbd></label>
              <label className="filter-box"><Filter size={16} /><select value={priority} onChange={(event) => setPriority(event.target.value)}><option>All priorities</option><option>High</option><option>Medium</option><option>Low</option></select><ChevronDown size={14} /></label>
              <button className="button button-secondary sort-button" onClick={() => setSortByScore((current) => !current)}><ArrowDownUp size={16} /> {sortByScore ? 'Sort: Best fit' : 'Sort: Company'} </button>
            </div>

            <div className="table-wrap">
              <table>
                <thead><tr><th>COMPANY</th><th>INDUSTRY / LOCATION</th><th>COMPANY SIZE</th><th>FIT SCORE</th><th>PRIORITY</th><th>DATA QUALITY</th></tr></thead>
                <tbody>
                  {filteredLeads.map((lead) => (
                    <tr key={lead.id}>
                      <td><div className="company-cell"><div className="company-logo">{lead.company.slice(0, 1).toUpperCase()}</div><div><strong>{lead.company}</strong><small>{lead.website || 'Website not provided'}</small></div></div></td>
                      <td><div className="industry-cell"><strong>{lead.industry || 'Unknown industry'}</strong><small>{lead.location || 'Location unknown'}</small></div></td>
                      <td><div className="size-cell"><strong>{lead.employees ? lead.employees.toLocaleString() : '—'}</strong><small>{lead.revenue ? `$${lead.revenue}M revenue` : 'Revenue unknown'}</small></div></td>
                      <td><div className="score-cell"><div className="score-number">{lead.score}<span>/100</span></div><div className="score-track"><span style={{ width: `${lead.score}%` }} /></div><small title={lead.reasons.join(', ')}>{lead.reasons.slice(0, 2).join(' · ') || 'No matching signals'}</small></div></td>
                      <td><span className={`priority-pill ${lead.priority.toLowerCase()}`}><span />{lead.priority}</span></td>
                      <td><span className={`quality-pill ${lead.duplicate ? 'warning' : lead.website && lead.email ? 'complete' : 'partial'}`}>{lead.duplicate ? 'Duplicate' : lead.website && lead.email ? 'Complete' : 'Partial'}</span></td>
                    </tr>
                  ))}
                  {!filteredLeads.length && <tr><td colSpan={6} className="empty-state">No matching leads. Change your filters or import a CSV file.</td></tr>}
                </tbody>
              </table>
            </div>
            <footer className="table-footer"><span>Showing {filteredLeads.length} of {leads.length} prospects</span><span><ShieldCheck size={14} /> Data stays in this browser session</span></footer>
          </section>

          <footer className="page-footer"><span>LEADSIGNAL · PROTOTYPE</span><span>Built for smarter prospecting <span className="footer-dot">•</span> <a href="#dashboard">Back to top ↑</a></span></footer>
        </section>
      </main>
    </div>
  )
}