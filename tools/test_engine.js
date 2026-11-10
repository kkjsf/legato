// Tests du moteur de Legato avec un faux piano MIDI.
// Page servie en local (pas en file://), puis dans la console :
//   (await import('./tools/test_engine.js?' + Date.now())).run()
// Le moteur est piloté à la main (P.step), donc ça marche même quand requestAnimationFrame est figé.
// Les réglages et le localStorage de la page sont remis comme avant à la fin.
export async function run() {
  const out = [];
  const ok = (name, cond, info) => out.push((cond ? 'OK   ' : 'FAIL ') + name + (info !== undefined ? ' · ' + info : ''));
  const saved = {}, setBefore = JSON.stringify(SET);
  for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k.startsWith('legato-')) saved[k] = localStorage.getItem(k); }
  const realSynth = window.synth;
  try {
    // ---------- faux piano ----------
    const sent = [], input = { name: 'Faux P-145', manufacturer: 'Test', state: 'connected', onmidimessage: null };
    const output = { name: 'Faux P-145', state: 'connected', send: (d, ts) => sent.push({ d: [...d], ts, at: performance.now() }) };
    navigator.requestMIDIAccess = async () => ({ inputs: new Map([['i', input]]), outputs: new Map([['o', output]]), onstatechange: null });
    await midiInit();
    ok('MIDI : faux piano reconnu en entrée et en sortie', MIDI.state === 'on' && MIDI.outs.length === 1);
    const key = (m, v = 80) => input.onmidimessage({ data: [0x90, m, v] });
    const rel = m => input.onmidimessage({ data: [0x80, m, 0] });
    const ons = () => sent.filter(s => (s.d[0] & 0xF0) === 0x90 && s.d[2] > 0);
    const menuet = PIECES.find(p => p.id === 'menuet');
    let synthCalls = 0; window.synth = () => { synthCalls++; };

    // ---------- 1. mode attente, main droite, vue partition ----------
    SET.accomp = 'piano'; SET.view = 'score'; SET.metro = false; SET.fing = 'all'; SET.latency = 0;
    // MIDI.recent : garde anti-écho de 80 ms en temps réel ; les scénarios s'enchaînent en quelques ms, donc on la vide
    openPiece(menuet); P.hands = 'R'; P.mode = 'wait'; P.pct = 70; P.loop = false; restart(); sent.length = 0; MIDI.recent = {};
    let groups = 0, guard = 0;
    while (!P.done && guard++ < 50000) {
      P.step(1 / 60); metroRun(); draw();
      if (P.wait) {
        groups++;
        if (groups === 10) { key(P.wait.grp[0].midi + 1); rel(P.wait.grp[0].midi + 1); }
        const ms = P.wait.grp.map(n => n.midi); ms.forEach(m => key(m)); ms.forEach(m => rel(m));
      }
    }
    let r = P.result();
    const lhCount = menuet.notes.filter(n => n.hand === 'L').length;
    ok('attente MD : morceau fini, bilan affiché', P.done && !$('#p-res').hidden);
    ok('attente MD : 64 groupes, une fausse note voulue', groups === 64 && r.tot === 64 && r.ok === 63 && r.extra === 1, `${groups} groupes, ${r.ok}/${r.tot}, ${r.acc} %`);
    ok('attente MD : main gauche envoyée au piano', ons().length === lhCount && ons().every(s => s.d[2] === 58), `${ons().length} / ${lhCount}`);

    // ---------- 2. mode tempo, deux mains, ±30 ms ----------
    openPiece(menuet); P.hands = 'B'; P.mode = 'tempo'; P.pct = 70; restart(); P.running = true; sent.length = 0; MIDI.recent = {};
    const spb = 60 / P.bpm, req = P.notes.filter(n => n.st === 'pend').sort((a, b) => a.on - b.on);
    let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const plan = req.map(n => ({ n, at: n.on + (rnd() * 60 - 30) / 1000 / spb, done: false }));
    guard = 0;
    while (!P.done && guard++ < 200000) {
      P.step(1 / 240);
      for (const p of plan) if (!p.done && P.t >= p.at) { p.done = true; key(p.n.midi, p.n.hand === 'R' ? 72 : 52); rel(p.n.midi); }
    }
    r = P.result();
    const mean = r.dts.reduce((a, b) => a + Math.abs(b), 0) / r.dts.length;
    ok('tempo 2 mains : tout juste', r.acc === 100 && r.extra === 0, `${r.ok}/${r.tot}`);
    ok('tempo 2 mains : écart moyen sous 25 ms', mean < 25, `± ${mean.toFixed(1)} ms`);
    ok('tempo 2 mains : équilibre mesuré (MD 72, MG 52)', r.vR === 72 && r.vL === 52);
    ok('tempo 2 mains : rien envoyé au piano', ons().length === 0);

    // ---------- 3. mode tempo, main droite : l'autre main part en avance, horodatée ----------
    openPiece(menuet); P.hands = 'R'; P.mode = 'tempo'; restart(); P.running = true; sent.length = 0;
    guard = 0; while (!P.done && guard++ < 50000) P.step(1 / 60);
    const lead = ons().map(s => s.ts - s.at);
    ok('tempo MD : main gauche envoyée, programmée 0 à 100 ms à l\'avance', ons().length === lhCount && Math.min(...lead) >= -1 && Math.max(...lead) <= 102, `${Math.min(...lead).toFixed(1)} à ${Math.max(...lead).toFixed(1)} ms`);
    $('#p-res').hidden = true;

    // ---------- 4. démo ----------
    openPiece(menuet); P.mode = 'tempo'; $('#p-mode').click(); sent.length = 0; synthCalls = 0;
    ok('démo : démarre seule, mains désactivées', P.running && $('#p-hands').classList.contains('off') && $('#p-mode').textContent === 'Démo');
    guard = 0; let probed = false;
    while (!P.done && guard++ < 50000) {
      P.step(1 / 60); draw();
      if (!probed && P.t > 4) { probed = true; const e = P.extra; key(61); rel(61); ok('démo : le jeu de l\'élève ne compte pas', P.extra === e && P.flashes.length === 0); }
    }
    const dl = ons().map(s => s.ts - s.at);
    ok('démo : les deux mains jouées par le piano', ons().length === menuet.notes.length && synthCalls === 0, `${ons().length} / ${menuet.notes.length} notes`);
    ok('démo : vélocités MD 72, MG 56', ons().every(s => s.d[2] === 72 || s.d[2] === 56));
    ok('démo : notes programmées 0 à 100 ms à l\'avance', Math.min(...dl) >= -1 && Math.max(...dl) <= 102);
    ok('démo : pas de bilan à la fin', P.done && $('#p-res').hidden && $('#p-toast').textContent === 'Fin de la démo');
    ok('démo : non mémorisée comme mode du morceau', (LS.get('p-menuet', {}).mode || 'wait') !== 'demo');
    const outs = MIDI.outs; MIDI.outs = []; openPiece(menuet); P.mode = 'demo'; restart(); synthCalls = 0;
    guard = 0; while (!P.done && guard++ < 50000) P.step(1 / 60);
    ok('démo sans sortie MIDI : jouée par le téléphone', synthCalls === menuet.notes.length, `${synthCalls} notes`);
    MIDI.outs = outs;

    // ---------- 5. métronome ----------
    const run2 = (until) => { let g = 0; while (P.t < until && g++ < 20000) { P.step(1 / 60); metroRun(); } };
    SET.metro = false; openPiece(menuet); P.mode = 'tempo'; restart(); P.running = true; METRO.log.length = 0;
    run2(4);
    ok('décompte : 3 clics même métronome coupé, accent sur le 1er', METRO.log.map(c => c.b).join() === '-3,-2,-1' && METRO.log.map(c => +c.accent).join() === '1,0,0', METRO.log.map(c => c.b + (c.accent ? '!' : '')).join(' '));
    SET.metro = true; restart(); P.running = true; METRO.log.length = 0;
    run2(9);
    const beats = METRO.log.map(c => c.b), acc = METRO.log.filter(c => c.accent).map(c => c.b);
    ok('métronome : un clic par temps, sans trou ni doublon', beats.every((b, i) => b === beats[0] + i) && beats[0] === -3 && beats.length >= 12, beats.join(' '));
    ok('métronome : accent sur le 1er temps de chaque mesure (3/4)', acc.join() === beats.filter(b => b % 3 === 0).join(), acc.join(' '));
    const n0 = METRO.log.length; P.running = false; for (let i = 0; i < 30; i++) { P.step(1 / 60); metroRun(); }
    ok('métronome : se tait à la pause', METRO.log.length === n0 && METRO.nodes.length === 0);
    P.running = true; const tb = P.t; P.pct = 100; metroCancel(); run2(tb + 3);
    const after = METRO.log.slice(n0);
    ok('métronome : suit le tempo % (repris sans doublon)', after.length >= 2 && after[0].b >= Math.ceil(tb - 1e-6) && after.every((c, i) => !i || c.b === after[i - 1].b + 1));
    // régularité en temps réel (2,5 s) : le moteur avance avec l'horloge, les clics doivent tomber tous les 60/bpm
    if (ac().state === 'running') {
      restart(); P.running = true; METRO.log.length = 0;
      const yieldNow = () => new Promise(res => { const c = new MessageChannel(); c.port1.onmessage = res; c.port2.postMessage(0); });
      // volet visible : la boucle de l'appli avance déjà le moteur ; volet masqué (rAF figé) : on l'avance ici
      let frames = 0; const tick = () => { frames++; if (frames < 30) requestAnimationFrame(tick); }; requestAnimationFrame(tick);
      const t0w = performance.now(); while (performance.now() - t0w < 400) await yieldNow();
      const rafLive = frames >= 15;
      let last = performance.now(); const end = last + 2500;
      if (rafLive) await new Promise(res => setTimeout(res, 2500));
      else while (performance.now() < end) { const now = performance.now(); if (now - last >= 8) { P.step((now - last) / 1000); metroRun(); last = now; } await yieldNow(); }
      const gaps = METRO.log.slice(1).map((c, i) => c.at - METRO.log[i].at), spb2 = 60 / P.bpm;
      ok('métronome : clics réguliers sur l\'horloge audio (temps réel)', gaps.length >= 3 && gaps.every(g => Math.abs(g - spb2) < 0.004), gaps.map(g => ((g - spb2) * 1000).toFixed(1) + ' ms').join(' '));
      restart();
    } else out.push('--   métronome : contexte audio suspendu (pas de geste), régularité non mesurable ici');
    SET.metro = false;

    // ---------- 6. gravure ----------
    openPiece(menuet);
    const all = P.score.units.flatMap(u => u.notes);
    ok('gravure Menuet : armure Sol, aucun Fa♯ altéré à la main', P.pc.key === 1 && all.filter(n => n.acc !== null).length === 0);
    const ch = P.score.units.find(u => u.hand === 'L' && u.on === 0);
    ok('gravure Menuet : accord MG Sol-Si-Ré en blanches, une hampe', ch && ch.notes.length === 3 && ch.hd === 'h' && !ch.dot);
    const b1 = P.score.beams.find(g => g[0].hand === 'R' && g[0].on === 1);
    ok('gravure Menuet : croches de la mes. 1 sous une même barre', b1 && b1.length === 4);
    ok('gravure Menuet : blanche pointée en fin de phrase', P.score.units.some(u => u.hand === 'R' && u.dur === 3 && u.hd === 'h' && u.dot));
    const fa = SCALES.find(s => s.id === 'gamme-F4'); openPiece(fa);
    ok('gravure Fa majeur : Si♭ dans l\'armure, pas sur la note', P.pc.key === -1 && P.score.units.flatMap(u => u.notes).every(n => n.acc === null));
    const imp = { id: 'test-acc', title: 'Test', sub: '', bpm: 90, num: 4, hands: 'B', pct: 100, src: '', key: 0,
      data: [[66, 0, 1, 1], [65, 1, 1, 1], [66, 2, 2, 1], [65, 4, 4, 1], [48, 0, 4, 0], [49, 4, 4, 0]] };
    openPiece(imp);
    const A = P.score.units.filter(u => u.hand === 'R').map(u => u.notes[0].acc);
    ok('altérations accidentelles : ♯, ♮, ♯ dans la mesure, rien à la suivante', A.join() === '1,0,1,', A.map(String).join(' '));
    ok('altérations accidentelles : Do♯ grave en clé de fa', P.score.units.find(u => u.hand === 'L' && u.on === 4).notes[0].acc === 1);
    const d = [62, 64, 66, 67, 69, 71, 73, 74].map((m, i) => [m, i, 1, 1]);
    ok('armure devinée : gamme de Ré = 2 dièses', guessKey(d) === 2);
    ok('épellation : Si♭ en Fa, Do♯ en Ré, Fa♮ en Sol', spell(70, -1).fr === 'Si♭' && spell(61, 2).fr === 'Do♯' && spell(65, 1).alt === 0 && spell(65, 1).step === 31);
    ok('épellation hors gamme : Fa♯ en Fa, Si♭ / Mi♭ / Do♯ en Do, Mi♯ en Fa♯', spell(66, -1).fr === 'Fa♯' && spell(70, 0).fr === 'Si♭' && spell(63, 0).fr === 'Mi♭' && spell(61, 0).fr === 'Do♯' && spell(65, 6).fr === 'Mi♯' && spell(65, 6).step === 30 && spell(61, -1).fr === 'Do♯' && spell(66, -2).fr === 'Fa♯');

    // ---------- 7. import d'un MIDI fabriqué (tempo, 3/4, armure 3 bémols, statut courant) ----------
    const u32 = n => [n >>> 24, (n >> 16) & 255, (n >> 8) & 255, n & 255];
    const trk = ev => { const b = ev.flat(); return [0x4D, 0x54, 0x72, 0x6B, ...u32(b.length), ...b]; };
    const bytes = [0x4D, 0x54, 0x68, 0x64, 0, 0, 0, 6, 0, 1, 0, 3, 1, 0xE0,
      ...trk([[0, 0xFF, 0x51, 3, 0x07, 0xA1, 0x20], [0, 0xFF, 0x58, 4, 3, 2, 24, 8], [0, 0xFF, 0x59, 2, 0xFD, 0], [0, 0xFF, 0x2F, 0]]),
      ...trk([[0, 0x90, 75, 90], [0x83, 0x60, 75, 0], [0, 74, 90], [0x83, 0x60, 74, 0], [0, 72, 90], [0x83, 0x60, 72, 0], [0, 70, 90], [0x8B, 0x20, 70, 0], [0, 0xFF, 0x2F, 0]]),
      ...trk([[0, 0x90, 51, 70], [0x8B, 0x20, 51, 0], [0, 55, 70], [0x8B, 0x20, 55, 0], [0, 0xFF, 0x2F, 0]])];
    const m = parseMidi(new Uint8Array(bytes).buffer), pc = fromMidi('essai.mid', m);
    ok('import : 120 bpm, 3/4, armure 3 bémols', pc.bpm === 120 && pc.num === 3 && pc.tn === 3 && pc.td === 4 && pc.key === -3, `${pc.bpm} bpm ${pc.tn}/${pc.td} armure ${pc.key}`);
    ok('import : mains par piste', pc.data.filter(n => n[3] === 1).length === 4 && pc.data.filter(n => n[3] === 0).length === 2);
    openPiece(pc);
    ok('import : Mi♭ épelé en bémol, sans altération (armure)', P.notes.find(n => n.midi === 75).fr === 'Mi♭' && P.score.units.flatMap(u => u.notes).every(n => n.acc === null));

    // ---------- 6 bis. son de l'appli : tout / coupé ; clavier masqué en partition ----------
    const outs2 = MIDI.outs; MIDI.outs = outs2;
    for (const [mode, wantSent, wantSynth] of [['all', 37, 64], ['off', 0, 0]]) {
      SET.sound = mode; openPiece(menuet); P.hands = 'R'; P.mode = 'tempo'; restart(); P.running = true; sent.length = 0; synthCalls = 0; MIDI.recent = {};
      let g = 0; while (!P.done && g++ < 50000) P.step(1 / 60);
      ok('son « ' + mode + ' » : ' + ons().length + ' notes au piano, ' + synthCalls + ' au téléphone', ons().length === wantSent && synthCalls === wantSynth);
      $('#p-res').hidden = true;
    }
    SET.sound = 'other'; SET.view = 'score'; SET.kbd = false; openPiece(menuet);
    ok('partition sans clavier : toute la hauteur, portées plus grandes', KB.kh === 0 && KB.hitY === KB.H && SC.sp >= 13 && !$('#p-kbd').hidden, `interligne ${SC.sp} px`);
    SET.kbd = true; layout();

    // ---------- 7 bis. répertoire : notes recopiées de Mutopia, mesures entières, doigtés partout ----------
    const count = { 'menuet-sol-mineur': [118, 81], 'schumann-melodie': [118, 185] };
    for (const p of PIECES) {
      build(p);
      const end = h => Math.max(...p.notes.filter(n => n.hand === h).map(n => n.on + n.dur));
      const n = h => p.notes.filter(x => x.hand === h).length, ok2 = !count[p.id] || (n('R') === count[p.id][0] && n('L') === count[p.id][1]);
      ok('répertoire ' + p.id + ' : ' + n('R') + ' + ' + n('L') + ' notes, fin sur la barre, doigtés', ok2 && Math.abs(Math.max(end('R'), end('L')) - p.measures * p.num) < 1e-6 && p.notes.every(x => x.f >= 1 && x.f <= 5) && p.lvl >= 1,
        `${p.measures} mes., MD finit à ${end('R')}, MG à ${end('L')}`);
    }

    // ---------- 7 ter. doigtés calculés pour les imports ----------
    const asImport = (p, id) => ({ id, title: p.title, sub: '', bpm: p.bpm, num: p.num, hands: 'B', pct: 100, src: '', key: p.key,
      data: build(p).notes.map(n => [n.midi, n.on, n.dur, n.hand === 'R' ? 1 : 0]) });
    // les 12 gammes majeures, montée puis descente, contre le doigté qu'on enseigne (« ? » = libre ; le doigt de chaque note se garde à la descente)
    const STD = { Do: [60, '1231234', '5432132'], Sol: [55, '1231234', '5432132'], 'Ré': [62, '1231234', '5432132'], La: [57, '1231234', '5432132'], Mi: [64, '1231234', '5432132'],
      Si: [59, '1231234', '4321432'], Fa: [53, '1234123', '5432132'], 'Si♭': [58, '4123123', '3214321'], 'Mi♭': [63, '3123412', '3214321'], 'La♭': [56, '3412312', '3214321'],
      'Ré♭': [61, '2312341', '3214321'], 'Fa♯': [54, '2341231', '4321321'] };
    const TOP = { R: { Do: 5, Sol: 5, 'Ré': 5, La: 5, Mi: 5, Si: 5, Fa: 4 }, L: {} }; // dernier doigt en haut (sinon celui du motif)
    const scaleFing = octs => {
      const res = {};
      for (const [name, [root, rp, lp]] of Object.entries(STD)) {
        const ms = []; for (let o = 0; o < octs; o++) for (const s of [0, 2, 4, 5, 7, 9, 11]) ms.push(root + 12 * o + s); ms.push(root + 12 * octs);
        const seq = ms.concat(ms.slice(0, -1).reverse());
        const want = (pat, h) => {
          const up = ms.map((_, i) => i === ms.length - 1 ? (TOP[h][name] || (h === 'L' ? '?' : +pat[0])) : i % 7 === 0 && i ? (h === 'L' ? 1 : +pat[0]) : +pat[i % 7]);
          if (h === 'L' && ['Si♭', 'Mi♭', 'La♭', 'Ré♭', 'Fa♯'].includes(name)) for (let i = 7; i < up.length - 1; i += 7) up[i] = +pat[0];
          return up.concat(up.slice(0, -1).reverse());
        };
        const pc2 = build({ id: 'g' + octs + name, title: '', sub: '', bpm: 80, num: 4, hands: 'B', pct: 100, src: '',
          data: seq.map((m, i) => [m, i / 2, 0.5, 1]).concat(seq.map((m, i) => [m - 12 * octs - 12, 40 + i / 2, 0.5, 0])) });
        for (const [h, pat] of [['R', rp], ['L', lp]]) {
          const got = pc2.notes.filter(n => n.hand === h).map(n => n.f), w = want(pat, h);
          res[name + ' ' + (h === 'R' ? 'MD' : 'MG')] = w.every((c, i) => c === '?' || c === got[i]) ? '' : got.join('');
        }
      }
      return res;
    };
    const one = scaleFing(1), two = scaleFing(2), bad = r => Object.keys(r).filter(k => r[k]);
    ok('doigtés calculés, gammes sur une octave : 22 / 24 standard (écarts admis : Si MG, Fa♯ MD)', bad(one).join() === 'Si MG,Fa♯ MD', `${24 - bad(one).length} / 24 · ` + bad(one).map(k => k + ' ' + one[k]).join(' · '));
    const flats = ['Si♭', 'Mi♭', 'La♭', 'Ré♭'].flatMap(n => [n + ' MD', n + ' MG']);
    ok('doigtés calculés, deux octaves : gammes à bémols justes aux deux mains, MD juste sauf Fa♯', flats.every(k => !two[k]) && bad(two).filter(k => k.endsWith('MD')).join() === 'Fa♯ MD',
      `${24 - bad(two).length} / 24 · à part : ` + bad(two).join(', '));
    const brod = build({ id: 'test-brod', title: '', sub: '', bpm: 80, num: 6, hands: 'B', pct: 100, src: '', key: -1,
      data: [[50, 0, 3, 0], [38, 3, 3, 0], [45, 6, 1.5, 0], [46, 7.5, 1.5, 0], [45, 9, 1.5, 0], [43, 10.5, 1.5, 0], [57, 0, 2, 1], [62, 0, 2, 1], [65, 0, 2, 1], [57, 6, 2, 1], [61, 6, 2, 1], [64, 6, 2, 1], [57, 12, 2, 1], [62, 12, 2, 1], [65, 12, 2, 1]] });
    const bf = brod.notes.filter(n => n.hand === 'L').map(n => n.f).join(''), cfg = on => brod.notes.filter(n => n.hand === 'R' && n.on === on).map(n => n.f).join('');
    ok('doigtés calculés : broderie MG La-Si♭-La en 2-1-2 (Sarabande mes. 2), accord repris avec les mêmes doigts', bf.slice(2, 5) === '212' && cfg(0) === cfg(12), `MG ${bf} · La-Ré-Fa ${cfg(0)} puis ${cfg(12)}`);
    const doScale = build(asImport(SCALES[0], 'test-do'));
    ok('doigtés calculés : passages du pouce marqués comme changements de position', doScale.notes.filter(n => n.hand === 'R' && n.ch).length >= 3);
    const chords = build({ id: 'test-ch', title: '', sub: '', bpm: 90, num: 4, hands: 'B', pct: 100, src: '', key: 0,
      data: [[60, 0, 1, 1], [64, 0, 1, 1], [67, 0, 1, 1], [60, 1, 1, 1], [72, 1, 1, 1], [48, 0, 1, 0], [52, 0, 1, 0], [55, 0, 1, 0]] });
    const cf = (h, on) => chords.notes.filter(n => n.hand === h && n.on === on).sort((a, b) => a.midi - b.midi).map(n => n.f).join('');
    ok('doigtés calculés : accords Do-Mi-Sol MD 135, MG 531, octave 15', cf('R', 0) === '135' && cf('L', 0) === '531' && cf('R', 1) === '15', `${cf('R', 0)} · ${cf('L', 0)} · ${cf('R', 1)}`);
    // Sarabande mes. 1-3 et 14-16 (MD), recopiées ici pour que le contrôle tourne aussi sans le fichier perso
    const sara = (id, data) => build({ id, title: '', sub: '', bpm: 80, num: 6, hands: 'B', pct: 100, src: '', key: -1, data });
    const s1 = sara('test-sara1', [[57, 0, 2, 1], [62, 0, 2, 1], [65, 0, 2, 1], [57, 2, 2, 1], [62, 2, 2, 1], [65, 2, 2, 1], [64, 5, 1, 1], [67, 5, 1, 1],
      [57, 6, 2, 1], [61, 6, 2, 1], [64, 6, 2, 1], [57, 8, 2, 1], [61, 8, 2, 1], [64, 8, 2, 1], [60, 12, 2, 1], [65, 12, 2, 1], [69, 12, 2, 1]]);
    const s1f = on => s1.notes.filter(n => n.on === on).sort((a, b) => a.midi - b.midi).map(n => n.f).join('');
    ok('doigtés calculés : La-Do♯-Mi en 1-2-4 après Mi-Sol en 3-5 (Sarabande mes. 2), plus 1-2-3', s1f(6) === '124' && s1f(8) === '124', `${s1f(0)} · ${s1f(5)} · ${s1f(6)} · ${s1f(12)}`);
    const s14 = sara('test-sara14', [[60, 0, 3, 1], [65, 0, 3, 1], [69, 0, 3, 1], [69, 3, 1, 1], [74, 4, 1, 1], [73, 5, 1, 1], [74, 6, 1, 1], [76, 7, 1, 1], [77, 8, 2, 1],
      [76, 10, 1, 1], [74, 11, 1, 1], [65, 12, 6, 1], [69, 12, 6, 1], [74, 12, 6, 1]]);
    const s14f = s14.notes.filter(n => n.on >= 3 && n.on < 12).map(n => n.f).join('');
    ok('doigtés calculés : La Ré Do♯ | Ré Mi Fa Mi Ré dans une seule position, 1-3-2 | 3-4-5-4-3 (Sarabande mes. 14-15)', s14f === '13234543', s14f);
    const schu = PIECES.find(x => x.id === 'schumann-melodie');
    for (const [p, src] of [[pc, null], [asImport(menuet, 'test-menuet'), menuet], [asImport(schu, 'test-schumann'), schu]]) {
      build(p);
      const same = src ? p.notes.filter((n, i) => src.notes[i].f === n.f).length : 0;
      ok('import ' + p.id + ' : doigté 1 à 5 sur ses ' + p.notes.length + ' notes', p.notes.every(n => n.f >= 1 && n.f <= 5 && Number.isInteger(n.f)) && p.notes.some(n => n.ch),
        src ? `${Math.round(same * 100 / p.notes.length)} % comme le doigté écrit à la main` : undefined);
    }
    try {
      const r0 = await fetch('perso/Sarabande_Haendel_HWV437_8notes.mid');
      if (r0.ok) {
        const sb = build(fromMidi('Sarabande.mid', parseMidi(await r0.arrayBuffer())));
        const sf = on => sb.notes.filter(n => n.hand === 'R' && n.on === on).sort((a, b) => a.midi - b.midi).map(n => n.f).join('');
        ok('import Sarabande (fichier perso) : doigté 1 à 5 sur ses ' + sb.notes.length + ' notes, mes. 2 en 1-2-4, mes. 14 le La au pouce', sb.notes.every(n => n.f >= 1 && n.f <= 5) && sf(6) === '124' && sf(81) === '1',
          `mes. 2 ${sf(6)} · mes. 14 La ${sf(81)}`);
      }
    } catch (e) { /* fichier perso absent en ligne */ }

    // ---------- 7 quater. correction d'un doigté par appui long ----------
    SET.view = 'score'; SET.fing = 'all'; SET.kbd = true; openPiece(menuet); P.hands = 'R'; P.mode = 'wait'; restart();
    for (let g = 0; g < 600 && !P.wait; g++) P.step(1 / 60);
    draw();
    const dig = HITS.filter(h => h.pri === 2).sort((a, b) => a.x0 - b.x0)[0], cr = cv.getBoundingClientRect();
    if (!dig) ok('appui long : un chiffre touchable sur la partition', false);
    else {
      const tn = dig.n, f0 = tn.f, f2 = f0 === 3 ? 2 : 3, cx = cr.left + (dig.x0 + dig.x1) / 2, cy = cr.top + (dig.y0 + dig.y1) / 2;
      cv.dispatchEvent(new PointerEvent('pointerdown', { clientX: cx, clientY: cy, pointerId: 77, bubbles: true }));
      const t0p = performance.now(); while ($('#p-fpick').hidden && performance.now() - t0p < 5000) await new Promise(res => setTimeout(res, 50));
      ok('appui long : le choix du doigt s\'ouvre sur ' + tn.fr + ' (doigt ' + f0 + ')', !$('#p-fpick').hidden && $('#p-fpick .on') && +$('#p-fpick .on').dataset.f === f0, Math.round(performance.now() - t0p) + ' ms');
      cv.dispatchEvent(new PointerEvent('pointerup', { clientX: cx, clientY: cy, pointerId: 77, bubbles: true }));
      $(`#p-fpick [data-f="${f2}"]`).click();
      ok('appui long : doigt ' + f2 + ' gardé (localStorage legato-fing-menuet)', $('#p-fpick').hidden && tn.f === f2 && LS.get('fing-menuet', {})[tn.i] === f2);
      openPiece(menuet);
      ok('appui long : correction reprise à la réouverture du morceau', P.notes[tn.i].f === f2 && menuet.notes[tn.i].f === f0);
      openPicker(P.notes[tn.i], 100, 100); $('#p-fpick [data-f="0"]').click();
      ok('appui long : « Auto » rend le doigté écrit', P.notes[tn.i].f === f0 && !(tn.i in LS.get('fing-menuet', {})));
    }
    openPiece(pc); P.mode = 'tempo'; restart(); P.running = true;
    for (let g = 0; g < 2000 && P.t < -0.5; g++) P.step(1 / 60);
    draw();
    const kh = HITS.find(h => h.pri >= 1.5 && h.pri < 2);
    if (kh) {
      openPicker(kh.n, 50, 50);
      const paused = !P.running;
      $('#p-fpick [data-f="5"]').click();
      ok('appui long sur une touche : le mode tempo s\'arrête pendant le choix, reprend après', paused && P.running);
      openPiece(pc);
      ok('appui long sur une touche (import) : correction gardée', P.notes[kh.n.i].f === 5);
    } else ok('appui long : une touche touchable au début de l\'import', false);

    // ---------- 7 quinquies. latence : calibrage simulé à 40 ms, puis bilan corrigé ----------
    show('diag'); calStart(); clearTimeout(CAL.timer);
    seed = 11;
    CAL.clicks.forEach((c, i) => {
      if (i === 9) return;                                    // un clic sans note
      const v = i === 6 ? 230 : i === 12 ? -160 : 40 + (rnd() * 16 - 8); // deux appuis aberrants
      calPress(c + v); if (i === 7) calPress(c + v + 30);    // un doublé ignoré
    });
    const cal = calFinish();
    ok('latence : 40 ms simulés mesurés à ± 5 ms, aberrants écartés', Math.abs(SET.latency - 40) <= 5 && cal.out === 2 && cal.n === 9, `${SET.latency} ms, ${cal.n} appuis gardés, ${cal.out} écartés`);
    ok('latence : affichée dans le diagnostic', $('#c-val').textContent === SET.latency + ' ms');
    const measured = SET.latency, bilan = lat0 => {
      SET.latency = lat0; openPiece(menuet); P.hands = 'R'; P.mode = 'tempo'; P.pct = 70; restart(); P.running = true; MIDI.recent = {};
      const sp2 = 60 / P.bpm, pl = P.notes.filter(n => n.st === 'pend' && P.req(n)).map(n => ({ n, at: n.on + 0.04 / sp2, done: false }));
      let g = 0; while (!P.done && g++ < 200000) { P.step(1 / 240); for (const p of pl) if (!p.done && P.t >= p.at) { p.done = true; key(p.n.midi); rel(p.n.midi); } }
      const rr = P.result(), b = rr.dts.reduce((a, x) => a + x, 0) / rr.dts.length; return { b, acc: rr.acc, txt: $('#p-resbox').textContent };
    };
    const raw = bilan(0), fixd = bilan(measured);
    ok('latence : sans correction, 40 ms de retard = « plutôt en retard »', raw.acc === 100 && raw.b > 30 && /plutôt en retard/.test(raw.txt), `+${raw.b.toFixed(1)} ms`);
    ok('latence : corrigée, « bien en place » et la latence est dite', fixd.acc === 100 && Math.abs(fixd.b) < 8 && /bien en place/.test(fixd.txt) && /latence de \d+ ms déduite/.test(fixd.txt), `${fixd.b.toFixed(1)} ms`);
    $('#p-res').hidden = true; SET.latency = 0; CAL.last = '';

    // ---------- 7 sexies. se déplacer : barre des mesures, ⏮ ⏭, glisser, flèches, mode gardé ----------
    {
      SET.view = 'score'; openPiece(menuet); P.hands = 'R'; P.mode = 'wait'; P.pct = 70; P.loop = false; restart(); MIDI.recent = {};
      const num = P.pc.num, N = P.pc.measures, cells = $('#p-bars').children;
      ok('navigation : une case par mesure, mesure 1 en cours', cells.length === N && cells[0].classList.contains('cur') && $('#p-pos').textContent === '1 / ' + N);
      const playGroups = k => { let g = 0, gu = 0; while (!P.done && g < k && gu++ < 20000) { P.step(1 / 60); if (P.wait) { g++; const ms = P.wait.grp.map(n => n.midi); ms.forEach(m => key(m)); ms.forEach(m => rel(m)); MIDI.recent = {}; } } };
      playGroups(3);
      goMeasure(5);
      const before = P.notes.filter(n => P.req(n) && n.on < 4 * num), after = P.notes.filter(n => P.req(n) && n.on >= 4 * num);
      ok('aller à la mes. 5 : les notes d\'avant non jouées sont sautées, les 3 jouées gardées', before.filter(n => n.st === 'ok').length === 3 && before.every(n => n.st === 'ok' || n.st === 'skip') && after.every(n => n.st === 'pend') && P.cue === 4 * num);
      draw(); ok('aller à la mes. 5 : case 5 en cours, 1 à 4 sans marque d\'erreur', cells[4].classList.contains('cur') && $('#p-pos').textContent === '5 / ' + N && ![...cells].slice(0, 4).some(c => c.classList.contains('bad')));
      for (let g = 0; g < 200 && !P.wait; g++) P.step(1 / 60);
      ok('aller à la mes. 5 : le mode attente attend la 1re note de la mes. 5', P.wait && Math.abs(P.wait.on - 4 * num) < 1e-6);
      navStep(-1);
      ok('⏮ au début d\'une mesure : mesure d\'avant (4)', P.cue === 3 * num && P.running);
      for (let g = 0; g < 200 && !P.wait; g++) P.step(1 / 60);
      const ms0 = P.wait.grp.map(n => n.midi); ms0.forEach(m => key(m)); ms0.forEach(m => rel(m)); MIDI.recent = {};
      for (let g = 0; g < 200 && !P.wait; g++) P.step(1 / 60);
      const inside = P.t - 3 * num;
      navStep(-1);
      ok('⏮ au milieu d\'une mesure : retour à son début (4), la note jouée est à rejouer', inside > 0.5 && P.cue === 3 * num && P.notes.filter(n => P.req(n) && n.on >= 3 * num).every(n => n.st === 'pend'), `on était ${inside.toFixed(2)} temps dans la mes.`);
      navStep(1); navStep(1);
      ok('⏭ deux fois : mes. 6', P.cue === 5 * num);
      document.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowLeft', bubbles: true }));
      ok('flèche ← : mes. 5', P.cue === 4 * num);
      playGroups(1000);
      const rr = P.result(), want = P.notes.filter(n => P.req(n) && n.on >= 4 * num).length + 3;
      ok('bilan après un saut : les notes sautées ne comptent pas', P.done && rr.tot === want && rr.acc === 100, `${rr.ok}/${rr.tot}`);
      // barre des mesures : toucher, glisser

      const pe = (type, m, id = 41) => { const b = $('#p-bars').getBoundingClientRect(); $('#p-bars').dispatchEvent(new PointerEvent(type, { clientX: b.left + (m - 0.5) * b.width / N, clientY: b.top + b.height / 2, pointerId: id, bubbles: true })); };
      pe('pointerdown', 9); pe('pointerup', 9);
      ok('barre : toucher la mes. 9 après le bilan relance l\'attente à la mes. 9', !P.done && P.running && P.cue === 8 * num && $('#p-res').hidden);
      pe('pointerdown', 3); pe('pointermove', 4); pe('pointermove', 6); pe('pointerup', 6);
      ok('barre : glisser de 3 à 6 boucle mes. 3-6', P.loop && P.m0 === 3 && P.m1 === 6 && P.cue === 2 * num && !$('#p-rng').hidden && /⟳ mes\. 3-6/.test($('#p-rng').textContent) && $('#p-loop').checked && $('#p-m0').value === '3' && $('#p-m1').value === '6');
      ok('barre : cases 3 à 6 dans le passage, les autres estompées', [...cells].every((c, i) => c.classList.contains('in') === (i >= 2 && i <= 5)));
      navStep(-1); navStep(-1);
      ok('⏮ ne sort pas du passage bouclé', P.cue === 2 * num && P.m0 === 3);
      pe('pointerdown', 12); pe('pointerup', 12);
      ok('barre : une mesure hors du passage rend le morceau entier', !P.loop && P.m0 === 1 && P.m1 === N && P.cue === 11 * num && $('#p-rng').hidden);
      pe('pointerdown', 2); pe('pointermove', 5); pe('pointerup', 5); $('#p-rng').click();
      ok('pastille « mes. 2-5 ✕ » : retour au morceau entier', !P.loop && P.m0 === 1 && P.m1 === N);
      // mode tempo : décompte d'une mesure avant le point d'arrivée
      P.mode = 'tempo'; restart(); P.running = true; METRO.log.length = 0;
      for (let g = 0; g < 400 && P.t < P.t0 + 2; g++) { P.step(1 / 60); metroRun(); }
      goMeasure(7);
      ok('tempo : sauter en jouant = une mesure de décompte avant la mes. 7', P.running && P.cue === 6 * num && P.t < 6 * num - num + 1e-6);
      METRO.log.length = 0;
      for (let g = 0; g < 600 && P.t < P.cue; g++) { P.step(1 / 60); metroRun(); }
      const cnt = METRO.log.filter(c => c.b >= 5 * num && c.b < 6 * num).length;
      ok('tempo : le décompte clique une fois par temps', cnt === num && METRO.log.every(c => c.b >= 5 * num), `${cnt} clics`);
      const skipped = P.notes.filter(n => n.on < 6 * num && n.on >= 5 * num && n.st === 'auto').length;
      ok('tempo : rien n\'est joué pendant le décompte', skipped === 0);
      P.running = false; goMeasure(3); syncBar();
      ok('tempo à l\'arrêt : on reste arrêté, « Lancer à la mes. 3 »', !P.running && !$('#p-start').hidden && /Lancer à la mes\. 3/.test($('#p-go').textContent));
      // changer de mode garde la mesure
      $('#p-mode').click();
      ok('changer de mode (tempo → démo) garde la mes. 3', P.mode === 'demo' && P.cue === 2 * num && P.running);
      $('#p-hands').querySelector('[data-h="B"]').click();
      ok('changer de main garde la mes. 3', P.hands === 'B' && P.cue === 2 * num);
      // glisser la partition : 4 temps vers la gauche = 4 temps plus loin, en pause, puis on repart de là
      P.mode = 'wait'; restart(); layout(); draw();
      const cr = cv.getBoundingClientRect(), sx = cr.left + KB.W * 0.6, sy = cr.top + KB.hitY * 0.5, t0s = P.t;
      const ce = (type, dx) => cv.dispatchEvent(new PointerEvent(type, { clientX: sx + dx, clientY: sy, pointerId: 52, bubbles: true }));
      ce('pointerdown', 0); ce('pointermove', -SC.ppb * 2); const mid = { run: P.running, t: P.t };
      ce('pointermove', -SC.ppb * 5); draw();
      ok('glisser la partition : le morceau suit le doigt, en pause', !mid.run && Math.abs(P.t - (t0s + 5)) < 0.01, `${t0s.toFixed(2)} → ${P.t.toFixed(2)}`);
      ce('pointerup', -SC.ppb * 5);
      ok('glisser la partition : au relâché, on repart du temps le plus proche', P.running && P.cue === Math.round(t0s + 5) && $('#p-fpick').hidden);
      SET.view = 'fall'; layout(); draw(); const t1s = P.t;
      ce('pointerdown', 0);
      cv.dispatchEvent(new PointerEvent('pointermove', { clientX: sx, clientY: sy - fallPPB() * 3, pointerId: 52, bubbles: true }));
      ok('glisser les notes qui tombent vers le haut : retour en arrière', Math.abs(P.t - (t1s - 3)) < 0.01, `${t1s.toFixed(2)} → ${P.t.toFixed(2)}`);
      cv.dispatchEvent(new PointerEvent('pointerup', { clientX: sx, clientY: sy - fallPPB() * 3, pointerId: 52, bubbles: true }));
      ok('glisser : au relâché, reprise (bornée au début du passage)', P.running && P.cue === Math.max(0, Math.round(t1s - 3)));
      SET.view = 'score';
    }

    // ---------- 7 septies. import MusicXML : anacrouse, liaison, accord, 2 portées, doigtés écrits, reprise 1re / 2e fois, .mxl ----------
    {
      const N = (s, o, d, st, x = '') => `<note><pitch><step>${s[0]}</step>${s[1] === '#' ? '<alter>1</alter>' : ''}<octave>${o}</octave></pitch><duration>${d}</duration>${x}<staff>${st}</staff></note>`;
      const F = f => `<notations><technical><fingering>${f}</fingering></technical></notations>`;
      const xml = `<?xml version="1.0" encoding="UTF-8"?><score-partwise version="4.0"><work><work-title>Essai</work-title></work><identification><creator type="composer">Moi</creator></identification>
        <part-list><score-part id="P1"><part-name>Piano</part-name></score-part><score-part id="P2"><part-name>Voix</part-name></score-part></part-list>
        <part id="P1">
        <measure number="0" implicit="yes"><attributes><divisions>2</divisions><key><fifths>1</fifths></key><time><beats>3</beats><beat-type>4</beat-type></time><staves>2</staves><clef number="1"><sign>G</sign></clef><clef number="2"><sign>F</sign></clef></attributes>
          <direction><sound tempo="96"/></direction>${N('D', 5, 2, 1, F(5)).replace('</duration>', '</duration>')}</measure>
        <measure number="1"><barline location="left"><repeat direction="forward"/></barline>${N('G', 4, 4, 1, '<tie type="start"/>' + F(1))}${N('G', 4, 2, 1, '<tie type="stop"/>')}<backup><duration>6</duration></backup>${N('G', 2, 6, 2)}${N('D', 3, 6, 2).replace('<note>', '<note><chord/>')}</measure>
        <measure number="2"><barline location="left"><ending number="1" type="start"/></barline>${N('F#', 4, 6, 1)}<barline location="right"><ending number="1" type="stop"/><repeat direction="backward"/></barline></measure>
        <measure number="3"><barline location="left"><ending number="2" type="start"/></barline>${N('A', 4, 6, 1)}<barline location="right"><ending number="2" type="discontinue"/></barline></measure>
        <measure number="4"><note><rest/><duration>2</duration><staff>1</staff></note>${N('B', 4, 4, 1)}</measure>
        </part><part id="P2"><measure number="0">${N('C', 6, 2, 1)}</measure></part></score-partwise>`;
      const pcx = parseMusicXml(xml, 'essai.musicxml'); build(pcx);
      const sig = pcx.notes.map(n => (n.hand === 'R' ? 'D' : 'G') + n.midi + '@' + n.on + '/' + n.dur).join(' ');
      ok('MusicXML : titre, compositeur, 96 bpm, 3/4, armure Sol, partie de voix ignorée', pcx.title === 'Essai' && /^Moi · /.test(pcx.sub) && pcx.bpm === 96 && pcx.num === 3 && pcx.tn === 3 && pcx.td === 4 && pcx.key === 1 && pcx.warn.join() === '1 autre partie ignorée');
      ok('MusicXML : anacrouse calée, liaison fondue, accord MG, reprise dépliée (1re fois puis 2e fois), silence', sig === 'D74@2/1 G43@3/3 G50@3/3 D67@3/3 D66@6/3 G43@9/3 G50@9/3 D67@9/3 D69@12/3 D71@16/2' && pcx.measures === 6, sig);
      ok('MusicXML : doigtés écrits gardés (Ré 5, Sol 1 aux deux passages), le reste calculé', pcx.notes.filter(n => n.fx).length === 3 && pcx.notes.filter(n => n.fx).every(n => n.f === n.fx) && pcx.notes.every(n => n.f >= 1 && n.f <= 5) && /3 doigtés écrits/.test(pcx.sub));
      // .mxl : zip (stocké, sans compression) avec META-INF/container.xml
      const enc = new TextEncoder(), files = { 'META-INF/container.xml': '<container><rootfiles><rootfile full-path="score/essai.xml"/></rootfiles></container>', 'score/essai.xml': xml };
      const chunks = [], cen = []; let zoff = 0;
      for (const [nm, str] of Object.entries(files)) {
        const nb = enc.encode(nm), db = enc.encode(str), lh = new DataView(new ArrayBuffer(30)), ch = new DataView(new ArrayBuffer(46));
        lh.setUint32(0, 0x04034b50, true); lh.setUint32(18, db.length, true); lh.setUint32(22, db.length, true); lh.setUint16(26, nb.length, true);
        ch.setUint32(0, 0x02014b50, true); ch.setUint32(20, db.length, true); ch.setUint32(24, db.length, true); ch.setUint16(28, nb.length, true); ch.setUint32(42, zoff, true);
        chunks.push(new Uint8Array(lh.buffer), nb, db); cen.push(new Uint8Array(ch.buffer), nb); zoff += 30 + nb.length + db.length;
      }
      const eocd = new DataView(new ArrayBuffer(22)); eocd.setUint32(0, 0x06054b50, true); eocd.setUint16(8, 2, true); eocd.setUint16(10, 2, true); eocd.setUint32(12, cen.reduce((s, a) => s + a.length, 0), true); eocd.setUint32(16, zoff, true);
      const pmx = await importFile(new File([...chunks, ...cen, new Uint8Array(eocd.buffer)], 'essai.mxl')); build(pmx);
      ok('MusicXML : .mxl (zip) lu par son container.xml', pmx.notes.map(n => n.midi + '@' + n.on).join() === pcx.notes.map(n => n.midi + '@' + n.on).join());
      let bad = ''; try { await importFile(new File(['bonjour'], 'x.txt')); } catch (e) { bad = e.message; }
      ok('import : format inconnu refusé avec un message', /Format non reconnu/.test(bad));
      // jouable de bout en bout, deux mains, dans les deux vues
      SET.view = 'score'; openPiece(pcx); P.hands = 'B'; P.mode = 'wait'; restart(); MIDI.recent = {};
      let g = 0, gu = 0, de = 0;
      while (!P.done && gu++ < 20000) { P.step(1 / 60); try { draw(); } catch (e) { de++; } if (P.wait) { g++; const ms = P.wait.grp.map(n => n.midi); ms.forEach(m => key(m)); ms.forEach(m => rel(m)); MIDI.recent = {}; } }
      const rx = P.result();
      ok('MusicXML : joué en entier en attente, deux mains, sans erreur de dessin', P.done && rx.acc === 100 && rx.tot === 10 && g === 6 && de === 0, `${g} groupes, ${rx.ok}/${rx.tot}`);
      $('#p-res').hidden = true;
    }

    // ---------- 7 octies. lecture : niveaux, places, réponses, octave, tirage pondéré, fin de série ----------
    {
      const rsBefore = JSON.stringify(RS), rdBefore = { clef: RD.clef, lvl: RD.lvl, names: RD.names };
      for (const k in RS) delete RS[k];
      const mids = (c, l) => rdPool(c, l).map(i => i.midi).join(' ');
      ok('lecture : repères clé de fa = les deux Do, Sol 1re ligne, Fa 4e ligne', mids('F', 0) === '36 43 53 60', mids('F', 0));
      ok('lecture : repères clé de sol = Do central, Sol 2e ligne, Do 3e interligne, Sol au-dessus', mids('G', 0) === '60 67 72 79', mids('G', 0));
      ok('lecture : lignes de la clé de fa Sol Si Ré Fa La', mids('F', 1) === '43 47 50 53 57' && rdPool('F', 1).map(i => i.name).join() === 'Sol,Si,Ré,Fa,La');
      ok('lecture : places nommées sans numéro d\'octave', rdPlace(1, 45) === '1er interligne' && rdPlace(0, 43) === '1re ligne' && rdPlace(-2, 40) === '1re ligne supplémentaire en dessous' && rdPlace(-3, 38) === 'sous la 1re ligne supplémentaire'
        && rdPlace(10, 60) === '1re ligne supplémentaire au-dessus, do central' && rdPlace(-1, 41) === 'sous la portée' && rdPlace(6, 53) === '4e ligne');
      const alt = rdPool('F', 5).map(i => i.name);
      ok('lecture : niveau altérations avec Fa♯ et Si♭, sans Mi♯ / Si♯ / Do♭ / Fa♭', alt.includes('Fa♯') && alt.includes('Si♭') && !alt.some(n => /Mi♯|Si♯|Do♭|Fa♭/.test(n)) && rdPool('F', 5).every(i => i.midi === stepMidi(i.step) + i.alt), alt.length + ' notes');
      RD.clef = 'F'; RD.lvl = 1; RD.names = false; show('read');
      ok('lecture : la carte d\'accueil ouvre la vue, série de 40, note entourée', view === 'read' && !$('#v-read').hidden && $('#r-count').textContent === '1 / 40' && /<circle/.test($('#r-staff').innerHTML));
      const c0 = RD.cur; noteOn(c0.midi + 2, 80, 'kbd'); noteOff(c0.midi + 2);
      ok('lecture : fausse note = erreur notée, la bonne touche s\'allume, on attend la bonne', RD.cur === c0 && RD.miss && RS[c0.k].h.join() === '0' && RD.hint && /cherche/.test($('#r-fb').textContent) && $('#r-keys').innerHTML.includes('#e2c574'));
      noteOn(c0.midi, 80, 'kbd'); noteOff(c0.midi);
      ok('lecture : la bonne note fait avancer, sans compter au premier coup', RD.n === 1 && RD.first === 0 && RD.cur !== c0 && /✓/.test($('#r-fb').textContent));
      const c1 = RD.cur; rdInput(c1.midi - 12);
      ok('lecture : une octave à côté = « bonne note, mauvaise octave »', /mauvaise octave/.test($('#r-fb').textContent) && /plus aigu/.test($('#r-fb').textContent));
      rdInput(c1.midi);
      // tirage : une note toujours ratée revient bien plus souvent
      for (const it of rdPool('F', 1)) RS[it.k] = { h: [1, 1, 1, 1, 1], t: [800, 800, 800, 800, 800] };
      RS.F22 = { h: [0, 0, 0, 1, 0], t: [3000, 2800, 3100, 1200, 2900] };
      const cnt = {}; for (let i = 0; i < 3000; i++) { const p = rdPick([]); cnt[p.name] = (cnt[p.name] || 0) + 1; }
      ok('lecture : Ré (3e ligne) ratée et lente tirée bien plus souvent (répétition espacée)', cnt['Ré'] > 3 * cnt['Sol'], JSON.stringify(cnt));
      rdRender();
      ok('lecture : notes à revoir = Ré 3e ligne, 20 %', rdWeak('F', 1).length === 1 && rdWeak('F', 1)[0].k === 'F22' && /Ré3e ligne20 %/.test($('#r-weak').textContent), $('#r-weak').textContent);
      // fin de série : tout juste du premier coup
      rdStart(); for (let i = 0; i < 40; i++) rdInput(RD.cur.midi);
      ok('lecture : 40 notes justes = série finie, 100 %, niveau suivant proposé', RD.done && RD.first === 40 && !$('#r-res').hidden && /100 %/.test($('#r-resbox').textContent) && $('#rr-next') && rdPassed('F', 1));
      $('#rr-next').click();
      ok('lecture : « Niveau suivant » passe aux interlignes et repart', RD.lvl === 2 && !RD.done && RD.n === 0 && $('#r-lvl').value === '2' && /✓ 2\. Les lignes/.test($('#r-lvl').innerHTML));
      RD.clef = 'G'; RD.names = true; rdSync(); rdStart();
      ok('lecture : clé de sol et noms affichés', /Lecture · clé de sol/.test($('#r-title').textContent) && $('#r-staff').innerHTML.includes('>' + RD.cur.name + '<'));
      show('home');
      ok('lecture : carte d\'accueil à jour (clé, niveau)', /clé de sol · niveau 3/.test($('#h-read-n').textContent) && /<ellipse/.test($('#h-read').innerHTML));
      for (const k in RS) delete RS[k]; Object.assign(RS, JSON.parse(rsBefore)); Object.assign(RD, rdBefore, { done: true }); rdSave();
    }

    // ---------- 7 nonies. catalogue : zip (index.json + mxl) ouvert depuis un fichier, gardé, recherche, ajout ----------
    {
      const enc = new TextEncoder(), zipOf = files => {
        const chunks = [], cen = []; let off = 0;
        for (const [nm, v] of Object.entries(files)) {
          const nb = enc.encode(nm), db = typeof v === 'string' ? enc.encode(v) : v, lh = new DataView(new ArrayBuffer(30)), ch = new DataView(new ArrayBuffer(46));
          lh.setUint32(0, 0x04034b50, true); lh.setUint32(18, db.length, true); lh.setUint32(22, db.length, true); lh.setUint16(26, nb.length, true);
          ch.setUint32(0, 0x02014b50, true); ch.setUint32(20, db.length, true); ch.setUint32(24, db.length, true); ch.setUint16(28, nb.length, true); ch.setUint32(42, off, true);
          chunks.push(new Uint8Array(lh.buffer), nb, db); cen.push(new Uint8Array(ch.buffer), nb); off += 30 + nb.length + db.length;
        }
        const e = new DataView(new ArrayBuffer(22)), n = Object.keys(files).length; e.setUint32(0, 0x06054b50, true); e.setUint16(8, n, true); e.setUint16(10, n, true); e.setUint32(12, cen.reduce((s, a) => s + a.length, 0), true); e.setUint32(16, off, true);
        return new Blob([...chunks, ...cen, new Uint8Array(e.buffer)]);
      };
      const note = (s, o, f) => `<note><pitch><step>${s}</step><octave>${o}</octave></pitch><duration>1</duration><staff>1</staff>${f ? `<notations><technical><fingering>${f}</fingering></technical></notations>` : ''}</note>`;
      const sx = `<score-partwise><part-list><score-part id="P1"/></part-list><part id="P1"><measure number="1"><attributes><divisions>1</divisions><time><beats>4</beats><beat-type>4</beat-type></time></attributes>${note('C', 5, 1)}${note('D', 5)}${note('E', 5)}${note('F', 5)}</measure></part></score-partwise>`;
      const mxl = new Uint8Array(await zipOf({ 'META-INF/container.xml': '<container><rootfiles><rootfile full-path="s.xml"/></rootfiles></container>', 's.xml': sx }).arrayBuffer());
      const idx = { v: 1, n: 2, src: 'essai', items: [['abc123', 'Petit essai', 'Moi', 1, 1, 4, 1, 45, 'CC0'], ['def456', 'Grande fugue', 'Quelqu’un', 3, 1, 4, 0, 0, 'PD']] };
      const catBlob = zipOf({ 'index.json': JSON.stringify(idx), 'mxl/abc123.mxl': mxl, 'mxl/def456.mxl': mxl });
      const keptBefore = await idbGet('catalogue').catch(() => undefined), catBefore = { blob: CAT.blob, files: CAT.files, idx: CAT.idx };
      try {
        Object.assign(CAT, { blob: null, files: null, idx: null, lvl: 0, fing: false }); $('#k-q').value = ''; $('#k-fing').checked = false;
        show('cat');
        await new Promise(r => setTimeout(r, 50));
        const dt = new DataTransfer(); dt.items.add(new File([catBlob], 'legato-catalogue.zip')); $('#f-cat').files = dt.files; $('#f-cat').dispatchEvent(new Event('change'));
        for (let i = 0; i < 50 && !/gardé/.test($('#k-msg').textContent); i++) await new Promise(r => setTimeout(r, 40));
        const stored = await idbGet('catalogue');
        ok('catalogue : ouvert depuis un fichier, gardé dans l\'appli (IndexedDB)', CAT.idx && CAT.idx.items.length === 2 && stored && stored.size === catBlob.size && $('#k-list').querySelectorAll('[data-cat]').length === 2 && /2 morceaux/.test($('#k-info').textContent));
        $('#k-q').value = 'ESSAI pétit'; catRender();
        ok('catalogue : recherche sans accents ni majuscules', [...$('#k-list').querySelectorAll('[data-cat]')].map(r => r.dataset.cat).join() === 'abc123');
        $('#k-q').value = ''; $('#k-lvl [data-l="3"]').click();
        const lv = [...$('#k-list').querySelectorAll('[data-cat]')].map(r => r.dataset.cat).join();
        $('#k-lvl [data-l="0"]').click(); $('#k-fing').click();
        const fg = [...$('#k-list').querySelectorAll('[data-cat]')].map(r => r.dataset.cat).join();
        $('#k-fing').click();
        ok('catalogue : filtres difficulté et « avec doigtés écrits »', lv === 'def456' && fg === 'abc123');
        const order = k => { $('#k-sort').value = k; $('#k-sort').dispatchEvent(new Event('change')); return [...$('#k-list').querySelectorAll('[data-cat]')].map(r => r.dataset.cat).join(); };
        ok('catalogue : tri par note, difficulté, titre ; « mesures » en entier', order('stars') === 'abc123,def456' && order('hard') === 'def456,abc123' && order('easy') === 'abc123,def456' && order('title') === 'def456,abc123' && /1 mesure/.test($('#k-list').textContent) && !/mes\./.test($('#k-list').textContent));
        order('stars');
        Object.assign(CAT, { blob: null, files: null, idx: null }); await catOpen();
        ok('catalogue : relu depuis le stockage de l\'appli (sans le fichier)', CAT.idx && CAT.idx.items.length === 2);
        const nImp = imports().length;
        $('#k-list [data-cat="abc123"]').click();
        for (let i = 0; i < 50 && view !== 'play'; i++) await new Promise(r => setTimeout(r, 40));
        ok('catalogue : toucher un morceau l\'importe et l\'ouvre, doigté écrit gardé', view === 'play' && P.pc.cat === 'abc123' && P.pc.title === 'Petit essai' && P.notes.length === 4 && P.notes[0].f === 1 && imports().length === nImp + 1 && /CC0/.test(P.pc.src));
        show('cat'); await new Promise(r => setTimeout(r, 30)); $('#k-list [data-cat="abc123"]').click();
        for (let i = 0; i < 50 && view !== 'play'; i++) await new Promise(r => setTimeout(r, 40));
        ok('catalogue : le rouvrir ne l\'ajoute pas deux fois', view === 'play' && imports().length === nImp + 1);
      } finally {
        if (keptBefore) await idbSet('catalogue', keptBefore); else await idbDo('readwrite', st => st.delete('catalogue'));
        Object.assign(CAT, catBefore, { lvl: 0, fing: false }); $('#k-q').value = ''; $('#k-msg').textContent = '';
        $('#p-res').hidden = true;
      }
    }

    // ---------- 8. dessin : chaque morceau, les deux vues, du début à la fin ----------
    let errs = 0, frames = 0;
    for (const p of PIECES.concat(SCALES, [imp, pc])) for (const v of ['score', 'fall']) {
      SET.view = v; openPiece(p); P.mode = 'demo'; restart();
      for (let t = -2; t <= P.pc.measures * P.pc.num + 2; t += 0.37) { P.t = t; try { draw(); frames++; } catch (e) { errs++; console.error(p.id, v, t, e); } }
    }
    ok('dessin : toutes les vues de tous les morceaux sans erreur', errs === 0, `${frames} images`);
    ok('clés : Noto Music mesurée', CM.G && CM.G.a + CM.G.d > 0 && CM.F.a + CM.F.d > 0, CM.G ? `sol ${(CM.G.a + CM.G.d).toFixed(0)} / fa ${(CM.F.a + CM.F.d).toFixed(0)} px à 100 px` : 'absente');
  } catch (e) {
    ok('exception', false, e.stack);
  } finally {
    window.synth = realSynth;
    Object.assign(SET, JSON.parse(setBefore));
    for (let i = localStorage.length - 1; i >= 0; i--) { const k = localStorage.key(i); if (k.startsWith('legato-') && !(k in saved)) localStorage.removeItem(k); }
    for (const k in saved) localStorage.setItem(k, saved[k]);
    show('home');
  }
  const fails = out.filter(l => l.startsWith('FAIL')).length;
  return (fails ? fails + ' ÉCHEC(S)' : 'TOUT PASSE') + ' · ' + out.filter(l => l.startsWith('OK')).length + ' OK\n' + out.join('\n');
}
