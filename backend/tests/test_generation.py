from flask import Flask, request, jsonify
from flask_cors import CORS, cross_origin
from openai import OpenAI
import tempfile
import os
import json

client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

def transcribe_audio(audio_file_path):
  audio_file= open("audio_file_path", "rb")
  transcription = client.audio.transcriptions.create(
    model="whisper-1", 
    file=audio_file
  )
  print(transcription.text)
  return transcription.text

def generate_nodes_from_transcription(transcription):
  
  prompt = f"""
  You are an assistant that converts spoken thoughts into a structured mind map. Given the input transcription, extract key ideas and organize them hierarchically as a list of nodes suitable for a mind map.

  Output format:
  [
      {{
          "id": "unique_node_id",
          "parents": "parent_node_ids_or_[]",
          "children": "children_node_ids_or_[]",
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

  print(json.loads(completion.choices[0].message.content))
  return completion.choices[0].message
   

transcription = "I've been thinking about launching a new product line for our company. The main idea is to introduce eco-friendly office supplies. Firstly, we can start with recycled paper products like notebooks and printing paper. Secondly, we should consider biodegradable pens and pencils made from sustainable materials. Additionally, marketing will play a crucial role. We need to focus on digital marketing strategies, including social media campaigns and influencer partnerships. Customer feedback is also essential; we should set up surveys and feedback forms to gather insights. Lastly, we need to look into potential partnerships with environmental organizations to boost our brand image."

# Generate nodes from transcription using GPT
nodes = generate_nodes_from_transcription(transcription)