// lancé par le test « local » de NeoDex : la vérification interne, deux tours rejoués au clavier, un cristal allumé (lumière et étincelles),
// une erreur qui finit la partie, le plein écran et la place prise (avec NEO_SHOTS : garde des images du jeu)
module.exports = async ({ pj, sleep }) => {
  const C = code => pj(`(() => { const T = document.getElementById('gc').__ec, ec = T.st(); ${code} })()`);
  const key = k => pj(`document.dispatchEvent(new KeyboardEvent('keydown', {key: '${k}', bubbles: true})), 0`);
  const shot = async n => { if (!process.env.NEO_SHOTS) return; const d = await pj(`document.getElementById('gc').toDataURL()`); require('fs').writeFileSync(require('path').join(process.env.NEO_SHOTS, 'echo-' + n + '.png'), Buffer.from(d.split(',')[1], 'base64')); };
  const waitInput = async () => { for (let i = 0; i < 60 && await C('return ec.mode;') !== 'input'; i++) await sleep(100); };
  await pj(`window.__e = []; addEventListener('error', e => __e.push(e.message)); 0`);
  const chk = await C('return T.check();'); if (chk !== 'ok') throw new Error('vérification : ' + chk);
  await pj(`document.getElementById('gNew').click(), 0`); await sleep(100); await shot('0-pret');
  await key(' '); await sleep(900); await shot('1-allume');
  // deux tours : on rejoue la suite lue dans le jeu
  for (let r = 1; r <= 2; r++) {
    await waitInput();
    const seq = await C('return ec.seq;'); if (seq.length !== r) throw new Error('la suite devait faire ' + r + ' : ' + seq.length);
    for (const i of seq) { await key(String(i + 1)); await sleep(120); }
    if (r === 2) await shot('2-reponse');
  }
  await waitInput();
  if (await C('return ec.seq.length;') !== 3) throw new Error('le troisième tour devait commencer');
  // une erreur : la partie finit
  const wrong = await C('return (ec.seq[0] + 1) % 4;'); await key(String(wrong + 1)); await sleep(800);
  if (await C('return ec.mode;') !== 'over') throw new Error('une erreur devait finir la partie'); await shot('3-fin');
  const errs = await pj(`window.__e.join(' | ')`); if (errs) throw new Error('erreur : ' + errs);
  // plein écran, et la zone de jeu qui tient dans la fenêtre
  await pj(`document.fullscreenElement && document.exitFullscreen(), 0`); await sleep(200);
  await pj(`document.getElementById('ecFs').click(), 0`); await sleep(700);
  const fs = await pj(`(() => { const c = document.getElementById('gc'), r = c.getBoundingClientRect(); return document.fullscreenElement === c.parentElement && (Math.abs(r.height - innerHeight) < 3 || Math.abs(r.width - innerWidth) < 3); })()`);
  await pj(`document.fullscreenElement && document.exitFullscreen(), 0`); await sleep(300);
  if (!fs) throw new Error('le plein écran ne remplit pas l\'écran');
  const L = await pj(`(() => { const r = document.getElementById('gc').getBoundingClientRect(); let s = 0; for (let e = document.getElementById('gc').parentElement; e; e = e.parentElement) s += e.scrollTop; return { bottom: Math.round(r.bottom + s), h: Math.round(r.height), wh: innerHeight, ww: innerWidth, sw: document.documentElement.scrollWidth }; })()`);
  if (process.env.NEO_FIT_LOG) console.log('FIT', JSON.stringify(L));
  if (L.bottom > L.wh + 1 || L.sw > L.ww + 1 || L.h < 300) throw new Error('la zone de jeu dépasse la fenêtre ou reste petite : ' + JSON.stringify(L));
  return 'vérification ok · deux tours rejoués · erreur · plein écran · ' + L.h + ' px dans ' + L.ww + '×' + L.wh;
};
