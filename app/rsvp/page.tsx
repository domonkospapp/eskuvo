'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

type MenuType = 'A' | 'B'

type Choices = {
  menuType: MenuType | null
  mainCourse: string | null
}

type GuestRecord = {
  name: string
  attending: boolean
  starter: string | null
  soup: string | null
  mainCourse: string | null
  dessert: string | null
  allergies: string | null
  submittedAt: string
}

const DESSERT = 'Étcsokoládé mousse sárgabarackkal és levendulával'

const MENU_A_STARTER = 'Kacsamáj terrine, fonott kaláccsal és Tokaji aszú géllel'
const MENU_A_SOUP = 'Újházi tyúkhúsleves, vele főtt zöldségekkel és házi tésztával'
const MENU_A_MAINS = [
  'Roston sült tőkehal filé, karfiollal, beluga lencsével, citrusos mángolddal és fehérboros kapormártással',
  'Érlelt marha bélszín, grillezett nyári zöldségekkel, erdei gombákkal és vörösboros jus-vel',
  'Csirkemell krumplipürével, bébi zöldségekkel és jus-vel',
]

const MENU_B_STARTER = 'Füstölt padlizsánkrém, paprika carpaccióval, pirított tökmaggal és lencseropogóssal'
const MENU_B_SOUP = 'Fehérspárga velouté, marinált zöldspárgával és puffasztott hajdinával'
const MENU_B_MAIN = 'Faszénen sült zeller steak, grillezett nyári zöldségekkel és vörösboros jus-vel'

async function apiSet(key: string, value: string) {
  const res = await fetch('/api/guests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key, value })
  })
  return res.ok
}

async function apiListKeys(prefix: string) {
  const res = await fetch('/api/guests?list=true')
  if (!res.ok) return []
  const data = await res.json()
  return (data.keys as string[]).filter((k) => k.startsWith(prefix))
}

class UnauthorizedError extends Error {}

async function apiGet(key: string, token: string) {
  const res = await fetch('/api/guests?key=' + encodeURIComponent(key), {
    headers: { 'x-admin-token': token }
  })
  if (res.status === 401) throw new UnauthorizedError()
  if (!res.ok) return null
  const data = await res.json()
  return data.value as GuestRecord
}

async function apiVerifyToken(token: string) {
  const res = await fetch('/api/guests?verify=true', {
    headers: { 'x-admin-token': token }
  })
  if (!res.ok) return false
  const data = await res.json()
  return data.authorized === true
}

const ADMIN_TOKEN_STORAGE_KEY = 'eskuvo_admin_token'

function esc(s: string | null | undefined) {
  return s == null ? '' : s
}

const CONFETTI_COLORS = ['#5B1B2E', '#B8965A', '#D9C08E', '#5C6B47', '#F8F1E4', '#FF6F91', '#FFC145']

function Celebration({ variant }: { variant: 'confetti' | 'sad' }) {
  const particles = useMemo(() => {
    const count = variant === 'confetti' ? 70 : 36
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      duration: 2.6 + Math.random() * 2.4,
      delay: Math.random() * 1.4,
      size: variant === 'confetti' ? 6 + Math.random() * 7 : 18 + Math.random() * 14,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    }))
  }, [variant])

  return (
    <div className="celebration-layer" aria-hidden="true">
      {particles.map((p) =>
        variant === 'confetti' ? (
          <span
            key={p.id}
            className="confetti-piece"
            style={{
              left: p.left + '%',
              width: p.size,
              height: p.size * 1.6,
              backgroundColor: p.color,
              animationDuration: p.duration + 's',
              animationDelay: p.delay + 's',
            }}
          />
        ) : (
          <span
            key={p.id}
            className="sad-piece"
            style={{
              left: p.left + '%',
              fontSize: p.size,
              animationDuration: p.duration + 's',
              animationDelay: p.delay + 's',
            }}
          >
            😢
          </span>
        )
      )}
    </div>
  )
}

