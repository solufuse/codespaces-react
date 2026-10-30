import './App.css';
import { useEffect, useMemo, useRef, useState } from 'react';

const LETTERS = {
  S: ['#######', '##     ', '##     ', '##     ', ' ##### ', '     ##', '     ##', '     ##', '###### '],
  O: [' ##### ', '##   ##', '##   ##', '##   ##', '##   ##', '##   ##', '##   ##', '##   ##', ' ##### '],
  D: ['###### ', '##   ##', '##    #', '##    #', '##    #', '##    #', '##    #', '##   ##', '###### '],
  U: ['##   ##', '##   ##', '##   ##', '##   ##', '##   ##', '##   ##', '##   ##', '##   ##', ' ##### '],
  R: ['###### ', '##   ##', '##   ##', '##   ##', '###### ', '## ##  ', '##  ## ', '##   ##', '##   ##'],
  A: [' ##### ', '##   ##', '##   ##', '##   ##', '#######', '##   ##', '##   ##', '##   ##', '##   ##'],
  L: ['##     ', '##     ', '##     ', '##     ', '##     ', '##     ', '##     ', '##     ', '#######'],
};

const LOGO_ROWS = Array.from({ length: 9 }, (_, sourceRow) =>
  [...'SODURAL'].flatMap((letter, index) => [
    ...[...LETTERS[letter][sourceRow]].flatMap((pixel) => [pixel, pixel]),
    ...(index < 6 ? [' ', ' ', ' ', ' '] : []),
  ]),
);

const FAULT_BUS_CONFIG = {
  BUS_100: {
    id: 'BUS_100',
    label: 'BUS-100 // 225 kV HTB (Poste Source RTE)',
    unKv: 225,
    zTheveninOhm: 6.35,
    rOverX: 0.1,
    breakerRatingKa: 40.0,
    peakRatingKa: 100.0,
    relayCode: 'ANSI 87B / 21',
    tripTimeMs: 65,
  },
  BUS_200: {
    id: 'BUS_200',
    label: 'BUS-200 // 20 kV HTA (Tableau Principal)',
    unKv: 20,
    zTheveninOhm: 0.442,
    rOverX: 0.14,
    breakerRatingKa: 31.5,
    peakRatingKa: 80.0,
    relayCode: 'ANSI 50/51 + 87T',
    tripTimeMs: 120,
  },
  BUS_300: {
    id: 'BUS_300',
    label: 'BUS-300 // 6.6 kV HTA (Auxiliaires & Moteurs HT)',
    unKv: 6.6,
    zTheveninOhm: 0.218,
    rOverX: 0.22,
    breakerRatingKa: 25.0,
    peakRatingKa: 63.0,
    relayCode: 'ANSI 50/51 / 67N',
    tripTimeMs: 185,
  },
};

const EXPERTISE_MODULES = [
  {
    code: 'ETAP-LF // MOD-01',
    title: 'LOAD FLOW & BILAN DE PUISSANCE (HTB / HTA / BT)',
    standard: 'IEC 60364 / NF C 13-200 / Grid Codes',
    metrics: ['Newton-Raphson & Adaptive', 'Profils ΔU% & Pertes I²R', 'Régleurs en charge (OLTC / AVR)'],
    summary:
      'Modélisation de réseaux industriels, postes sources 225/90/20 kV, data centers et centrales EnR/BESS. Analyse des régimes N et N-1, dimensionnement thermique des câbles et transformateurs, compensation d’énergie réactive (batteries HT / STATCOM).',
    asciiFormula: 'S_k = V_k · I_k* = P_k + jQ_k   |   ΔU% = (R·P + X·Q) / U_n²',
  },
  {
    code: 'ETAP-SC // MOD-02',
    title: 'CALCULS DE COURANTS DE COURT-CIRCUIT (Icc)',
    standard: 'IEC 60909-0 / ANSI C37 / IEC 60865',
    metrics: ['I"k3 / I"k1 / I"k2 (Max & Min)', 'Tenue électrodynamique ip', 'Contrainte thermique Ith (1s)'],
    summary:
      'Calcul rigoureux des courants de court-circuit symétriques et asymétriques (triphasé franc, biphasé, homopolaire terre). Vérification du Pouvoir de Coupure (PdC) et de Fermeture (PdF) des disjoncteurs HTB/HTA, tenue des jeux de barres.',
    asciiFormula: 'I"k3 = (c · U_n) / (√3 · Z_k)   |   i_p = κ · √2 · I"k3',
  },
  {
    code: 'ETAP-STAR // MOD-03',
    title: 'PLAN DE PROTECTION & SÉLECTIVITÉ (TCC)',
    standard: 'IEC 60255 / IEEE 242 (Buff Book)',
    metrics: ['Courbes TCC (SI, VI, EI, DT)', 'Sélectivité Logique & Chrono', 'ANSI 50/51, 51N, 67, 87T, 27/59'],
    summary:
      'Paramétrage complet des relais numériques (Schneider Sepam/Easergy, Siemens Siprotec, ABB Relion, GE Multilin). Coordination amont/aval avec vérification sous Icc max (non-déclenchement intempestif) et Icc min (sensibilité garantie).',
    asciiFormula: 't(I) = TMS · [ k / ((I / I_s)^α - 1) ]   |   Δt_sel ≥ 250 ms',
  },
  {
    code: 'ETAP-DYN // MOD-04',
    title: 'DÉMARRAGE MOTEUR HT, HARMONIQUES & ARC FLASH',
    standard: 'IEEE 1584-2018 / NFPA 70E / IEEE 519',
    metrics: ['Chute ΔU démarrage moteur HT', 'Énergie incidente (cal/cm²)', 'Filtrage THD-U / THD-I & Résonance'],
    summary:
      'Simulation transitoire de démarrage de gros moteurs asynchrones/synchrones 6.6 kV & 11 kV. Études Arc Flash (énergie incidente E_inc, distance limite AFB, choix EPI) et analyse spectrale harmonique avec dimensionnement de filtres.',
    asciiFormula: 'E_inc = f(I_bf, t_arc, D, G) [cal/cm²]   |   U_start ≥ 80% U_n',
  },
];

