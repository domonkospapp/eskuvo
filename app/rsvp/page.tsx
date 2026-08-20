'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

type Choices = {
  starter: string | null
  soup: string | null
  main: string | null
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

export default function RsvpPage() {
  const [name, setName] = useState('')
  const [allergies, setAllergies] = useState('')
  const [attending, setAttending] = useState<boolean | null>(null)
  const [choices, setChoices] = useState<Choices>({ starter: null, soup: null, main: null })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submittedName, setSubmittedName] = useState('')
  const [counter, setCounter] = useState<number | null>(null)

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
      setChoices({ starter: null, soup: null, main: null })
    }
    setError('')
  }

  function selectOption(group: keyof Choices, value: string) {
    setChoices((prev) => ({ ...prev, [group]: value }))
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
      if (!choices.starter) { setError('Kérjük, válassz előételt.'); return }
      if (!choices.soup) { setError('Kérjük, válassz levest.'); return }
      if (!choices.main) { setError('Kérjük, válassz főételt.'); return }
    }

    setSubmitting(true)
    setError('')

    const record: GuestRecord = {
      name: trimmedName,
      attending,
      starter: attending ? choices.starter : null,
      soup: attending ? choices.soup : null,
      mainCourse: attending ? choices.main : null,
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
      <div className="hero">
        <p className="eyebrow">Esküvői visszajelzés</p>
        <h1 className="names">Márkó<span className="amp">&amp;</span>Mercédesz</h1>
        <p className="meta">2026. szeptember 11. &nbsp;•&nbsp; Daalarna Garden, Szentendre</p>
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
              <p style={{fontSize: '13px', color: '#8a7d6c', fontStyle: 'italic', margin: '28px 0 20px'}}>Fogásonként külön-külön választhatsz — bátran kombinálhatod a hagyományos és a vegán opciókat.</p>

              <div className="course-block">
                <label className="field-label">Előétel</label>
                <div className="main-options" role="radiogroup" aria-label="Előétel">
                  <div
                    className={'main-option' + (choices.starter === 'Kacsamáj terrine' ? ' selected' : '')}
                    role="radio"
                    aria-checked={choices.starter === 'Kacsamáj terrine'}
                    tabIndex={0}
                    onClick={() => selectOption('starter', 'Kacsamáj terrine')}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectOption('starter', 'Kacsamáj terrine') } }}
                  >
                    <div className="main-option-head"><span className="radio-dot"></span> Kacsamáj terrine</div>
                    <div className="main-option-detail"><p className="course-text">Fonott kaláccsal és Tokaji aszú géllel</p></div>
                  </div>
                  <div
                    className={'main-option' + (choices.starter === 'Füstölt padlizsánkrém (vegán)' ? ' selected' : '')}
                    role="radio"
                    aria-checked={choices.starter === 'Füstölt padlizsánkrém (vegán)'}
                    tabIndex={0}
                    onClick={() => selectOption('starter', 'Füstölt padlizsánkrém (vegán)')}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectOption('starter', 'Füstölt padlizsánkrém (vegán)') } }}
                  >
                    <div className="main-option-head"><span className="radio-dot"></span> Füstölt padlizsánkrém <span className="tag">VEGÁN</span> <span className="tag">GM</span></div>
                    <div className="main-option-detail"><p className="course-text">Paprika carpaccióval, pirított tökmaggal és lencseropogóssal</p></div>
                  </div>
                </div>
              </div>

              <div className="course-block">
                <label className="field-label">Leves</label>
                <div className="main-options" role="radiogroup" aria-label="Leves">
                  <div
                    className={'main-option' + (choices.soup === 'Újházi tyúkhúsleves' ? ' selected' : '')}
                    role="radio"
                    aria-checked={choices.soup === 'Újházi tyúkhúsleves'}
                    tabIndex={0}
                    onClick={() => selectOption('soup', 'Újházi tyúkhúsleves')}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectOption('soup', 'Újházi tyúkhúsleves') } }}
                  >
                    <div className="main-option-head"><span className="radio-dot"></span> Újházi tyúkhúsleves <span className="tag">LM</span></div>
                    <div className="main-option-detail"><p className="course-text">Vele főtt zöldségekkel és házi tésztával</p></div>
                  </div>
                  <div
                    className={'main-option' + (choices.soup === 'Fehérspárga veluté (vegán)' ? ' selected' : '')}
                    role="radio"
                    aria-checked={choices.soup === 'Fehérspárga veluté (vegán)'}
                    tabIndex={0}
                    onClick={() => selectOption('soup', 'Fehérspárga veluté (vegán)')}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectOption('soup', 'Fehérspárga veluté (vegán)') } }}
                  >
                    <div className="main-option-head"><span className="radio-dot"></span> Fehérspárga veluté <span className="tag">VEGÁN</span> <span className="tag">GM</span></div>
                    <div className="main-option-detail"><p className="course-text">Marinált zöldspárgával és puffasztott hajdinával</p></div>
                  </div>
                </div>
              </div>

              <div className="course-block">
                <label className="field-label">Főétel</label>
                <div className="main-options" role="radiogroup" aria-label="Főétel">
                  <div
                    className={'main-option' + (choices.main === 'Roston sült tőkehal filé' ? ' selected' : '')}
                    role="radio"
                    aria-checked={choices.main === 'Roston sült tőkehal filé'}
                    tabIndex={0}
                    onClick={() => selectOption('main', 'Roston sült tőkehal filé')}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectOption('main', 'Roston sült tőkehal filé') } }}
                  >
                    <div className="main-option-head"><span className="radio-dot"></span> Roston sült tőkehal filé <span className="tag">GM</span></div>
                    <div className="main-option-detail"><p className="course-text">Karfiollal, beluga lencsével, citrusos mángolddal és fehérboros kapormártással</p></div>
                  </div>
                  <div
                    className={'main-option' + (choices.main === 'Érlelt marha bélszín' ? ' selected' : '')}
                    role="radio"
                    aria-checked={choices.main === 'Érlelt marha bélszín'}
                    tabIndex={0}
                    onClick={() => selectOption('main', 'Érlelt marha bélszín')}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectOption('main', 'Érlelt marha bélszín') } }}
                  >
                    <div className="main-option-head"><span className="radio-dot"></span> Érlelt marha bélszín <span className="tag">GM</span> <span className="tag">LM</span></div>
                    <div className="main-option-detail"><p className="course-text">Grillezett nyári zöldségekkel, erdei gombákkal és vörösboros jus-vel</p></div>
                  </div>
                  <div
                    className={'main-option' + (choices.main === 'Chicken Supreme' ? ' selected' : '')}
                    role="radio"
                    aria-checked={choices.main === 'Chicken Supreme'}
                    tabIndex={0}
                    onClick={() => selectOption('main', 'Chicken Supreme')}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectOption('main', 'Chicken Supreme') } }}
                  >
                    <div className="main-option-head"><span className="radio-dot"></span> Chicken Supreme</div>
                    <div className="main-option-detail"><p className="course-text">Csirkemell szupreme</p></div>
                  </div>
                  <div
                    className={'main-option' + (choices.main === 'Faszénen sült zeller steak (vegán)' ? ' selected' : '')}
                    role="radio"
                    aria-checked={choices.main === 'Faszénen sült zeller steak (vegán)'}
                    tabIndex={0}
                    onClick={() => selectOption('main', 'Faszénen sült zeller steak (vegán)')}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectOption('main', 'Faszénen sült zeller steak (vegán)') } }}
                  >
                    <div className="main-option-head"><span className="radio-dot"></span> Faszénen sült zeller steak <span className="tag">VEGÁN</span> <span className="tag">GM</span></div>
                    <div className="main-option-detail"><p className="course-text">Grillezett nyári zöldségekkel és vörösboros jus-vel</p></div>
                  </div>
                </div>
              </div>

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
