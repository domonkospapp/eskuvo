import Link from 'next/link'
import Image from 'next/image'

const PROGRAM = [
  { time: '16:00', event: 'Vendégvárás' },
  { time: '16:45', event: 'Szertartás' },
  { time: '17:20', event: 'Aperitivo, Gratuláció' },
  { time: '18:00', event: 'Csoportfotók' },
  { time: '19:00', event: 'Vacsora' },
  { time: '21:00', event: 'Nyitótánc' },
  { time: '23:00', event: 'Torta' },
  { time: '00:00', event: 'Éjféli vacsora' },
]

export default function Home() {
  return (
    <>
      <div className="hero">
        <p className="eyebrow">Esküvői meghívó</p>
        <h1 className="names">Márkó<span className="amp">&amp;</span>Mercédesz</h1>
        <p className="meta">2026. szeptember 11. &nbsp;•&nbsp; Daalarna Garden, Szentendre</p>
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
        <section className="card">
          <div className="invite-letter">
            <p>Kedves családunk és barátaink!</p>
            <p>
              Szeretettel meghívunk Benneteket, hogy velünk ünnepeljétek életünk
              egyik fontos pillanatát, amikor hivatalosan is összekötjük
              életünket.
            </p>
          </div>

          <div className="detail-row">
            <div className="detail-box">
              <p className="course-label">Helyszín</p>
              <p>
                <a href="https://www.daalarnagarden.hu/en/home/" target="_blank" rel="noopener noreferrer" className="detail-link">
                  Daalarna Garden, Szentendre
                </a>
              </p>
            </div>
            <div className="detail-box">
              <p className="course-label">Időpont</p>
              <p>2026. szeptember 11.</p>
            </div>
          </div>
        </section>

        <div className="photo-frame">
          <Image
            src="/mmimage.png"
            alt="Márkó és Mercédesz"
            width={1731}
            height={1984}
            style={{ width: '100%', height: 'auto' }}
            priority
          />
        </div>

        <section className="card">
          <h2>Program</h2>
          <p className="sub">Így telik majd a napunk együtt.</p>
          <div className="timeline">
            {PROGRAM.map((p) => (
              <div className="timeline-row" key={p.time}>
                <span className="timeline-time">{p.time}</span>
                <span className="timeline-event">{p.event}</span>
              </div>
            ))}
          </div>
        </section>

        <Link href="/rsvp" className="submit-btn" style={{display: 'block', marginTop: '32px'}}>
          Visszajelzés és menüválasztás
        </Link>

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
    </>
  )
}
