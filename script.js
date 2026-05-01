'use strict';

/* ================================================
   月音香 心身調律アライメントマップ — script.js
   ================================================ */

/* -----------------------------------------------
   1. パーティクルシステム（Canvas）
----------------------------------------------- */
(function initParticles() {
  var canvas = document.getElementById('particle-canvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var particles = [];
  var raf;

  var COLORS = [
    'rgba(200,168,75,',   /* ゴールド */
    'rgba(180,150,220,',  /* ラベンダー */
    'rgba(255,255,255,',  /* ホワイト */
    'rgba(240,216,150,',  /* 淡金 */
  ];

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function mkParticle() {
    return {
      x:  Math.random() * canvas.width,
      y:  Math.random() * canvas.height,
      r:  Math.random() * 1.4 + 0.4,
      col: COLORS[Math.floor(Math.random() * COLORS.length)],
      a:  Math.random() * 0.5 + 0.08,
      da: (Math.random() < 0.5 ? 1 : -1) * (Math.random() * 0.004 + 0.001),
      dx: (Math.random() - 0.5) * 0.15,
      dy: -(Math.random() * 0.25 + 0.05),
    };
  }

  function init() {
    resize();
    particles = [];
    var n = Math.min(90, Math.floor(canvas.width * canvas.height / 10000));
    for (var i = 0; i < n; i++) particles.push(mkParticle());
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(function(p) {
      p.a += p.da;
      if (p.a > 0.65 || p.a < 0.05) p.da *= -1;
      p.x += p.dx;
      p.y += p.dy;
      if (p.y < -4) { p.y = canvas.height + 4; p.x = Math.random() * canvas.width; }
      if (p.x < -4) p.x = canvas.width + 4;
      if (p.x > canvas.width + 4) p.x = -4;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.col + p.a.toFixed(2) + ')';
      ctx.fill();
    });
    raf = requestAnimationFrame(draw);
  }

  init();
  draw();
  window.addEventListener('resize', function() {
    cancelAnimationFrame(raf);
    init();
    draw();
  });
})();


/* -----------------------------------------------
   2. フェードイン（IntersectionObserver）
----------------------------------------------- */
(function initFadeIn() {
  var targets = document.querySelectorAll('.fade-in');
  if (!('IntersectionObserver' in window)) {
    targets.forEach(function(el) { el.classList.add('visible'); });
    return;
  }
  var obs = new IntersectionObserver(function(entries) {
    entries.forEach(function(e) {
      if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
    });
  }, { threshold: 0.1 });
  targets.forEach(function(el) { obs.observe(el); });
})();


/* -----------------------------------------------
   3. セッションフォーム送信
----------------------------------------------- */
(function initSessionForm() {
  var form      = document.getElementById('session-form');
  var success   = document.getElementById('form-success');
  var submitBtn = document.getElementById('submit-btn');
  if (!form || !success) return;

  form.addEventListener('submit', function(e) {
    e.preventDefault();
    var action = form.getAttribute('action') || '';
    if (action.indexOf('YOUR_FORMSPREE_ID') !== -1) { showSuccess(); return; }
    submitBtn.disabled = true;
    submitBtn.textContent = '送信中…';
    fetch(action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } })
      .then(function(r) { if (r.ok) showSuccess(); else throw new Error(); })
      .catch(function() {
        submitBtn.disabled = false;
        submitBtn.textContent = '申し込む';
        alert('送信に失敗しました。時間をおいて再度お試しください。');
      });
  });

  function showSuccess() {
    form.setAttribute('hidden', '');
    success.removeAttribute('hidden');
    success.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
})();


