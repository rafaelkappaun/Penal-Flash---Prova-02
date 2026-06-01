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
    const totalRespondidas = Object.keys(respostasSimulado).length;
    const todasRespondidas = totalRespondidas === questoesSimulado.length;

    container.innerHTML = questoesSimulado.map((q, idx) => {
        const respondido = respostasSimulado[idx];
        const isCorrect = respondido !== undefined && (respondido === q.correta || respondido === q.correta);

        if (q.tipo === 'vf') {
            const corretaVF = q.correta === true || q.correta === 'true' || q.correta === 'V';
            let btnTrueClass = '';
            let btnFalseClass = '';
            if (respondido !== undefined) {
                if (corretaVF) {
                    btnTrueClass = ' correct';
                    if (respondido === false || respondido === 'false' || respondido === false) btnFalseClass = ' wrong';
                } else {
                    btnFalseClass = ' correct';
                    if (respondido === true || respondido === 'true' || respondido === true) btnTrueClass = ' wrong';
                }
            }
            return `
                <div class="questao-item" id="sq-${idx}">
                    <div class="simulado-questao-numero">Questão ${idx + 1} de ${questoesSimulado.length}</div>
                    <div class="questao-texto">${q.pergunta}</div>
                    <div class="questao-vf">
                        <button class="btn-vf true${btnTrueClass}" onclick="responderSimuladoVF(${idx}, true)" ${respondido !== undefined ? 'disabled' : ''}>V</button>
                        <button class="btn-vf false${btnFalseClass}" onclick="responderSimuladoVF(${idx}, false)" ${respondido !== undefined ? 'disabled' : ''}>F</button>
                    </div>
                    <div class="questao-explicacao ${respondido !== undefined ? 'visible' : ''}">
                        <strong>${respondido !== undefined ? (isCorrect ? '&#x2705; Correto!' : '&#x274C; Errado!') : 'Aguardando resposta...'}</strong><br>
                        ${q.explicacao}
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
                        let extraClass = '';
                        if (respondido !== undefined) {
                            if (letra === q.correta) extraClass = ' correct';
                            else if (letra === respondido) extraClass = ' wrong';
                        }
                        return `
                            <div class="questao-alternativa${extraClass}" onclick="responderSimuladoMC(${idx}, '${letra}')">
                                <span class="questao-letra">${letra}</span>
                                <span>${alt.replace(/^[A-E]\)\s*/, '')}</span>
                            </div>
                        `;
                    }).join('')}
                </div>
                <div class="questao-explicacao ${respondido !== undefined ? 'visible' : ''}">
                    <strong>${respondido !== undefined ? (isCorrect ? '&#x2705; Correto!' : '&#x274C; Errado!') : 'Aguardando resposta...'}</strong><br>
                    ${q.explicacao}
                </div>
            </div>
        `;
    }).join('');

    if (todasRespondidas) {
        const btnGroup = document.querySelector('#simuladoContainer > div:last-child');
        if (btnGroup) {
            btnGroup.innerHTML = `
                <button class="btn btn-gold" onclick="finalizarSimulado()">&#x1F4CA; Ver Relatório</button>
            `;
        }
    }

    atualizarContador();
}

function atualizarContador() {
    const total = questoesSimulado.length;
    const respondidas = Object.keys(respostasSimulado).length;
    let el = document.getElementById('simuladoContador');
    if (!el) {
        el = document.createElement('div');
        el.id = 'simuladoContador';
        el.style.cssText = 'text-align:center;font-size:14px;color:var(--text-secondary);margin-bottom:16px;';
        document.getElementById('simuladoQuestoes').before(el);
    }
    el.innerHTML = `Respondidas: ${respondidas} / ${total}`;
}

function responderSimuladoMC(idx, letra) {
    if (respostasSimulado[idx] !== undefined) return;
    respostasSimulado[idx] = letra;
    renderizarSimulado();
}

function responderSimuladoVF(idx, valor) {
    if (respostasSimulado[idx] !== undefined) return;
    respostasSimulado[idx] = valor;
    renderizarSimulado();
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
