document.addEventListener('DOMContentLoaded', () => {
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
    const difficultySelection = document.getElementById('difficulty-selection');
    const difficultyButtons = document.querySelectorAll('.difficulty-btn');
    const timerElement = document.querySelector('.timer');
    const scoreElement = document.querySelector('.score');
    const timeBonusElement = document.getElementById('time-bonus');
    const recordTagElement = document.getElementById('record-tag');
    const difficultyTagElement = document.getElementById('difficulty-tag');
    const statsTableBodyElement = document.getElementById('stats-table-body');
    const statsTotalAnsweredElement = document.getElementById('stats-total-answered');
    const statsTotalCorrectElement = document.getElementById('stats-total-correct');
    const statsHitRateElement = document.getElementById('stats-hit-rate');
    const statsMaxStreakElement = document.getElementById('stats-max-streak');

    let allQuestions = []; // Store all questions loaded from the file
    let questions = []; // Questions for the current difficulty
    let currentQuestionIndex = 0;
    let answeredQuestions = new Set(); // To avoid immediate repetition
    let correctScore = 0;
    let incorrectScore = 0;
    let timeLeft = 30; // Initial time in seconds
    let timerInterval;
    let bonusFlashTimeout;
    let gameOver = false;
    let selectedDifficulty = '';
    let hardcoreMode = false;
    let funMode = false;
    let funCompleted = false;
    let timerPaused = false;

    const WINSTREAKS_KEY = 'quizWinstreaks';
    const STATS_KEY = 'quizStats';
    const CATEGORY_LABELS = { facil: 'Fácil', medio: 'Médio', dificil: 'Difícil', hardcore: 'Hardcore', lite: 'Lite' };

    function getCategoryKey(difficulty, hardcore) {
        if (hardcore) return 'hardcore';
        switch (difficulty) {
            case 'EASY': return 'facil';
            case 'MEDIUM': return 'medio';
            case 'HARD': return 'dificil';
            case 'LITE': return 'lite';
            default: return '';
        }
    }

    function getWinstreaks() {
        try {
            return JSON.parse(localStorage.getItem(WINSTREAKS_KEY)) || {};
        } catch (error) {
            return {};
        }
    }

    function getStats() {
        try {
            return JSON.parse(localStorage.getItem(STATS_KEY)) || {};
        } catch (error) {
            return {};
        }
    }

    function saveAnswerStat(category, correct) {
        if (!category) return;
        const stats = getStats();
        if (!stats[category]) {
            stats[category] = { answered: 0, correct: 0 };
        }
        stats[category].answered++;
        if (correct) {
            stats[category].correct++;
        }
        localStorage.setItem(STATS_KEY, JSON.stringify(stats));
    }

    function displayStatsScreen() {
        const stats = getStats();
        const streaks = getWinstreaks();
        let totalAnswered = 0;
        let totalCorrect = 0;
        const rowsHtml = Object.entries(CATEGORY_LABELS).map(([key, label]) => {
            const s = stats[key] || { answered: 0, correct: 0 };
            totalAnswered += s.answered;
            totalCorrect += s.correct;
            const rate = s.answered > 0 ? Math.round((s.correct / s.answered) * 100) : 0;
            return `<tr><td class="stats-label">${label}</td><td>${s.answered}</td><td>${s.correct}</td><td>${rate}%</td></tr>`;
        }).join('');
        statsTableBodyElement.innerHTML = rowsHtml;

        const overallRate = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;
        statsTotalAnsweredElement.textContent = totalAnswered;
        statsTotalCorrectElement.textContent = totalCorrect;
        statsHitRateElement.textContent = `Aproveitamento: ${overallRate}%`;
        const maxStreak = Object.values(streaks).reduce((max, v) => Math.max(max, v), 0);
        statsMaxStreakElement.textContent = maxStreak;
    }

    function updateDifficultyRecords() {
        const streaks = getWinstreaks();
        difficultyButtons.forEach(button => {
            const category = getCategoryKey(button.dataset.difficulty, button.dataset.hardcore === 'true');
            if (!category) return;
            const record = streaks[category] || 0;
            let recordSpan = button.querySelector('.difficulty-record');
            if (!recordSpan) {
                recordSpan = document.createElement('span');
                recordSpan.className = 'difficulty-record';
                button.appendChild(recordSpan);
            }
            recordSpan.textContent = record > 0 ? `Recorde: ${record} acertos` : 'Sem recorde ainda';
        });
    }

    function updateRecordTag() {
        if (gameOver) return;
        const category = getCategoryKey(selectedDifficulty, hardcoreMode);
        const record = getWinstreaks()[category] || 0;
        if (record <= 0 || correctScore <= 0) {
            recordTagElement.classList.add('hidden');
            return;
        }
        const remaining = record - correctScore;
        if (remaining >= 1 && remaining <= 3) {
            recordTagElement.textContent = remaining === 1
                ? 'Falta 1 resposta para o seu recorde!'
                : `Faltam ${remaining} respostas para o seu recorde!`;
            recordTagElement.classList.remove('hidden');
            recordTagElement.classList.remove('record-beaten');
        } else if (remaining <= 0) {
            recordTagElement.textContent = 'Você bateu seu recorde! Continue assim!';
            recordTagElement.classList.remove('hidden');
            recordTagElement.classList.add('record-beaten');
        } else {
            recordTagElement.classList.add('hidden');
        }
    }

    // Function to shuffle an array
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    async function loadAllQuestions() {
        try {
            const response = await fetch('questions.txt');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const text = await response.text();
            const lines = text.split('\n').filter(line => line.trim() !== '');
            allQuestions = lines.map(line => {
                const parts = line.split(' | ');
                return {
                    question: parts[0],
                    alternatives: [parts[1], parts[2], parts[3], parts[4]],
                    correctAnswerIndex: parseInt(parts[5]),
                    explanation: parts[6],
                    reference: parts[7],
                    difficulty: parts[8].trim()
                };
            });
            loadingMessage.classList.add('hidden');
            difficultySelection.classList.remove('hidden'); // Show difficulty selection
            updateDifficultyRecords(); // Show stored records on the difficulty buttons
        } catch (error) {
            console.error('Erro ao carregar perguntas:', error);
            questionTextElement.textContent = 'Erro ao carregar as perguntas. Por favor, tente novamente mais tarde.';
            loadingMessage.classList.add('hidden');
        }
    }

    function selectDifficulty(difficulty, hardcore = false, fun = false) {
        selectedDifficulty = difficulty;
        hardcoreMode = hardcore;
        funMode = fun;
        funCompleted = false;
        if (fun) {
            const grouped = {};
            allQuestions.forEach(q => {
                (grouped[q.difficulty] = grouped[q.difficulty] || []).push(q);
            });
            questions = [];
            ['EASY', 'MEDIUM', 'HARD'].forEach(d => {
                if (grouped[d]) questions.push(...shuffleArray(grouped[d]));
            });
            currentQuestionIndex = 0;
        } else {
            questions = allQuestions.filter(q => q.difficulty === (hardcore ? 'HARD' : difficulty));
            shuffleArray(questions); // Shuffle questions for the selected difficulty
        }

        difficultySelection.classList.add('hidden');
        quizCard.classList.remove('hidden');
        scoreElement.classList.remove('hidden');

        if (fun) {
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

    function startCronometer() {
        cronometerDisplay.textContent = `${timeLeft}s`;
        timerInterval = setInterval(() => {
            if (gameOver) {
                clearInterval(timerInterval);
                return;
            }
            if (timerPaused) {
                return; // Keep the time frozen while the explanation is on screen
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
        quizCard.classList.add('hidden'); // Hide the quiz card
        displayGameOverScreen(forcedLoss);
    }

    function displayGameOverScreen(forcedLoss = false) {
        const lost = forcedLoss || correctScore < (2 * incorrectScore);
        const gameContainer = document.querySelector('.container');
        const endMessage = (funMode && funCompleted) ? 'Você completou todas as perguntas!' : 'Fim do Jogo!';

        const category = getCategoryKey(selectedDifficulty, hardcoreMode);
        const categoryLabel = CATEGORY_LABELS[category] || '';
        let currentRecord = getWinstreaks()[category] || 0;
        let newRecord = false;
        if (!lost && category) {
            if (correctScore > currentRecord) {
                const streaks = getWinstreaks();
                streaks[category] = correctScore;
                localStorage.setItem(WINSTREAKS_KEY, JSON.stringify(streaks));
                newRecord = true;
                currentRecord = correctScore;
                updateDifficultyRecords();
            }
        }

        gameContainer.innerHTML = `
            <header>
                <h1>Quiz Bíblico Católico</h1>
            </header>
            <main>
                <div class="game-over-container">
                    <p class="game-over-message">${endMessage}</p>
                    <p class="game-over-summary">Acertos: ${correctScore}</p>
                    <p class="game-over-summary">Erros: ${incorrectScore}</p>
                    ${newRecord ? `<p class="game-over-new-record">Novo recorde em ${categoryLabel}: ${currentRecord} acertos!</p>` : ''}
                    ${!lost && category && !newRecord ? `<p class="game-over-record">Seu recorde em ${categoryLabel}: ${currentRecord} acertos</p>` : ''}
                    <p class="game-over-result ${lost ? 'lose' : 'win'}">
                        ${lost ? 'Você Perdeu!' : 'Você Venceu!'}
                    </p>
                    <button id="restart-btn" class="button">Jogar Novamente</button>
                </div>
            </main>
        `;
        document.getElementById('restart-btn').addEventListener('click', () => location.reload());
    }

    function renderQuestion(question) {
        questionTextElement.textContent = question.question;

        alternativesContainer.innerHTML = '';
        // Shuffle alternatives to ensure correct answer isn't always in the same position visually
        const shuffledAlternatives = shuffleArray(question.alternatives.map((alt, idx) => ({ alt, originalIndex: idx })));

        shuffledAlternatives.forEach(item => {
            const button = document.createElement('button');
            button.classList.add('alternative-btn');
            button.textContent = item.alt;
            button.dataset.originalIndex = item.originalIndex; // Store original index
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
            // All questions for the current difficulty have been answered, reset and reshuffle
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
            endGame(false); // All questions answered
            return;
        }
        answeredQuestions.add(currentQuestionIndex);
        renderQuestion(questions[currentQuestionIndex]);
    }

    function handleAnswer(selectedButton, selectedIndex) {
        if (gameOver) return;

        const currentQuestion = questions[currentQuestionIndex];
        const isCorrect = selectedIndex === currentQuestion.correctAnswerIndex;
        const statCategory = funMode ? 'lite' : getCategoryKey(selectedDifficulty, hardcoreMode);
        saveAnswerStat(statCategory, isCorrect);

        // Disable all alternative buttons after an answer is selected
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
                displayRandomQuestion(); // Hardcore: no answer, just the next question
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
        timerPaused = true; // Pause the timer so the player can read the explanation

        feedbackContainer.classList.remove('hidden');
        alternativesContainer.classList.add('hidden');
    }

    function updateScoreDisplay() {
        correctScoreSpan.textContent = correctScore;
        incorrectScoreSpan.textContent = incorrectScore;
        updateRecordTag();
    }

    function addBonusTime() {
        if (gameOver) return;
        let bonus = 0;
        if (hardcoreMode) {
            if (correctScore > 0 && correctScore % 5 === 0) {
                bonus = 3;
            }
        } else {
            switch (selectedDifficulty) {
                case 'EASY':
                    bonus = 3;
                    break;
                case 'MEDIUM':
                    bonus = 2;
                    break;
                case 'HARD':
                    bonus = 1;
                    break;
            }
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
        void timeBonusElement.offsetWidth; // Restart the animation
        timeBonusElement.style.animation = '';
    }

    function flashCronometer() {
        cronometerDisplay.classList.add('cronometer-bonus');
        clearTimeout(bonusFlashTimeout);
        bonusFlashTimeout = setTimeout(() => {
            cronometerDisplay.classList.remove('cronometer-bonus');
        }, 1000);
    }

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
        timerPaused = false; // Resume the timer when moving to the next question
        displayRandomQuestion();
    });

    const giveUpBtn = document.getElementById('give-up-btn');
    giveUpBtn.addEventListener('click', () => {
        if (gameOver) return;
        if (funMode) {
            endGame(false); // Finalizar: ends the game and evaluates normally
            return;
        }
        endGame(true);
    });

    // Event listeners for difficulty selection buttons
    difficultyButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            const clickedButton = event.target.closest('.difficulty-btn') || event.target;
            selectDifficulty(clickedButton.dataset.difficulty, clickedButton.dataset.hardcore === 'true', clickedButton.dataset.fun === 'true');
        });
    });

    // Help screen
    const helpBtn = document.getElementById('help-btn');
    const helpScreen = document.getElementById('help-screen');
    const helpBackBtn = document.getElementById('help-back-btn');

    helpBtn.addEventListener('click', () => {
        difficultySelection.classList.add('hidden');
        helpScreen.classList.remove('hidden');
    });

    helpBackBtn.addEventListener('click', () => {
        helpScreen.classList.add('hidden');
        difficultySelection.classList.remove('hidden');
    });

    // Stats screen
    const statsBtn = document.getElementById('stats-btn');
    const statsScreen = document.getElementById('stats-screen');
    const statsBackBtn = document.getElementById('stats-back-btn');

    statsBtn.addEventListener('click', () => {
        difficultySelection.classList.add('hidden');
        displayStatsScreen();
        statsScreen.classList.remove('hidden');
    });

    statsBackBtn.addEventListener('click', () => {
        statsScreen.classList.add('hidden');
        difficultySelection.classList.remove('hidden');
    });

    // Reset stats with confirmation modal
    const resetStatsBtn = document.getElementById('reset-stats-btn');
    const resetModal = document.getElementById('reset-modal');
    const resetCancelBtn = document.getElementById('reset-cancel-btn');
    const resetConfirmBtn = document.getElementById('reset-confirm-btn');

    resetStatsBtn.addEventListener('click', () => {
        resetModal.classList.remove('hidden');
    });

    resetCancelBtn.addEventListener('click', () => {
        resetModal.classList.add('hidden');
    });

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

    // Initial load
    quizCard.classList.add('hidden'); // Hide quiz until questions are loaded
    timerElement.classList.add('hidden');
    scoreElement.classList.add('hidden');
    difficultySelection.classList.add('hidden'); // Hide difficulty until questions are loaded
    loadAllQuestions();
});
