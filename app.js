document.addEventListener('DOMContentLoaded', () => {
    // ---- Element references ----
    const questionTextElement = document.getElementById('question-text');
    const alternativesContainer = document.getElementById('alternatives-container');
    const feedbackContainer = document.getElementById('feedback-container');
    const feedbackMessage = document.getElementById('feedback-message');
    const correctAnswerElement = document.getElementById('correct-answer');
    const explanationElement = document.getElementById('explanation');
    const referenceElement = document.getElementById('reference');
    const nextQuestionBtn = document.getElementById('next-question-btn');
    const correctScoreSpan = document.getElementById('correct-score');
    const incorrectScoreSpan = document.getElementById('incorrect-score');
    const loadingMessage = document.getElementById('loading-message');
    const quizCard = document.getElementById('quiz-card');
    const cronometerDisplay = document.getElementById('cronometer-display');
    const categorySelection = document.getElementById('category-selection');
    const categoryButtons = document.querySelectorAll('.category-btn');
    const difficultySelection = document.getElementById('difficulty-selection');
    const difficultyPrompt = document.getElementById('difficulty-prompt');
    const difficultyButtons = document.querySelectorAll('.difficulty-btn');
    const changeCategoryBtn = document.getElementById('change-category-btn');
    const timerElement = document.querySelector('.timer');
    const scoreElement = document.querySelector('.score');
    const timeBonusElement = document.getElementById('time-bonus');
    const recordTagElement = document.getElementById('record-tag');
    const difficultyTagElement = document.getElementById('difficulty-tag');
    const giveUpBtn = document.getElementById('give-up-btn');
    const helpScreen = document.getElementById('help-screen');
    const helpBtn = document.getElementById('help-btn');
    const helpBackBtn = document.getElementById('help-back-btn');
    const statsScreen = document.getElementById('stats-screen');
    const statsBtn = document.getElementById('stats-btn');
    const statsBackBtn = document.getElementById('stats-back-btn');
    const statsTableBodyElement = document.getElementById('stats-table-body');
    const statsTotalAnsweredElement = document.getElementById('stats-total-answered');
    const statsTotalCorrectElement = document.getElementById('stats-total-correct');
    const statsHitRateElement = document.getElementById('stats-hit-rate');
    const statsMaxStreakElement = document.getElementById('stats-max-streak');
    const gameOverScreen = document.getElementById('game-over-screen');
    const gameOverMessageElement = document.getElementById('game-over-message');
    const gameOverSummaryElement = document.getElementById('game-over-summary');
    const gameOverNewRecordElement = document.getElementById('game-over-new-record');
    const gameOverRecordElement = document.getElementById('game-over-record');
    const gameOverResultElement = document.getElementById('game-over-result');
    const restartBtn = document.getElementById('restart-btn');
    const exitBtn = document.getElementById('exit-btn');
    const exportBtn = document.getElementById('export-btn');
    const resetStatsBtn = document.getElementById('reset-stats-btn');
    const resetModal = document.getElementById('reset-modal');
    const resetCancelBtn = document.getElementById('reset-cancel-btn');
    const resetConfirmBtn = document.getElementById('reset-confirm-btn');
    const printAreaElement = document.getElementById('print-area');
    const printTableBodyElement = document.getElementById('print-table-body');
    const printTotalAnsweredElement = document.getElementById('print-total-answered');
    const printTotalCorrectElement = document.getElementById('print-total-correct');
    const printHitRateElement = document.getElementById('print-hit-rate');
    const printMaxStreakElement = document.getElementById('print-max-streak');
    const printDateElement = document.getElementById('print-date');
    const printEmptyElement = document.getElementById('print-empty');
    const printContentElement = document.getElementById('print-content');
    const printTableElement = document.getElementById('print-table');
    const printStatCorrectElement = document.getElementById('print-stat-correct');
    const printStatRateElement = document.getElementById('print-stat-rate');
    const printStatStreakElement = document.getElementById('print-stat-streak');
    const filterCategoryInputs = document.querySelectorAll('.filter-category');
    const filterDifficultyInputs = document.querySelectorAll('.filter-difficulty');

    // Time selection elements
    const timeSelection = document.getElementById('time-selection');
    const timePrompt = document.getElementById('time-prompt');
    const timeButtons = document.querySelectorAll('.time-btn');
    const changeDifficultyBtn = document.getElementById('change-difficulty-btn');
    const customTimeInput = document.getElementById('custom-time-input');
    const customTimeValue = document.getElementById('custom-time-value');
    const confirmCustomTimeBtn = document.getElementById('confirm-custom-time');

    // ---- Game state ----
    let allQuestions = [];
    let questions = [];
    let currentQuestionIndex = 0;
    let answeredQuestions = new Set();
    let correctScore = 0;
    let incorrectScore = 0;
    let timeLeft = 30;
    let timerInterval;
    let bonusFlashTimeout;
    let gameOver = false;
    let selectedCategory = '';
    let selectedDifficulty = '';
    let hardcoreMode = false;
    let funMode = false;
    let funCompleted = false;
    let timerPaused = false;
    let selectedInitialTime = 30; // Default initial time

    const WINSTREAKS_KEY = 'quizWinstreaks';
    const STATS_KEY = 'quizStats';
    const DEFAULT_INITIAL_TIME = 30;
    const CATEGORIES = { biblia: 'Bíblia', santos: 'Santos', concilios: 'Concílios', igreja: 'Igreja' };
    const DIFFICULTY_LABELS = { facil: 'Fácil', medio: 'Médio', dificil: 'Difícil', hardcore: 'Hardcore', lite: 'Sem Pressão' };

    // ---- Storage helpers ----
    function getDifficultyKey(difficulty, hardcore) {
        if (hardcore) return 'hardcore';
        switch (difficulty) {
            case 'EASY': return 'facil';
            case 'MEDIUM': return 'medio';
            case 'HARD': return 'dificil';
            case 'LITE': return 'lite';
            default: return '';
        }
    }

    function getComboKey(category, difficultyKey) {
        return `${category}|${difficultyKey}`;
    }

    function readStorage(key) {
        try {
            return JSON.parse(localStorage.getItem(key)) || {};
        } catch (error) {
            return {};
        }
    }

    function getWinstreaks() {
        return readStorage(WINSTREAKS_KEY);
    }

    function getStats() {
        return readStorage(STATS_KEY);
    }

    function saveAnswerStat(comboKey, correct) {
        if (!comboKey) return;
        const stats = getStats();
        if (!stats[comboKey]) {
            stats[comboKey] = { answered: 0, correct: 0 };
        }
        stats[comboKey].answered++;
        if (correct) {
            stats[comboKey].correct++;
        }
        localStorage.setItem(STATS_KEY, JSON.stringify(stats));
    }

    function maxWinstreak() {
        const streaks = getWinstreaks();
        let max = 0;
        getSelectedCategories().forEach(catKey => {
            getSelectedDifficulties().forEach(diffKey => {
                max = Math.max(max, streaks[getComboKey(catKey, diffKey)] || 0);
            });
        });
        return max;
    }

    function getSelectedCategories() {
        const checked = Array.from(filterCategoryInputs).filter(el => el.checked).map(el => el.value);
        return checked.length > 0 ? checked : Object.keys(CATEGORIES);
    }

    function getSelectedDifficulties() {
        const checked = Array.from(filterDifficultyInputs).filter(el => el.checked).map(el => el.value);
        return checked.length > 0 ? checked : Object.keys(DIFFICULTY_LABELS);
    }

    // ---- Stats / export shared helpers ----
    function computeTotals() {
        const stats = getStats();
        const rows = [];
        let totalAnswered = 0;
        let totalCorrect = 0;
        getSelectedCategories().forEach(catKey => {
            getSelectedDifficulties().forEach(diffKey => {
                const key = getComboKey(catKey, diffKey);
                const s = stats[key] || { answered: 0, correct: 0 };
                const rate = s.answered > 0 ? Math.round((s.correct / s.answered) * 100) : 0;
                rows.push({
                    categoryLabel: CATEGORIES[catKey],
                    difficultyLabel: DIFFICULTY_LABELS[diffKey],
                    answered: s.answered,
                    correct: s.correct,
                    rate
                });
                totalAnswered += s.answered;
                totalCorrect += s.correct;
            });
        });
        return { rows, totalAnswered, totalCorrect };
    }

    function displayStatsScreen() {
        const { rows, totalAnswered, totalCorrect } = computeTotals();
        statsTableBodyElement.innerHTML = rows.map(r =>
            `<tr><td class="stats-label">${r.categoryLabel}</td><td>${r.difficultyLabel}</td><td>${r.answered}</td><td>${r.correct}</td><td>${r.rate}%</td></tr>`
        ).join('');
        statsTotalAnsweredElement.textContent = totalAnswered;
        statsTotalCorrectElement.textContent = totalCorrect;
        statsHitRateElement.textContent = `Aproveitamento: ${totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0}%`;
        statsMaxStreakElement.textContent = maxWinstreak();
    }

    function fillPrintArea() {
        const { rows, totalAnswered, totalCorrect } = computeTotals();
        const hasStats = totalAnswered > 0;

        printEmptyElement.classList.toggle('hidden', hasStats);
        printContentElement.classList.toggle('hidden', !hasStats);
        printTableElement.classList.toggle('hidden', !hasStats);

        const nonZeroRows = rows.filter(r => r.answered > 0);
        printTableBodyElement.innerHTML = nonZeroRows.map(r =>
            `<tr><td>${r.categoryLabel}</td><td>${r.difficultyLabel}</td><td>${r.answered}</td><td>${r.correct}</td><td>${r.rate}%</td></tr>`
        ).join('');

        printTotalAnsweredElement.textContent = totalAnswered;
        printTotalCorrectElement.textContent = totalCorrect;
        printHitRateElement.textContent = `${totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0}%`;
        printMaxStreakElement.textContent = maxWinstreak();
        printDateElement.textContent = new Date().toLocaleDateString('pt-BR');

        const streak = maxWinstreak();
        const rate = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;
        printStatCorrectElement.classList.toggle('hidden', totalCorrect === 0);
        printStatRateElement.classList.toggle('hidden', rate === 0);
        printStatStreakElement.classList.toggle('hidden', streak === 0);
    }

    function updateDifficultyRecords() {
        const streaks = getWinstreaks();
        difficultyButtons.forEach(button => {
            const difficultyKey = getDifficultyKey(button.dataset.difficulty, button.dataset.hardcore === 'true');
            if (!difficultyKey || !selectedCategory) return;
            const key = getComboKey(selectedCategory, difficultyKey);
            const record = streaks[key] || 0;
            let recordSpan = button.querySelector('.difficulty-record');
            if (!recordSpan) {
                recordSpan = document.createElement('span');
                recordSpan.className = 'difficulty-record';
                button.appendChild(recordSpan);
            }
            recordSpan.textContent = record > 0 ? `Recorde: ${record} acertos` : 'Sem recorde ainda';
        });
    }

    // ---- Screen navigation ----
    function hideAllScreens() {
        categorySelection.classList.add('hidden');
        difficultySelection.classList.add('hidden');
        timeSelection.classList.add('hidden');
        helpScreen.classList.add('hidden');
        statsScreen.classList.add('hidden');
        gameOverScreen.classList.add('hidden');
        quizCard.classList.add('hidden');
        timerElement.classList.add('hidden');
        scoreElement.classList.add('hidden');
    }

    function showHome() {
        hideAllScreens();
        categorySelection.classList.remove('hidden');
    }

    function showDifficultySelection() {
        difficultyPrompt.textContent = `Categoria: ${CATEGORIES[selectedCategory] || ''} — Escolha o nível de dificuldade:`;
        hideAllScreens();
        difficultySelection.classList.remove('hidden');
        updateDifficultyRecords();
    }

    function showTimeSelection() {
        const categoryLabel = CATEGORIES[selectedCategory] || '';
        const difficultyLabel = DIFFICULTY_LABELS[getDifficultyKey(selectedDifficulty, hardcoreMode)] || '';
        timePrompt.textContent = `${categoryLabel} · ${difficultyLabel} — Escolha o tempo inicial:`;
        
        // Hide custom input initially
        customTimeInput.classList.add('hidden');
        customTimeValue.value = '';
        
        hideAllScreens();
        timeSelection.classList.remove('hidden');
    }

    function openScreen(open, close) {
        close.classList.add('hidden');
        open.classList.remove('hidden');
    }

    // ---- Record tag ----
    function updateRecordTag() {
        if (gameOver) return;
        const key = getComboKey(selectedCategory, getDifficultyKey(selectedDifficulty, hardcoreMode));
        const record = getWinstreaks()[key] || 0;
        if (record <= 0 || correctScore <= 0) {
            recordTagElement.classList.add('hidden');
            return;
        }
        const remaining = record - correctScore;
        recordTagElement.classList.remove('record-beaten');
        if (remaining >= 1 && remaining <= 3) {
            recordTagElement.textContent = remaining === 1
                ? 'Falta 1 resposta para o seu recorde!'
                : `Faltam ${remaining} respostas para o seu recorde!`;
            recordTagElement.classList.remove('hidden');
        } else if (remaining <= 0) {
            recordTagElement.textContent = 'Você bateu seu recorde! Continue assim!';
            recordTagElement.classList.add('record-beaten');
            recordTagElement.classList.remove('hidden');
        } else {
            recordTagElement.classList.add('hidden');
        }
    }

    function updateScoreDisplay() {
        correctScoreSpan.textContent = correctScore;
        incorrectScoreSpan.textContent = incorrectScore;
        updateRecordTag();
    }

    // ---- Question loading ----
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    async function loadAllQuestions() {
        try {
            const response = await fetch('questions.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const questions = await response.json();
            allQuestions = questions.map(q => ({
                question: q.question,
                alternatives: q.options,
                correctAnswerIndex: q.answer,
                explanation: q.explanation,
                reference: q.reference,
                difficulty: q.difficulty,
                category: q.category
            }));
            loadingMessage.classList.add('hidden');
            showHome();
        } catch (error) {
            console.error('Erro ao carregar perguntas:', error);
            questionTextElement.textContent = 'Erro ao carregar as perguntas. Por favor, tente novamente mais tarde.';
            loadingMessage.classList.add('hidden');
        }
    }

    // ---- Game flow ----
    function buildQuestions() {
        const base = allQuestions.filter(q => q.category === selectedCategory);
        if (funMode) {
            const grouped = {};
            base.forEach(q => {
                (grouped[q.difficulty] = grouped[q.difficulty] || []).push(q);
            });
            questions = [];
            ['EASY', 'MEDIUM', 'HARD'].forEach(d => {
                if (grouped[d]) questions.push(...shuffleArray(grouped[d]));
            });
            currentQuestionIndex = 0;
        } else {
            questions = shuffleArray(base.filter(q => q.difficulty === (hardcoreMode ? 'HARD' : selectedDifficulty)));
        }
    }

    function resetGameState() {
        correctScore = 0;
        incorrectScore = 0;
        timeLeft = selectedInitialTime;
        currentQuestionIndex = 0;
        answeredQuestions.clear();
        funCompleted = false;
        timerPaused = false;
        clearInterval(timerInterval);
        updateScoreDisplay();
    }

    function startGame() {
        gameOver = false;
        resetGameState();
        buildQuestions();
        if (questions.length === 0) {
            showHome();
            return;
        }
        hideAllScreens();
        quizCard.classList.remove('hidden');
        scoreElement.classList.remove('hidden');
        if (funMode) {
            timerElement.classList.add('hidden');
            giveUpBtn.textContent = 'Finalizar';
            displayFunQuestion();
        } else {
            timerElement.classList.remove('hidden');
            giveUpBtn.textContent = 'Desistir';
            startCronometer();
            displayRandomQuestion();
        }
    }

    function selectDifficulty(difficulty, hardcore = false, fun = false) {
        selectedDifficulty = difficulty;
        hardcoreMode = hardcore;
        funMode = fun;
        if (funMode) {
            // Sem Pressão mode doesn't use timer, go straight to game
            startGame();
        } else {
            showTimeSelection();
        }
    }

    function startCronometer() {
        cronometerDisplay.textContent = `${timeLeft}s`;
        timerInterval = setInterval(() => {
            if (gameOver) {
                clearInterval(timerInterval);
                return;
            }
            if (timerPaused) {
                return;
            }
            timeLeft--;
            cronometerDisplay.textContent = `${timeLeft}s`;
            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                endGame();
            }
        }, 1000);
    }

    function endGame(forcedLoss = false) {
        clearInterval(timerInterval);
        gameOver = true;
        timerPaused = false;
        quizCard.classList.add('hidden');
        timerElement.classList.add('hidden');
        scoreElement.classList.add('hidden');
        showGameOverScreen(forcedLoss);
    }

    function showGameOverScreen(forcedLoss) {
        const lost = forcedLoss || correctScore < 2 * incorrectScore;
        const difficultyKey = getDifficultyKey(selectedDifficulty, hardcoreMode);
        const key = getComboKey(selectedCategory, difficultyKey);
        const categoryLabel = CATEGORIES[selectedCategory] || '';
        const difficultyLabel = DIFFICULTY_LABELS[difficultyKey] || '';
        let currentRecord = getWinstreaks()[key] || 0;
        let newRecord = false;

        // In Lite mode the winstreak always counts when the game ends; otherwise only on a win.
        if ((funMode || !lost) && key && correctScore > currentRecord) {
            const streaks = getWinstreaks();
            streaks[key] = correctScore;
            localStorage.setItem(WINSTREAKS_KEY, JSON.stringify(streaks));
            newRecord = true;
            currentRecord = correctScore;
            updateDifficultyRecords();
        }

        gameOverMessageElement.textContent = funCompleted ? 'Você completou todas as perguntas!' : 'Fim do Jogo!';
        gameOverSummaryElement.textContent = `Acertos: ${correctScore} · Erros: ${incorrectScore}`;

        gameOverResultElement.classList.remove('win', 'lose');
        gameOverResultElement.classList.add('hidden');
        gameOverNewRecordElement.classList.add('hidden');
        gameOverRecordElement.classList.add('hidden');

        if (funMode) {
            // Lite: no win/lose result, only errors, corrects and the record.
            if (newRecord) {
                gameOverNewRecordElement.textContent = `Novo recorde em ${categoryLabel} · ${difficultyLabel}: ${currentRecord} acertos!`;
                gameOverNewRecordElement.classList.remove('hidden');
            } else if (key && currentRecord > 0) {
                gameOverRecordElement.textContent = `Seu recorde em ${categoryLabel} · ${difficultyLabel}: ${currentRecord} acertos`;
                gameOverRecordElement.classList.remove('hidden');
            }
        } else {
            gameOverResultElement.textContent = lost ? 'Você Perdeu!' : 'Você Venceu!';
            gameOverResultElement.classList.remove('hidden');
            gameOverResultElement.classList.add(lost ? 'lose' : 'win');
            if (newRecord) {
                gameOverNewRecordElement.textContent = `Novo recorde em ${categoryLabel} · ${difficultyLabel}: ${currentRecord} acertos!`;
                gameOverNewRecordElement.classList.remove('hidden');
            } else if (!lost && key && currentRecord > 0) {
                gameOverRecordElement.textContent = `Seu recorde em ${categoryLabel} · ${difficultyLabel}: ${currentRecord} acertos`;
                gameOverRecordElement.classList.remove('hidden');
            }
        }

        gameOverScreen.classList.remove('hidden');
    }

    // ---- Question rendering ----
    function renderQuestion(question) {
        questionTextElement.textContent = question.question;

        alternativesContainer.innerHTML = '';
        const shuffledAlternatives = shuffleArray(question.alternatives.map((alt, idx) => ({ alt, originalIndex: idx })));

        shuffledAlternatives.forEach(item => {
            const button = document.createElement('button');
            button.classList.add('alternative-btn');
            button.textContent = item.alt;
            button.dataset.originalIndex = item.originalIndex;
            button.addEventListener('click', () => handleAnswer(button, item.originalIndex));
            alternativesContainer.appendChild(button);
        });

        feedbackContainer.classList.add('hidden');
        alternativesContainer.classList.remove('hidden');
        updateDifficultyTag(question.difficulty);
    }

    function updateDifficultyTag(difficulty) {
        if (!funMode) {
            difficultyTagElement.classList.add('hidden');
            return;
        }
        difficultyTagElement.textContent = difficulty === 'EASY' ? 'Fácil' : difficulty === 'MEDIUM' ? 'Médio' : 'Difícil';
        difficultyTagElement.className = 'difficulty-tag';
        difficultyTagElement.classList.add('difficulty-tag-' + difficulty.toLowerCase());
        difficultyTagElement.classList.remove('hidden');
    }

    function displayRandomQuestion() {
        if (gameOver || questions.length === 0) {
            return;
        }

        let availableQuestions = questions.filter((_, index) => !answeredQuestions.has(index));
        if (availableQuestions.length === 0) {
            answeredQuestions.clear();
            availableQuestions = questions;
            shuffleArray(availableQuestions);
        }

        const randomIndex = Math.floor(Math.random() * availableQuestions.length);
        currentQuestionIndex = questions.indexOf(availableQuestions[randomIndex]);
        answeredQuestions.add(currentQuestionIndex);
        renderQuestion(questions[currentQuestionIndex]);
    }

    function displayFunQuestion() {
        if (gameOver) return;
        if (currentQuestionIndex >= questions.length) {
            funCompleted = true;
            endGame(false);
            return;
        }
        answeredQuestions.add(currentQuestionIndex);
        renderQuestion(questions[currentQuestionIndex]);
    }

    function handleAnswer(selectedButton, selectedIndex) {
        if (gameOver) return;

        const currentQuestion = questions[currentQuestionIndex];
        const isCorrect = selectedIndex === currentQuestion.correctAnswerIndex;
        const statKey = getComboKey(selectedCategory, getDifficultyKey(selectedDifficulty, hardcoreMode));
        saveAnswerStat(statKey, isCorrect);

        Array.from(alternativesContainer.children).forEach(button => {
            button.disabled = true;
            if (parseInt(button.dataset.originalIndex) === currentQuestion.correctAnswerIndex) {
                button.classList.add('correct');
            }
        });

        if (isCorrect) {
            selectedButton.classList.add('correct');
            correctScore++;
            updateScoreDisplay();
            addBonusTime();
            if (hardcoreMode) {
                displayRandomQuestion();
                return;
            }
            feedbackMessage.textContent = 'Correto!';
            feedbackMessage.classList.remove('incorrect');
            feedbackMessage.classList.add('correct');
        } else {
            selectedButton.classList.add('incorrect');
            incorrectScore++;
            updateScoreDisplay();
            if (hardcoreMode) {
                endGame(true);
                return;
            }
            feedbackMessage.textContent = 'Incorreto!';
            feedbackMessage.classList.remove('correct');
            feedbackMessage.classList.add('incorrect');
        }

        correctAnswerElement.textContent = `A resposta correta era: ${currentQuestion.alternatives[currentQuestion.correctAnswerIndex]}`;
        explanationElement.textContent = `Explicação: ${currentQuestion.explanation}`;
        referenceElement.textContent = `Referência: ${currentQuestion.reference}`;
        timerPaused = true;

        feedbackContainer.classList.remove('hidden');
        alternativesContainer.classList.add('hidden');
    }

    // ---- Time bonus ----
    function addBonusTime() {
        if (gameOver) return;
        let bonus = 0;
        if (hardcoreMode) {
            if (correctScore > 0 && correctScore % 5 === 0) {
                bonus = 3;
            }
        } else {
            bonus = { EASY: 3, MEDIUM: 2, HARD: 1 }[selectedDifficulty] || 0;
        }
        if (bonus > 0) {
            timeLeft += bonus;
            cronometerDisplay.textContent = `${timeLeft}s`;
            showTimeBonus(bonus);
            flashCronometer();
        }
    }

    function showTimeBonus(bonus) {
        timeBonusElement.textContent = `+${bonus}s`;
        timeBonusElement.classList.remove('hidden');
        timeBonusElement.style.animation = 'none';
        void timeBonusElement.offsetWidth;
        timeBonusElement.style.animation = '';
    }

    function flashCronometer() {
        cronometerDisplay.classList.add('cronometer-bonus');
        clearTimeout(bonusFlashTimeout);
        bonusFlashTimeout = setTimeout(() => {
            cronometerDisplay.classList.remove('cronometer-bonus');
        }, 1000);
    }

    // ---- Export image ----
    function exportAsImage() {
        if (typeof html2canvas === 'undefined') {
            alert('Não foi possível gerar a imagem. Verifique sua conexão com a internet.');
            return;
        }
        html2canvas(printAreaElement, {
            backgroundColor: null,
            scale: 2,
            useCORS: true,
            logging: false
        }).then(canvas => {
            const link = document.createElement('a');
            link.download = 'quiz-biblia-estatisticas.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
        }).catch(() => {
            alert('Não foi possível gerar a imagem.');
        });
    }

    // ---- Event listeners ----
    timeBonusElement.addEventListener('animationend', () => {
        timeBonusElement.classList.add('hidden');
    });

    nextQuestionBtn.addEventListener('click', () => {
        if (gameOver) return;
        if (funMode) {
            currentQuestionIndex++;
            displayFunQuestion();
            return;
        }
        timerPaused = false;
        displayRandomQuestion();
    });

    giveUpBtn.addEventListener('click', () => {
        if (gameOver) return;
        endGame(funMode ? false : true);
    });

    difficultyButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            const clickedButton = event.target.closest('.difficulty-btn') || event.target;
            selectDifficulty(clickedButton.dataset.difficulty, clickedButton.dataset.hardcore === 'true', clickedButton.dataset.fun === 'true');
        });
    });

    categoryButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            const clickedButton = event.target.closest('.category-btn') || event.target;
            selectedCategory = clickedButton.dataset.category;
            showDifficultySelection();
        });
    });

    // Time selection event listeners
    timeButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            const clickedButton = event.target.closest('.time-btn') || event.target;
            const timeValue = clickedButton.dataset.time;
            
            if (timeValue === 'custom') {
                customTimeInput.classList.remove('hidden');
                customTimeValue.focus();
            } else {
                selectedInitialTime = parseInt(timeValue, 10);
                startGame();
            }
        });
    });

    confirmCustomTimeBtn.addEventListener('click', () => {
        const value = parseInt(customTimeValue.value, 10);
        if (isNaN(value) || value < 10 || value > 600) {
            alert('Por favor, insira um valor entre 10 e 600 segundos.');
            customTimeValue.focus();
            return;
        }
        selectedInitialTime = value;
        startGame();
    });

    // Allow Enter key in custom time input
    customTimeValue.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            confirmCustomTimeBtn.click();
        }
    });

    changeDifficultyBtn.addEventListener('click', () => showDifficultySelection());

    changeCategoryBtn.addEventListener('click', () => showHome());

    helpBtn.addEventListener('click', () => openScreen(helpScreen, categorySelection));
    helpBackBtn.addEventListener('click', () => showHome());

    statsBtn.addEventListener('click', () => {
        displayStatsScreen();
        openScreen(statsScreen, categorySelection);
    });
    statsBackBtn.addEventListener('click', () => showHome());

    filterCategoryInputs.forEach(input => input.addEventListener('change', displayStatsScreen));
    filterDifficultyInputs.forEach(input => input.addEventListener('change', displayStatsScreen));

    restartBtn.addEventListener('click', () => startGame());
    exitBtn.addEventListener('click', () => showHome());

    exportBtn.addEventListener('click', () => {
        fillPrintArea();
        exportAsImage();
    });

    resetStatsBtn.addEventListener('click', () => resetModal.classList.remove('hidden'));
    resetCancelBtn.addEventListener('click', () => resetModal.classList.add('hidden'));
    resetModal.addEventListener('click', (event) => {
        if (event.target === resetModal) {
            resetModal.classList.add('hidden');
        }
    });
    resetConfirmBtn.addEventListener('click', () => {
        localStorage.removeItem(WINSTREAKS_KEY);
        localStorage.removeItem(STATS_KEY);
        resetModal.classList.add('hidden');
        displayStatsScreen();
        updateDifficultyRecords();
    });

    // ---- Initial load ----
    hideAllScreens();
    loadAllQuestions();
});
