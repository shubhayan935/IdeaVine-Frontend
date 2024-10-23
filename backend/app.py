from flask import Flask, request, jsonify
from flask_cors import CORS
import tempfile
import os
from utils import transcribe_audio, generate_nodes_from_transcription, synthesize_idea
from openai import OpenAI
import json

# load_dotenv()

app = Flask(__name__)
cors = CORS(app)

client = OpenAI()

def transcribe_audio(audio_file_path):
  audio_file= open(audio_file_path, "rb")
  transcription = client.audio.transcriptions.create(
    model="whisper-1", 
    file=audio_file
  )
  print('transcription: ', transcription.text)
  return transcription.text

def generate_nodes_from_transcription(transcription):
  prompt = f"""
  You are an assistant that converts spoken thoughts into a structured mind map. Given the input transcription, extract key ideas and organize them hierarchically as a list of nodes suitable for a mind map.

  Output format:
  [
      {{
          "id": "unique_node_id",
          "parents": "parent_node_ids_or_null",
          "children": "children_node_ids_or_null",
          "title": "Node Title",
          "content": "Content"
      }},
      ...
  ]

  Begin:
  """

  completion = client.chat.completions.create(
  model="gpt-4o-mini",
  messages=[
    {"role": "system", "content": prompt},
    {"role": "user", "content": transcription}
  ],
  temperature=0.0,
  )

  print(completion.choices[0].message.content)
  return json.loads(completion.choices[0].message.content)
   

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