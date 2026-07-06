(function () {
  'use strict';

  /* ---------- Deck definition ---------- */
  var SUITS = [
    { symbol: '♠', color: 'black' }, // spades
    { symbol: '♥', color: 'red' },   // hearts
    { symbol: '♦', color: 'red' },   // diamonds
    { symbol: '♣', color: 'black' }  // clubs
  ];
  var RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

  // Pip column positions (percent of card width) and the vertical band pips live in.
  var X = { L: 27, C: 50, R: 73 };
  var Y_TOP = 18, Y_BOTTOM = 82;
  function toTop(n) { return Y_TOP + n * (Y_BOTTOM - Y_TOP); } // n in 0..1

  // Traditional pip layouts: [columnKey, verticalFraction]. Pips below the
  // midline are rotated 180deg, as on real cards.
  var PIP_LAYOUTS = {
    '2':  [['C', 0], ['C', 1]],
    '3':  [['C', 0], ['C', 0.5], ['C', 1]],
    '4':  [['L', 0], ['R', 0], ['L', 1], ['R', 1]],
    '5':  [['L', 0], ['R', 0], ['C', 0.5], ['L', 1], ['R', 1]],
    '6':  [['L', 0], ['R', 0], ['L', 0.5], ['R', 0.5], ['L', 1], ['R', 1]],
    '7':  [['L', 0], ['R', 0], ['C', 0.25], ['L', 0.5], ['R', 0.5], ['L', 1], ['R', 1]],
    '8':  [['L', 0], ['R', 0], ['C', 0.25], ['L', 0.5], ['R', 0.5], ['C', 0.75], ['L', 1], ['R', 1]],
    '9':  [['L', 0], ['R', 0], ['L', 1 / 3], ['R', 1 / 3], ['C', 0.5], ['L', 2 / 3], ['R', 2 / 3], ['L', 1], ['R', 1]],
    '10': [['L', 0], ['R', 0], ['C', 1 / 6], ['L', 1 / 3], ['R', 1 / 3], ['L', 2 / 3], ['R', 2 / 3], ['C', 5 / 6], ['L', 1], ['R', 1]]
  };

  function buildDeck() {
    var deck = [];
    for (var s = 0; s < SUITS.length; s++) {
      for (var r = 0; r < RANKS.length; r++) {
        deck.push({ rank: RANKS[r], suit: SUITS[s] });
      }
    }
    return deck;
  }

  // Fisher-Yates, in place.
  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
    }
    return arr;
  }

  /* ---------- Card rendering ---------- */
  function cardFaceHTML(card) {
    var sym = card.suit.symbol;
    var rank = card.rank;
    var center;

    if (rank === 'A') {
      center = '<div class="pips"><span class="pip big" style="left:50%;top:50%">' + sym + '</span></div>';
    } else if (rank === 'J' || rank === 'Q' || rank === 'K') {
      center =
        '<div class="face-frame"></div>' +
        '<div class="face-center">' +
          '<span class="big-letter">' + rank + '</span>' +
          '<span class="big-suit">' + sym + '</span>' +
        '</div>';
    } else {
      var pts = PIP_LAYOUTS[rank];
      var spans = '';
      for (var i = 0; i < pts.length; i++) {
        var col = pts[i][0];
        var frac = pts[i][1];
        var flip = frac > 0.5 ? ' flip' : '';
        spans +=
          '<span class="pip' + flip + '" style="left:' + X[col] + '%;top:' + toTop(frac) + '%">' +
          sym + '</span>';
      }
      center = '<div class="pips">' + spans + '</div>';
    }

    return (
      '<div class="card-face ' + card.suit.color + '">' +
        '<div class="corner tl"><span class="rank">' + rank + '</span><span class="suit">' + sym + '</span></div>' +
        center +
        '<div class="corner br"><span class="rank">' + rank + '</span><span class="suit">' + sym + '</span></div>' +
      '</div>'
    );
  }

  // Decorative face-down back shown at the start of a freshly shuffled deck.
  // Reuses .card-face so it inherits the card's size, radius, shadow and
  // cardIn reveal animation.
  function cardBackHTML() {
    return (
      '<div class="card-face card-back">' +
        '<div class="back-pattern"></div>' +
        '<div class="back-plaque">Guess<br>The<br>Card</div>' +
        '<div class="back-credit">Created By Max</div>' +
      '</div>'
    );
  }

  /* ---------- SVG icons ---------- */
  var EYE =
    '<svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
  var EYE_OFF =
    '<svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>';

  /* ---------- State ---------- */
  var order = shuffle(buildDeck());
  var index = 0;
  var progressOn = true;
  var overlayOpen = false;
  var hintDismissed = false;
  var faceDown = false;
  var hardMode = false;
  var hardCount = 0;

  /* ---------- Elements ---------- */
  var cardEl = document.getElementById('card');
  var progressEl = document.getElementById('progress');
  var hintEl = document.getElementById('hint');
  var overlayEl = document.getElementById('overlay');
  var toggleBtn = document.getElementById('toggleProgress');
  var toggleHardBtn = document.getElementById('toggleHard');
  var shuffleTopBtn = document.getElementById('shuffleTop');
  var reshuffleBtn = document.getElementById('reshuffleBtn');
  var continueBtn = document.getElementById('continueBtn');
  var brandEl = document.querySelector('.brand');

  /* ---------- Brand title fit ----------
     Keep the "Guess The Card" title while it fits; hide it entirely (rather
     than showing a truncated "Guess Th…") once there isn't room. */
  function fitBrand() {
    brandEl.classList.remove('brand-hidden');   // reveal so we can measure
    if (brandEl.scrollWidth > brandEl.clientWidth + 1) {
      brandEl.classList.add('brand-hidden');    // would truncate → hide it
    }
  }

  /* ---------- Core actions ---------- */
  function drawHardCard() {
    // Hard Mode: a fresh random card from the full 52 — repeats allowed.
    return order[Math.floor(Math.random() * order.length)];
  }

  function updateProgress() {
    if (hardMode) {
      progressEl.textContent = hardCount + (hardCount === 1 ? ' card' : ' cards');
    } else {
      progressEl.textContent = (index + 1) + ' / 52';
    }
  }

  function showCard(card) {
    faceDown = false;
    cardEl.innerHTML = cardFaceHTML(card);
    cardEl.setAttribute('aria-label', 'Playing card. Tap or press space to reveal the next card.');
    updateProgress();
  }

  // Face-down back: the top card of a freshly shuffled deck. First advance
  // reveals it rather than moving on.
  function showBack() {
    faceDown = true;
    cardEl.innerHTML = cardBackHTML();
    cardEl.setAttribute('aria-label', 'Card face down. Tap or press space to reveal the first card.');
    updateProgress();
  }

  function dismissHint() {
    if (hintDismissed) return;
    hintDismissed = true;
    hintEl.classList.add('gone');
  }

  function advance() {
    if (overlayOpen) return;
    dismissHint();
    if (faceDown) {
      // Reveal the first card without advancing.
      if (hardMode) {
        hardCount = 1;
        showCard(drawHardCard());
      } else {
        showCard(order[index]);
      }
      return;
    }
    if (hardMode) {
      // Reshuffle-every-draw: endless stream of random cards, repeats allowed.
      hardCount++;
      showCard(drawHardCard());
      return;
    }
    if (index >= order.length - 1) {
      openOverlay();
      return;
    }
    index++;
    showCard(order[index]);
  }

  function openOverlay() {
    overlayOpen = true;
    overlayEl.classList.remove('hidden');
  }
  function closeOverlay() {
    overlayOpen = false;
    overlayEl.classList.add('hidden');
  }

  function reshuffle() {
    shuffle(order);
    closeOverlay();
    dismissHint();
    index = 0;
    if (hardMode) hardCount = 0;
    showBack();
  }

  function continueSame() {
    closeOverlay();
    index = 0;
    showCard(order[index]);
  }

  function setHardMode(on) {
    hardMode = on;
    toggleHardBtn.setAttribute('aria-pressed', String(on));
    closeOverlay();
    dismissHint();
    if (on) {
      // Start a fresh Hard Mode run, first card face down.
      hardCount = 0;
      showBack();
    } else {
      // Back to a normal shuffled pass, first card face down.
      shuffle(order);
      index = 0;
      showBack();
    }
  }

  function toggleHard() {
    setHardMode(!hardMode);
  }

  function toggleProgress() {
    progressOn = !progressOn;
    progressEl.classList.toggle('hidden', !progressOn);
    toggleBtn.setAttribute('aria-pressed', String(progressOn));
    toggleBtn.innerHTML = progressOn ? EYE : EYE_OFF;
  }

  /* ---------- Input: tap / swipe / keyboard ---------- */
  var startX = 0, startY = 0, lastSwipe = 0;

  cardEl.addEventListener('click', function () {
    // Ignore the synthetic click that follows a swipe gesture.
    if (Date.now() - lastSwipe < 600) return;
    advance();
  });

  cardEl.addEventListener('touchstart', function (e) {
    var t = e.changedTouches[0];
    startX = t.clientX;
    startY = t.clientY;
  }, { passive: true });

  cardEl.addEventListener('touchend', function (e) {
    var t = e.changedTouches[0];
    var dx = t.clientX - startX;
    var dy = t.clientY - startY;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
      // Decisive horizontal swipe: advance and suppress the follow-up click.
      lastSwipe = Date.now();
      e.preventDefault();
      advance();
    }
    // Otherwise it was a tap; the click handler will advance.
  }, { passive: false });

  cardEl.addEventListener('keydown', function (e) {
    if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      advance();
    }
  });

  cardEl.addEventListener('contextmenu', function (e) { e.preventDefault(); });

  /* ---------- Button wiring ---------- */
  shuffleTopBtn.addEventListener('click', reshuffle);
  toggleBtn.addEventListener('click', toggleProgress);
  toggleHardBtn.addEventListener('click', toggleHard);
  reshuffleBtn.addEventListener('click', reshuffle);
  continueBtn.addEventListener('click', continueSame);

  /* ---------- Init ---------- */
  toggleBtn.innerHTML = EYE;
  showBack();
  fitBrand();
  window.addEventListener('resize', fitBrand);
})();
