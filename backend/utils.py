import os
import json
import re
from typing import List, Dict
from openai import OpenAI
# from dotenv import load_dotenv

# load_dotenv()

# Initialize client
client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

def send_to_openai(prompt: str) -> str:
    # Send prompt to OpenAI and get response
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You are an assistant that helps create structured mind maps and synthesize ideas."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.7,
    )
    
    answer = response.choices[0].message.content
    parsed_response = extract_and_parse_json(answer)
    print(f'OPENAI RESPONSE: {parsed_response}')
    return parsed_response

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
    Convert the following transcription into a structured mind map. Extract key ideas and organize them hierarchically as a list of nodes.

    Input: {transcription}

    Output the result as a JSON array of nodes. Each node should have this structure:
    {{
        "id": "unique_node_id",
        "parents": "parent_node_ids_or_null" (string),
        "children": "children_node_ids_or_null" (string),
        "title": "Node Title",
        "content": "Content"
    }}

    Ensure the output is properly formatted JSON enclosed in triple backticks.
    """
    answer = send_to_openai(prompt)
    print(f'ANSWER HERE: {answer}')
    return answer

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
        # If no triple backticks found, try to parse the entire text as JSON
        try:
            return json.loads(text)
        except json.JSONDecodeError as e:
            print(f"Error parsing JSON: {e}")
            return None

def calculate_new_position(nodes: List[Dict]) -> Dict[str, int]:
    avg_x = sum(node['position']['x'] for node in nodes) / len(nodes)
    avg_y = sum(node['position']['y'] for node in nodes) / len(nodes)
    return {'x': round(avg_x), 'y': round(avg_y) + 100}

def synthesize_idea(nodes: List[Dict]) -> Dict:
    print(nodes)
    all_titles = [node['title'] for node in nodes]
    all_contents = [node['content'] for node in nodes]
    
    combined_text = " ".join(all_titles + all_contents)
    
    prompt = f"""
    Generate one new idea or thought based on the following input. Limit the content to 20 words.

    Input: {combined_text}

    Output a single JSON object with this structure:
    {{
        "title": "Node Title",
        "content": "Content"
    }}

    Ensure the output is properly formatted JSON enclosed in triple backticks.
    """
    
    openai_response = send_to_openai(prompt)
    
    new_node = {
        'id': '-1',
        'title': openai_response['title'],
        'content': openai_response['content'],
        'parents': [node['id'] for node in nodes],
        'children': []
    }
    
    return new_node