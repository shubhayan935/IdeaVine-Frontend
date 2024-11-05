'''
Functions: 
generation of idea from nodes 
[
  {
    id: '1',
    type: 'customNode',
    data: { title: 'Main Idea', content: 'Start your mind map here' },
    position: { x: 250, y: 0 },
    parents: [2, 3],
    children: [4, 5],
  },
]
'''

import json
from typing import List, Dict

def synthesize_idea(nodes: List[Dict]) -> Dict:
    # Combine all titles and contents
    all_titles = [node['data']['title'] for node in nodes]
    all_contents = [node['data']['content'] for node in nodes]
    
    combined_text = " ".join(all_titles + all_contents)
    
    # Create a prompt for Gemini
    prompt = f"Based on the following ideas and contents, generate a single new, synthesized idea:\n\n{combined_text}\n\nNew synthesized idea:"
    
    # Send prompt to Gemini and get response
    gemini_response = send_to_gemini(prompt)
    
    # Create a new node with the synthesized idea
    new_node = {
        'id': generate_new_id(nodes),
        'type': 'customNode',
        'data': {
            'title': 'Synthesized Idea',
            'content': gemini_response
        },
        'position': calculate_new_position(nodes),
        'parents': [node['id'] for node in nodes],
        'children': []
    }
    
    return new_node

def send_to_gemini(prompt: str) -> str:
    # TODO: Implement the API call to Gemini here
    # For now, we'll return a placeholder response
    return "This is a placeholder for the synthesized idea from Gemini."

def generate_new_id(nodes: List[Dict]) -> str:
    # Generate a new unique ID
    existing_ids = [node['id'] for node in nodes]
    new_id = max(map(int, existing_ids)) + 1
    return str(new_id)

def calculate_new_position(nodes: List[Dict]) -> Dict[str, int]:
    # Calculate the average position of all nodes
    avg_x = sum(node['position']['x'] for node in nodes) / len(nodes)
    avg_y = sum(node['position']['y'] for node in nodes) / len(nodes)
    return {'x': round(avg_x), 'y': round(avg_y) + 100}  # Place it slightly below the average

# Example usage
def main():
    # Sample input nodes
    input_nodes = [
        {
            'id': '1',
            'type': 'customNode',
            'data': { 'title': 'Main Idea', 'content': 'Start your mind map here' },
            'position': { 'x': 250, 'y': 0 },
            'parents': [],
            'children': ['2', '3'],
        },
        {
            'id': '2',
            'type': 'customNode',
            'data': { 'title': 'Subtopic 1', 'content': 'First branch of thought' },
            'position': { 'x': 100, 'y': 100 },
            'parents': ['1'],
            'children': [],
        },
        {
            'id': '3',
            'type': 'customNode',
            'data': { 'title': 'Subtopic 2', 'content': 'Second branch of thought' },
            'position': { 'x': 400, 'y': 100 },
            'parents': ['1'],
            'children': [],
        },
    ]

    new_node = synthesize_idea(input_nodes)
    print(json.dumps(new_node, indent=2))

if __name__ == "__main__":
    main()