const CASE_STUDIES = [
  {
    id: 'CS-01',
    sector: 'POSTE SOURCE HTB/HTA // 225 kV - 20 kV (2x40 MVA)',
    scope: 'Étude Load Flow N/N-1 + Court-Circuit IEC 60909 + Sélectivité',
    result: 'Optimisation des prises OLTC (+1.8% de tenue de tension), validation PdC 31.5 kA et réduction du temps d’élimination de défaut de 420 ms à 140 ms par sélectivité logique.',
  },
  {
    id: 'CS-02',
    sector: 'INDUSTRIE LOURDE // RÉSEAU 20 kV / 6.6 kV (MOTEURS 4.5 MW)',
    scope: 'Démarrage moteur dynamique + Compensation réactive + Arc Flash IEEE 1584',
    result: 'Chute de tension au démarrage limitée à 8.9% (contre 16.4% initialement), relèvement du cos φ global de 0.82 à 0.96, abaissement de la catégorie EPI Arc Flash de Cat. 4 à Cat. 2.',
  },
  {
    id: 'CS-03',
    sector: 'CENTRALE HAUTE PUISSANCE & BESS // RACCORDEMENT HTA/HTB',
    scope: 'Conformité Grid Code PQ-Capability + Harmoniques + Plan de Protection',
    result: 'Dimensionnement batterie de condensateurs + gradins d’inductance, conformité gabarit Q(U) au Point de Livraison (PDL) et réglage des protections de découplage (ANSI 27/59/81).',
  },
];