/* -----------------------------------------------
   4. 診断ロジック
----------------------------------------------- */
(function initDiagnosis() {

  /* ---- 気質データ ---- */
  var TYPES = {
    hakuryu: {
      id: 'hakuryu', name: '白龍', kana: 'はくりゅう',
      element: '金', keyword: '洞察・超越・本質',
      colorClass: 'rc-hakuryu', badgeClass: 'badge-hakuryu',
      essence: [
        '静かな知性と透徹した洞察力を持ちます。感情よりも思考が先立ち、物事の本質を深く読み解く力があります。',
        '複雑な状況を静かに整理し、本質を見極める才能は、あなたの内側に宿る白龍の力そのものです。'
      ].join(''),
      secondaryMod: '白龍の洞察力がさらに奥行きを加え、物事の核心をより静かに、より深く見通す力を持ちます。',
      care: {
        inner:  '「考えること」を一時的に手放し、「感じること」へ意識を向けましょう。答えのない問いをゆっくり味わう時間が、白龍を深く整えます。',
        body:   '深呼吸と温める養生が鍵。腎・背中を温めることで、思考の過熱を静めることができます。',
        action: 'ひとつのことに集中する時間を意識的に作りましょう。静寂の中でこそ、白龍の洞察は研ぎ澄まされます。'
      },
      experience: 'セイクレッドマウンテン（深い静寂と本質へのアクセスを助けます）/ ホワイトアンジェリカ（高次の保護と明晰さをもたらします）',
      original: { name: '白龍の雫', note: '白龍の氣質のために月音香が特別に調合したエッセンスです。深い洞察と静けさを内側から整えます。' },
      bush: 'Angelsword / Fringed Violet',
      indigo: 'Happy',
      imbalanceBase: '思考が活発な白龍は、考えすぎることで頭部・首・肩に緊張が生まれやすい傾向があります。',
      svgIcon: '<svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="28" cy="28" r="20" stroke="#c8a84b" stroke-width="0.6" opacity="0.35"/><circle cx="28" cy="28" r="14" stroke="#c8a84b" stroke-width="0.8" opacity="0.45"/><circle cx="28" cy="28" r="10" fill="rgba(255,255,255,0.75)"/><circle cx="24" cy="24" r="3.5" fill="white" opacity="0.5"/><path d="M40,11 C46,18 43,27 36,30 C29,33 23,29 24,22 C25,16 31,11 37,12" stroke="#c8a84b" stroke-width="1.8" fill="none" stroke-linecap="round"/><path d="M16,45 C10,38 13,29 20,26 C27,23 33,27 32,34 C31,40 25,45 19,44" stroke="#c8a84b" stroke-width="1.4" fill="none" stroke-linecap="round" opacity="0.55"/></svg>'
    },
    toka: {
      id: 'toka', name: '灯火', kana: 'とうか',
      element: '火', keyword: '発動・情熱・温もり',
      colorClass: 'rc-toka', badgeClass: 'badge-toka',
      essence: [
        '発動と情熱のエネルギーを持ちます。思い立ったらすぐに動き出す推進力と、周囲を明るく照らす温かさがあります。',
        'その発動の速さと熱量は、あなたの最大の強みのひとつです。'
      ].join(''),
      secondaryMod: '灯火の発動力が加わり、内に宿る思いを形にするエネルギーがさらに際立ちます。',
      care: {
        inner:  '発動する前に、ひと息おく習慣を。衝動と直感を区別することで、エネルギーが安定します。',
        body:   '過剰な熱を逃がすケアを。水分補給、冷やす食材、十分な睡眠が灯火のバランスを整えます。',
        action: '「やりたい」気持ちを大切にしながら、スピードを意図的に調節してみましょう。'
      },
      experience: 'リリース（抑圧されたエネルギーの発動を助けます）/ パチュリー（熱を静め、地に足をつける助けになります）',
      original: null,
      bush: 'Black-eyed Susan / Crowea',
      indigo: 'Tantrum Tamer',
      imbalanceBase: '発動力が強い灯火は、エネルギーの消耗が速く、熱のこもりや燃え尽きが起こりやすい傾向があります。',
      svgIcon: '<svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="tg" x1="0.5" y1="1" x2="0.5" y2="0"><stop offset="0%" stop-color="#cc3300"/><stop offset="50%" stop-color="#ff7700"/><stop offset="90%" stop-color="#ffd040"/></linearGradient></defs><path d="M28,7 C28,7 40,19 40,30 C40,40 35,49 28,49 C21,49 16,40 16,30 C16,19 28,7 28,7Z" fill="url(#tg)" opacity="0.88"/><path d="M28,21 C28,21 36,29 36,36 C36,41.5 32.5,46 28,46 C23.5,46 20,41.5 20,36 C20,29 28,21 28,21Z" fill="#ffe080" opacity="0.7"/><ellipse cx="28" cy="40" rx="5" ry="7" fill="white" opacity="0.5"/></svg>'
    },
    fuki: {
      id: 'fuki', name: '風氣', kana: 'ふうき',
      element: '木', keyword: '閃・変化・自由',
      colorClass: 'rc-fuki', badgeClass: 'badge-fuki',
      essence: [
        '閃きと変化のエネルギーを持ちます。次々と浮かぶ閃きと、変化への柔軟な適応力があります。',
        '枠にとらわれない発想が、あなたの周囲に新しい可能性をもたらします。'
      ].join(''),
      secondaryMod: '風氣の閃きと柔軟性が加わり、変化の中でもしなやかに輝くことができます。',
      care: {
        inner:  '閃きをひとつずつ丁寧に扱いましょう。アイデアを書き出し、優先順位をつけることで混乱が整っていきます。',
        body:   '腸と神経系のケアが鍵。規則正しい食事・就寝時間が風氣の安定を助けます。',
        action: 'ひとつのことを完了させてから次へ進む練習を、少しずつ始めましょう。'
      },
      experience: 'レモン（思考をクリアにし、閃きを整流します）/ R.C（呼吸を深め、神経系を落ち着かせます）',
      original: null,
      bush: 'Bush Fuchsia / Jacaranda',
      indigo: 'Settle',
      imbalanceBase: '閃きが豊富な風氣は、集中が分散しやすく、神経系の過活動が体に影響しやすい傾向があります。',
      svgIcon: '<svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10,18 Q22,11 28,18 Q34,25 46,18" stroke="#2aad8a" stroke-width="2.2" fill="none" stroke-linecap="round"/><path d="M8,28 Q20,21 28,28 Q36,35 48,28" stroke="#2aad8a" stroke-width="1.8" fill="none" stroke-linecap="round" opacity="0.7"/><path d="M10,38 Q22,31 28,38 Q34,45 46,38" stroke="#2aad8a" stroke-width="1.3" fill="none" stroke-linecap="round" opacity="0.4"/><circle cx="28" cy="28" r="6" fill="none" stroke="#2aad8a" stroke-width="1.4"/><circle cx="28" cy="28" r="3" fill="#2aad8a" opacity="0.55"/><circle cx="28" cy="28" r="1.2" fill="white" opacity="0.8"/></svg>'
    },
    gekka: {
      id: 'gekka', name: '月華', kana: 'げっか',
      element: '水', keyword: '共感・受容・静寂',
      colorClass: 'rc-gekka', badgeClass: 'badge-gekka',
      essence: [
        '深い共感と受容のエネルギーを持ちます。人の気持ちに寄り添い、繊細に感じ取る力があります。',
        'その優しさと受容力が、周囲に安らぎをもたらしています。'
      ].join(''),
      secondaryMod: '月華の深い共感力が加わり、人の心に寄り添う繊細さがさらに際立ちます。',
      care: {
        inner:  '人の感情と自分の感情を、少しずつ切り離す練習を。「感じること」と「飲み込まれること」は違います。',
        body:   '肺と皮膚のケアを意識しましょう。深呼吸、アロマ、温かいお風呂が月華を整えます。',
        action: '「ノー」と言う練習を、やさしく少しずつ始めましょう。境界線を引くことは、自己尊重の表れです。'
      },
      experience: 'ホワイトアンジェリカ（境界線を守り、共感疲れを癒します）/ ピューリフィケーション（感情の浄化と空間の清浄化を助けます）',
      original: { name: '祈光水', note: '月華の氣質のために月音香が特別に調合したエッセンスです。深い受容と感情の浄化をやさしく整えます。' },
      bush: 'Five Corners / Pink Flannel Flower',
      indigo: 'Invisible Friend',
      imbalanceBase: '共感力が高い月華は、感情を受け取りすぎることで消耗しやすく、肺や皮膚に影響が出やすい傾向があります。',
      svgIcon: '<svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M28,6 A20,20 0 1,1 28,44 A13,13 0 1,0 28,6Z" fill="#a855c8" opacity="0.75"/><path d="M22,10 A16,16 0 0,0 18,32" stroke="white" stroke-width="1.2" fill="none" stroke-linecap="round" opacity="0.4"/><ellipse cx="28" cy="50" rx="6" ry="3.5" fill="#c084e0" opacity="0.7"/><ellipse cx="19" cy="48" rx="5" ry="2.8" fill="#c084e0" opacity="0.45" transform="rotate(-18,19,48)"/><ellipse cx="37" cy="48" rx="5" ry="2.8" fill="#c084e0" opacity="0.45" transform="rotate(18,37,48)"/><circle cx="44" cy="14" r="1.5" fill="#e0b0ff" opacity="0.7"/><circle cx="14" cy="22" r="1.2" fill="#e0b0ff" opacity="0.5"/></svg>'
    },
    daichi: {
      id: 'daichi', name: '大地', kana: 'だいち',
      element: '土', keyword: '安定・持続・滋養',
      colorClass: 'rc-daichi', badgeClass: 'badge-daichi',
      essence: [
        '安定と持続のエネルギーを持ちます。コツコツと積み上げる力と、揺るぎない安定感があります。',
        '変化の中でも地に足をつけ、周囲に安心感を与える存在です。'
      ].join(''),
      secondaryMod: '大地の安定感と持続力が加わり、継続して形にする力がさらに確かになります。',
      care: {
        inner:  '「完璧でなくていい」と自分に許可しましょう。思考の渦から一度降りることが、整えの第一歩です。',
        body:   '胃腸のケアが最優先。腸を温め、よく噛んで食べることが大地の安定をもたらします。',
        action: '小さな行動から始めましょう。「完璧な計画」より「不完全な実行」を選ぶ練習を。'
      },
      experience: 'パチュリー（大地への根付きと安定をもたらします）/ DiGize（消化器系をサポートし、大地のエネルギーを整えます）/ Young Valor（自己信頼を育てます）',
      original: null,
      bush: 'Banksia Robur / Sturt Desert Pea',
      indigo: 'Confidence',
      imbalanceBase: '思考が深い大地は、考えすぎて動けなくなりやすく、消化器系への影響が出やすい傾向があります。',
      svgIcon: '<svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6,42 L18,22 L28,35 L36,16 L50,42Z" fill="#b87820" opacity="0.35"/><path d="M12,44 L28,14 L44,44Z" fill="#c8854a" opacity="0.82"/><path d="M28,14 L35,28 L21,28Z" fill="white" opacity="0.6"/><line x1="8" y1="44" x2="48" y2="44" stroke="#8b5a2b" stroke-width="0.8" opacity="0.35"/><path d="M22,44 Q18,50 14,53" stroke="#8b5a2b" stroke-width="1.8" stroke-linecap="round" fill="none" opacity="0.65"/><path d="M28,44 Q28,51 28,54" stroke="#8b5a2b" stroke-width="1.6" stroke-linecap="round" fill="none" opacity="0.55"/><path d="M34,44 Q38,50 42,53" stroke="#8b5a2b" stroke-width="1.8" stroke-linecap="round" fill="none" opacity="0.65"/></svg>'
    }
  };

  /* ---- 望診マッピング ---- */
  var BOUSHIN_MAP = {
    forehead: {
      msgs: {
        '2': 'おでこのくすみ・テカリは大地（腸・思考）への負荷のサイン',
        '3': 'おでこのブツブツは腸内環境の乱れを示しています',
        '4': 'おでこの乾燥は大地のエネルギー枯渇のサイン'
      }
    },
    eyebrow: {
      msgs: {
        '2': '眉間のシワ・張りは風氣（肝・ストレス）の滞りのサイン',
        '3': '眉間の赤みは肝への熱の停滞を示しています',
        '4': '眉間の緊張は閃きのエネルギーが詰まっているサイン'
      }
    },
    eye: {
      msgs: {
        '2': '目の疲れは感情・血のエネルギー消耗のサイン',
        '3': '目のクマは血の不足と深い疲労のサイン',
        '4': '目の充血は発動エネルギーの過多・熱の上昇のサイン'
      }
    },
    cheek: {
      msgs: {
        '2': '頬の乾燥は肺・月華のエネルギーが不足しているサイン',
        '3': '頬の赤みは肺に熱がこもっているサイン',
        '4': '頬の荒れは肺・免疫バリアの低下のサイン'
      }
    },
    nose: {
      msgs: {
        '2': '鼻のテカリは胃（脾・大地）のオーバーワークのサイン',
        '3': '鼻の赤みは消化器の熱こもりのサイン',
        '4': '鼻の毛穴の開きは腸内停滞のサイン'
      }
    },
    mouth: {
      msgs: {
        '2': '口の乾燥は発動エネルギーの過多・熱のサイン',
        '3': '顎の緊張はホルモンバランスの乱れのサイン',
        '4': '食いしばりは発動エネルギーが抑圧されているサイン'
      }
    }
  };

  /* ---- 状態変数 ---- */
  var step1Page = 0;
  var answers   = {};    /* q1–q15 → 1–5 */
  var boushin   = {};    /* forehead… → '1'–'4' */

  /* ---- DOM参照 ---- */
  var $startBtn    = document.querySelector('a[href="#diagnosis"].btn-start');
  var $step1Panel  = document.getElementById('diag-step1');
  var $step2Panel  = document.getElementById('diag-step2');
  var $resultsPanel= document.getElementById('diag-results');
  var $resultsContent = document.getElementById('diag-results-content');
  var $s1Pages     = document.querySelectorAll('.s1-page');
  var $s1Prev      = document.getElementById('s1-prev');
  var $s1Next      = document.getElementById('s1-next');
  var $s1Done      = document.getElementById('s1-done');
  var $s1Fill      = document.getElementById('s1-progress-fill');
  var $s1Label     = document.getElementById('s1-progress-label');
  var $s2Back      = document.getElementById('s2-back');
  var $s2Done      = document.getElementById('s2-done');

  if (!$step1Panel) return;

  /* ---- ユーティリティ ---- */
  function showPanel(panel) {
    [$step1Panel, $step2Panel, $resultsPanel].forEach(function(p) { p.hidden = true; });
    panel.hidden = false;
    setTimeout(function() {
      var top = panel.getBoundingClientRect().top + window.pageYOffset - 72;
      window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    }, 60);
  }

  function setShake(el) {
    el.classList.add('shake');
    setTimeout(function() { el.classList.remove('shake'); }, 600);
  }

  /* ---- STEP 1 ---- */
  function updateStep1UI() {
    $s1Pages.forEach(function(p, i) { p.hidden = i !== step1Page; });
    $s1Prev.hidden  = step1Page === 0;
    $s1Next.hidden  = step1Page === $s1Pages.length - 1;
    $s1Done.hidden  = step1Page !== $s1Pages.length - 1;
    var pct = ((step1Page + 1) / $s1Pages.length * 100).toFixed(0);
    $s1Fill.style.width = pct + '%';
    $s1Label.textContent = (step1Page + 1) + ' / ' + $s1Pages.length;
  }

  function validateStep1Page() {
    var page = $s1Pages[step1Page];
    var groups = page.querySelectorAll('.q-group');
    var allOk = true;
    groups.forEach(function(g) {
      if (!g.querySelector('input:checked')) {
        setShake(g);
        allOk = false;
      }
    });
    if (allOk) {
      page.querySelectorAll('input[type="radio"]:checked').forEach(function(inp) {
        answers[inp.name] = parseInt(inp.value, 10);
      });
    }
    return allOk;
  }

  function markGroupAnswered() {
    document.querySelectorAll('.q-group').forEach(function(g) {
      if (g.querySelector('input:checked')) g.classList.add('answered');
    });
  }

  $s1Next && $s1Next.addEventListener('click', function() {
    if (!validateStep1Page()) return;
    step1Page++;
    updateStep1UI();
    setTimeout(function() {
      var top = $step1Panel.getBoundingClientRect().top + window.pageYOffset - 72;
      window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    }, 60);
  });

  $s1Prev && $s1Prev.addEventListener('click', function() {
    step1Page--;
    updateStep1UI();
    setTimeout(function() {
      var top = $step1Panel.getBoundingClientRect().top + window.pageYOffset - 72;
      window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    }, 60);
  });

  $s1Done && $s1Done.addEventListener('click', function() {
    if (!validateStep1Page()) return;
    showPanel($step2Panel);
  });

  /* 選択時の視覚フィードバック */
  $step1Panel.addEventListener('change', function(e) {
    if (e.target.type !== 'radio') return;
    var g = e.target.closest('.q-group');
    if (g) g.classList.add('answered');
  });

  updateStep1UI();

  /* ---- STEP 2 ---- */
  var BOUSHIN_AREAS = ['forehead','eyebrow','eye','cheek','nose','mouth'];

  $step2Panel.addEventListener('change', function(e) {
    if (e.target.type !== 'radio') return;
    var card = e.target.closest('.boushin-card');
    if (card) card.classList.add('answered');
  });

  $s2Back && $s2Back.addEventListener('click', function() { showPanel($step1Panel); });

  $s2Done && $s2Done.addEventListener('click', function() {
    var allOk = true;
    BOUSHIN_AREAS.forEach(function(area) {
      var chk = document.querySelector('input[name="' + area + '"]:checked');
      if (!chk) {
        var card = document.querySelector('[data-area="' + area + '"]');
        if (card) { setShake(card); card.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
        allOk = false;
      } else {
        boushin[area] = chk.value;
      }
    });
    if (!allOk) return;
    renderResults();
    showPanel($resultsPanel);
  });

  /* ---- スコア計算 ---- */
  function calcScores() {
    return {
      hakuryu: (answers.q1||0)  + (answers.q6||0)  + (answers.q11||0),
      toka:    (answers.q2||0)  + (answers.q7||0)  + (answers.q12||0),
      fuki:    (answers.q3||0)  + (answers.q8||0)  + (answers.q13||0),
      gekka:   (answers.q4||0)  + (answers.q9||0)  + (answers.q14||0),
      daichi:  (answers.q5||0)  + (answers.q10||0) + (answers.q15||0)
    };
  }

  /* ---- 現在の状態テキスト生成 ---- */
  function buildStateText(primaryId, secondaryId) {
    var primary = TYPES[primaryId];
    var imbalances = [];
    BOUSHIN_AREAS.forEach(function(area) {
      var val = boushin[area];
      if (val && val !== '1' && BOUSHIN_MAP[area] && BOUSHIN_MAP[area].msgs[val]) {
        imbalances.push(BOUSHIN_MAP[area].msgs[val]);
      }
    });

    var text = primary.imbalanceBase;
    if (imbalances.length === 0) {
      text += '\n\n望診では大きな偏りは見られませんでした。引き続き、' + primary.name + 'の傾向に合ったセルフケアを続けていきましょう。';
    } else if (imbalances.length === 1) {
      text += '\n\n今の望診では、' + imbalances[0] + 'が見られます。';
    } else if (imbalances.length === 2) {
      text += '\n\n今の望診では、' + imbalances[0] + '。さらに、' + imbalances[1] + 'も読み取れます。';
    } else {
      text += '\n\n今の望診では、' + imbalances.slice(0,-1).join('、') + '。そして、' + imbalances[imbalances.length-1] + 'が重なって現れています。';
    }
    return text;
  }

  /* ---- 結果HTML構築 ---- */
  function buildEssenceHTML(t) {
    var html = '';
    if (t.original) {
      html += '<div class="essence-original">' +
        '<p class="essence-original-tag">✦ 月音香オリジナル</p>' +
        '<p class="essence-original-name">' + t.original.name + '</p>' +
        '<p class="essence-original-note">' + t.original.note + '</p>' +
        '</div>';
    }
    html += '<div class="essence-section"><p class="essence-cat">Bush Flower Essences</p><p class="essence-names">' + t.bush + '</p></div>';
    html += '<div class="essence-section"><p class="essence-cat">インディゴチルドレン</p><p class="essence-names">' + t.indigo + '</p></div>';
    return html;
  }

  function buildResultHTML(primary, secondary, stateText) {
    var html = '';

    /* ── ヘッダー：主×副 ── */
    html += '<div class="result-header">' +
      '<p class="result-pretext">あなたの本質は…</p>' +
      '<div class="result-types-row">' +
        '<div class="type-badge ' + primary.badgeClass + '">' +
          '<div class="type-badge-icon">' + primary.svgIcon + '</div>' +
          '<p class="type-badge-role">主気質</p>' +
          '<p class="type-badge-name">' + primary.name + '</p>' +
          '<p class="type-badge-kana">' + primary.kana + '</p>' +
        '</div>' +
        '<div class="types-cross">×</div>' +
        '<div class="type-badge ' + secondary.badgeClass + '">' +
          '<div class="type-badge-icon">' + secondary.svgIcon + '</div>' +
          '<p class="type-badge-role">副気質</p>' +
          '<p class="type-badge-name">' + secondary.name + '</p>' +
          '<p class="type-badge-kana">' + secondary.kana + '</p>' +
        '</div>' +
      '</div>' +
      '<p class="result-type-title">あなたは ' + primary.name + ' × ' + secondary.name + ' タイプです</p>' +
      '<p class="result-type-sub">' + primary.element + ' の氣 × ' + secondary.element + ' の氣</p>' +
    '</div>';

    /* ── ① 本質 ── */
    html += '<div class="result-card ' + primary.colorClass + '">' +
      '<p class="rc-title"><span class="rc-num">①</span>本質</p>' +
      '<div class="rc-body">' +
        '<p>' + primary.essence + '</p>' +
        '<p>' + secondary.secondaryMod + '</p>' +
      '</div>' +
    '</div>';

    /* ── ② 現在の状態 ── */
    html += '<div class="result-card rc-state">' +
      '<p class="rc-title"><span class="rc-num">②</span>現在の状態（未病）</p>' +
      '<div class="rc-body"><p>' + stateText.replace(/\n/g,'<br>') + '</p></div>' +
    '</div>';

    /* ── ③ 整え方 ── */
    html += '<div class="result-card ' + primary.colorClass + '">' +
      '<p class="rc-title"><span class="rc-num">③</span>整え方</p>' +
      '<div class="care-grid">' +
        '<div class="care-item"><p class="care-label">内面</p><p class="care-text">' + primary.care.inner + '</p></div>' +
        '<div class="care-item"><p class="care-label">身体</p><p class="care-text">' + primary.care.body + '</p></div>' +
        '<div class="care-item"><p class="care-label">行動</p><p class="care-text">' + primary.care.action + '</p></div>' +
      '</div>' +
    '</div>';

    /* ── ④ おすすめ体験 ── */
    html += '<div class="result-card rc-state">' +
      '<p class="rc-title"><span class="rc-num">④</span>おすすめ体験</p>' +
      '<div class="rc-body">' +
        '<p style="margin-bottom:0.4rem;font-size:0.75rem;letter-spacing:0.12em;color:rgba(200,168,75,0.75);">気質別アロマ</p>' +
        '<p>' + primary.experience + '</p>' +
        '<p style="margin-top:0.8rem;font-size:0.82rem;color:rgba(220,210,240,0.55);">今のあなたに必要な整え方として、このアロマが心と体のバランスを整える助けになります。</p>' +
      '</div>' +
    '</div>';

    /* ── ⑤ おすすめエッセンス ── */
    html += '<div class="result-card rc-state">' +
      '<p class="rc-title"><span class="rc-num">⑤</span>おすすめエッセンス</p>' +
      '<div class="rc-body">' + buildEssenceHTML(primary) + '</div>' +
    '</div>';

    /* ── ⑥ CTA ── */
    html += '<div class="result-cta-section">' +
      '<p class="cta-lead">この状態を整えるための個別アドバイスをお届けします</p>' +
      '<a href="https://lin.ee/pZutbEM" class="btn-cta-gold" target="_blank" rel="noopener noreferrer">' +
        '<span class="btn-cta-gold-inner">今のあなたを整える</span>' +
      '</a>' +
      '<div class="qr-wrap">' +
        '<img src="assets/qr-line.png" width="150" height="150" alt="公式LINE QRコード" class="qr-img"' +
          ' onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'" />' +
        '<div class="qr-placeholder" style="display:none">' +
          '<svg viewBox="0 0 150 150" width="150" height="150">' +
            '<rect width="150" height="150" rx="8" fill="rgba(255,255,255,0.06)" stroke="rgba(200,168,75,0.3)" stroke-width="1"/>' +
            '<rect x="12" y="12" width="48" height="48" rx="4" fill="none" stroke="#c8a84b" stroke-width="2.5"/>' +
            '<rect x="22" y="22" width="28" height="28" rx="2" fill="#c8a84b" opacity="0.6"/>' +
            '<rect x="90" y="12" width="48" height="48" rx="4" fill="none" stroke="#c8a84b" stroke-width="2.5"/>' +
            '<rect x="100" y="22" width="28" height="28" rx="2" fill="#c8a84b" opacity="0.6"/>' +
            '<rect x="12" y="90" width="48" height="48" rx="4" fill="none" stroke="#c8a84b" stroke-width="2.5"/>' +
            '<rect x="22" y="100" width="28" height="28" rx="2" fill="#c8a84b" opacity="0.6"/>' +
            '<rect x="90" y="90" width="10" height="10" fill="#c8a84b" opacity="0.5"/>' +
            '<rect x="110" y="90" width="10" height="10" fill="#c8a84b" opacity="0.5"/>' +
            '<rect x="130" y="90" width="10" height="10" fill="#c8a84b" opacity="0.5"/>' +
            '<rect x="90" y="110" width="10" height="10" fill="#c8a84b" opacity="0.5"/>' +
            '<rect x="130" y="110" width="10" height="10" fill="#c8a84b" opacity="0.5"/>' +
            '<rect x="90" y="130" width="30" height="10" fill="#c8a84b" opacity="0.5"/>' +
            '<rect x="130" y="130" width="10" height="10" fill="#c8a84b" opacity="0.5"/>' +
            '<text x="75" y="160" text-anchor="middle" font-size="8" fill="rgba(200,168,75,0.5)">QR準備中</text>' +
          '</svg>' +
        '</div>' +
        '<p class="qr-caption">公式LINE QRコード</p>' +
      '</div>' +
      '<a href="#session" class="btn-session">個別セッションを申し込む</a>' +
    '</div>';

    html += '<div class="result-retry"><button class="btn-ghost-diag" id="quiz-retry">もう一度診断する</button></div>';

    return html;
  }

  /* ---- 結果レンダリング ---- */
  function renderResults() {
    var scores = calcScores();
    var sorted = Object.keys(scores).sort(function(a,b){ return scores[b]-scores[a]; });
    var primaryId   = sorted[0];
    var secondaryId = sorted[1];
    var primary   = TYPES[primaryId];
    var secondary = TYPES[secondaryId];
    var stateText = buildStateText(primaryId, secondaryId);

    $resultsContent.innerHTML = buildResultHTML(primary, secondary, stateText);

    /* タイプ別クラス適用 */
    var RES_CLASSES = ['res-hakuryu','res-toka','res-fuki','res-gekka','res-daichi'];
    RES_CLASSES.forEach(function(c){ $resultsPanel.classList.remove(c); });
    $resultsPanel.classList.add('res-' + primaryId);

    /* リトライボタン */
    var retryBtn = document.getElementById('quiz-retry');
    if (retryBtn) {
      retryBtn.addEventListener('click', function() {
        /* リセット */
        answers = {}; boushin = {}; step1Page = 0;
        RES_CLASSES.forEach(function(c){ $resultsPanel.classList.remove(c); });
        document.querySelectorAll('.q-group, .boushin-card').forEach(function(el) { el.classList.remove('answered'); });
        document.querySelectorAll('input[type="radio"]').forEach(function(r) { r.checked = false; });
        updateStep1UI();
        showPanel($step1Panel);
      });
    }
  }

  /* ---- ヒーローの「診断を始める」 ---- */
  if ($startBtn) {
    $startBtn.addEventListener('click', function(e) {
      e.preventDefault();
      $step1Panel.hidden = false;
      $step2Panel.hidden = true;
      $resultsPanel.hidden = true;
      setTimeout(function() {
        setTimeout(function() {
      var top = $step1Panel.getBoundingClientRect().top + window.pageYOffset - 72;
      window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    }, 60);
      }, 80);
    });
  }

})();
