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

    let allQuestions = []; // Store all questions loaded from the file
    let questions = []; // Questions for the current difficulty
    let currentQuestionIndex = 0;
    let answeredQuestions = new Set(); // To avoid immediate repetition
    let correctScore = 0;
    let incorrectScore = 0;
    let timeLeft = 60; // Initial time in seconds
    let timerInterval;
    let gameOver = false;
    let selectedDifficulty = '';

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
        } catch (error) {
            console.error('Erro ao carregar perguntas:', error);
            questionTextElement.textContent = 'Erro ao carregar as perguntas. Por favor, tente novamente mais tarde.';
            loadingMessage.classList.add('hidden');
        }
    }

    function selectDifficulty(difficulty) {
        selectedDifficulty = difficulty;
        questions = allQuestions.filter(q => q.difficulty === difficulty);
        shuffleArray(questions); // Shuffle questions for the selected difficulty

        difficultySelection.classList.add('hidden');
        quizCard.classList.remove('hidden');
        timerElement.classList.remove('hidden');
        scoreElement.classList.remove('hidden');

        startCronometer();
        displayRandomQuestion();
    }

    function startCronometer() {
        cronometerDisplay.textContent = `${timeLeft}s`;
        timerInterval = setInterval(() => {
            if (gameOver) {
                clearInterval(timerInterval);
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
        quizCard.classList.add('hidden'); // Hide the quiz card
        displayGameOverScreen(forcedLoss);
    }

    function displayGameOverScreen(forcedLoss = false) {
        const lost = forcedLoss || correctScore < (2 * incorrectScore);
        const gameContainer = document.querySelector('.container');
        gameContainer.innerHTML = `
            <header>
                <h1>Quiz Bíblico Católico</h1>
            </header>
            <main>
                <div class="game-over-container">
                    <p class="game-over-message">Fim do Jogo!</p>
                    <p class="game-over-summary">Acertos: ${correctScore}</p>
                    <p class="game-over-summary">Erros: ${incorrectScore}</p>
                    <p class="game-over-result ${lost ? 'lose' : 'win'}">
                        ${lost ? 'Você Perdeu!' : 'Você Venceu!'}
                    </p>
                    <button id="restart-btn" class="button">Jogar Novamente</button>
                </div>
            </main>
        `;
        document.getElementById('restart-btn').addEventListener('click', () => location.reload());
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

        const currentQuestion = questions[currentQuestionIndex];
        questionTextElement.textContent = currentQuestion.question;

        alternativesContainer.innerHTML = '';
        // Shuffle alternatives to ensure correct answer isn't always in the same position visually
        const shuffledAlternatives = shuffleArray(currentQuestion.alternatives.map((alt, idx) => ({ alt, originalIndex: idx })));

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
    }

    function handleAnswer(selectedButton, selectedIndex) {
        if (gameOver) return;

        const currentQuestion = questions[currentQuestionIndex];
        const isCorrect = selectedIndex === currentQuestion.correctAnswerIndex;

        // Disable all alternative buttons after an answer is selected
        Array.from(alternativesContainer.children).forEach(button => {
            button.disabled = true;
            if (parseInt(button.dataset.originalIndex) === currentQuestion.correctAnswerIndex) {
                button.classList.add('correct');
            }
        });

        if (isCorrect) {
            selectedButton.classList.add('correct');
            feedbackMessage.textContent = 'Correto!';
            feedbackMessage.classList.remove('incorrect');
            feedbackMessage.classList.add('correct');
            correctScore++;
        } else {
            selectedButton.classList.add('incorrect');
            feedbackMessage.textContent = 'Incorreto!';
            feedbackMessage.classList.remove('correct');
            feedbackMessage.classList.add('incorrect');
            incorrectScore++;
        }
        updateScoreDisplay();

        correctAnswerElement.textContent = `A resposta correta era: ${currentQuestion.alternatives[currentQuestion.correctAnswerIndex]}`;
        explanationElement.textContent = `Explicação: ${currentQuestion.explanation}`;
        referenceElement.textContent = `Referência: ${currentQuestion.reference}`;

        feedbackContainer.classList.remove('hidden');
        alternativesContainer.classList.add('hidden');
    }

    function updateScoreDisplay() {
        correctScoreSpan.textContent = correctScore;
        incorrectScoreSpan.textContent = incorrectScore;
    }

    nextQuestionBtn.addEventListener('click', () => {
        if (gameOver) return;
        displayRandomQuestion();
    });

    const giveUpBtn = document.getElementById('give-up-btn');
    giveUpBtn.addEventListener('click', () => {
        if (gameOver) return;
        endGame(true);
    });

    // Event listeners for difficulty selection buttons
    difficultyButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            selectDifficulty(event.target.dataset.difficulty);
        });
    });

    // Initial load
    quizCard.classList.add('hidden'); // Hide quiz until questions are loaded
    timerElement.classList.add('hidden');
    scoreElement.classList.add('hidden');
    difficultySelection.classList.add('hidden'); // Hide difficulty until questions are loaded
    loadAllQuestions();
});
