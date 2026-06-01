import json
import random
from pathlib import Path
from flask import Flask, render_template, jsonify, request, session

app = Flask(__name__)
app.secret_key = 'civil-flash-secret-key-2026'

DATA_DIR = Path(__file__).parent / 'data'

def load_json(filename):
    with open(DATA_DIR / filename, encoding='utf-8') as f:
        return json.load(f)

@app.context_processor
def inject_theme():
    return {'theme': 'dark'}

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/resumos')
def resumos():
    return render_template('resumos.html')

@app.route('/api/resumos')
def api_resumos():
    data = load_json('resumos.json')
    temas = data.get('temas', data if isinstance(data, list) else [])
    assunto = request.args.get('assunto', '').lower()
    if assunto:
        temas = [t for t in temas if assunto in t.get('titulo', '').lower()]
    return jsonify(temas)

@app.route('/flashcards')
def flashcards():
    return render_template('flashcards.html')

@app.route('/api/flashcards')
def api_flashcards():
    data = load_json('flashcards.json')
    cards = data if isinstance(data, list) else data.get('flashcards', [])
    assunto = request.args.get('assunto', '').lower()
    if assunto:
        cards = [c for c in cards if assunto in c.get('tema', '').lower()]
    return jsonify(cards)

@app.route('/questoes')
def questoes():
    return render_template('questoes.html')

@app.route('/api/questoes')
def api_questoes():
    data = load_json('questoes.json')
    questoes = data if isinstance(data, list) else data.get('questoes', [])
    assunto = request.args.get('assunto', '').lower()
    if assunto:
        questoes = [q for q in questoes if assunto in q.get('tema', '').lower()]
    return jsonify(questoes)

@app.route('/simulado')
def simulado():
    return render_template('simulado.html')

@app.route('/api/simulado/gerar')
def api_simulado_gerar():
    qtd = request.args.get('qtd', '20')
    qtd = int(qtd) if qtd.isdigit() else 20
    qtd = max(10, min(30, qtd))
    data = load_json('questoes.json')
    questoes = data if isinstance(data, list) else data.get('questoes', [])
    selected = random.sample(questoes, min(qtd, len(questoes)))
    return jsonify(selected)

@app.route('/revisao-final')
def revisao_final():
    return render_template('revisao_final.html')

@app.route('/api/revisao-final')
def api_revisao_final():
    data = load_json('revisao_final.json')
    return jsonify(data)

@app.route('/professor')
def professor():
    return render_template('professor.html')

@app.route('/api/temas')
def api_temas():
    data = load_json('resumos.json')
    temas = data if isinstance(data, list) else data.get('temas', [])
    return jsonify([t['titulo'] for t in temas if 'titulo' in t])

if __name__ == '__main__':
    app.run(debug=True)
