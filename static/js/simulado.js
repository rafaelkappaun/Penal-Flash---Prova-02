let questoesSimulado = [];
let respostasSimulado = {};
let qtdQuestoes = 30;
let timerInterval = null;
let timerAtivo = false;
let segundosRestantes = 1800;

function setQtd(qtd) {
    qtdQuestoes = qtd;
    document.querySelectorAll('.simulado-config .btn').forEach(b => b.classList.remove('btn-primary'));
    document.getElementById('qtd' + qtd).classList.add('btn-primary');
}

function toggleTimer() {
    timerAtivo = document.getElementById('timerToggle').checked;
}

async function iniciarSimulado() {
    respostasSimulado = {};
    document.getElementById('simuladoConfig').style.display = 'none';
    document.getElementById('simuladoRelatorio').style.display = 'none';
    document.getElementById('simuladoContainer').style.display = 'block';

    const r = await fetch(`/api/simulado/gerar?qtd=${qtdQuestoes}`);
    questoesSimulado = await r.json();
    renderizarSimulado();

    if (timerAtivo) {
        segundosRestantes = 1800;
        iniciarTimer();
    }
}

function iniciarTimer() {
    const display = document.getElementById('timerDisplay');
    display.classList.add('active');
    timerInterval = setInterval(() => {
        segundosRestantes--;
        const min = Math.floor(segundosRestantes / 60);
        const seg = segundosRestantes % 60;
        display.textContent = `Tempo restante: ${min}:${seg.toString().padStart(2, '0')}`;
        if (segundosRestantes <= 0) {
            clearInterval(timerInterval);
            finalizarSimulado();
        }
    }, 1000);
}

function renderizarSimulado() {
    const container = document.getElementById('simuladoQuestoes');

    container.innerHTML = questoesSimulado.map((q, idx) => {
        if (q.tipo === 'vf') {
            return `
                <div class="questao-item" id="sq-${idx}">
                    <div class="simulado-questao-numero">Questão ${idx + 1} de ${questoesSimulado.length}</div>
                    <div class="questao-texto">${q.pergunta}</div>
                    <div class="questao-vf">
                        <button class="btn-vf true" onclick="responderSimuladoVF(${idx}, true, this)">V</button>
                        <button class="btn-vf false" onclick="responderSimuladoVF(${idx}, false, this)">F</button>
                    </div>
                </div>
            `;
        }
        return `
            <div class="questao-item" id="sq-${idx}">
                <div class="simulado-questao-numero">Questão ${idx + 1} de ${questoesSimulado.length}</div>
                <div class="questao-texto">${q.pergunta}</div>
                <div class="questao-alternativas">
                    ${q.alternativas.map((alt, i) => {
                        const letra = String.fromCharCode(65 + i);
                        return `
                            <div class="questao-alternativa" onclick="responderSimuladoMC(${idx}, '${letra}', this)">
                                <span class="questao-letra">${letra}</span>
                                <span>${alt.replace(/^[A-E]\)\s*/, '')}</span>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }).join('');
}

function responderSimuladoMC(idx, letra, el) {
    if (respostasSimulado[idx] !== undefined) return;
    respostasSimulado[idx] = letra;
    const parent = document.getElementById(`sq-${idx}`);
    parent.querySelectorAll('.questao-alternativa').forEach(a => a.style.borderColor = 'var(--border-glass)');
    el.style.borderColor = 'var(--accent-blue)';
    el.style.background = 'rgba(79, 110, 247, 0.1)';
}

function responderSimuladoVF(idx, valor, el) {
    if (respostasSimulado[idx] !== undefined) return;
    respostasSimulado[idx] = valor;
    const parent = document.getElementById(`sq-${idx}`);
    parent.querySelectorAll('.btn-vf').forEach(b => {
        b.classList.remove('selected-true', 'selected-false');
    });
    if (valor === true) el.classList.add('selected-true');
    else el.classList.add('selected-false');
}

function finalizarSimulado() {
    if (timerInterval) clearInterval(timerInterval);

    let certas = 0;
    let erros = 0;
    const errosPorTema = {};

    questoesSimulado.forEach((q, idx) => {
        const resp = respostasSimulado[idx];
        if (resp === undefined) {
            erros++;
            const tema = q.tema || 'Sem tema';
            errosPorTema[tema] = (errosPorTema[tema] || 0) + 1;
            return;
        }
        const correta = q.correta;
        if (resp === correta || resp === correta) {
            certas++;
        } else {
            erros++;
            const tema = q.tema || 'Sem tema';
            errosPorTema[tema] = (errosPorTema[tema] || 0) + 1;
        }
    });

    const total = questoesSimulado.length;
    const pct = Math.round((certas / total) * 100);

    document.getElementById('simuladoContainer').style.display = 'none';
    document.getElementById('simuladoRelatorio').style.display = 'block';
    document.getElementById('relatorioNota').textContent = `${certas}/${total}`;
    document.getElementById('relatorioPercentual').textContent = `${pct}% de acertos`;
    document.getElementById('relatorioBarra').style.width = pct + '%';

    const sorted = Object.entries(errosPorTema).sort((a, b) => b[1] - a[1]);
    const detalhes = document.getElementById('relatorioDetalhes');
    if (sorted.length === 0) {
        detalhes.innerHTML = '<p style="text-align:center;color:var(--accent-green);">Nenhum erro! &#x1F389;</p>';
    } else {
        detalhes.innerHTML = sorted.map(([tema, qtde]) => `
            <div class="relatorio-item">
                <span class="tema">${tema}</span>
                <span class="erros">${qtde} erro(s)</span>
            </div>
        `).join('');
    }
}
