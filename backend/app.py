from flask import Flask, request, jsonify
from flask_cors import CORS, cross_origin
import tempfile
import os
from openai import OpenAI
import json
from typing import List, Dict
import google.generativeai as genai
import re
from dotenv import load_dotenv

load_dotenv()
genai.configure(api_key=os.getenv('GEMINI_API_KEY'))
client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

app = Flask(__name__)
cors = CORS(app)

def send_to_gemini(prompt: str) -> str:
  model = genai.GenerativeModel("gemini-1.5-flash")
  response = model.generate_content(prompt)
  return response.text

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

  Input: {transcription}

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

  response = extract_and_parse_json(send_to_gemini(prompt))

  print(response)
  return response
   

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

def extract_and_parse_json(text):
    # Use regex to find content between triple backticks
    match = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', text)
    
    if match:
        json_str = match.group(1)
        try:
            # Parse the extracted JSON string
            return json.loads(json_str)
        except json.JSONDecodeError as e:
            print(f"Error parsing JSON: {e}")
            return None
    else:
        print("No JSON content found between triple backticks")
        return None
    
# Placeholder
def calculate_new_position(nodes: List[Dict]) -> Dict[str, int]:
    # Calculate the average position of all nodes
    avg_x = sum(node['position']['x'] for node in nodes) / len(nodes)
    avg_y = sum(node['position']['y'] for node in nodes) / len(nodes)
    return {'x': round(avg_x), 'y': round(avg_y) + 100}  # Place it slightly below the average

def synthesize_idea(nodes: List[Dict]) -> Dict:
    # Combine all titles and contents
    all_titles = [node['data']['title'] for node in nodes]
    all_contents = [node['data']['content'] for node in nodes]
    
    combined_text = " ".join(all_titles + all_contents)
    
    # Create a prompt for Gemini
    prompt = f"""
    You are an assistant that generates one new idea from the following ideas: \n{combined_text}\n\n

    Output format:
    {{
        "title": "Node Title",
        "content": "Content"
    }}

    Begin:
    """
    
    # Send prompt to Gemini and get response
    gemini_response_text = extract_and_parse_json(send_to_gemini(prompt))
    
    # Create a new node with the synthesized idea
    new_node = {
        'id': '-1',
        'type': 'customNode',
        'data': {
            'title': gemini_response_text['title'],
            'content': gemini_response_text['content']
        },
        'position': calculate_new_position(nodes),
        'parents': [node['id'] for node in nodes],
        'children': []
    }
    
    return new_node

@app.route('/synthesize', methods=['POST'])
def synthesize():
    nodes = request.json['nodes']
    new_node = synthesize_idea(nodes)
    return jsonify(new_node)

if __name__ == '__main__':
    app.run(debug=True)