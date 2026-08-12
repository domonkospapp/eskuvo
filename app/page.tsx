'use client'

import { useEffect } from 'react'

export default function Home() {
  useEffect(() => {
    window.storage = {
      async set(key: string, value: string) {
        const res = await fetch('/api/guests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key, value })
        })
        return res.ok
      },
      async get(key: string) {
        const res = await fetch('/api/guests?key=' + encodeURIComponent(key))
        if (res.ok) {
          const data = await res.json()
          return { value: data.value }
        }
        return null
      },
      async list(prefix: string) {
        const res = await fetch('/api/guests?list=true')
        if (res.ok) {
          const data = await res.json()
          const keys = data.keys.filter((k: string) => k.startsWith(prefix))
          return { keys }
        }
        return { keys: [] }
      }
    }
  }, [])

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
        <section className="card" id="form-section">
          <h2>Kérjük, jelezd részvételed</h2>
          <p className="sub">Válaszodat és a menüválasztást ezen az oldalon rögzítjük.</p>

          <div style={{marginBottom: '22px'}}>
            <label className="field-label" htmlFor="guest-name">Neved</label>
            <input type="text" id="guest-name" placeholder="Kovács Anna" autoComplete="name" />
          </div>

          <div style={{marginBottom: '8px'}}>
            <label className="field-label">Részvétel</label>
            <div className="attend-row">
              <div className="toggle-btn" id="btn-yes" role="button" tabIndex={0}>Örömmel részt veszek</div>
              <div className="toggle-btn" id="btn-no" role="button" tabIndex={0}>Sajnos nem tudok részt venni</div>
            </div>
          </div>

          <div className="menu-card" id="menu-block">
            <p style={{fontSize: '13px', color: '#8a7d6c', fontStyle: 'italic', margin: '28px 0 20px'}}>Fogásonként külön-külön választhatsz — bátran kombinálhatod a hagyományos és a vegán opciókat.</p>

            <div className="course-block">
              <label className="field-label">Előétel</label>
              <div className="main-options">
                <div className="main-option" data-group="starter" data-value="Kacsamáj terrine">
                  <div className="main-option-head"><span className="radio-dot"></span> Kacsamáj terrine</div>
                  <div className="main-option-detail"><p className="course-text">Fonott kaláccsal és Tokaji aszú géllel</p></div>
                </div>
                <div className="main-option" data-group="starter" data-value="Füstölt padlizsánkrém (vegán)">
                  <div className="main-option-head"><span className="radio-dot"></span> Füstölt padlizsánkrém <span className="tag">VEGÁN</span> <span className="tag">GM</span></div>
                  <div className="main-option-detail"><p className="course-text">Paprika carpaccióval, pirított tökmaggal és lencseropogóssal</p></div>
                </div>
              </div>
            </div>

            <div className="course-block">
              <label className="field-label">Leves</label>
              <div className="main-options">
                <div className="main-option" data-group="soup" data-value="Újházi tyúkhúsleves">
                  <div className="main-option-head"><span className="radio-dot"></span> Újházi tyúkhúsleves <span className="tag">LM</span></div>
                  <div className="main-option-detail"><p className="course-text">Vele főtt zöldségekkel és házi tésztával</p></div>
                </div>
                <div className="main-option" data-group="soup" data-value="Fehérspárga veluté (vegán)">
                  <div className="main-option-head"><span className="radio-dot"></span> Fehérspárga veluté <span className="tag">VEGÁN</span> <span className="tag">GM</span></div>
                  <div className="main-option-detail"><p className="course-text">Marinált zöldspárgával és puffasztott hajdinával</p></div>
                </div>
              </div>
            </div>

            <div className="course-block">
              <label className="field-label">Főétel</label>
              <div className="main-options">
                <div className="main-option" data-group="main" data-value="Roston sült tőkehal filé">
                  <div className="main-option-head"><span className="radio-dot"></span> Roston sült tőkehal filé <span className="tag">GM</span></div>
                  <div className="main-option-detail"><p className="course-text">Karfiollal, beluga lencsével, citrusos mángolddal és fehérboros kapormártással</p></div>
                </div>
                <div className="main-option" data-group="main" data-value="Érlelt marha bélszín">
                  <div className="main-option-head"><span className="radio-dot"></span> Érlelt marha bélszín <span className="tag">GM</span> <span className="tag">LM</span></div>
                  <div className="main-option-detail"><p className="course-text">Grillezett nyári zöldségekkel, erdei gombákkal és vörösboros jus-vel</p></div>
                </div>
                <div className="main-option" data-group="main" data-value="Chicken Supreme">
                  <div className="main-option-head"><span className="radio-dot"></span> Chicken Supreme</div>
                  <div className="main-option-detail"><p className="course-text">Csirkemell szupreme</p></div>
                </div>
                <div className="main-option" data-group="main" data-value="Faszénen sült zeller steak (vegán)">
                  <div className="main-option-head"><span className="radio-dot"></span> Faszénen sült zeller steak <span className="tag">VEGÁN</span> <span className="tag">GM</span></div>
                  <div className="main-option-detail"><p className="course-text">Grillezett nyári zöldségekkel és vörösboros jus-vel</p></div>
                </div>
              </div>
            </div>

            <div className="printed-menu" style={{marginTop: '8px'}}>
              <p className="course-label" style={{marginTop: 0}}>Desszert <span className="tag">VEGÁN</span> <span className="tag">GM</span></p>
              <p className="course-text">Étcsokoládé mousse sárgabarackkal és levendulával</p>
              <p style={{fontSize: '13px', color: '#8a7d6c', fontStyle: 'italic', margin: '8px 0 0'}}>Ez a desszert eleve vegán, így minden vendégnek ugyanaz kerül felszolgálásra — nincs külön választás.</p>
            </div>

            <div style={{marginTop: '26px'}}>
              <label className="field-label" htmlFor="allergies">Ételallergia / érzékenység</label>
              <textarea id="allergies" placeholder="pl. mogyoróallergia, laktózérzékenység — ha nincs, hagyd üresen"></textarea>
            </div>
          </div>

          <p className="error-text" id="error-text"></p>
          <button className="submit-btn" id="submit-btn">Visszajelzés elküldése</button>
        </section>

        <section className="card" id="confirmation-section" style={{display: 'none'}}>
          <div className="confirmation">
            <div className="checkmark">✓</div>
            <h2 id="conf-title">Köszönjük!</h2>
            <p id="conf-text">Visszajelzésed rögzítettük.</p>
          </div>
        </section>

        <p className="counter" id="counter-text"></p>

        <p style={{textAlign: 'center', marginTop: '8px'}}>
          <a href="#" id="admin-link" style={{fontSize: '13px', color: '#a89a86', textDecoration: 'none', borderBottom: '1px solid #ddd2be'}}>Szervezői nézet</a>
        </p>

        <section className="card" id="admin-section" style={{display: 'none'}}>
          <h2>Vendéglista</h2>
          <p className="sub">Beérkezett visszajelzések és összesítés a cateringnek.</p>

          <div id="admin-summary"></div>

          <div style={{overflowX: 'auto', marginTop: '26px'}}>
            <table id="admin-table" style={{width: '100%', borderCollapse: 'collapse', fontSize: '14.5px'}}>
              <thead>
                <tr style={{borderBottom: '1.5px solid var(--wine)'}}>
                  <th style={{textAlign: 'left', padding: '8px 10px 8px 0', fontWeight: '500', color: 'var(--wine)'}}>Név</th>
                  <th style={{textAlign: 'left', padding: '8px 10px', fontWeight: '500', color: 'var(--wine)'}}>Jön?</th>
                  <th style={{textAlign: 'left', padding: '8px 10px', fontWeight: '500', color: 'var(--wine)'}}>Előétel</th>
                  <th style={{textAlign: 'left', padding: '8px 10px', fontWeight: '500', color: 'var(--wine)'}}>Leves</th>
                  <th style={{textAlign: 'left', padding: '8px 10px', fontWeight: '500', color: 'var(--wine)'}}>Főétel</th>
                  <th style={{textAlign: 'left', padding: '8px 0 8px 10px', fontWeight: '500', color: 'var(--wine)'}}>Allergia</th>
                </tr>
              </thead>
              <tbody id="admin-tbody"></tbody>
            </table>
          </div>

          <div style={{display: 'flex', gap: '10px', marginTop: '24px', flexWrap: 'wrap'}}>
            <button className="submit-btn" id="refresh-btn" style={{flex: 1, minWidth: '160px', marginTop: 0}}>Lista frissítése</button>
            <button className="submit-btn" id="csv-btn" style={{flex: 1, minWidth: '160px', marginTop: 0, background: '#fff', color: 'var(--wine)', border: '1.5px solid var(--wine)'}}>CSV letöltése</button>
          </div>
          <p style={{fontSize: '13px', color: '#8a7d6c', fontStyle: 'italic', marginTop: '14px'}}>Ez a nézet mindenki számára elérhető, aki megtalálja a linket — a végleges oldalról érdemes eltávolítani, vagy külön fájlban tartani.</p>
        </section>

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

      <script dangerouslySetInnerHTML={{__html: `
(function(){
  var attending = null;
  var choices = { starter: null, soup: null, main: null };

  var btnYes = document.getElementById('btn-yes');
  var btnNo = document.getElementById('btn-no');
  var menuBlock = document.getElementById('menu-block');
  var errorText = document.getElementById('error-text');
  var submitBtn = document.getElementById('submit-btn');

  function selectAttend(val){
    attending = val;
    btnYes.classList.toggle('selected', val === true);
    btnNo.classList.toggle('selected', val === false);
    if(val === true){
      menuBlock.classList.add('open');
    } else {
      menuBlock.classList.remove('open');
      choices = { starter: null, soup: null, main: null };
      document.querySelectorAll('.main-option').forEach(function(el){ el.classList.remove('selected'); });
    }
    errorText.style.display = 'none';
  }

  btnYes.addEventListener('click', function(){ selectAttend(true); });
  btnNo.addEventListener('click', function(){ selectAttend(false); });
  [btnYes, btnNo].forEach(function(el){
    el.addEventListener('keydown', function(e){
      if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); el.click(); }
    });
  });

  document.querySelectorAll('.main-option').forEach(function(opt){
    opt.addEventListener('click', function(){
      var group = opt.getAttribute('data-group');
      choices[group] = opt.getAttribute('data-value');
      document.querySelectorAll('.main-option[data-group="' + group + '"]').forEach(function(el){ el.classList.remove('selected'); });
      opt.classList.add('selected');
      errorText.style.display = 'none';
    });
  });

  function showError(msg){
    errorText.textContent = msg;
    errorText.style.display = 'block';
  }

  async function updateCounter(){
    var counterEl = document.getElementById('counter-text');
    try{
      var list = await window.storage.list('guest:');
      var count = (list && list.keys) ? list.keys.length : 0;
      if(count > 0){
        counterEl.textContent = 'Eddig ' + count + ' visszajelzés érkezett.';
      }
    }catch(err){
      counterEl.textContent = '';
    }
  }

  submitBtn.addEventListener('click', async function(){
    var name = document.getElementById('guest-name').value.trim();
    var allergies = document.getElementById('allergies').value.trim();

    if(!name){
      showError('Kérjük, add meg a neved.');
      return;
    }
    if(attending === null){
      showError('Kérjük, jelezd, részt tudsz-e venni.');
      return;
    }
    if(attending === true){
      if(!choices.starter){ showError('Kérjük, válassz előételt.'); return; }
      if(!choices.soup){ showError('Kérjük, válassz levest.'); return; }
      if(!choices.main){ showError('Kérjük, válassz főételt.'); return; }
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Küldés...';

    var record = {
      name: name,
      attending: attending,
      starter: attending ? choices.starter : null,
      soup: attending ? choices.soup : null,
      mainCourse: attending ? choices.main : null,
      dessert: attending ? 'Étcsokoládé mousse sárgabarackkal és levendulával' : null,
      allergies: allergies || null,
      submittedAt: new Date().toISOString()
    };

    var key = 'guest:' + Date.now() + '_' + Math.random().toString(36).slice(2,8);

    try{
      var result = await window.storage.set(key, JSON.stringify(record));
      if(!result){
        throw new Error('Storage write returned no result');
      }
      document.getElementById('form-section').style.display = 'none';
      var confSection = document.getElementById('confirmation-section');
      confSection.style.display = 'block';
      if(attending){
        document.getElementById('conf-title').textContent = 'Köszönjük, ' + name + '!';
        document.getElementById('conf-text').textContent = 'Örülünk, hogy velünk ünnepelsz. Menüválasztásod rögzítettük.';
      } else {
        document.getElementById('conf-title').textContent = 'Köszönjük a visszajelzést, ' + name + '.';
        document.getElementById('conf-text').textContent = 'Sajnáljuk, hogy nem tudsz jönni — nagyon fogsz hiányozni.';
      }
      updateCounter();
    }catch(err){
      submitBtn.disabled = false;
      submitBtn.textContent = 'Visszajelzés elküldése';
      showError('Hiba történt a küldés során. Kérjük, próbáld újra.');
    }
  });

  var loadedRecords = [];

  async function loadRecords(){
    var list = await window.storage.list('guest:');
    var keys = (list && list.keys) ? list.keys : [];
    var records = [];
    for(var i = 0; i < keys.length; i += 8){
      var batch = keys.slice(i, i + 8);
      var results = await Promise.all(batch.map(function(k){
        return window.storage.get(k).then(function(r){
          try { return JSON.parse(r.value); } catch(e){ return null; }
        }).catch(function(){ return null; });
      }));
      results.forEach(function(r){ if(r) records.push(r); });
    }
    records.sort(function(a,b){ return (a.submittedAt || '').localeCompare(b.submittedAt || ''); });
    return records;
  }

  function tally(records, field){
    var counts = {};
    records.forEach(function(r){
      if(r.attending && r[field]){
        counts[r[field]] = (counts[r[field]] || 0) + 1;
      }
    });
    return counts;
  }

  function countBlock(title, counts){
    var rows = Object.keys(counts).map(function(k){
      return '<div style="display:flex;justify-content:space-between;gap:12px;padding:3px 0;font-size:14.5px;"><span>' + esc(k) + '</span><span style="font-weight:500;">' + counts[k] + '</span></div>';
    }).join('');
    if(!rows){ rows = '<div style="font-size:14px;color:#8a7d6c;font-style:italic;">—</div>'; }
    return '<div style="background:var(--cream);padding:14px 16px;border:1px solid var(--cream-deep);"><p class="course-label" style="margin:0 0 8px;">' + title + '</p>' + rows + '</div>';
  }

  function esc(s){
    return String(s == null ? '' : s).replace(/[&<>"]/g, function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];
    });
  }

  function renderAdmin(records){
    loadedRecords = records;
    var yes = records.filter(function(r){ return r.attending; });
    var no = records.filter(function(r){ return !r.attending; });

    var summary = '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:12px;margin-bottom:20px;"><div style="background:var(--cream);padding:14px 16px;border:1px solid var(--cream-deep);"><p class="course-label" style="margin:0 0 4px;">Összes válasz</p><p style="font-size:26px;margin:0;font-family:\\'Cormorant Garamond\\',serif;">' + records.length + '</p></div><div style="background:var(--cream);padding:14px 16px;border:1px solid var(--cream-deep);"><p class="course-label" style="margin:0 0 4px;">Jön</p><p style="font-size:26px;margin:0;font-family:\\'Cormorant Garamond\\',serif;">' + yes.length + '</p></div><div style="background:var(--cream);padding:14px 16px;border:1px solid var(--cream-deep);"><p class="course-label" style="margin:0 0 4px;">Nem jön</p><p style="font-size:26px;margin:0;font-family:\\'Cormorant Garamond\\',serif;">' + no.length + '</p></div></div>';

    summary += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;">' + countBlock('Előétel', tally(records, 'starter')) + countBlock('Leves', tally(records, 'soup')) + countBlock('Főétel', tally(records, 'mainCourse')) + '</div>';

    var allergyList = yes.filter(function(r){ return r.allergies; });
    if(allergyList.length){
      summary += '<div style="background:#FBF2F2;border:1px solid #E8D4D4;padding:14px 16px;margin-top:12px;"><p class="course-label" style="margin:0 0 8px;color:var(--error);">Allergiák</p>' + allergyList.map(function(r){ return '<div style="font-size:14.5px;padding:2px 0;"><strong style="font-weight:500;">' + esc(r.name) + ':</strong> ' + esc(r.allergies) + '</div>'; }).join('') + '</div>';
    }

    document.getElementById('admin-summary').innerHTML = summary;

    var tbody = document.getElementById('admin-tbody');
    if(!records.length){
      tbody.innerHTML = '<tr><td colspan="6" style="padding:20px 0;color:#8a7d6c;font-style:italic;">Még nem érkezett visszajelzés.</td></tr>';
      return;
    }
    tbody.innerHTML = records.map(function(r){
      return '<tr style="border-bottom:1px solid var(--cream-deep);"><td style="padding:9px 10px 9px 0;">' + esc(r.name) + '</td><td style="padding:9px 10px;color:' + (r.attending ? 'var(--olive)' : '#a08a8a') + ';">' + (r.attending ? 'Igen' : 'Nem') + '</td><td style="padding:9px 10px;">' + esc(r.starter || '—') + '</td><td style="padding:9px 10px;">' + esc(r.soup || '—') + '</td><td style="padding:9px 10px;">' + esc(r.mainCourse || '—') + '</td><td style="padding:9px 0 9px 10px;">' + esc(r.allergies || '—') + '</td></tr>';
    }).join('');
  }

  async function refreshAdmin(){
    var tbody = document.getElementById('admin-tbody');
    tbody.innerHTML = '<tr><td colspan="6" style="padding:20px 0;color:#8a7d6c;font-style:italic;">Betöltés...</td></tr>';
    try{
      renderAdmin(await loadRecords());
    }catch(err){
      tbody.innerHTML = '<tr><td colspan="6" style="padding:20px 0;color:#8A2E2E;">Nem sikerült betölteni a listát. Próbáld újra.</td></tr>';
    }
  }

  document.getElementById('admin-link').addEventListener('click', function(e){
    e.preventDefault();
    var sec = document.getElementById('admin-section');
    if(sec.style.display === 'none'){
      sec.style.display = 'block';
      this.textContent = 'Szervezői nézet elrejtése';
      refreshAdmin();
    } else {
      sec.style.display = 'none';
      this.textContent = 'Szervezői nézet';
    }
  });

  document.getElementById('refresh-btn').addEventListener('click', refreshAdmin);

  document.getElementById('csv-btn').addEventListener('click', function(){
    var head = ['Nev','Jon','Eloetel','Leves','Foetel','Desszert','Allergia','Idopont'];
    var rows = loadedRecords.map(function(r){
      return [r.name, r.attending ? 'Igen' : 'Nem', r.starter || '', r.soup || '', r.mainCourse || '', r.dessert || '', r.allergies || '', r.submittedAt || ''];
    });
    var csv = [head].concat(rows).map(function(row){
      return row.map(function(cell){ return '"' + String(cell).replace(/"/g,'""') + '"'; }).join(',');
    }).join('\\n');
    var blob = new Blob(['\\uFEFF' + csv], {type:'text/csv;charset=utf-8;'});
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'vendeglista.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  });

  updateCounter();
})();
      `}}></script>

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
          display:none;
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
