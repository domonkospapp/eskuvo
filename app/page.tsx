import Link from 'next/link'
import Image from 'next/image'

const PROGRAM_DAY1 = [
  { time: '16:00', event: 'Vendégvárás' },
  { time: '16:45', event: 'Szertartás' },
  { time: '17:20', event: 'Aperitivo, Gratuláció' },
  { time: '18:00', event: 'Csoportfotók' },
  { time: '19:00', event: 'Vacsora' },
  { time: '21:00', event: 'Nyitótánc' },
  { time: '23:00', event: 'Torta' },
  { time: '00:00', event: 'Éjféli vacsora' },
]

const PROGRAM_DAY2 = [
  { time: '13:00', event: 'Érkezés & Welcome drink' },
  { time: '14:00', event: 'Live DJ' },
  { time: '15:00', event: 'Grill & Pizza' },
]

export default function Home() {
  return (
    <>
      <div className="hero">
        <p className="eyebrow">Esküvői meghívó</p>
        <h1 className="names-label">
          <Image src="/mm-label.png" alt="Márkó & Mercédesz" width={2172} height={724} priority style={{ width: '100%', height: 'auto' }} />
        </h1>
        <p className="meta">2026. szeptember 11-12. &nbsp;•&nbsp; Daalarna Garden, Szentendre</p>
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
              <p>2026. szeptember 11-12.</p>
            </div>
          </div>
        </section>

        <div className="photo-frame">
          <Image
            src="/mm-envelope.png"
            alt="Márkó és Mercédesz"
            width={1823}
            height={1937}
            style={{ width: '100%', height: 'auto' }}
            priority
          />
        </div>

        <section className="card">
          <p className="day-label">Szeptember 11.</p>
          <h2 className="day-title">Program</h2>
          <p className="sub">Így telik majd a napunk együtt.</p>
          <div className="timeline">
            {PROGRAM_DAY1.map((p) => (
              <div className="timeline-row" key={p.time}>
                <span className="timeline-time">{p.time}</span>
                <span className="timeline-event">{p.event}</span>
              </div>
            ))}
          </div>

          <p className="day-label" style={{marginTop: '36px'}}>Szeptember 12.</p>
          <h2 className="day-title">Program</h2>
          <div className="timeline">
            {PROGRAM_DAY2.map((p) => (
              <div className="timeline-row" key={p.time}>
                <span className="timeline-time">{p.time}</span>
                <span className="timeline-event">{p.event}</span>
              </div>
            ))}
          </div>
          <p className="timeline-note">…and the party goes on</p>
        </section>

        <Link href="/rsvp" className="submit-btn cta-gray" style={{display: 'block', marginTop: '32px'}}>
          Visszajelzés és menüválasztás
        </Link>

        <footer className="divider-foot"></footer>
      </div>
    </>
  )
}
