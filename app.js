(function () {
  'use strict';

  var config = window.JANA_HUB_CONFIG || {};
  var modal = document.getElementById('modal');
  var modalContent = document.getElementById('modalContent');
  var closeModalButton = document.getElementById('closeModal');
  var toast = document.getElementById('toast');
  var parentTrigger = document.getElementById('parentTrigger');
  var parentHoldTimer = null;
  var danceTimer = null;
  var breathTimer = null;
  var currentSpeech = null;

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function loadSettings() {
    var saved = null;
    try { saved = JSON.parse(localStorage.getItem('janaHubSettings') || 'null'); } catch (e) { saved = null; }
    if (!saved) {
      saved = {
        parentPin: config.defaultParentPin || '2468',
        videos: config.initialVideos || []
      };
      saveSettings(saved);
    }
    if (!saved.videos) { saved.videos = []; }
    return saved;
  }

  function saveSettings(settings) {
    try { localStorage.setItem('janaHubSettings', JSON.stringify(settings)); } catch (e) {}
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.remove('hidden');
    window.setTimeout(function () { toast.classList.add('hidden'); }, 2200);
  }

  function setGreeting() {
    var hour = new Date().getHours();
    var word = 'Hello';
    if (hour < 12) { word = 'Good morning'; }
    else if (hour < 18) { word = 'Good afternoon'; }
    else { word = 'Good evening'; }
    document.getElementById('greeting').textContent = word + ', ' + (config.childName || 'Jana') + '!';

    var messages = [
      'You make today sparkle.',
      'Kind hearts make magic.',
      'Your imagination is a superpower.',
      'You are loved to the moon and back.',
      'Small smiles make big sunshine.'
    ];
    document.getElementById('kindMessage').textContent = messages[new Date().getDate() % messages.length];
  }

  function openModal(html) {
    stopActiveActivities();
    modalContent.innerHTML = html;
    modal.classList.remove('hidden');
  }

  function closeModal() {
    stopActiveActivities();
    modal.classList.add('hidden');
    modalContent.innerHTML = '';
  }

  function stopActiveActivities() {
    if (danceTimer) { clearInterval(danceTimer); danceTimer = null; }
    if (breathTimer) { clearTimeout(breathTimer); breathTimer = null; }
    if (window.speechSynthesis) { window.speechSynthesis.cancel(); }
    currentSpeech = null;
  }

  closeModalButton.addEventListener('click', closeModal);

  var cards = document.querySelectorAll('[data-open]');
  for (var i = 0; i < cards.length; i++) {
    cards[i].addEventListener('click', function () {
      var target = this.getAttribute('data-open');
      if (target === 'theatre') { showTheatre(); }
      if (target === 'dressup') { showDressup(); }
      if (target === 'stories') { showStories(); }
      if (target === 'colour') { showColour(); }
      if (target === 'dance') { showDance(); }
      if (target === 'calm') { showCalm(); }
    });
  }

  function extractYouTubeId(value) {
    var text = String(value || '').trim();
    if (/^[A-Za-z0-9_-]{11}$/.test(text)) { return text; }
    var patterns = [
      /[?&]v=([A-Za-z0-9_-]{11})/,
      /youtu\.be\/([A-Za-z0-9_-]{11})/,
      /youtube\.com\/shorts\/([A-Za-z0-9_-]{11})/,
      /youtube(?:-nocookie)?\.com\/embed\/([A-Za-z0-9_-]{11})/
    ];
    for (var i = 0; i < patterns.length; i++) {
      var match = text.match(patterns[i]);
      if (match) { return match[1]; }
    }
    return '';
  }

  function showTheatre() {
    var settings = loadSettings();
    if (!settings.videos.length) {
      openModal(
        '<div class="empty-state">' +
          '<div class="empty-icon">🏰</div>' +
          '<h2 id="modalTitle">Your theatre is getting ready</h2>' +
          '<p>Mum will choose the Barbie doll videos that are safe for you. Try Dress-Up Studio while you wait!</p>' +
        '</div>'
      );
      return;
    }

    var html = '<h2 id="modalTitle" class="modal-heading">Barbie Doll Theatre</h2>' +
      '<p class="modal-subtitle">Marli chose every video on this shelf.</p><div class="video-grid">';
    for (var i = 0; i < settings.videos.length; i++) {
      var video = settings.videos[i];
      var id = escapeHtml(video.id);
      html += '<button class="video-card" data-video-id="' + id + '" data-video-title="' + escapeHtml(video.title || ('Video ' + (i + 1))) + '">' +
        '<img src="https://img.youtube.com/vi/' + id + '/hqdefault.jpg" alt="">' +
        '<strong>' + escapeHtml(video.title || ('Magic video ' + (i + 1))) + '</strong></button>';
    }
    html += '</div>';
    openModal(html);

    var videoButtons = modalContent.querySelectorAll('[data-video-id]');
    for (var j = 0; j < videoButtons.length; j++) {
      videoButtons[j].addEventListener('click', function () {
        playVideo(this.getAttribute('data-video-id'), this.getAttribute('data-video-title'));
      });
    }
  }

  function playVideo(id, title) {
    var safeId = escapeHtml(id);
    modalContent.innerHTML = '<div class="video-player-wrap">' +
      '<iframe class="video-frame" title="' + escapeHtml(title) + '" ' +
      'src="https://www.youtube-nocookie.com/embed/' + safeId + '?rel=0&playsinline=1&autoplay=1" ' +
      'allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen ' +
      'sandbox="allow-scripts allow-same-origin allow-presentation"></iframe></div>';
  }

  function showDressup() {
    openModal(
      '<div class="dressup-layout">' +
        '<div class="doll-stage"><div class="doll">' +
          '<div class="doll-hair"></div><div class="doll-head"></div><div class="doll-face"></div><div class="doll-smile"></div><div class="doll-neck"></div>' +
          '<div class="doll-arm left"></div><div class="doll-arm right"></div><div id="dollTop" class="doll-top"></div><div id="dollSkirt" class="doll-skirt"></div>' +
          '<div class="doll-leg left"></div><div class="doll-leg right"></div><div class="doll-shoe left"></div><div class="doll-shoe right"></div>' +
          '<div id="accCrown" class="accessory crown">👑</div><div id="accBow" class="accessory bow">🎀</div><div id="accWand" class="accessory starwand">🪄</div>' +
        '</div></div>' +
        '<div class="controls-panel"><h2 id="modalTitle">Dress-Up Studio</h2>' +
          '<div class="control-label">Choose a top</div><div id="topColours" class="swatches"></div>' +
          '<div class="control-label">Choose a skirt</div><div id="skirtColours" class="swatches"></div>' +
          '<div class="control-label">Add something sparkly</div><div class="option-row">' +
            '<button class="option-button" data-acc="accCrown">👑 Crown</button>' +
            '<button class="option-button" data-acc="accBow">🎀 Bow</button>' +
            '<button class="option-button" data-acc="accWand">🪄 Wand</button>' +
          '</div><div style="margin-top:22px"><button id="surpriseOutfit" class="big-action">✨ Surprise me!</button></div>' +
        '</div>' +
      '</div>'
    );

    var colours = ['#ff6fb1','#a45ed3','#50b7e8','#ffd34f','#62cf9b','#ff875e'];
    addSwatches('topColours', 'dollTop', colours);
    addSwatches('skirtColours', 'dollSkirt', colours.slice().reverse());

    var accButtons = modalContent.querySelectorAll('[data-acc]');
    for (var i = 0; i < accButtons.length; i++) {
      accButtons[i].addEventListener('click', function () {
        document.getElementById(this.getAttribute('data-acc')).classList.toggle('show');
        happyChime();
      });
    }

    document.getElementById('surpriseOutfit').addEventListener('click', function () {
      document.getElementById('dollTop').style.background = colours[Math.floor(Math.random() * colours.length)];
      document.getElementById('dollSkirt').style.background = colours[Math.floor(Math.random() * colours.length)];
      var accessories = ['accCrown','accBow','accWand'];
      for (var i = 0; i < accessories.length; i++) { document.getElementById(accessories[i]).classList.remove('show'); }
      document.getElementById(accessories[Math.floor(Math.random() * accessories.length)]).classList.add('show');
      happyChime();
    });
  }

  function addSwatches(containerId, targetId, colours) {
    var container = document.getElementById(containerId);
    for (var i = 0; i < colours.length; i++) {
      var button = document.createElement('button');
      button.className = 'swatch';
      button.style.background = colours[i];
      button.setAttribute('data-colour', colours[i]);
      button.addEventListener('click', function () {
        document.getElementById(targetId).style.background = this.getAttribute('data-colour');
        tinyPop();
      });
      container.appendChild(button);
    }
  }

  function randomStory() {
    var heroes = ['Jana', 'a brave fashion doll', 'a tiny pink dragon', 'a singing puppy', 'a glittery unicorn'];
    var places = ['the rainbow castle', 'a secret dollhouse', 'the cloud garden', 'the moonlight dance hall', 'a village made of cupcakes'];
    var helpers = ['a friendly butterfly', 'a talking handbag', 'a clever kitten', 'a sparkling fairy', 'a shy little pony'];
    var quests = ['find the missing golden shoe', 'prepare a surprise party', 'teach the stars a new dance', 'return a magic crown', 'paint a grey day with bright colours'];
    return heroes[Math.floor(Math.random()*heroes.length)] + ' travelled to ' + places[Math.floor(Math.random()*places.length)] + ', where ' + helpers[Math.floor(Math.random()*helpers.length)] + ' helped her ' + quests[Math.floor(Math.random()*quests.length)] + '. And because she was brave and kind, everyone celebrated with music, hugs and strawberry cake!';
  }

  function showStories() {
    var story = randomStory();
    openModal(
      '<div class="story-box"><div class="story-icon">📖✨</div>' +
      '<h2 id="modalTitle" class="modal-heading">Story Sparkles</h2>' +
      '<div id="storyText" class="story-text">' + escapeHtml(story) + '</div>' +
      '<div class="story-actions"><button id="newStory" class="big-action">✨ New story</button>' +
      '<button id="readStory" class="option-button">🔊 Read to me</button></div></div>'
    );
    document.getElementById('newStory').addEventListener('click', function () {
      var next = randomStory();
      document.getElementById('storyText').textContent = next;
      happyChime();
    });
    document.getElementById('readStory').addEventListener('click', function () {
      if (!window.speechSynthesis) { showToast('Reading aloud is not available here.'); return; }
      window.speechSynthesis.cancel();
      currentSpeech = new SpeechSynthesisUtterance(document.getElementById('storyText').textContent);
      currentSpeech.rate = 0.86;
      currentSpeech.pitch = 1.12;
      window.speechSynthesis.speak(currentSpeech);
    });
  }

  function showColour() {
    openModal(
      '<h2 id="modalTitle" class="modal-heading">Colour Garden</h2><p class="modal-subtitle">Draw a dress, a castle, a pet — anything you imagine.</p>' +
      '<div class="canvas-wrap"><canvas id="drawCanvas"></canvas><div id="palette" class="palette"></div></div>'
    );
    setupCanvas();
  }

  function setupCanvas() {
    var canvas = document.getElementById('drawCanvas');
    var palette = document.getElementById('palette');
    var ctx = canvas.getContext('2d');
    var currentColour = '#ef5aa4';
    var drawing = false;
    var lastX = 0;
    var lastY = 0;

    function resizeCanvas() {
      var rect = canvas.getBoundingClientRect();
      var ratio = window.devicePixelRatio || 1;
      var old = document.createElement('canvas');
      old.width = canvas.width; old.height = canvas.height;
      if (canvas.width && canvas.height) { old.getContext('2d').drawImage(canvas,0,0); }
      canvas.width = Math.floor(rect.width * ratio);
      canvas.height = Math.floor(rect.height * ratio);
      ctx = canvas.getContext('2d');
      ctx.scale(ratio, ratio);
      ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = 13;
      if (old.width) { ctx.drawImage(old,0,0,old.width,old.height,0,0,rect.width,rect.height); }
    }
    window.setTimeout(resizeCanvas, 50);

    var colours = ['#ef5aa4','#9e61d2','#4db9ed','#42c78b','#ffd04a','#ff835e','#62435d','#ffffff'];
    for (var i = 0; i < colours.length; i++) {
      var sw = document.createElement('button');
      sw.className = 'swatch';
      sw.style.background = colours[i];
      sw.setAttribute('data-colour', colours[i]);
      sw.addEventListener('click', function () { currentColour = this.getAttribute('data-colour'); tinyPop(); });
      palette.appendChild(sw);
    }
    var clear = document.createElement('button'); clear.className='palette-button'; clear.textContent='🧼'; clear.title='Clear picture';
    clear.addEventListener('click', function(){ ctx.clearRect(0,0,canvas.width,canvas.height); happyChime(); });
    palette.appendChild(clear);

    function point(event) {
      var rect = canvas.getBoundingClientRect();
      var source = event.touches && event.touches.length ? event.touches[0] : event;
      return { x: source.clientX - rect.left, y: source.clientY - rect.top };
    }
    function start(event) { event.preventDefault(); drawing=true; var p=point(event); lastX=p.x; lastY=p.y; }
    function move(event) {
      if (!drawing) { return; }
      event.preventDefault();
      var p=point(event); ctx.strokeStyle=currentColour; ctx.beginPath(); ctx.moveTo(lastX,lastY); ctx.lineTo(p.x,p.y); ctx.stroke(); lastX=p.x; lastY=p.y;
    }
    function end(event) { if (event) { event.preventDefault(); } drawing=false; }
    canvas.addEventListener('touchstart', start, {passive:false});
    canvas.addEventListener('touchmove', move, {passive:false});
    canvas.addEventListener('touchend', end, {passive:false});
    canvas.addEventListener('mousedown', start);
    canvas.addEventListener('mousemove', move);
    canvas.addEventListener('mouseup', end);
    canvas.addEventListener('mouseleave', end);
  }

  function showDance() {
    openModal(
      '<div class="dance-room"><h2 id="modalTitle" class="modal-heading">Dance & Freeze</h2>' +
      '<div id="danceOrb" class="dance-orb"><div id="danceState" class="dance-state">READY?</div><div id="danceTime" class="dance-time">30</div></div>' +
      '<div class="dance-controls"><button id="danceStart" class="big-action">▶ Start</button><button id="danceReset" class="option-button">↺ Again</button></div>' +
      '<p class="modal-subtitle" style="margin:18px 0 0">Dance when it says DANCE. Freeze like a statue when it says FREEZE!</p></div>'
    );
    var remaining = 30;
    var running = false;
    var phase = 'DANCE';
    var switchAt = 4;
    var stateEl = document.getElementById('danceState');
    var timeEl = document.getElementById('danceTime');
    function update() { timeEl.textContent = remaining; stateEl.textContent = running ? phase : 'READY?'; }
    function reset() { if(danceTimer){clearInterval(danceTimer);danceTimer=null;} remaining=30;running=false;phase='DANCE';switchAt=4;update(); }
    document.getElementById('danceStart').addEventListener('click', function () {
      if (running) { return; }
      running=true; phase='DANCE'; switchAt=3 + Math.floor(Math.random()*3); update(); happyChime();
      danceTimer=setInterval(function(){
        remaining--; switchAt--;
        if (switchAt <= 0) { phase = phase === 'DANCE' ? 'FREEZE!' : 'DANCE'; switchAt = 3 + Math.floor(Math.random()*4); phase === 'FREEZE!' ? lowBeep() : happyChime(); }
        if (remaining <= 0) { clearInterval(danceTimer);danceTimer=null;running=false;stateEl.textContent='TA-DA!';timeEl.textContent='★';happyChime();return; }
        update();
      },1000);
    });
    document.getElementById('danceReset').addEventListener('click', reset);
  }

  function showCalm() {
    openModal(
      '<div class="calm-room"><h2 id="modalTitle" class="modal-heading">Quiet Cloud</h2>' +
      '<div id="breathCloud" class="breath-cloud"></div><div id="breathInstruction" class="breath-instruction">Ready for calm?</div>' +
      '<div id="breathCount" class="breath-count">Five gentle breaths</div>' +
      '<div style="margin-top:24px"><button id="breathStart" class="big-action">☁️ Begin</button></div></div>'
    );
    document.getElementById('breathStart').addEventListener('click', function () {
      var count = 0;
      var cloud = document.getElementById('breathCloud');
      var instruction = document.getElementById('breathInstruction');
      var counter = document.getElementById('breathCount');
      this.disabled = true;
      function cycle() {
        if (count >= 5) { cloud.classList.remove('grow'); instruction.textContent='Soft and sparkly'; counter.textContent='You did it!'; happyChime(); return; }
        instruction.textContent='Breathe in…'; cloud.classList.add('grow'); counter.textContent='Breath ' + (count+1) + ' of 5';
        breathTimer=setTimeout(function(){
          instruction.textContent='Breathe out…'; cloud.classList.remove('grow');
          breathTimer=setTimeout(function(){ count++; cycle(); },4200);
        },4200);
      }
      cycle();
    });
  }

  function audioContext() {
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) { return null; }
    try { return new AC(); } catch (e) { return null; }
  }
  function playTone(frequency, duration, volume) {
    var ctx = audioContext();
    if (!ctx) { return; }
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.frequency.value = frequency;
    osc.type = 'sine';
    gain.gain.value = volume || .08;
    osc.connect(gain); gain.connect(ctx.destination); osc.start();
    gain.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + duration);
    osc.stop(ctx.currentTime + duration);
  }
  function tinyPop(){ playTone(620,.12,.05); }
  function lowBeep(){ playTone(220,.22,.08); }
  function happyChime(){ playTone(660,.2,.06); window.setTimeout(function(){playTone(880,.28,.05);},110); }

  function startParentHold(event) {
    event.preventDefault();
    if (parentHoldTimer) { clearTimeout(parentHoldTimer); }
    parentHoldTimer = setTimeout(function () { parentHoldTimer=null; requestParentPin(); }, 3000);
  }
  function cancelParentHold(event) {
    if (event) { event.preventDefault(); }
    if (parentHoldTimer) { clearTimeout(parentHoldTimer); parentHoldTimer=null; }
  }
  parentTrigger.addEventListener('touchstart', startParentHold, {passive:false});
  parentTrigger.addEventListener('touchend', cancelParentHold, {passive:false});
  parentTrigger.addEventListener('touchcancel', cancelParentHold, {passive:false});
  parentTrigger.addEventListener('mousedown', startParentHold);
  parentTrigger.addEventListener('mouseup', cancelParentHold);
  parentTrigger.addEventListener('mouseleave', cancelParentHold);

  function requestParentPin() {
    var entered = window.prompt('Grown-up code:');
    if (entered === null) { return; }
    var settings = loadSettings();
    if (String(entered) !== String(settings.parentPin)) { showToast('That code did not match.'); return; }
    showParentPanel();
  }

  function showParentPanel() {
    var settings = loadSettings();
    var rows = '';
    for (var i=0;i<6;i++) {
      var video = settings.videos[i] || {title:'',id:''};
      rows += '<div class="parent-video-row"><input class="parent-title" placeholder="Button title" value="' + escapeHtml(video.title) + '">' +
        '<input class="parent-url" placeholder="Paste a YouTube video link" value="' + escapeHtml(video.id) + '"></div>';
    }
    openModal(
      '<div class="parent-panel"><h2 id="modalTitle" class="modal-heading">Marli&#039;s Grown-Up Controls</h2>' +
      '<p class="parent-note">This little panel prevents accidental changes by a young child; Apple supervision and Screen Time remain the real security controls.</p>' +
      '<div class="parent-section"><h3>Approved Barbie doll videos</h3><p class="parent-note">Paste individual video links, not a YouTube search page. Empty rows will be ignored.</p>' + rows + '</div>' +
      '<div class="parent-section"><h3>Change grown-up code</h3><label>New 4-digit code</label><input id="newParentPin" type="password" inputmode="numeric" maxlength="4" placeholder="Leave blank to keep current code"></div>' +
      '<div class="parent-actions"><button id="saveParent" class="big-action">Save choices</button><button id="resetHub" class="big-action danger-action">Reset hub choices</button></div></div>'
    );
    document.getElementById('saveParent').addEventListener('click', saveParentPanel);
    document.getElementById('resetHub').addEventListener('click', function () {
      if (window.confirm('Remove all approved video choices and restore the starting grown-up code?')) {
        localStorage.removeItem('janaHubSettings'); loadSettings(); closeModal(); showToast('Hub choices were reset.');
      }
    });
  }

  function saveParentPanel() {
    var settings = loadSettings();
    var titles = modalContent.querySelectorAll('.parent-title');
    var urls = modalContent.querySelectorAll('.parent-url');
    var videos = [];
    for (var i=0;i<urls.length;i++) {
      var id = extractYouTubeId(urls[i].value);
      if (id) { videos.push({ id:id, title:titles[i].value.trim() || ('Magic video ' + (videos.length+1)) }); }
    }
    var newPin = document.getElementById('newParentPin').value.trim();
    if (newPin && !/^\d{4}$/.test(newPin)) { showToast('Use exactly four numbers for the grown-up code.'); return; }
    settings.videos = videos;
    if (newPin) { settings.parentPin = newPin; }
    saveSettings(settings);
    closeModal();
    showToast('Marli’s choices are saved.');
  }

  setGreeting();

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function () {});
    });
  }
})();
