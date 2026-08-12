'use client'

import { useState } from 'react'

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

async function apiGet(key: string) {
  const res = await fetch('/api/guests?key=' + encodeURIComponent(key))
  if (!res.ok) return null
  const data = await res.json()
  return data.value as GuestRecord
}

function esc(s: string | null | undefined) {
  return s == null ? '' : s
}

export default function Home() {
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

  async function refreshCounter() {
    const keys = await apiListKeys('guest:')
    setCounter(keys.length)
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

  async function loadRecords() {
    const keys = await apiListKeys('guest:')
    const result: GuestRecord[] = []
    for (let i = 0; i < keys.length; i += 8) {
      const batch = keys.slice(i, i + 8)
      const values = await Promise.all(batch.map((k) => apiGet(k).catch(() => null)))
      values.forEach((v) => {
        if (!v) return
        result.push(v)
      })
    }
    result.sort((a, b) => (a.submittedAt || '').localeCompare(b.submittedAt || ''))
    return result
  }

  async function refreshAdmin() {
    setAdminLoading(true)
    setAdminError('')
    try {
      const recs = await loadRecords()
      setRecords(recs)
    } catch {
      setAdminError('Nem sikerült betölteni a listát. Próbáld újra.')
    } finally {
      setAdminLoading(false)
    }
  }

  function toggleAdmin() {
    const next = !adminOpen
    setAdminOpen(next)
    if (next) {
      refreshAdmin()
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

  function downloadCsv() {
    const head = ['Nev', 'Jon', 'Eloetel', 'Leves', 'Foetel', 'Desszert', 'Allergia', 'Idopont']
    const rows = records.map((r) => [
      r.name, r.attending ? 'Igen' : 'Nem', r.starter || '', r.soup || '',
      r.mainCourse || '', r.dessert || '', r.allergies || '', r.submittedAt || ''
    ])
    const csv = [head, ...rows]
      .map((row) => row.map((cell) => '"' + String(cell).replace(/"/g, '""') + '"').join(','))
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
        <h1 className="names">[Menyasszony neve]<span className="amp">&amp;</span>[Vőlegény neve]</h1>
        <p className="meta">[2027. év hónap nap.] &nbsp;•&nbsp; [Helyszín neve, város]</p>
        <p className="hint">(Ezt a sort a szervezők cseréljék ki a saját adataikra a HTML fájlban.)</p>
        <svg className="vine vine-top" viewBox="0 0 400 24" xmlns="http://www.w3.org/2000/svg" role="presentation">
          <line x1="20" y1="12" x2="380" y2="12" stroke="#D9C08E" strokeWidth="1"/>
          <circle cx="200" cy="12" r="4" fill="#D9C08E"/>
          <circle cx="188" cy="8" r="2.4" fill="#D9C08E"/>
          <circle cx="212" cy="8" r="2.4" fill="#D9C08E"/>
          <circle cx="182" cy="16" r="2" fill="#D9C08E"/>
          <circle cx="218" cy="16" r="2" fill="#D9C08E"/>
        </svg>
      </div>

      <div className="wrap">
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
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div style={{marginBottom: '8px'}}>
              <label className="field-label">Részvétel</label>
              <div className="attend-row">
                <div
                  className={'toggle-btn' + (attending === true ? ' selected' : '')}
                  role="button"
                  tabIndex={0}
                  onClick={() => selectAttend(true)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectAttend(true) } }}
                >Örömmel részt veszek</div>
                <div
                  className={'toggle-btn' + (attending === false ? ' selected' : '')}
                  role="button"
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
                <div className="main-options">
                  <div
                    className={'main-option' + (choices.starter === 'Kacsamáj terrine' ? ' selected' : '')}
                    onClick={() => selectOption('starter', 'Kacsamáj terrine')}
                  >
                    <div className="main-option-head"><span className="radio-dot"></span> Kacsamáj terrine</div>
                    <div className="main-option-detail"><p className="course-text">Fonott kaláccsal és Tokaji aszú géllel</p></div>
                  </div>
                  <div
                    className={'main-option' + (choices.starter === 'Füstölt padlizsánkrém (vegán)' ? ' selected' : '')}
                    onClick={() => selectOption('starter', 'Füstölt padlizsánkrém (vegán)')}
                  >
                    <div className="main-option-head"><span className="radio-dot"></span> Füstölt padlizsánkrém <span className="tag">VEGÁN</span> <span className="tag">GM</span></div>
                    <div className="main-option-detail"><p className="course-text">Paprika carpaccióval, pirított tökmaggal és lencseropogóssal</p></div>
                  </div>
                </div>
              </div>

              <div className="course-block">
                <label className="field-label">Leves</label>
                <div className="main-options">
                  <div
                    className={'main-option' + (choices.soup === 'Újházi tyúkhúsleves' ? ' selected' : '')}
                    onClick={() => selectOption('soup', 'Újházi tyúkhúsleves')}
                  >
                    <div className="main-option-head"><span className="radio-dot"></span> Újházi tyúkhúsleves <span className="tag">LM</span></div>
                    <div className="main-option-detail"><p className="course-text">Vele főtt zöldségekkel és házi tésztával</p></div>
                  </div>
                  <div
                    className={'main-option' + (choices.soup === 'Fehérspárga veluté (vegán)' ? ' selected' : '')}
                    onClick={() => selectOption('soup', 'Fehérspárga veluté (vegán)')}
                  >
                    <div className="main-option-head"><span className="radio-dot"></span> Fehérspárga veluté <span className="tag">VEGÁN</span> <span className="tag">GM</span></div>
                    <div className="main-option-detail"><p className="course-text">Marinált zöldspárgával és puffasztott hajdinával</p></div>
                  </div>
                </div>
              </div>

              <div className="course-block">
                <label className="field-label">Főétel</label>
                <div className="main-options">
                  <div
                    className={'main-option' + (choices.main === 'Roston sült tőkehal filé' ? ' selected' : '')}
                    onClick={() => selectOption('main', 'Roston sült tőkehal filé')}
                  >
                    <div className="main-option-head"><span className="radio-dot"></span> Roston sült tőkehal filé <span className="tag">GM</span></div>
                    <div className="main-option-detail"><p className="course-text">Karfiollal, beluga lencsével, citrusos mángolddal és fehérboros kapormártással</p></div>
                  </div>
                  <div
                    className={'main-option' + (choices.main === 'Érlelt marha bélszín' ? ' selected' : '')}
                    onClick={() => selectOption('main', 'Érlelt marha bélszín')}
                  >
                    <div className="main-option-head"><span className="radio-dot"></span> Érlelt marha bélszín <span className="tag">GM</span> <span className="tag">LM</span></div>
                    <div className="main-option-detail"><p className="course-text">Grillezett nyári zöldségekkel, erdei gombákkal és vörösboros jus-vel</p></div>
                  </div>
                  <div
                    className={'main-option' + (choices.main === 'Chicken Supreme' ? ' selected' : '')}
                    onClick={() => selectOption('main', 'Chicken Supreme')}
                  >
                    <div className="main-option-head"><span className="radio-dot"></span> Chicken Supreme</div>
                    <div className="main-option-detail"><p className="course-text">Csirkemell szupreme</p></div>
                  </div>
                  <div
                    className={'main-option' + (choices.main === 'Faszénen sült zeller steak (vegán)' ? ' selected' : '')}
                    onClick={() => selectOption('main', 'Faszénen sült zeller steak (vegán)')}
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
              <div className="checkmark">✓</div>
              {attending ? (
                <>
                  <h2>Köszönjük, {submittedName}!</h2>
                  <p>Örülünk, hogy velünk ünnepelsz. Menüválasztásod rögzítettük.</p>
                </>
              ) : (
                <>
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

        {adminOpen && (
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
              <button className="submit-btn" style={{flex: 1, minWidth: '160px', marginTop: 0}} onClick={refreshAdmin}>Lista frissítése</button>
              <button
                className="submit-btn"
                style={{flex: 1, minWidth: '160px', marginTop: 0, background: '#fff', color: 'var(--wine)', border: '1.5px solid var(--wine)'}}
                onClick={downloadCsv}
              >CSV letöltése</button>
            </div>
            <p style={{fontSize: '13px', color: '#8a7d6c', fontStyle: 'italic', marginTop: '14px'}}>Ez a nézet mindenki számára elérhető, aki megtalálja a linket — a végleges oldalról érdemes eltávolítani, vagy külön fájlban tartani.</p>
          </section>
        )}

        <footer className="divider-foot">
          <svg className="vine" viewBox="0 0 400 24" xmlns="http://www.w3.org/2000/svg" role="presentation">
            <line x1="20" y1="12" x2="380" y2="12" stroke="#B8965A" strokeWidth="1"/>
            <circle cx="200" cy="12" r="4" fill="#B8965A"/>
            <circle cx="188" cy="8" r="2.4" fill="#B8965A"/>
            <circle cx="212" cy="8" r="2.4" fill="#B8965A"/>
            <circle cx="182" cy="16" r="2" fill="#B8965A"/>
            <circle cx="218" cy="16" r="2" fill="#B8965A"/>
          </svg>
        </footer>
      </div>

      <style>{`
        :root{
          --wine:#5B1B2E;
          --wine-dark:#3D1220;
          --cream:#F8F1E4;
          --cream-deep:#F1E6D3;
          --gold:#B8965A;
          --gold-light:#D9C08E;
          --ink:#2B2320;
          --olive:#5C6B47;
          --olive-bg:#E9EBDF;
          --error:#8A2E2E;
        }
        *{box-sizing:border-box;}
        body{
          margin:0;
          background:var(--cream);
          color:var(--ink);
          font-family:'EB Garamond', serif;
          -webkit-font-smoothing:antialiased;
        }
        .wrap{max-width:640px;margin:0 auto;padding:0 24px 80px;}
        .hero{
          text-align:center;
          padding:72px 24px 40px;
          background:var(--wine);
          color:var(--cream);
          margin-bottom:0;
        }
        .eyebrow{
          font-family:'EB Garamond', serif;
          letter-spacing:0.28em;
          text-transform:uppercase;
          font-size:12.5px;
          color:var(--gold-light);
          margin:0 0 20px;
        }
        .names{
          font-family:'Cormorant Garamond', serif;
          font-weight:500;
          font-size:clamp(38px,7vw,58px);
          line-height:1.08;
          margin:0;
        }
        .names .amp{
          font-style:italic;
          color:var(--gold-light);
          padding:0 6px;
          font-weight:400;
        }
        .meta{
          margin:22px 0 0;
          font-size:17px;
          color:var(--gold-light);
          letter-spacing:0.02em;
        }
        .hint{
          margin:6px 0 0;
          font-size:13px;
          color:#c9a9a9;
          font-style:italic;
        }
        .vine{display:block;width:100%;height:auto;margin:0 auto;}
        .vine-top{margin-top:8px;}
        section.card{
          background:#fff;
          border:1px solid var(--cream-deep);
          border-radius:2px;
          padding:36px 32px;
          margin-top:32px;
        }
        h2{
          font-family:'Cormorant Garamond', serif;
          font-weight:600;
          font-size:26px;
          color:var(--wine);
          margin:0 0 6px;
        }
        .sub{
          font-size:15px;
          color:#7a6f63;
          margin:0 0 24px;
          font-style:italic;
        }
        label.field-label{
          display:block;
          font-size:13px;
          letter-spacing:0.08em;
          text-transform:uppercase;
          color:var(--wine);
          margin-bottom:8px;
        }
        input[type="text"], textarea{
          width:100%;
          font-family:'EB Garamond', serif;
          font-size:17px;
          padding:12px 14px;
          border:1px solid #d8cdb8;
          border-radius:2px;
          background:var(--cream);
          color:var(--ink);
        }
        input[type="text"]:focus, textarea:focus{
          outline:2px solid var(--gold);
          outline-offset:1px;
        }
        textarea{resize:vertical;min-height:80px;}
        .attend-row{
          display:grid;
          grid-template-columns:1fr 1fr;
          gap:12px;
          margin-top:6px;
        }
        .toggle-btn{
          padding:16px 12px;
          text-align:center;
          border:1.5px solid #d8cdb8;
          border-radius:2px;
          background:var(--cream);
          cursor:pointer;
          font-family:'EB Garamond', serif;
          font-size:16px;
          color:var(--ink);
          transition:border-color .15s, background .15s;
        }
        .toggle-btn:hover{border-color:var(--gold);}
        .toggle-btn.selected{
          background:var(--wine);
          border-color:var(--wine);
          color:var(--cream);
        }
        .menu-card{
          display:none;
        }
        .menu-card.open{display:block;}
        .printed-menu{
          background:var(--cream);
          border:1px solid var(--cream-deep);
          padding:24px 22px;
          margin-bottom:24px;
        }
        .course-label{
          font-size:12px;
          letter-spacing:0.18em;
          color:var(--gold);
          text-transform:uppercase;
          margin:0 0 4px;
        }
        .course-label:not(:first-child){margin-top:18px;}
        .course-text{
          font-size:16.5px;
          line-height:1.5;
          margin:0;
        }
        .tag{
          display:inline-block;
          font-size:11px;
          letter-spacing:0.04em;
          padding:1px 7px;
          border-radius:20px;
          background:var(--olive-bg);
          color:var(--olive);
          margin-left:6px;
          position:relative;
          top:-1px;
        }
        .course-block{margin-bottom:26px;}
        .main-options{display:flex;flex-direction:column;gap:10px;}
        .main-option{
          border:1.5px solid #d8cdb8;
          border-radius:2px;
          padding:14px 16px;
          cursor:pointer;
          transition:border-color .15s;
        }
        .main-option:hover{border-color:var(--gold);}
        .main-option.selected{border-color:var(--wine);background:var(--cream);}
        .main-option-head{
          display:flex;
          align-items:center;
          gap:10px;
          font-size:17px;
        }
        .radio-dot{
          width:16px;height:16px;
          border-radius:50%;
          border:1.5px solid #b8a888;
          flex:none;
          position:relative;
        }
        .main-option.selected .radio-dot{border-color:var(--wine);}
        .main-option.selected .radio-dot::after{
          content:"";
          position:absolute;
          inset:3px;
          border-radius:50%;
          background:var(--wine);
        }
        .main-option-detail{
          margin:10px 0 0 26px;
          font-size:15px;
          color:#5a5148;
          display:none;
        }
        .main-option.selected .main-option-detail{display:block;}
        .main-option-detail .course-label{margin-top:12px;}
        .main-option-detail .course-label:first-child{margin-top:0;}
        .submit-btn{
          width:100%;
          margin-top:32px;
          padding:16px;
          background:var(--wine);
          color:var(--cream);
          border:none;
          border-radius:2px;
          font-family:'Cormorant Garamond', serif;
          font-size:19px;
          letter-spacing:0.04em;
          cursor:pointer;
          transition:background .15s;
        }
        .submit-btn:hover{background:var(--wine-dark);}
        .submit-btn:disabled{opacity:0.6;cursor:not-allowed;}
        .error-text{
          color:var(--error);
          font-size:14px;
          margin-top:10px;
        }
        .confirmation{
          text-align:center;
          padding:20px 8px 8px;
        }
        .confirmation .checkmark{
          width:48px;height:48px;
          border-radius:50%;
          border:1.5px solid var(--wine);
          display:flex;align-items:center;justify-content:center;
          margin:0 auto 18px;
          color:var(--wine);
          font-size:22px;
        }
        .confirmation h2{margin-bottom:10px;}
        .confirmation p{font-size:16px;color:#5a5148;}
        .counter{
          text-align:center;
          font-size:14px;
          color:#8a7d6c;
          margin-top:28px;
          font-style:italic;
        }
        footer.divider-foot{padding:40px 24px 0;}
        @media (max-width:480px){
          .attend-row{grid-template-columns:1fr;}
          section.card{padding:28px 20px;}
        }
      `}</style>
    </>
  )
}
