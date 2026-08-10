# Quiz Teológico e Bíblico

Um projeto focado em testar e expandir o conhecimento bíblico e teológico através de uma plataforma interativa. O jogo conta com perguntas de diferentes níveis de dificuldade e modos de jogo dinâmicos para desafiar a precisão e a velocidade do jogador.

## 🚀 Tecnologias
* **Fase Atual:** HTML, CSS e JavaScript (Vanilla)
* **Arquitetura Futura:** React (Frontend), FastAPI (Backend) e SQLite (Banco de Dados)

---

## 🗺️ Roadmap e Estado do Projeto

Abaixo está o rastreamento de tudo o que já foi validado e o que está planejado para o desenvolvimento:

- [x] **Curadoria de Conteúdo:** Estruturação inicial de perguntas profundas (níveis Easy, Medium e Hard) com justificativas e referências bíblicas/teológicas.
- [x] **Prova de Conceito (PoC):** Criação da interface base e lógica de validação de respostas utilizando HTML, CSS e JavaScript puro.
- [ ] **Modo Hardcore (Morte Súbita):** Implementação da regra onde 1 único erro resulta no fim imediato do jogo.
- [ ] **Modo Time Attack (Mecânica de Bônus de Tempo):** 
  - O jogador corre contra o relógio.
  - Acertar questão **Easy**: +3 segundos.
  - Acertar questão **Medium**: +1 segundo.
  - Acertar questão **Hard**: +0 segundos (foco em pressão e conhecimento).
- [ ] **Migração de Stack:** Refatoração do frontend para **React** e construção da API REST com **FastAPI**.
- [ ] **Integração de Banco de Dados:** Implementação do **SQLite** para armazenar e servir as perguntas, substituindo os dados estáticos em código.
- [ ] **Sistema de Pontuação:** Multiplicadores baseados na dificuldade da questão e velocidade de resposta.
- [ ] **Leaderboard / Ranking:** Tabela de classificação para registrar os melhores desempenhos no Modo Hardcore.

---

## 🛠️ Como executar (Versão Atual)
1. Clone este repositório.
2. Abra o arquivo `index.html` diretamente no seu navegador.
3. *Instruções adicionais de setup para React e FastAPI serão adicionadas conforme a migração da stack.*