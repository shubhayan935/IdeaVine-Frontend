from flask import Flask, request, jsonify
from flask_cors import CORS, cross_origin
from openai import OpenAI
import tempfile
import os
import json

app = Flask(__name__)
cors = CORS(app)

os.environ['OPENAI_API_KEY'] = "sk-proj-RmmuI2WsruF2tXW4cdkzT3BlbkFJgbGOd2gIwBd6fDn5bk4p"
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

    # Transcribe the audio using Whisper
    transcription = transcribe_audio(audio_file_path)
    # transcription = "I've been thinking about launching a new product line for our company. The main idea is to introduce eco-friendly office supplies. Firstly, we can start with recycled paper products like notebooks and printing paper. Secondly, we should consider biodegradable pens and pencils made from sustainable materials. Additionally, marketing will play a crucial role. We need to focus on digital marketing strategies, including social media campaigns and influencer partnerships. Customer feedback is also essential; we should set up surveys and feedback forms to gather insights. Lastly, we need to look into potential partnerships with environmental organizations to boost our brand image."

    # Generate nodes from transcription using GPT
    nodes = generate_nodes_from_transcription(transcription)

    # Clean up the temporary file
    os.remove(audio_file_path)

    return jsonify({'nodes': nodes})

if __name__ == '__main__':
    app.run(debug=True)