function App() {
  const vortexRef = useRef(null);
  const scopeRef = useRef(null);

  // Simulation Mode: 'LOADFLOW' | 'SHORTCIRCUIT'
  const [simMode, setSimMode] = useState('LOADFLOW');
  const [oltcTap, setOltcTap] = useState(1); // -5 to +5 (%)
  const [capBankOn, setCapBankOn] = useState(true);
  const [motorStarting, setMotorStarting] = useState(false);
  const [faultBus, setFaultBus] = useState('BUS_200');
  const [voltageFactorC, setVoltageFactorC] = useState(1.1); // 1.10 (Icc max) or 1.00 (Icc min)

  // Oscilloscope / TCC Controls
  const [scopeView, setScopeView] = useState('WAVEFORM'); // 'WAVEFORM' | 'TCC'
  const [xOverR, setXOverR] = useState(14);
  const [tmsUpstream, setTmsUpstream] = useState(0.32);
  const [flowTick, setFlowTick] = useState(0);

  // Animate ASCII flow arrows in SLD
  useEffect(() => {
    const interval = window.setInterval(() => {
      setFlowTick((prev) => (prev + 1) % 4);
    }, 360);
    return () => window.clearInterval(interval);
  }, []);

  // Load Flow & Short-Circuit Physics Engine
  const gridState = useMemo(() => {
    // Base Active & Reactive Demand
    const baseP_MW = 24.8;
    const baseQ_Mvar = 16.2;

    // Motor starting impact (4.5 MW motor on 6.6 kV bus: Id = 6.0 In, cos phi_d = 0.20)
    const motorP_MW = motorStarting ? 5.4 : 4.2;
    const motorQ_Mvar = motorStarting ? 25.8 : 2.6;

    // Capacitor bank compensation on 20 kV bus (-6.5 Mvar reactive demand)
    const capQ_Mvar = capBankOn ? -6.5 : 0.0;

    const totalP_MW = baseP_MW + motorP_MW;
    const totalQ_Mvar = Math.max(1.8, baseQ_Mvar + motorQ_Mvar + capQ_Mvar);
    const totalS_MVA = Math.hypot(totalP_MW, totalQ_Mvar);
    const cosPhi = totalP_MW / totalS_MVA;

    // Transformer TR-101: 40 MVA, uk = 12.5%, ur = 0.6%
    const trRatingMVA = 40.0;
    const trLoadingPct = (totalS_MVA / trRatingMVA) * 100;

    // Voltage drop across TR-101 (%)
    const uR = 0.6;
    const uX = 12.48;
    const deltaU_TR_pct =
      ((uR * totalP_MW + uX * totalQ_Mvar) / trRatingMVA) * (100 / 100);

    // Bus 100 (225 kV Slack Bus)
    const u100_pct = 100.4;
    const u100_kV = (225 * u100_pct) / 100;

    // Bus 200 (20 kV Main Bus with OLTC tap regulation)
    const u200_pct = Number(
      Math.max(84.0, Math.min(106.5, u100_pct + oltcTap * 1.25 - deltaU_TR_pct)).toFixed(2),
    );
    const u200_kV = Number(((20 * u200_pct) / 100).toFixed(2));

    // Bus 300 (6.6 kV Motor & Aux Bus via TR-201 10 MVA, uk = 8%)
    const tr201_MVA = 10.0;
    const s300_MVA = Math.hypot(motorP_MW + 1.8, motorQ_Mvar + 0.9);
    const deltaU_300_pct = ((0.8 * (motorP_MW + 1.8) + 7.96 * (motorQ_Mvar + 0.9)) / tr201_MVA);
    const u300_pct = Number(Math.max(76.0, u200_pct - deltaU_300_pct).toFixed(2));
    const u300_kV = Number(((6.6 * u300_pct) / 100).toFixed(2));

    const lossesKW = Math.round(145 * Math.pow(totalS_MVA / trRatingMVA, 2) + (motorStarting ? 310 : 48));

    // IEC 60909 Short-Circuit calculation for selected fault bus
    const busCfg = FAULT_BUS_CONFIG[faultBus];
    // c * Un / (sqrt(3) * Zk)
    const ik3_kA = (voltageFactorC * busCfg.unKv) / (Math.sqrt(3) * busCfg.zTheveninOhm);
    // kappa = 1.02 + 0.98 * exp(-3 * R/X)
    const kappa = 1.02 + 0.98 * Math.exp(-3 * busCfg.rOverX);
    const ip_kA = kappa * Math.SQRT2 * ik3_kA;
    // Symmetrical breaking current Ib (approx 0.96 * I"k3)
    const ib_kA = 0.96 * ik3_kA;
    // Thermal equivalent 1s current Ith = I"k3 * sqrt(m + n)
    const mFactor = 0.08 * (1 / busCfg.rOverX);
    const ith_kA = ik3_kA * Math.sqrt(1 + mFactor);
    const breakerMarginPct = ((busCfg.breakerRatingKa - ik3_kA) / busCfg.breakerRatingKa) * 100;

    return {
      totalP_MW: totalP_MW.toFixed(1),
      totalQ_Mvar: totalQ_Mvar.toFixed(1),
      totalS_MVA: totalS_MVA.toFixed(1),
      cosPhi: cosPhi.toFixed(3),
      trLoadingPct: trLoadingPct.toFixed(1),
      deltaU_TR_pct: deltaU_TR_pct.toFixed(2),
      u100_pct: u100_pct.toFixed(1),
      u100_kV: u100_kV.toFixed(1),
      u200_pct: u200_pct.toFixed(1),
      u200_kV: u200_kV.toFixed(2),
      u300_pct: u300_pct.toFixed(1),
      u300_kV: u300_kV.toFixed(2),
      s300_MVA: s300_MVA.toFixed(1),
      lossesKW,
      busCfg,
      ik3_kA: ik3_kA.toFixed(2),
      kappa: kappa.toFixed(3),
      ip_kA: ip_kA.toFixed(2),
      ib_kA: ib_kA.toFixed(2),
      ith_kA: ith_kA.toFixed(2),
      breakerMarginPct: breakerMarginPct.toFixed(1),
    };
  }, [oltcTap, capBankOn, motorStarting, faultBus, voltageFactorC]);

  // Hero background ASCII field / electromagnetic flux canvas
  useEffect(() => {
    const canvas = vortexRef.current;
    if (!canvas || !window.CanvasRenderingContext2D) return undefined;

    const context = canvas.getContext('2d');
    if (!context) return undefined;

    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const glyphs = '.:-=+*xX#%@';
    let animationFrame;
    let lastFrame = 0;

    function draw(timestamp) {
      if (timestamp - lastFrame >= 45 || reducedMotion) {
        lastFrame = timestamp;
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

        const canvasWidth = Math.round(width * pixelRatio);
        const canvasHeight = Math.round(height * pixelRatio);

        if (canvas.width !== canvasWidth || canvas.height !== canvasHeight) {
          canvas.width = canvasWidth;
          canvas.height = canvasHeight;
          context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
        }

        const fontSize = Math.max(8, Math.min(12, width / 100));
        const cellWidth = fontSize * 0.68;
        const rowHeight = fontSize * 1.25;
        const time = timestamp / 1000;

        context.clearRect(0, 0, width, height);
        context.font = `${fontSize}px 'Courier New', monospace`;
        context.textBaseline = 'top';

        for (let row = 0, y = 0; y < height; row += 1, y += rowHeight) {
          for (let column = 0, x = 0; x < width; column += 1, x += cellWidth) {
            const horizontal = (x - width / 2) / (width * 0.56);
            const vertical = (y - height / 2) / (height * 0.46);
            const radius = Math.hypot(horizontal, vertical);
            const noise = Math.abs(Math.sin(column * 127.1 + row * 311.7) * 43758.5453) % 1;

            if (radius > 1.28) {
              if (noise > 0.997) {
                context.fillStyle = 'rgba(160, 205, 255, 0.35)';
                context.fillText('.', x, y);
              }
              continue;
            }

            const angle = Math.atan2(vertical, horizontal);
            const spiral = angle * 4 - radius * 8 + time * 0.48;
            const arm = Math.pow((Math.sin(spiral) + 1) / 2, 2.4);
            const core = Math.exp(-radius * 6);
            const dustLane = (Math.sin(radius * 28 - angle * 4 + time * 0.35) + 1) / 2;
            const density = Math.min(0.96, 0.16 + arm * 0.62 + core * 0.35 + dustLane * 0.12);

            if (noise > density) continue;

            const glyphIndex = Math.floor((noise * 19 + arm * 7 + time * 1.4) % glyphs.length);
            const opacity = Math.min(0.94, 0.22 + arm * 0.42 + core * 0.3);

            context.fillStyle =
              core > 0.48 || arm > 0.82
                ? `rgba(225, 242, 255, ${opacity})`
                : `rgba(119, 190, 255, ${opacity})`;
            context.fillText(glyphs[glyphIndex], x, y);
          }
        }
      }

      if (!reducedMotion) animationFrame = window.requestAnimationFrame(draw);
    }

    function resize() {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = window.requestAnimationFrame(draw);
    }

    animationFrame = window.requestAnimationFrame(draw);
    window.addEventListener('resize', resize);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener('resize', resize);
    };
  }, []);

  // ASCII Oscilloscope Canvas (Short-Circuit Waveform i(t) & TCC Curve)
  useEffect(() => {
    const canvas = scopeRef.current;
    if (!canvas || !window.CanvasRenderingContext2D) return undefined;

    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    let frameId;
    let lastDraw = 0;

    function renderScope(timestamp) {
      if (timestamp - lastDraw >= 55 || reducedMotion) {
        lastDraw = timestamp;
        const width = canvas.clientWidth || 680;
        const height = canvas.clientHeight || 310;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);

        if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
          canvas.width = Math.round(width * dpr);
          canvas.height = Math.round(height * dpr);
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }

        ctx.clearRect(0, 0, width, height);
        ctx.font = "700 11px 'Courier New', monospace";
        ctx.textBaseline = 'middle';

        const padLeft = 56;
        const padRight = 24;
        const padTop = 28;
        const padBottom = 32;
        const plotW = Math.max(120, width - padLeft - padRight);
        const plotH = Math.max(120, height - padTop - padBottom);

        // Background ASCII grid dots
        ctx.fillStyle = 'rgba(110, 175, 245, 0.16)';
        for (let gx = padLeft; gx <= padLeft + plotW; gx += 24) {
          for (let gy = padTop; gy <= padTop + plotH; gy += 20) {
            ctx.fillText('·', gx, gy);
          }
        }

        const timePhase = reducedMotion ? 0 : timestamp / 900;

        if (scopeView === 'WAVEFORM') {
          const midY = padTop + plotH * 0.56;
          // Draw zero axis
          ctx.fillStyle = 'rgba(143, 202, 255, 0.45)';
          for (let x = padLeft; x < padLeft + plotW; x += 8) {
            ctx.fillText('-', x, midY);
          }
          ctx.fillText('0 kA', 10, midY);
          ctx.fillText('+ip', 10, padTop + 14);
          ctx.fillText('-I"k', 10, padTop + plotH - 8);

          const freq = 50;
          const omega = 2 * Math.PI * freq;
          const tau = xOverR / omega; // DC decay time constant
          const totalTimeSec = 0.12; // 120 ms (6 cycles at 50 Hz)

          const cols = Math.floor(plotW / 6.5);
          for (let c = 0; c <= cols; c += 1) {
            const t = (c / cols) * totalTimeSec;
            const x = padLeft + (c / cols) * plotW;

            // Decaying DC component envelope
            const dcOffset = Math.exp(-t / tau);
            // Symmetrical AC + DC offset
            const acWave = -Math.cos(omega * t - timePhase * 0.35);
            const totalCurrentNorm = (acWave + dcOffset) / 1.92; // normalized -1..+1

            // Envelope upper curve
            const envUpperNorm = (1 + dcOffset) / 1.92;
            const yEnv = midY - envUpperNorm * (plotH * 0.46);
            ctx.fillStyle = 'rgba(255, 183, 77, 0.65)';
            ctx.fillText(':', x, yEnv);

            // DC decaying component curve
            const yDc = midY - (dcOffset / 1.92) * (plotH * 0.46);
            ctx.fillStyle = 'rgba(255, 110, 110, 0.65)';
            ctx.fillText('.', x, yDc);

            // Total asymmetrical current i(t)
            const yWave = midY - totalCurrentNorm * (plotH * 0.46);
            const isPeakRegion = t > 0.008 && t < 0.013;
            ctx.fillStyle = isPeakRegion ? '#ff5c5c' : '#5ce1e6';
            ctx.fillText(isPeakRegion ? '@' : '#', x, yWave);
          }

          ctx.fillStyle = '#dceeff';
          ctx.fillText(
            `IEC 60909 // i(t) = √2·I"k·[sin(ωt - φ) + e^(-t/τ)]  |  X/R = ${xOverR}  |  τ = ${(
              (xOverR / (2 * Math.PI * 50)) *
              1000
            ).toFixed(1)} ms`,
            padLeft,
            14,
          );
          ctx.fillStyle = '#8fcaff';
          ctx.fillText('t = 0 ms (Défaut)', padLeft, height - 12);
          ctx.fillText('t = 10 ms (Crête ip)', padLeft + plotW * 0.18, height - 12);
          ctx.fillText('t = 120 ms (Coupure CB)', padLeft + plotW - 145, height - 12);
        } else {
          // TCC Curve (Time-Current Coordination ANSI 50/51 Standard Inverse)
          ctx.fillStyle = '#dceeff';
          ctx.fillText(
            `ETAP STAR // COURBE TCC IEC STANDARD INVERSE (ANSI 51) | TMS Amont = ${tmsUpstream.toFixed(2)}`,
            padLeft,
            14,
          );

          const cols = Math.floor(plotW / 7);
          for (let c = 0; c <= cols; c += 1) {
            const normX = c / cols;
            const x = padLeft + normX * plotW;
            // Current multiple I / Is from 1.2x to 20x
            const multiple = 1.25 + normX * 18.75;

            // Downstream feeder relay (TMS = 0.14)
            const tDown = 0.14 * (0.14 / (Math.pow(multiple, 0.02) - 1));
            // Upstream incomer relay (TMS = tmsUpstream)
            const tUp = tmsUpstream * (0.14 / (Math.pow(multiple * 0.78, 0.02) - 1));

            const mapTimeY = (tSec) => {
              const clamped = Math.max(0.05, Math.min(4.0, tSec));
              const logNorm = (Math.log10(clamped) - Math.log10(0.05)) / (Math.log10(4.0) - Math.log10(0.05));
              return padTop + plotH - logNorm * plotH;
            };

            const yDown = mapTimeY(tDown);
            const yUp = mapTimeY(tUp);

            ctx.fillStyle = '#5ce1e6';
            ctx.fillText('*', x, yDown);

            ctx.fillStyle = '#ffb74d';
            ctx.fillText('#', x, yUp);
          }

          ctx.fillStyle = '#5ce1e6';
          ctx.fillText('[*] RELAIS AVAL 51 (Départ 6.6 kV - TMS 0.14)', padLeft, height - 12);
          ctx.fillStyle = '#ffb74d';
          ctx.fillText(
            `[#] RELAIS AMONT 51 (Arrivée 20 kV - TMS ${tmsUpstream.toFixed(2)}) | Δt = ${Math.round(
              (tmsUpstream - 0.14) * 1450,
            )} ms`,
            padLeft + 310,
            height - 12,
          );
        }
      }

      if (!reducedMotion) {
        frameId = window.requestAnimationFrame(renderScope);
      }
    }

    frameId = window.requestAnimationFrame(renderScope);
    return () => window.cancelAnimationFrame(frameId);
  }, [scopeView, xOverR, tmsUpstream]);

  const flowArrows = ['>>>', ' >>', '> >', '>> '][flowTick];
  const isFaultMode = simMode === 'SHORTCIRCUIT';

  // Generate dynamic ASCII Single-Line Diagram (SLD)
  const asciiSldDiagram = useMemo(() => {
    const f100 = isFaultMode && faultBus === 'BUS_100' ? ' ⚡<<< [DÉFAUT 3Φ FRANC : ' + gridState.ik3_kA + ' kA]' : '';
    const f200 = isFaultMode && faultBus === 'BUS_200' ? ' ⚡<<< [DÉFAUT 3Φ FRANC : ' + gridState.ik3_kA + ' kA]' : '';
    const f300 = isFaultMode && faultBus === 'BUS_300' ? ' ⚡<<< [DÉFAUT 3Φ FRANC : ' + gridState.ik3_kA + ' kA]' : '';

    const cb200State = isFaultMode && faultBus === 'BUS_200' ? '[CB-102: TRIP!]' : '[CB-102: CLOSED]';
    const cb300State = isFaultMode && faultBus === 'BUS_300' ? '[CB-204: TRIP!]' : '[CB-204: CLOSED]';
    const capState = capBankOn ? '[CB-CAP: CLOSED] (+6.5 Mvar)' : '[CB-CAP: OPEN]   (0.0 Mvar) ';
    const motorState = motorStarting ? 'DÉMARRAGE (Id=6.0x)' : 'NOMINAL (4.2 MW)   ';

    return [
      `                      [ RÉSEAU HTB RTE 225 kV // Sk" = 8750 MVA | c = ${voltageFactorC.toFixed(2)} ]`,
      `                                              ║`,
      `                                        [CB-101: CLOSED]`,
      `                                              ║  P = ${gridState.totalP_MW} MW | Q = ${gridState.totalQ_Mvar} Mvar`,
      `   ╔══════════════════════════════════════════╬══════════════════════════════════════════╗`,
      `   ║ BUS-100 // 225 kV HTB                    ║ U = ${gridState.u100_kV} kV (${gridState.u100_pct}% Un) | f = 50.00 Hz ║${f100}`,
      `   ╚══════════════════════════════════════════╬══════════════════════════════════════════╝`,
      `                                              ║`,
      `                                         ( 87T / OLTC )  Prise régleur : ${oltcTap >= 0 ? `+${oltcTap}` : oltcTap}%`,
      `                                           }{ TR-101     225 / 20 kV — 40 MVA (uk = 12.5%)`,
      `                                           }{            Charge : ${gridState.trLoadingPct}% | ΔU = ${gridState.deltaU_TR_pct}%`,
      `                                              ║  ${flowArrows}`,
      `                                       ${cb200State}`,
      `                                              ║`,
      `   ╔══════════════════════╦═══════════════════╬═══════════════════╦══════════════════════╗`,
      `   ║ BUS-200 // 20 kV HTA ║ U = ${gridState.u200_kV} kV (${gridState.u200_pct}% Un) | cos φ = ${gridState.cosPhi} | S = ${gridState.totalS_MVA} MVA ║${f200}`,
      `   ╚══════════════════════╬═══════════════════╩═══════════════════╬══════════════════════╝`,
      `                          ║                                       ║`,
      `             ${capState}                        ${cb300State}`,
      `                          ║                                       ║`,
      `                      ════╬════ CAP-201                        }{ TR-201 (20/6.6 kV - 10 MVA)`,
      `                      ════╬════ Gradin HTA                     }{ S = ${gridState.s300_MVA} MVA | uk = 8.0%`,
      `                          ╨                                       ║`,
      `                                              ╔═══════════════════╬══════════════════════╗`,
      `                                              ║ BUS-300 // 6.6 kV ║ U = ${gridState.u300_kV} kV (${gridState.u300_pct}% Un) ║${f300}`,
      `                                              ╚═══════════════════╬══════════════════════╝`,
      `                                                                  ║`,
      `                                                            ( M3~ 6.6kV ) M-301 : ${motorState}`,
    ].join('\n');
  }, [isFaultMode, faultBus, gridState, voltageFactorC, oltcTap, flowArrows, capBankOn, motorStarting]);

  return (
    <div className="scada-app">
      {/* Top SCADA Telemetry Bar */}
      <header className="scada-topbar">
        <div className="scada-topbar-inner">
          <div className="telemetry-brand">
            <span className="status-led" aria-hidden="true" />
            <span>SODURAL // HV-CALC-TERMINAL v4.2</span>
          </div>
          <div className="telemetry-metrics">
            <span>ENGINE: ETAP® / IEC 60909</span>
            <span className="telemetry-sep">|</span>
            <span>GRID: 225 kV / 20 kV / 6.6 kV</span>
            <span className="telemetry-sep">|</span>
            <span>COS φ: {gridState.cosPhi}</span>
            <span className="telemetry-sep">|</span>
            <span className={isFaultMode ? 'telemetry-alert' : 'telemetry-ok'}>
              {isFaultMode ? `FAULT I"k3 = ${gridState.ik3_kA} kA` : 'STATUS: NOMINAL 50.00 Hz'}
            </span>
          </div>
          <nav className="telemetry-nav" aria-label="Navigation principale">
            <a href="#simulateur-etap">[01. SIMULATEUR SLD]</a>
            <a href="#oscilloscope-ascii">[02. OSCILLOSCOPE & TCC]</a>
            <a href="#expertise-hv">[03. EXPERTISE ETAP]</a>
            <a
              href="https://www.linkedin.com/in/pascalso/"
              target="_blank"
              rel="noreferrer"
              className="topbar-cta"
            >
              LINKEDIN // PASCAL SO ↗
            </a>
          </nav>
        </div>
      </header>

      {/* Main Hero Screen with ASCII Vortex & SODURAL Wave Logo */}
      <main className="screen">
        <canvas className="ascii-vortex" ref={vortexRef} aria-hidden="true" />

        <div className="hero-hud">
          <div className="hud-corner hud-top-left">
            <span>SYS_ID: PASCAL_SO // INGÉNIEUR CALCUL HAUTE TENSION</span>
            <span>SPÉCIALITÉ: LOAD FLOW • COURT-CIRCUIT (Icc) • SÉLECTIVITÉ SUR ETAP®</span>
          </div>

          <a
            className="logo-link"
            href="https://www.linkedin.com/in/pascalso/"
            aria-label="Sodural, profil LinkedIn de Pascal So"
            title="Profil LinkedIn de Pascal So"
            target="_blank"
            rel="noreferrer"
          >
            <pre className="ascii-logo" aria-hidden="true">
              {LOGO_ROWS.map((row, rowIndex) => (
                <span className="ascii-row" key={rowIndex}>
                  {row.map((pixel, columnIndex) => (
                    <span
                      className={pixel === '#' ? 'ascii-pixel' : undefined}
                      key={columnIndex}
                      style={{ '--wave-delay': `${(columnIndex + rowIndex * 2) * -40}ms` }}
                    >
                      {pixel}
                    </span>
                  ))}
                </span>
              ))}
            </pre>
          </a>

          <div className="hero-pitch">
            <p className="hero-badge">
              [ ARCHITECTURE & ÉTUDES DE RÉSEAUX ÉLECTRIQUES HTB / HTA // ETAP® POWERSTATION ]
            </p>
            <h1 className="hero-title">
              Ingénierie de Calcul Haute Tension — <span>Load Flow, Court-Circuit IEC 60909 & Protection</span>
            </h1>
            <p className="hero-subtitle">
              Modélisation numérique de réseaux électriques, dimensionnement Haute Tension, calculs de courants
              de court-circuit (I&quot;k, ip, Ib, Ith), coordination des protections (ETAP Star) et études transitoires.
            </p>

            <div className="hero-kpi-strip">
              <div className="kpi-chip">
                <span className="kpi-label">LOGICIEL DE RÉFÉRENCE</span>
                <strong>ETAP® (LF / SC / STAR)</strong>
              </div>
              <div className="kpi-chip">
                <span className="kpi-label">NORMES DE CALCUL</span>
                <strong>IEC 60909 • IEEE C37 • NF C 13-200</strong>
              </div>
              <div className="kpi-chip">
                <span className="kpi-label">NIVEAUX DE TENSION</span>
                <strong>400 kV • 225 kV • 90 kV • 20 kV • 6.6 kV</strong>
              </div>
              <div className="kpi-chip">
                <span className="kpi-label">VALEURS SIMULÉES</span>
                <strong>I&quot;k3 = {gridState.ik3_kA} kA | ip = {gridState.ip_kA} kA</strong>
              </div>
            </div>

            <div className="hero-actions">
              <a href="#simulateur-etap" className="btn-scada btn-primary">
                [ ⚡ LANCER LE SIMULATEUR UNIFILAIRE ETAP ]
              </a>
              <a
                href="https://www.linkedin.com/in/pascalso/"
                target="_blank"
                rel="noreferrer"
                className="btn-scada btn-secondary"
              >
                [ CONTACTER PASCAL SO SUR LINKEDIN ↗ ]
              </a>
            </div>
          </div>
        </div>
      </main>

      {/* SECTION 1: Interactive ASCII Single-Line Diagram (SLD) Simulator */}
      <section id="simulateur-etap" className="scada-section">
        <div className="section-container">
          <div className="section-header">
            <div>
              <p className="section-eyebrow">// TERMINAL INTERACTIF 01 — SINGLE-LINE DIAGRAM (SLD)</p>
              <h2 className="section-title">
                Simulateur de Réseau HTB/HTA : <span>Load Flow (Newton-Raphson) & Court-Circuit IEC 60909</span>
              </h2>
            </div>
            <div className="mode-switcher" role="group" aria-label="Mode de calcul réseau">
              <button
                type="button"
                className={`mode-btn ${simMode === 'LOADFLOW' ? 'is-active' : ''}`}
                onClick={() => setSimMode('LOADFLOW')}
              >
                [ MODE LOAD FLOW (P, Q, ΔU%) ]
              </button>
              <button
                type="button"
                className={`mode-btn mode-btn-fault ${simMode === 'SHORTCIRCUIT' ? 'is-active-fault' : ''}`}
                onClick={() => setSimMode('SHORTCIRCUIT')}
              >
                [ ⚡ MODE COURT-CIRCUIT Icc (IEC 60909) ]
              </button>
            </div>
          </div>

          <div className="sld-workbench">
            {/* Left Control Console */}
            <aside className="sld-controls">
              <div className="control-block">
                <span className="control-title">01 // RÉGLEUR EN CHARGE TRANSFO (OLTC TR-101)</span>
                <p className="control-help">Ajuste le rapport de transformation 225/20 kV (±5%) pour réguler le plan de tension.</p>
                <div className="tap-controls">
                  <button
                    type="button"
                    className="scada-mini-btn"
                    onClick={() => setOltcTap((t) => Math.max(-5, t - 1))}
                  >
                    [ - PRISE ]
                  </button>
                  <span className="tap-readout">
                    PRISE : {oltcTap >= 0 ? `+${oltcTap}` : oltcTap}% ({(oltcTap * 1.25).toFixed(2)}% U)
                  </span>
                  <button
                    type="button"
                    className="scada-mini-btn"
                    onClick={() => setOltcTap((t) => Math.min(5, t + 1))}
                  >
                    [ + PRISE ]
                  </button>
                </div>
              </div>

              <div className="control-block">
                <span className="control-title">02 // COMPENSATION RÉACTIVE & TRANSITOIRE MOTEUR</span>
                <div className="toggle-stack">
                  <button
                    type="button"
                    className={`toggle-btn ${capBankOn ? 'is-on' : ''}`}
                    onClick={() => setCapBankOn((v) => !v)}
                  >
                    <span>BATTERIE HTA CAP-201 (+6.5 Mvar)</span>
                    <strong>{capBankOn ? 'EN SERVICE [ON]' : 'HORS SERVICE [OFF]'}</strong>
                  </button>

                  <button
                    type="button"
                    className={`toggle-btn ${motorStarting ? 'is-warn' : ''}`}
                    onClick={() => setMotorStarting((v) => !v)}
                  >
                    <span>MOTEUR HT 6.6 kV (4.5 MW - Id/In = 6x)</span>
                    <strong>{motorStarting ? 'DÉMARRAGE DIRECT' : 'RÉGIME NOMINAL'}</strong>
                  </button>
                </div>
              </div>

              <div className="control-block">
                <span className="control-title">03 // LOCALISATION DU DÉFAUT TRIPHASÉ (IEC 60909)</span>
                <div className="bus-selector">
                  {Object.values(FAULT_BUS_CONFIG).map((bus) => (
                    <button
                      key={bus.id}
                      type="button"
                      className={`bus-btn ${faultBus === bus.id ? 'is-selected' : ''}`}
                      onClick={() => {
                        setFaultBus(bus.id);
                        setSimMode('SHORTCIRCUIT');
                      }}
                    >
                      <span>{bus.label}</span>
                      <code>Un = {bus.unKv} kV</code>
                    </button>
                  ))}
                </div>
                <div className="factor-row">
                  <span>Facteur de tension c (IEC 60909) :</span>
                  <div className="factor-buttons">
                    <button
                      type="button"
                      className={`scada-mini-btn ${voltageFactorC === 1.1 ? 'is-active' : ''}`}
                      onClick={() => setVoltageFactorC(1.1)}
                    >
                      c_max = 1.10 (Icc Max)
                    </button>
                    <button
                      type="button"
                      className={`scada-mini-btn ${voltageFactorC === 1.0 ? 'is-active' : ''}`}
                      onClick={() => setVoltageFactorC(1.0)}
                    >
                      c_min = 1.00 (Icc Min)
                    </button>
                  </div>
                </div>
              </div>
            </aside>

            {/* Right ASCII SLD & Numerical Output */}
            <div className="sld-display">
              <div className="terminal-window">
                <div className="terminal-bar">
                  <span>
                    ETAP® SCHÉMA UNIFILAIRE ASCII //{' '}
                    {isFaultMode ? 'ANALYSE COURT-CIRCUIT CEI 60909' : 'LOAD FLOW NEWTON-RAPHSON'}
                  </span>
                  <span>SOLVER: CONVERGED (4 ITÉRATIONS)</span>
                </div>
                <pre className={`ascii-sld-pre ${isFaultMode ? 'is-fault' : ''}`}>{asciiSldDiagram}</pre>
              </div>

              {/* Live Engineering Report Matrix */}
              <div className="report-grid">
                <div className="report-card">
                  <div className="report-card-header">RAPPORT LOAD FLOW (TRANSIT & CHUTE DE TENSION)</div>
                  <div className="report-rows">
                    <div className="report-row">
                      <span>Puissance Apparente Totale (S)</span>
                      <strong>
                        {gridState.totalS_MVA} MVA ({gridState.totalP_MW} MW / {gridState.totalQ_Mvar} Mvar)
                      </strong>
                    </div>
                    <div className="report-row">
                      <span>Facteur de Puissance Global (cos φ)</span>
                      <strong className={Number(gridState.cosPhi) < 0.9 ? 'val-warn' : 'val-ok'}>
                        {gridState.cosPhi} {Number(gridState.cosPhi) >= 0.92 ? '[CONFORME TARIF VERT/HT]' : '[PÉNALITÉS Q]'}
                      </strong>
                    </div>
                    <div className="report-row">
                      <span>Tension BUS-200 (20 kV) & BUS-300 (6.6 kV)</span>
                      <strong className={Number(gridState.u300_pct) < 90 ? 'val-warn' : 'val-ok'}>
                        {gridState.u200_pct}% Un ({gridState.u200_kV} kV) / {gridState.u300_pct}% Un ({gridState.u300_kV} kV)
                      </strong>
                    </div>
                    <div className="report-row">
                      <span>Pertes Joule Réseau Actives (Σ I²R)</span>
                      <strong>{gridState.lossesKW} kW</strong>
                    </div>
                  </div>
                </div>

                <div className="report-card report-card-fault">
                  <div className="report-card-header">
                    BILAN COURT-CIRCUIT IEC 60909 // {gridState.busCfg.id} ({gridState.busCfg.unKv} kV)
                  </div>
                  <div className="report-rows">
                    <div className="report-row">
                      <span>I&quot;k3 (Courant subtransitoire initial)</span>
                      <strong className="val-fault">{gridState.ik3_kA} kA eff.</strong>
                    </div>
                    <div className="report-row">
                      <span>ip (Courant de crête électrodynamique, κ={gridState.kappa})</span>
                      <strong className="val-warn">{gridState.ip_kA} kA crête</strong>
                    </div>
                    <div className="report-row">
                      <span>Ib (Coupé sym.) / Ith (Thermique 1s)</span>
                      <strong>
                        {gridState.ib_kA} kA / {gridState.ith_kA} kA·√s
                      </strong>
                    </div>
                    <div className="report-row">
                      <span>Vérification PdC Disjoncteur ({gridState.busCfg.breakerRatingKa} kA)</span>
                      <strong className="val-ok">
                        CONFORME (Marge +{gridState.breakerMarginPct}% // {gridState.busCfg.relayCode})
                      </strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: ASCII Oscilloscope & Protection Coordination TCC */}
      <section id="oscilloscope-ascii" className="scada-section scada-section-alt">
        <div className="section-container">
          <div className="section-header">
            <div>
              <p className="section-eyebrow">// TERMINAL INTERACTIF 02 — TRANSITOIRE & PROTECTION STAR</p>
              <h2 className="section-title">
                Oscilloscope ASCII : <span>Onde Asymétrique de Court-Circuit i(t) & Courbe TCC (ANSI 50/51)</span>
              </h2>
            </div>
            <div className="mode-switcher">
              <button
                type="button"
                className={`mode-btn ${scopeView === 'WAVEFORM' ? 'is-active' : ''}`}
                onClick={() => setScopeView('WAVEFORM')}
              >
                [ OSCILLOSCOPE ONDE i(t) ]
              </button>
              <button
                type="button"
                className={`mode-btn ${scopeView === 'TCC' ? 'is-active' : ''}`}
                onClick={() => setScopeView('TCC')}
              >
                [ COURBE DE SÉLECTIVITÉ TCC (ANSI 51) ]
              </button>
            </div>
          </div>

          <div className="scope-layout">
            <div className="scope-canvas-wrap">
              <canvas ref={scopeRef} className="ascii-scope-canvas" />
            </div>

            <div className="scope-sidebar">
              {scopeView === 'WAVEFORM' ? (
                <div className="control-block">
                  <span className="control-title">PARAMÈTRE RÉSEAU : RAPPORT X/R ({xOverR})</span>
                  <p className="control-help">
                    Plus le rapport X/R est élevé (proximité d&apos;un alternateur ou transfo HTB), plus la composante
                    apériodique continue décroît lentement, augmentant le courant de crête asymétrique ip.
                  </p>
                  <input
                    type="range"
                    min="4"
                    max="45"
                    value={xOverR}
                    onChange={(e) => setXOverR(Number(e.target.value))}
                    className="scada-slider"
                    aria-label="Rapport X sur R"
                  />
                  <div className="formula-box">
                    <code>κ = 1.02 + 0.98·e^(-3·R/X) = {(1.02 + 0.98 * Math.exp(-3 / xOverR)).toFixed(3)}</code>
                    <code>τ = X / (ω·R) = {((xOverR / (2 * Math.PI * 50)) * 1000).toFixed(1)} ms</code>
                    <code>ip = {((1.02 + 0.98 * Math.exp(-3 / xOverR)) * Math.SQRT2 * Number(gridState.ik3_kA)).toFixed(1)} kA</code>
                  </div>
                </div>
              ) : (
                <div className="control-block">
                  <span className="control-title">COORDINATION CHRONOMÉTRIQUE : TMS AMONT ({tmsUpstream.toFixed(2)})</span>
                  <p className="control-help">
                    Ajustez le Time Multiplier Setting (TMS) du relais d&apos;arrivée 20 kV pour garantir un intervalle
                    de sélectivité Δt ≥ 250 ms avec le départ 6.6 kV aval.
                  </p>
                  <input
                    type="range"
                    min="0.18"
                    max="0.55"
                    step="0.02"
                    value={tmsUpstream}
                    onChange={(e) => setTmsUpstream(Number(e.target.value))}
                    className="scada-slider"
                    aria-label="Réglage TMS Amont"
                  />
                  <div className="formula-box">
                    <code>Courbe IEC 60255 : Standard Inverse (SI)</code>
                    <code>Δt sélectivité = {Math.round((tmsUpstream - 0.14) * 1450)} ms</code>
                    <code>
                      Statut :{' '}
                      {Math.round((tmsUpstream - 0.14) * 1450) >= 250
                        ? 'SÉLECTIVITÉ TOTALE GARANTIE'
                        : 'ALERTE : Δt < 250 ms'}
                    </code>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: Technical Modules & Case Studies */}
      <section id="expertise-hv" className="scada-section">
        <div className="section-container">
          <div className="section-header">
            <div>
              <p className="section-eyebrow">// DOSSIER D&apos;INGÉNIERIE — COMPÉTENCES & LIVRABLES</p>
              <h2 className="section-title">
                Architecture de Calcul Haute Tension sur <span>ETAP® Software</span>
              </h2>
            </div>
          </div>

          <div className="modules-grid">
            {EXPERTISE_MODULES.map((mod) => (
              <article key={mod.code} className="module-card">
                <div className="module-top">
                  <span className="module-code">{mod.code}</span>
                  <span className="module-std">{mod.standard}</span>
                </div>
                <h3 className="module-title">{mod.title}</h3>
                <p className="module-summary">{mod.summary}</p>
                <pre className="module-formula">{mod.asciiFormula}</pre>
                <ul className="module-tags">
                  {mod.metrics.map((m) => (
                    <li key={m}>{m}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>

          {/* Case Studies Banner */}
          <div className="cases-box">
            <div className="cases-header">
              <span>// RÉFÉRENCES D&apos;ÉTUDES DE RÉSEAUX & NOTES DE CALCUL</span>
              <span>VALIDATION CONFORMITÉ CEI / GRID CODE</span>
            </div>
            <div className="cases-grid">
              {CASE_STUDIES.map((cs) => (
                <div key={cs.id} className="case-item">
                  <span className="case-id">[{cs.id}] {cs.sector}</span>
                  <strong>{cs.scope}</strong>
                  <p>{cs.result}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer / Direct Social & Contact Terminal */}
      <footer className="scada-footer">
        <div className="section-container scada-footer-inner">
          <div>
            <strong>SODURAL // PASCAL SO — INGÉNIEUR CALCUL HAUTE TENSION (ETAP® / LOAD FLOW / Icc)</strong>
            <p>
              Disponible pour études de réseaux électriques HTB/HTA, notes de calcul IEC 60909, bilans de puissance,
              plans de protection et missions d&apos;expertise.
            </p>
          </div>
          <a
            href="https://www.linkedin.com/in/pascalso/"
            target="_blank"
            rel="noreferrer"
            className="btn-scada btn-primary"
          >
            [ ÉCHANGER SUR LINKEDIN // PASCAL SO ↗ ]
          </a>
        </div>
      </footer>
    </div>
  );
}

export default App;