export default function RsvpPage() {
  const [name, setName] = useState('')
  const [allergies, setAllergies] = useState('')
  const [attending, setAttending] = useState<boolean | null>(null)
  const [choices, setChoices] = useState<Choices>({ menuType: null, mainCourse: null })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submittedName, setSubmittedName] = useState('')
  const [counter, setCounter] = useState<number | null>(null)
  const [showCelebration, setShowCelebration] = useState(false)

  useEffect(() => {
    if (!showCelebration) return
    const timer = setTimeout(() => setShowCelebration(false), 4500)
    return () => clearTimeout(timer)
  }, [showCelebration])

  const [adminOpen, setAdminOpen] = useState(false)
  const [adminLoading, setAdminLoading] = useState(false)
  const [adminError, setAdminError] = useState('')
  const [records, setRecords] = useState<GuestRecord[]>([])
  const [adminToken, setAdminToken] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null
    return sessionStorage.getItem(ADMIN_TOKEN_STORAGE_KEY)
  })
  const [tokenInput, setTokenInput] = useState('')
  const [tokenChecking, setTokenChecking] = useState(false)
  const [tokenError, setTokenError] = useState('')

  async function refreshCounter() {
    const keys = await apiListKeys('guest:')
    setCounter(keys.length)
  }

  useEffect(() => {
    refreshCounter()
  }, [])

  function selectAttend(val: boolean) {
    setAttending(val)
    if (!val) {
      setChoices({ menuType: null, mainCourse: null })
    }
    setError('')
  }

  function selectMenuType(type: MenuType) {
    setChoices({ menuType: type, mainCourse: null })
    setError('')
  }

  function selectMainCourse(value: string) {
    setChoices((prev) => ({ ...prev, mainCourse: value }))
    setError('')
  }

  async function handleSubmit() {
    const trimmedName = name.trim()
    const trimmedAllergies = allergies.trim()

    if (!trimmedName) {
      setError('Kérjük, add meg a neved.')
      return
    }
    if (attending === null) {
      setError('Kérjük, jelezd, részt tudsz-e venni.')
      return
    }
    if (attending === true) {
      if (!choices.menuType) { setError('Kérjük, válassz menüt.'); return }
      if (choices.menuType === 'A' && !choices.mainCourse) { setError('Kérjük, válassz főételt.'); return }
    }

    setSubmitting(true)
    setError('')

    const menuStarter = choices.menuType === 'A' ? MENU_A_STARTER : choices.menuType === 'B' ? MENU_B_STARTER : null
    const menuSoup = choices.menuType === 'A' ? MENU_A_SOUP : choices.menuType === 'B' ? MENU_B_SOUP : null
    const menuMain = choices.menuType === 'A' ? choices.mainCourse : choices.menuType === 'B' ? MENU_B_MAIN : null

    const record: GuestRecord = {
      name: trimmedName,
      attending,
      starter: attending ? menuStarter : null,
      soup: attending ? menuSoup : null,
      mainCourse: attending ? menuMain : null,
      dessert: attending ? DESSERT : null,
      allergies: trimmedAllergies || null,
      submittedAt: new Date().toISOString()
    }

    const key = 'guest:' + Date.now() + '_' + Math.random().toString(36).slice(2, 8)

    try {
      const ok = await apiSet(key, JSON.stringify(record))
      if (!ok) throw new Error('Storage write failed')
      setSubmittedName(trimmedName)
      setSubmitted(true)
      setShowCelebration(true)
      refreshCounter()
    } catch (err) {
      setSubmitting(false)
      setError('Hiba történt a küldés során. Kérjük, próbáld újra.')
    }
  }

  async function loadRecords(token: string) {
    const keys = await apiListKeys('guest:')
    const result: GuestRecord[] = []
    for (let i = 0; i < keys.length; i += 8) {
      const batch = keys.slice(i, i + 8)
      const values = await Promise.all(batch.map((k) => apiGet(k, token)))
      values.forEach((v) => {
        if (!v) return
        result.push(v)
      })
    }
    result.sort((a, b) => (a.submittedAt || '').localeCompare(b.submittedAt || ''))
    return result
  }

  async function refreshAdmin(token: string) {
    setAdminLoading(true)
    setAdminError('')
    try {
      const recs = await loadRecords(token)
      setRecords(recs)
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        sessionStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY)
        setAdminToken(null)
        setTokenError('Hibás token. Próbáld újra.')
      } else {
        setAdminError('Nem sikerült betölteni a listát. Próbáld újra.')
      }
    } finally {
      setAdminLoading(false)
    }
  }

  function toggleAdmin() {
    const next = !adminOpen
    setAdminOpen(next)
    if (next && adminToken) {
      refreshAdmin(adminToken)
    }
    if (!next) {
      setTokenError('')
    }
  }

  async function handleTokenSubmit() {
    const candidate = tokenInput.trim()
    if (!candidate) {
      setTokenError('Add meg a jelszót.')
      return
    }
    setTokenChecking(true)
    setTokenError('')
    try {
      const ok = await apiVerifyToken(candidate)
      if (!ok) {
        setTokenError('Hibás jelszó.')
        return
      }
      sessionStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, candidate)
      setAdminToken(candidate)
      setTokenInput('')
      refreshAdmin(candidate)
    } catch {
      setTokenError('Hiba történt az ellenőrzés során. Próbáld újra.')
    } finally {
      setTokenChecking(false)
    }
  }

  function tally(field: 'starter' | 'soup' | 'mainCourse') {
    const counts: Record<string, number> = {}
    records.forEach((r) => {
      if (r.attending && r[field]) {
        const v = r[field] as string
        counts[v] = (counts[v] || 0) + 1
      }
    })
    return counts
  }

  function sanitizeCsvCell(cell: string) {
    // Neutralize formula injection: a cell starting with =, +, -, or @ can be
    // interpreted as a formula by Excel/Sheets/LibreOffice when the CSV is opened.
    return /^[=+\-@]/.test(cell) ? "'" + cell : cell
  }

  function downloadCsv() {
    const head = ['Nev', 'Jon', 'Eloetel', 'Leves', 'Foetel', 'Desszert', 'Allergia', 'Idopont']
    const rows = records.map((r) => [
      r.name, r.attending ? 'Igen' : 'Nem', r.starter || '', r.soup || '',
      r.mainCourse || '', r.dessert || '', r.allergies || '', r.submittedAt || ''
    ])
    const csv = [head, ...rows]
      .map((row) => row.map((cell) => '"' + sanitizeCsvCell(String(cell)).replace(/"/g, '""') + '"').join(','))
      .join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'vendeglista.csv'
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const yes = records.filter((r) => r.attending)
  const no = records.filter((r) => !r.attending)
  const allergyList = yes.filter((r) => r.allergies)

  return (
    <>
      {showCelebration && <Celebration variant={attending ? 'confetti' : 'sad'} />}

      <div className="hero">
        <p className="eyebrow">Esküvői visszajelzés</p>
        <h1 className="names-label">
          <Image src="/mm-label.png" alt="Márkó & Mercédesz" width={2172} height={724} priority style={{ width: '100%', height: 'auto' }} />
        </h1>
        <p className="meta">2026. szeptember 11-12. &nbsp;•&nbsp; Daalarna Garden, Szentendre</p>
      </div>

      <div className="wrap">
        <Link href="/" className="back-link">← Vissza a főoldalra</Link>

        {!submitted && (
          <section className="card">
            <h2>Kérjük, jelezd részvételed</h2>
            <p className="sub">Válaszodat és a menüválasztást ezen az oldalon rögzítjük.</p>

            <div style={{marginBottom: '22px'}}>
              <label className="field-label" htmlFor="guest-name">Neved</label>
              <input
                type="text"
                id="guest-name"
                placeholder="Kovács Anna"
                autoComplete="name"
                maxLength={100}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div style={{marginBottom: '8px'}}>
              <label className="field-label">Részvétel</label>
              <div className="attend-row" role="radiogroup" aria-label="Részvétel">
                <div
                  className={'toggle-btn' + (attending === true ? ' selected' : '')}
                  role="radio"
                  aria-checked={attending === true}
                  tabIndex={0}
                  onClick={() => selectAttend(true)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectAttend(true) } }}
                >Örömmel részt veszek</div>
                <div
                  className={'toggle-btn' + (attending === false ? ' selected' : '')}
                  role="radio"
                  aria-checked={attending === false}
                  tabIndex={0}
                  onClick={() => selectAttend(false)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectAttend(false) } }}
                >Sajnos nem tudok részt venni</div>
              </div>
            </div>

            <div className={'menu-card' + (attending === true ? ' open' : '')}>
              <div className="course-block">
                <label className="field-label">Menü</label>
                <div className="main-options" role="radiogroup" aria-label="Menü">
                  <div
                    className={'main-option' + (choices.menuType === 'A' ? ' selected' : '')}
                    role="radio"
                    aria-checked={choices.menuType === 'A'}
                    tabIndex={0}
                    onClick={() => selectMenuType('A')}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectMenuType('A') } }}
                  >
                    <div className="main-option-head"><span className="radio-dot"></span> A Menü</div>
                    <div className="main-option-detail">
                      <p className="course-label" style={{marginTop: 0}}>Előétel</p>
                      <p className="course-text">{MENU_A_STARTER}</p>
                      <p className="course-label">Leves</p>
                      <p className="course-text">{MENU_A_SOUP}</p>
                      <p className="course-label">Főétel — választható</p>
                      <p className="course-text">{MENU_A_MAINS.join(' / ')}</p>
                    </div>
                  </div>
                  <div
                    className={'main-option' + (choices.menuType === 'B' ? ' selected' : '')}
                    role="radio"
                    aria-checked={choices.menuType === 'B'}
                    tabIndex={0}
                    onClick={() => selectMenuType('B')}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectMenuType('B') } }}
                  >
                    <div className="main-option-head"><span className="radio-dot"></span> B Menü <span className="tag">VEGÁN</span></div>
                    <div className="main-option-detail">
                      <p className="course-label" style={{marginTop: 0}}>Előétel</p>
                      <p className="course-text">{MENU_B_STARTER}</p>
                      <p className="course-label">Leves</p>
                      <p className="course-text">{MENU_B_SOUP}</p>
                      <p className="course-label">Főétel</p>
                      <p className="course-text">{MENU_B_MAIN}</p>
                    </div>
                  </div>
                </div>
              </div>

              {choices.menuType === 'A' && (
                <div className="course-block">
                  <label className="field-label">Főétel választása</label>
                  <div className="main-options" role="radiogroup" aria-label="Főétel">
                    {MENU_A_MAINS.map((option) => (
                      <div
                        key={option}
                        className={'main-option' + (choices.mainCourse === option ? ' selected' : '')}
                        role="radio"
                        aria-checked={choices.mainCourse === option}
                        tabIndex={0}
                        onClick={() => selectMainCourse(option)}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectMainCourse(option) } }}
                      >
                        <div className="main-option-head"><span className="radio-dot"></span> {option}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="printed-menu" style={{marginTop: '8px'}}>
                <p className="course-label" style={{marginTop: 0}}>Desszert <span className="tag">VEGÁN</span> <span className="tag">GM</span></p>
                <p className="course-text">{DESSERT}</p>
                <p style={{fontSize: '13px', color: '#8a7d6c', fontStyle: 'italic', margin: '8px 0 0'}}>Ez a desszert eleve vegán, így minden vendégnek ugyanaz kerül felszolgálásra — nincs külön választás.</p>
              </div>

              <div style={{marginTop: '26px'}}>
                <label className="field-label" htmlFor="allergies">Ételallergia / érzékenység</label>
                <textarea
                  id="allergies"
                  placeholder="pl. mogyoróallergia, laktózérzékenység — ha nincs, hagyd üresen"
                  maxLength={500}
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
                ></textarea>
              </div>
            </div>

            {error && <p className="error-text" style={{display: 'block'}}>{error}</p>}
            <button className="submit-btn" disabled={submitting} onClick={handleSubmit}>
              {submitting ? 'Küldés...' : 'Visszajelzés elküldése'}
            </button>
          </section>
        )}

        {submitted && (
          <section className="card">
            <div className="confirmation">
              {attending ? (
                <>
                  <div className="checkmark">✓</div>
                  <h2>Köszönjük, {submittedName}!</h2>
                  <p>Örülünk, hogy velünk ünnepelsz. Menüválasztásod rögzítettük.</p>
                </>
              ) : (
                <>
                  <div className="confirmation-photo">
                    <Image src="/sad.png" alt="Sajnáljuk" width={1442} height={3117} style={{ width: '100%', height: 'auto' }} />
                  </div>
                  <h2>Köszönjük a visszajelzést, {submittedName}.</h2>
                  <p>Sajnáljuk, hogy nem tudsz jönni — nagyon fogsz hiányozni.</p>
                </>
              )}
            </div>
          </section>
        )}

        {counter !== null && counter > 0 && (
          <p className="counter">Eddig {counter} visszajelzés érkezett.</p>
        )}

        <p style={{textAlign: 'center', marginTop: '8px'}}>
          <a
            href="#"
            style={{fontSize: '13px', color: '#a89a86', textDecoration: 'none', borderBottom: '1px solid #ddd2be'}}
            onClick={(e) => { e.preventDefault(); toggleAdmin() }}
          >{adminOpen ? 'Szervezői nézet elrejtése' : 'Szervezői nézet'}</a>
        </p>

        {adminOpen && !adminToken && (
          <section className="card">
            <h2>Vendéglista</h2>
            <p className="sub">Ez a nézet jelszóval védett — csak a szervezők férnek hozzá.</p>

            <div style={{marginBottom: '22px'}}>
              <label className="field-label" htmlFor="admin-token">Jelszó</label>
              <input
                type="password"
                id="admin-token"
                placeholder="••••••••"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleTokenSubmit() }}
              />
            </div>

            {tokenError && <p className="error-text" style={{display: 'block'}}>{tokenError}</p>}
            <button className="submit-btn" disabled={tokenChecking} onClick={handleTokenSubmit}>
              {tokenChecking ? 'Ellenőrzés...' : 'Belépés'}
            </button>
          </section>
        )}

        {adminOpen && adminToken && (
          <section className="card">
            <h2>Vendéglista</h2>
            <p className="sub">Beérkezett visszajelzések és összesítés a cateringnek.</p>

            {!adminLoading && !adminError && (
              <div>
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', gap: '12px', marginBottom: '20px'}}>
                  <div style={{background: 'var(--cream)', padding: '14px 16px', border: '1px solid var(--cream-deep)'}}>
                    <p className="course-label" style={{margin: '0 0 4px'}}>Összes válasz</p>
                    <p style={{fontSize: '26px', margin: 0, fontFamily: "'Cormorant Garamond',serif"}}>{records.length}</p>
                  </div>
                  <div style={{background: 'var(--cream)', padding: '14px 16px', border: '1px solid var(--cream-deep)'}}>
                    <p className="course-label" style={{margin: '0 0 4px'}}>Jön</p>
                    <p style={{fontSize: '26px', margin: 0, fontFamily: "'Cormorant Garamond',serif"}}>{yes.length}</p>
                  </div>
                  <div style={{background: 'var(--cream)', padding: '14px 16px', border: '1px solid var(--cream-deep)'}}>
                    <p className="course-label" style={{margin: '0 0 4px'}}>Nem jön</p>
                    <p style={{fontSize: '26px', margin: 0, fontFamily: "'Cormorant Garamond',serif"}}>{no.length}</p>
                  </div>
                </div>

                <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '12px'}}>
                  {(['starter', 'soup', 'mainCourse'] as const).map((field) => {
                    const title = field === 'starter' ? 'Előétel' : field === 'soup' ? 'Leves' : 'Főétel'
                    const counts = tally(field)
                    const entries = Object.entries(counts)
                    return (
                      <div key={field} style={{background: 'var(--cream)', padding: '14px 16px', border: '1px solid var(--cream-deep)'}}>
                        <p className="course-label" style={{margin: '0 0 8px'}}>{title}</p>
                        {entries.length === 0 ? (
                          <div style={{fontSize: '14px', color: '#8a7d6c', fontStyle: 'italic'}}>—</div>
                        ) : entries.map(([k, v]) => (
                          <div key={k} style={{display: 'flex', justifyContent: 'space-between', gap: '12px', padding: '3px 0', fontSize: '14.5px'}}>
                            <span>{k}</span><span style={{fontWeight: 500}}>{v}</span>
                          </div>
                        ))}
                      </div>
                    )
                  })}
                </div>

                {allergyList.length > 0 && (
                  <div style={{background: '#FBF2F2', border: '1px solid #E8D4D4', padding: '14px 16px', marginTop: '12px'}}>
                    <p className="course-label" style={{margin: '0 0 8px', color: 'var(--error)'}}>Allergiák</p>
                    {allergyList.map((r, i) => (
                      <div key={i} style={{fontSize: '14.5px', padding: '2px 0'}}>
                        <strong style={{fontWeight: 500}}>{r.name}:</strong> {r.allergies}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div style={{overflowX: 'auto', marginTop: '26px'}}>
              <table style={{width: '100%', borderCollapse: 'collapse', fontSize: '14.5px'}}>
                <thead>
                  <tr style={{borderBottom: '1.5px solid var(--wine)'}}>
                    <th style={{textAlign: 'left', padding: '8px 10px 8px 0', fontWeight: 500, color: 'var(--wine)'}}>Név</th>
                    <th style={{textAlign: 'left', padding: '8px 10px', fontWeight: 500, color: 'var(--wine)'}}>Jön?</th>
                    <th style={{textAlign: 'left', padding: '8px 10px', fontWeight: 500, color: 'var(--wine)'}}>Előétel</th>
                    <th style={{textAlign: 'left', padding: '8px 10px', fontWeight: 500, color: 'var(--wine)'}}>Leves</th>
                    <th style={{textAlign: 'left', padding: '8px 10px', fontWeight: 500, color: 'var(--wine)'}}>Főétel</th>
                    <th style={{textAlign: 'left', padding: '8px 0 8px 10px', fontWeight: 500, color: 'var(--wine)'}}>Allergia</th>
                  </tr>
                </thead>
                <tbody>
                  {adminLoading && (
                    <tr><td colSpan={6} style={{padding: '20px 0', color: '#8a7d6c', fontStyle: 'italic'}}>Betöltés...</td></tr>
                  )}
                  {!adminLoading && adminError && (
                    <tr><td colSpan={6} style={{padding: '20px 0', color: '#8A2E2E'}}>{adminError}</td></tr>
                  )}
                  {!adminLoading && !adminError && records.length === 0 && (
                    <tr><td colSpan={6} style={{padding: '20px 0', color: '#8a7d6c', fontStyle: 'italic'}}>Még nem érkezett visszajelzés.</td></tr>
                  )}
                  {!adminLoading && !adminError && records.map((r, i) => (
                    <tr key={i} style={{borderBottom: '1px solid var(--cream-deep)'}}>
                      <td style={{padding: '9px 10px 9px 0'}}>{esc(r.name)}</td>
                      <td style={{padding: '9px 10px', color: r.attending ? 'var(--olive)' : '#a08a8a'}}>{r.attending ? 'Igen' : 'Nem'}</td>
                      <td style={{padding: '9px 10px'}}>{esc(r.starter) || '—'}</td>
                      <td style={{padding: '9px 10px'}}>{esc(r.soup) || '—'}</td>
                      <td style={{padding: '9px 10px'}}>{esc(r.mainCourse) || '—'}</td>
                      <td style={{padding: '9px 0 9px 10px'}}>{esc(r.allergies) || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{display: 'flex', gap: '10px', marginTop: '24px', flexWrap: 'wrap'}}>
              <button className="submit-btn" style={{flex: 1, minWidth: '160px', marginTop: 0}} onClick={() => adminToken && refreshAdmin(adminToken)}>Lista frissítése</button>
              <button
                className="submit-btn"
                style={{flex: 1, minWidth: '160px', marginTop: 0, background: '#fff', color: 'var(--wine)', border: '1.5px solid var(--wine)'}}
                onClick={downloadCsv}
              >CSV letöltése</button>
            </div>
            <p style={{fontSize: '13px', color: '#8a7d6c', fontStyle: 'italic', marginTop: '14px'}}>Ez a nézet mindenki számára elérhető, aki megtalálja a linket — a végleges oldalról érdemes eltávolítani, vagy külön fájlban tartani.</p>
          </section>
        )}

        <footer className="divider-foot"></footer>
      </div>
    </>
  )
}
