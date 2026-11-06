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
    SET.accomp = 'piano'; SET.view = 'score'; SET.metro = false; SET.fing = 'all';
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
    ok('épellation hors gamme : Fa♯ en Fa, Si♭ / Mi♭ / Do♯ en Do, Mi♯ en Fa♯', spell(66, -1).fr === 'Fa♯' && spell(70, 0).fr === 'Si♭' && spell(63, 0).fr === 'Mi♭' && spell(61, 0).fr === 'Do♯' && spell(65, 6).fr === 'Mi♯' && spell(65, 6).step === 30);

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
