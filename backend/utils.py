import os
import json
import re
from typing import List, Dict
from openai import OpenAI
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

# Initialize clients
genai.configure(api_key=os.getenv('GEMINI_API_KEY'))
client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

def send_to_gemini(prompt: str) -> str:
    model = genai.GenerativeModel("gemini-1.5-flash")
    response = model.generate_content(prompt)
    return response.text

def transcribe_audio(audio_file_path):
    with open(audio_file_path, "rb") as audio_file:
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

def extract_and_parse_json(text):
    match = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', text)
    
    if match:
        json_str = match.group(1)
        try:
            return json.loads(json_str)
        except json.JSONDecodeError as e:
            print(f"Error parsing JSON: {e}")
            return None
    else:
        print("No JSON content found between triple backticks")
        return None

def calculate_new_position(nodes: List[Dict]) -> Dict[str, int]:
    avg_x = sum(node['position']['x'] for node in nodes) / len(nodes)
    avg_y = sum(node['position']['y'] for node in nodes) / len(nodes)
    return {'x': round(avg_x), 'y': round(avg_y) + 100}

def synthesize_idea(nodes: List[Dict]) -> Dict:
    all_titles = [node['data']['title'] for node in nodes]
    all_contents = [node['data']['content'] for node in nodes]
    
    combined_text = " ".join(all_titles + all_contents)
    
    prompt = f"""
    You are an assistant that generates one new idea from the following ideas: \n{combined_text}\n\n

    Output format:
    {{
        "title": "Node Title",
        "content": "Content"
    }}

    Begin:
    """
    
    gemini_response_text = extract_and_parse_json(send_to_gemini(prompt))
    
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