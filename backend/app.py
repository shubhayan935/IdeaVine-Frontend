from flask import Flask, request, jsonify
from flask_cors import CORS
import tempfile
import os
from utils import transcribe_audio, generate_nodes_from_transcription, synthesize_idea
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
cors = CORS(app)

@app.route('/process_audio', methods=['POST', 'GET'])
def process_audio():
    if 'audio_file' not in request.files:
        return jsonify({'error': 'No audio file provided'}), 400

    audio_file = request.files['audio_file']

    # Save the audio file temporarily
    with tempfile.NamedTemporaryFile(delete=False, suffix='.mp3') as tmp:
        audio_file.save(tmp.name)
        audio_file_path = tmp.name

    try:
        # Transcribe the audio using Whisper
        transcription = transcribe_audio(audio_file_path)

        # Generate nodes from transcription
        nodes = generate_nodes_from_transcription(transcription)

        return jsonify({'nodes': nodes})
    finally:
        # Clean up the temporary file
        os.remove(audio_file_path)

@app.route('/synthesize', methods=['POST'])
def synthesize():
    nodes = request.json['nodes']
    new_node = synthesize_idea(nodes)
    return jsonify(new_node)

if __name__ == '__main__':
    app.run(debug=True)