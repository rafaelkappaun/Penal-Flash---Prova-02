let allQuestoes = [];
let filteredQuestoes = [];
let respostas = {};

const PROGRESS_KEY = 'civil_flash_questoes';

function loadRespostas() {
    try {
        return JSON.parse(localStorage.getItem(PROGRESS_KEY) || '{}');
    } catch { return {}; }
}

function saveResposta(id, value) {
    const data = loadRespostas();
    data[id] = value;
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(data));
}

function calcularAcertos() {
    const resp = loadRespostas();
    let certas = 0;
    let total = 0;
    filteredQuestoes.forEach(q => {
        if (resp[q.id] !== undefined) {
            total++;
            if (resp[q.id] === q.correta) {
                certas++;
            }
        }
    });
    const pct = total > 0 ? Math.round((certas / total) * 100) : 0;
    document.getElementById('acertosLabel').textContent = `${pct}% de acertos (${certas}/${total})`;
}

function renderQuestoes(lista) {
    filteredQuestoes = lista;
    const container = document.getElementById('questoesContainer');
    const resp = loadRespostas();

    container.innerHTML = lista.map(q => {
        const respondido = resp[q.id];
        const isCorrect = respondido !== undefined && (respondido === q.correta || respondido === q.correta);

        if (q.tipo === 'vf') {
            const corretaVF = q.correta === true;
            let btnTrueClass = '';
            let btnFalseClass = '';
            if (respondido !== undefined) {
                if (corretaVF) {
                    btnTrueClass = ' correct';
                    if (respondido === false) btnFalseClass = ' wrong';
                } else {
                    btnFalseClass = ' correct';
                    if (respondido === true) btnTrueClass = ' wrong';
                }
            }
            return `
                <div class="questao-item" id="q-${q.id}">
                    <div class="questao-header">
                        <span class="questao-numero">Questão ${q.id}</span>
                        <span class="questao-tema">${q.tema || ''}</span>
                    </div>
                    <div class="questao-texto">${q.pergunta}</div>
                    <div class="questao-vf">
                        <button class="btn-vf true${btnTrueClass}" onclick="responderVF(${q.id}, true)">V</button>
                        <button class="btn-vf false${btnFalseClass}" onclick="responderVF(${q.id}, false)">F</button>
                    </div>
                    <div class="questao-explicacao ${respondido !== undefined ? 'visible' : ''}" id="expl-${q.id}">
                        <strong>${respondido !== undefined ? (isCorrect ? '&#x2705; Correto!' : '&#x274C; Errado!') : 'Clique em V ou F para responder'}</strong><br>
                        ${q.explicacao}
                    </div>
                </div>
            `;
        }

        return `
            <div class="questao-item" id="q-${q.id}">
                <div class="questao-header">
                    <span class="questao-numero">Questão ${q.id}</span>
                    <span class="questao-tema">${q.tema || ''}</span>
                </div>
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
                            <div class="questao-alternativa${extraClass}" onclick="responderMC(${q.id}, '${letra}')">
                                <span class="questao-letra">${letra}</span>
                                <span>${alt.replace(/^[A-E]\)\s*/, '')}</span>
                            </div>
                        `;
                    }).join('')}
                </div>
                <div class="questao-explicacao ${respondido !== undefined ? 'visible' : ''}" id="expl-${q.id}">
                    <strong>${respondido !== undefined ? (isCorrect ? '&#x2705; Correto!' : '&#x274C; Errado!') : 'Clique em uma alternativa para responder'}</strong><br>
                    ${q.explicacao}
                </div>
            </div>
        `;
    }).join('');

    calcularAcertos();
}

function responderMC(id, letra) {
    const q = filteredQuestoes.find(x => x.id === id);
    if (!q) return;
    if (loadRespostas()[id] !== undefined) return;
    saveResposta(id, letra);
    renderQuestoes(filteredQuestoes);
}

function responderVF(id, valor) {
    const q = filteredQuestoes.find(x => x.id === id);
    if (!q) return;
    if (loadRespostas()[id] !== undefined) return;
    saveResposta(id, valor);
    renderQuestoes(filteredQuestoes);
}

function filtrarQuestoes(tipo) {
    document.querySelectorAll('.questoes-filters .btn').forEach(b => b.classList.remove('btn-primary'));
    event.target.classList.add('btn-primary');

    let lista = allQuestoes;
    if (tipo === 'mc') lista = allQuestoes.filter(q => q.tipo === 'mc');
    if (tipo === 'vf') lista = allQuestoes.filter(q => q.tipo === 'vf');
    if (tipo === 'erros') {
        const resp = loadRespostas();
        lista = allQuestoes.filter(q => {
            const r = resp[q.id];
            return r !== undefined && r !== q.correta;
        });
    }
    renderQuestoes(lista);
}

fetch('/api/questoes')
    .then(r => r.json())
    .then(data => {
        allQuestoes = data;
        renderQuestoes(allQuestoes);
    });
