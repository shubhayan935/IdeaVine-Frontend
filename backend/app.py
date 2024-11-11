from flask import Flask, request, jsonify
from flask_cors import CORS
import tempfile
import os
from openai import OpenAI
import json
from utils import transcribe_audio, generate_nodes_from_transcription, synthesize_idea, send_to_openai, extract_and_parse_json
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

@app.route('/write', methods=['POST'])
def write():
    nodes = request.json['nodes']
    
    all_titles = [node['title'] for node in nodes]
    all_contents = [node['content'] for node in nodes]
    combined_text = " ".join(all_titles + all_contents)
    
    prompt = f"""
    Write a structured essay on the following ideas and concepts, connecting similar ones.
    Include:
    1. An introduction paragraph
    2. 2-3 body paragraphs connecting the main ideas
    3. A conclusion paragraph
    
    Make logical connections between these concepts:
    {combined_text}

    Output format:
    {{
        "title": "An overarching title for the analysis",
        "content": "Content of the essay",
    }}

    Ensure the output is properly formatted JSON enclosed in triple backticks.
    """
    
    response = send_to_openai(prompt)
    
    if response:
        return jsonify(response)
    else:
        return jsonify({'error': 'Failed to generate writing'}), 500


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 10000))
    app.run(host='0.0.0.0', port=port, debug=True)