let ysdk;

async function initGame() {
  if (typeof YaGames !== 'undefined') {
    try {
      ysdk = await YaGames.init();
      ysdk.features.LoadingAPI?.ready();
      console.log('✅ Yandex SDK инициализирован, lang:', ysdk.environment.i18n.lang);
    } catch (error) {
      console.error('❌ Ошибка инициализации Yandex SDK:', error);
    }
  } else {
    console.warn('⚠️ YaGames SDK не найден. Игра продолжает работать без него.');
  }

  const cells = document.querySelectorAll('.cell');
  const status = document.getElementById('status');
  const restartBtn = document.getElementById('restartBtn');
  const backToMenuBtn = document.getElementById('backToMenuBtn');
  const btnNormal = document.getElementById('btn-normal');
  const btnTimer = document.getElementById('btn-timer');
  const timerContainer = document.getElementById('timer');
  const timerPlayerText = document.getElementById('time-player');
  const timerDisplay = document.getElementById('time-left');

  const soundMove = document.getElementById('sound-move');
  const soundWin = document.getElementById('sound-win');
  const soundDraw = document.getElementById('sound-draw');
  const warningSound = document.getElementById('sound-warning');

  let board = Array(9).fill("");
  let currentPlayer = "X";
  let gameActive = true;
  let mode = "normal";
  let firstMoveMade = false;
  let isPaused = false;
  let timer;
  let timeLeft;

  const winningConditions = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];

  // 🎮 Поддержка кнопок пульта
  document.addEventListener('keydown', function(e) {
    const key = e.key;
    const isInMenu = menu.style.display === 'flex';

    // OK / Enter запускает активный режим
    if (key === 'Enter' && isInMenu) {
      const active = document.querySelector('.mode-btn.active');
      if (active) {
        active.click();
      }
    }

    // Стрелки — переключение активной кнопки
    if ((key === 'ArrowUp' || key === 'ArrowDown') && isInMenu) {
      const buttons = [btnNormal, btnTimer];
      let current = buttons.findIndex(btn => btn.classList.contains('active'));
      if (key === 'ArrowUp') {
        current = (current - 1 + buttons.length) % buttons.length;
      } else {
        current = (current + 1) % buttons.length;
      }
      buttons.forEach((btn, i) => btn.classList.toggle('active', i === current));
    }

    // Back/Escape возвращает в меню
    if ((key === 'Backspace' || key === 'Escape') && !isInMenu) {
      showMenu();
    }
  });

  function startTimer() {
    clearInterval(timer);
    if (mode !== 'timer' || isPaused) return;

    timeLeft = 10;
    timerDisplay.textContent = timeLeft;

    timer = setInterval(() => {
      if (isPaused) return;
      timeLeft--;
      timerDisplay.textContent = timeLeft;
      timerContainer.classList.toggle('warning', timeLeft <= 4);

      if (timeLeft <= 0) {
        clearInterval(timer);
        warningSound.pause();
        warningSound.currentTime = 0;
        currentPlayer = currentPlayer === "X" ? "O" : "X";
        status.innerHTML = `⏰ Ход переходит к <span class="${currentPlayer === 'X' ? 'span-red' : 'span-blue'}">${currentPlayer}</span>`;
        startTimer();
      }
    }, 1000);
  }

  function checkResult() {
    for (const cond of winningConditions) {
      const [a, b, c] = cond;
      if (board[a] && board[a] === board[b] && board[b] === board[c]) {
        highlightWin(cond);
        status.innerHTML = `🎉 Победил <span class="${currentPlayer === 'X' ? 'span-red' : 'span-blue'}">${currentPlayer}</span>!`;
        endGame(soundWin);
        return;
      }
    }

    if (!board.includes("")) {
      endGame(soundDraw, "🤝 Ничья!");
    }
  }

  function highlightWin(cond) {
    cond.forEach(i => {
      cells[i].style.animation = 'winBlink 1s ease-in-out infinite';
      cells[i].style.backgroundColor = currentPlayer === "X" ? "#ff6f61" : "#61dafb";
      cells[i].style.color = "#fff";
    });
  }

  function endGame(sound, text) {
    gameActive = false;
    clearInterval(timer);
    warningSound.pause();
    warningSound.currentTime = 0;
    if (sound) {
      sound.currentTime = 0;
      sound.play();
    }
    if (text) status.innerHTML = text;
  }

  function handleCellClick(e) {
    if (!gameActive || isPaused) return;
    const idx = +e.target.getAttribute('data-index');
    if (board[idx]) return;

    board[idx] = currentPlayer;
    e.target.textContent = currentPlayer;
    e.target.classList.add(currentPlayer.toLowerCase());
    soundMove.currentTime = 0;
    soundMove.play();

    clearInterval(timer);
    timerContainer.classList.remove('warning');

    if (!firstMoveMade && mode === 'timer') {
      timerContainer.style.display = 'flex';
      firstMoveMade = true;
    }

    checkResult();
    if (!gameActive) return;

    currentPlayer = currentPlayer === "X" ? "O" : "X";
    status.innerHTML = `Ходит игрок <span class="${currentPlayer === 'X' ? 'span-red' : 'span-blue'}">${currentPlayer}</span>`;
    if (mode === 'timer') startTimer();
  }

  function restartGame() {
    board.fill("");
    cells.forEach(c => {
      c.textContent = "";
      c.classList.remove('x', 'o');
      c.style.backgroundColor = "";
      c.style.animation = "";
    });
    currentPlayer = "X";
    gameActive = true;
    firstMoveMade = false;
    status.innerHTML = `Ходит игрок <span class="${currentPlayer === 'X' ? 'span-red' : 'span-blue'}">${currentPlayer}</span>`;
    clearInterval(timer);
    timerContainer.classList.remove('warning');
    timerContainer.style.display = 'none';
  }

  const menu = document.getElementById('menu');

  function showMenu() {
    gameActive = false;
    restartGame();
    menu.style.display = 'flex';
    document.getElementById('game-container').style.display = 'none';

    // При возврате в меню — делаем первую кнопку активной
    btnNormal.classList.add('active');
    btnTimer.classList.remove('active');
  }

  function startGameWithMode(m) {
    mode = m;
    btnNormal.classList.toggle('active', mode === 'normal');
    btnTimer.classList.toggle('active', mode === 'timer');
    console.log(`▶️ Режим: ${mode}`);
    menu.style.display = 'none';
    document.getElementById('game-container').style.display = 'block';
    restartGame();
  }

  document.addEventListener('visibilitychange', () => {
    isPaused = document.hidden;
    if (isPaused) {
      clearInterval(timer);
      [soundMove, soundWin, soundDraw, warningSound].forEach(s => {
        s.pause();
        s.muted = true;
      });
      status.textContent = '⏸️ Игра на паузе';
    } else {
      [soundMove, soundWin, soundDraw, warningSound].forEach(s => s.muted = false);
      status.innerHTML = `Ходит игрок <span class="${currentPlayer === 'X' ? 'span-red' : 'span-blue'}">${currentPlayer}</span>`;
      if (mode === 'timer' && firstMoveMade) startTimer();
    }
  });

  cells.forEach(c => c.addEventListener('click', handleCellClick));
  restartBtn.addEventListener('click', restartGame);
  backToMenuBtn.addEventListener('click', showMenu);
  btnNormal.addEventListener('click', () => {
    startGameWithMode('normal');
  });
  btnTimer.addEventListener('click', () => {
    startGameWithMode('timer');
  });

  // Защита от действий мыши/тачпада
  window.addEventListener('contextmenu', e => e.preventDefault());
  window.addEventListener('selectstart', e => e.preventDefault());
  window.addEventListener('mousedown', e => e.preventDefault());
  window.addEventListener('touchstart', e => {
    if (e.touches.length > 1) e.preventDefault();
  }, { passive: false });

  showMenu();
}

document.addEventListener('DOMContentLoaded', () => {
  initGame();
});
