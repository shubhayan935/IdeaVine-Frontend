# app.py

from flask import Flask, request, jsonify
from flask_cors import CORS
import tempfile
import os
from openai import OpenAI
import json
from utils import transcribe_audio, generate_nodes_from_transcription, synthesize_idea, send_to_openai, extract_and_parse_json
from dotenv import load_dotenv
from datetime import datetime
from bson.errors import InvalidId
from database.schema import (
    # Classes
    UserDB,
    MindMapDB,
    NodeDB,
    # Functions
    validate_mindmap_id,
    generate_node_id,
    validate_node_id,
    # MongoDB collections
    users,
    mindmaps,
    nodes
)

load_dotenv()

app = Flask(__name__)
cors = CORS(app)

@app.route('/users', methods=['POST'])
def create_user():
    """Create a new user.
    
    Request Body:
    {
        "email": "user@example.com"
    }
    
    Returns:
    201: {
        "message": "User created successfully",
        "user": {
            "_id": "uuid-string",
            "email": "user@example.com",
            "name": "user",
            "created_at": "2024-11-04T10:00:00.000Z",
            "updated_at": "2024-11-04T10:00:00.000Z",
            "last_login": "2024-11-04T10:00:00.000Z",
            "is_active": true,
            "settings": {
                "default_mindmap_layout": "tree",
                "theme": "light",
                "notifications_enabled": true
            },
            "metadata": {
                "total_mindmaps": 0,
                "total_nodes": 0
            }
        }
    }
    
    400: {"error": "Missing required field: email"}
    409: {"error": "User with this email already exists"}
    500: {"error": "An error occurred: {error_message}"}
    """
    try:
        data = request.get_json()
        
        # Validate email field
        if 'email' not in data:
            return jsonify({'error': 'Missing required field: email'}), 400

        email = data['email']
        
        # Check if user with email already exists
        existing_user = UserDB.get_user_by_email(email)
        if existing_user:
            return jsonify({'error': 'User with this email already exists'}), 409

        # Generate default name from email (everything before @)
        default_name = email.split('@')[0]

        # Create new user
        user_uid = UserDB.create_user(
            email=email,
            name=data.get('name', default_name)
        )

        # Get the created user
        user = UserDB.get_user(user_uid)
        
        # Convert datetime objects to strings for JSON serialization
        user['created_at'] = user['created_at'].isoformat()
        user['updated_at'] = user['updated_at'].isoformat()
        user['last_login'] = user['last_login'].isoformat()

        return jsonify({
            'message': 'User created successfully',
            'user': user
        }), 201

    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': f'An error occurred: {str(e)}'}), 500

@app.route('/users/<email>', methods=['DELETE'])
def delete_user(email):
    """Delete a user by email (soft delete).
    
    Parameters:
        email (str): The email address of the user to delete
    
    Returns:
    200: {
        "message": "User deleted successfully"
    }
    
    404: {"error": "User not found"}
    500: {"error": "An error occurred: {error_message}"}
    """
    try:
        # Check if user exists
        user = UserDB.get_user_by_email(email)
        if not user:
            return jsonify({'error': 'User not found'}), 404

        user_uid = user['_id']
        
        # Update stats (which includes updating timestamp)
        UserDB.update_user_stats(user_uid)
        
        # Soft delete the user
        UserDB.soft_delete_user(user_uid)

        return jsonify({
            'message': 'User deleted successfully'
        }), 200

    except Exception as e:
        return jsonify({'error': f'An error occurred: {str(e)}'}), 500

@app.route('/users/lookup', methods=['POST','GET'])
def get_user():
    """Get user details by email.
    
    Parameters:
        email (str): The email address of the user to retrieve
    
    Returns:
    200: {
        "user": {
            "_id": "uuid-string",
            "email": "user@example.com",
            "name": "user",
            "created_at": "2024-11-04T10:00:00.000Z",
            "updated_at": "2024-11-04T10:00:00.000Z",
            "last_login": "2024-11-04T10:00:00.000Z",
            "is_active": true,
            "settings": {
                "default_mindmap_layout": "tree",
                "theme": "light",
                "notifications_enabled": true
            },
            "metadata": {
                "total_mindmaps": 0,
                "total_nodes": 0
            }
        }
    }
    
    404: {"error": "User not found"}
    500: {"error": "An error occurred: {error_message}"}
    """
    try:
        data = request.get_json()
        # First get user to check if exists and get user_uid
        email = data['email']
        user = UserDB.get_user_by_email(email)
        if not user:
            return jsonify({'error': 'User not found'}), 404

        # Update user stats (which includes updating timestamp)
        UserDB.update_user_stats(user['_id'])
        
        # Get fresh user data after stats update
        user = UserDB.get_user_by_email(email)

        # Convert datetime objects to strings for JSON serialization
        user['created_at'] = user['created_at'].isoformat()
        user['updated_at'] = user['updated_at'].isoformat()
        user['last_login'] = user['last_login'].isoformat()

        return jsonify({'user': user}), 200

    except Exception as e:
        return jsonify({'error': f'An error occurred: {str(e)}'}), 500
    
@app.route('/mindmaps', methods=['POST'])
def create_mindmap():
    """Create a new mindmap with initial nodes.
    
    Request Body:
    {
        # Required fields
        "mindmap_id": "uuid_mindmap-timestamp",  # Required: Format must be uuid_mindmap-timestamp
        "user_email": "user-email",                 # Required: Valid user UUID
        "title": "My Mindmap",                   # Required: String
        
        # Optional fields
        "description": "Description",            # Optional: String, defaults to empty string
        "tags": ["tag1", "tag2"],               # Optional: Array of strings, defaults to empty array
        
        # Optional nodes array
        "nodes": [                              # Optional: Array of node objects
            {
                # Required node fields
                "title": "Node 1",              # Required: String
                "content": "Content 1",          # Required: String
                "position": {                    # Required: Object
                    "x": 100,                   # Required: Number
                    "y": 100                    # Required: Number
                },
                
                # Optional node fields
                "parents": []                   # Optional: Array of node IDs, defaults to empty array
            }
        ]
    }
    
    Returns:
    201: {
        "message": "Mindmap created successfully",
        "mindmap": {mindmap_object},
        "nodes": [node_objects]
    }
    """
    try:
        data = request.get_json()
        # Validate required fields
        required_fields = ['mindmap_id', 'user_email', 'title']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        # Validate mindmap_id format
        # if not validate_mindmap_id(data['mindmap_id']):
        #     return jsonify({'error': 'Invalid mindmap_id format'}), 400
            
        # Check if user exists
        user = UserDB.get_user_by_email(data['user_email'])
        if not user:
            return jsonify({'error': 'User not found'}), 404
            
        # Create mindmap
        mindmap_id = MindMapDB.create_mindmap(
            mindmap_id=data['mindmap_id'],
            user_uid=user['_id'],
            title=data['title'],
            description=data.get('description', ''),
            tags=data.get('tags', [])
        )
        
        # Create nodes if provided
        created_nodes = []
        if 'nodes' in data:
            for node_data in data['nodes']:
                node_id = NodeDB.create_node(
                    _id=node_data['_id'],
                    mindmap_id=mindmap_id,
                    user_uid=user['_id'],
                    title=node_data['title'],
                    content=node_data['content'],
                    position=node_data['position'],
                    parents=node_data.get('parents', [])
                )
                created_node = nodes.find_one({"_id": node_id})
                created_nodes.append(created_node)
                
        # Update mindmap stats
        MindMapDB.update_mindmap_stats(mindmap_id)
        
        # Update user stats
        UserDB.update_user_stats(user['_id'])
        
        # Get fresh mindmap data
        mindmap = mindmaps.find_one({"_id": mindmap_id})

        
        # Convert datetime objects
        for key in ['created_at', 'updated_at', 'last_accessed']:
            mindmap[key] = mindmap[key].isoformat()
            
        for node in created_nodes:
            node['created_at'] = node['created_at'].isoformat()
            node['updated_at'] = node['updated_at'].isoformat()
    
        return jsonify({
            'message': 'Mindmap created successfully',
            'mindmap': mindmap,
            'nodes': created_nodes
        }), 201
    
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': f'An error occurred: {str(e)}'}), 500
    
@app.route('/mindmaps/<mindmap_id>', methods=['PUT'])
def update_mindmap(mindmap_id):
    """Update a mindmap and its nodes.
    
    Parameters:
        mindmap_id (str): Required - The ID of the mindmap to update
    
    Request Body:
    {
        # All fields in the body are optional
        
        # Mindmap update fields
        "title": "Updated Title",            # Optional: New title for mindmap
        "description": "Updated desc",       # Optional: New description
        
        # Node operations - all arrays are optional
        "nodes_to_add": [                   # Optional: Array of new nodes
            {
                # Required fields for new nodes
                "title": "New Node",         # Required: String
                "content": "New Content",    # Required: String
                "position": {                # Required: Object
                    "x": 300,               # Required: Number
                    "y": 300                # Required: Number
                },
                
                # Optional fields for new nodes
                "parents": ["parent_id"]     # Optional: Array of node IDs
            }
        ],
        "nodes_to_update": [                # Optional: Array of node updates
            {
                # Required field for node update
                "node_id": "node_id",        # Required: Valid node ID
                
                # Optional update fields - include only fields that need to change
                "title": "Updated Title",    # Optional: New title
                "content": "Updated Content", # Optional: New content
                "position": {                # Optional: New position
                    "x": 400,
                    "y": 400
                },
                "parents": ["new_parent"]    # Optional: New parent IDs
            }
        ],
        "nodes_to_delete": [                # Optional: Array of node IDs to delete
            "node_id1",
            "node_id2"
        ]
    }
    
    Returns:
    200: {
        "message": "Mindmap updated successfully",
        "mindmap": {mindmap_object},
        "nodes": {
            "added": [node_objects],
            "updated": [node_objects],
            "deleted": ["node_id1", "node_id2"]
        }
    }
    """
    try:
        data = request.get_json()

        # Check if mindmap exists
        mindmap = mindmaps.find_one({"_id": mindmap_id, "is_deleted": False})
        if not mindmap:
            return jsonify({'error': 'Mindmap not found'}), 404
        
        user_uid = mindmap['user_uid']
        
        # Update mindmap basic info if provided
        update_fields = {}
        if 'title' in data:
            update_fields['title'] = data['title']
        if 'description' in data:
            update_fields['description'] = data['description']
            
        if update_fields:
            update_fields['updated_at'] = datetime.utcnow()
            mindmaps.update_one(
                {"_id": mindmap_id},
                {"$set": update_fields}
            )
            
        response_data = {
            'added': [],
            'updated': [],
            'deleted': []
        }
            
        # Add new nodes
        if 'nodes_to_add' in data:
            for node_data in data['nodes_to_add']:
                node_id = NodeDB.create_node(
                    _id = node_data['_id'],
                    mindmap_id=mindmap_id,
                    user_uid=user_uid,
                    title=node_data['title'],
                    content=node_data['content'],
                    position=node_data['position'],
                    parents=node_data['parents'],
                )
                new_node = nodes.find_one({"_id": node_id})
                new_node['created_at'] = new_node['created_at'].isoformat()
                new_node['updated_at'] = new_node['updated_at'].isoformat()
                response_data['added'].append(new_node)
                
        # Update existing nodes
        if 'nodes_to_update' in data:
            for node_data in data['nodes_to_update']:
                node_id = node_data['node_id']
                # if not validate_node_id(node_id, mindmap_id):
                #     return jsonify({'error': f'Invalid node_id format: {node_id}'}), 400
                    
                update_fields = {}
                for field in ['title', 'content', 'position', 'parents']:
                    if field in node_data:
                        update_fields[field] = node_data[field]
                        
                if update_fields:
                    update_fields['updated_at'] = datetime.utcnow()
                    nodes.update_one(
                        {"_id": node_id},
                        {"$set": update_fields}
                    )
                    updated_node = nodes.find_one({"_id": node_id})
                    updated_node['created_at'] = updated_node['created_at'].isoformat()
                    updated_node['updated_at'] = updated_node['updated_at'].isoformat()
                    response_data['updated'].append(updated_node)
                    
        # Delete nodes
        if 'nodes_to_delete' in data:
            for node_id in data['nodes_to_delete']:
                # if not validate_node_id(node_id, mindmap_id):
                #     return jsonify({'error': f'Invalid node_id format: {node_id}'}), 400
                nodes.delete_one({"_id": node_id})
                response_data['deleted'].append(node_id)
                
        # Update stats

        MindMapDB.update_mindmap_stats(mindmap_id)
        UserDB.update_user_stats(user_uid)

        
        # Get fresh mindmap data
        mindmap = mindmaps.find_one({"_id": mindmap_id})
        mindmap['created_at'] = mindmap['created_at'].isoformat()
        mindmap['updated_at'] = mindmap['updated_at'].isoformat()
        mindmap['last_accessed'] = mindmap['last_accessed'].isoformat()

        return jsonify({
            'message': 'Mindmap updated successfully',
            'mindmap': mindmap,
            'nodes': response_data
        }), 200

    except Exception as e:
        return jsonify({'error': f'An error occurred: {str(e)}'}), 500
   
@app.route('/mindmaps/<mindmap_id>', methods=['DELETE'])
def delete_mindmap(mindmap_id):
    """Delete a mindmap and all its nodes.
    
    Parameters:
        mindmap_id (str): The ID of the mindmap to delete
    
    Returns:
    200: {
        "message": "Mindmap deleted successfully",
        "deleted_nodes_count": 5
    }
    
    404: {"error": "Mindmap not found"}
    500: {"error": "An error occurred: {error_message}"}
    """
    try:
        # Check if mindmap exists
        mindmap = mindmaps.find_one({"_id": mindmap_id, "is_deleted": False})
        if not mindmap:
            return jsonify({'error': 'Mindmap not found'}), 404
            
        user_uid = mindmap['user_uid']
        
        # Delete all nodes associated with this mindmap
        delete_result = nodes.delete_many({"mindmap_id": mindmap_id})
        deleted_nodes_count = delete_result.deleted_count
        
        # Soft delete the mindmap
        mindmaps.update_one(
            {"_id": mindmap_id},
            {
                "$set": {
                    "is_deleted": True,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        # Update user stats
        UserDB.update_user_stats(user_uid)
        
        return jsonify({
            'message': 'Mindmap deleted successfully',
            'deleted_nodes_count': deleted_nodes_count
        }), 200

    except Exception as e:
        return jsonify({'error': f'An error occurred: {str(e)}'}), 500

@app.route('/users/<user_uid>/mindmaps', methods=['GET'])
def get_user_mindmaps(user_uid):
    """Get all mindmaps for a user.
    
    Parameters:
        user_uid (str): The user's ID - required
    
    Returns:
    200: {
        "mindmaps": [
            {
                "_id": "uuid_mindmap-timestamp",
                "title": "My Mindmap",
                "description": "Description",
                "created_at": "2024-11-04T10:00:00.000Z",
                "updated_at": "2024-11-04T10:00:00.000Z",
                "last_accessed": "2024-11-04T10:00:00.000Z",
                "metadata": {
                    "total_nodes": 5,
                    "max_depth": 2,
                    "tags": []
                }
            },
            ...
        ]
    }
    
    404: {"error": "User not found"}
    500: {"error": "An error occurred: {error_message}"}
    """
    try:
        # Check if user exists
        user = UserDB.get_user(user_uid)
        if not user:
            return jsonify({'error': 'User not found'}), 404
            
        # Get all non-deleted mindmaps for the user
        user_mindmaps = list(mindmaps.find(
            {"user_uid": user_uid, "is_deleted": False}
        ))
        
        # Convert datetime objects to strings
        for mindmap in user_mindmaps:
            mindmap['created_at'] = mindmap['created_at'].isoformat()
            mindmap['updated_at'] = mindmap['updated_at'].isoformat()
            mindmap['last_accessed'] = mindmap['last_accessed'].isoformat()
        
        return jsonify({'mindmaps': user_mindmaps}), 200

    except Exception as e:
        return jsonify({'error': f'An error occurred: {str(e)}'}), 500

@app.route('/mindmaps/<mindmap_id>/nodes', methods=['GET'])
def get_mindmap_nodes(mindmap_id):
    """Get all nodes for a mindmap.
    
    Parameters:
        mindmap_id (str): The mindmap's ID - required
    
    Returns:
    200: {
        "mindmap": {mindmap_object},
        "nodes": [
            {
                "_id": "mindmap_id_node-timestamp",
                "title": "Node Title",
                "content": "Node Content",
                "position": {"x": 100, "y": 100},
                "parents": ["parent_node_id"],
                "children": ["child_node_id"],
                "depth": 1,
                "created_at": "2024-11-04T10:00:00.000Z",
                "updated_at": "2024-11-04T10:00:00.000Z",
                "metadata": {
                    "type": "manual",
                    "source": "user_input",
                    "last_modified_by": "user_uid"
                }
            },
            ...
        ]
    }
    
    404: {"error": "Mindmap not found"}
    500: {"error": "An error occurred: {error_message}"}
    """
    try:
        # Check if mindmap exists and is not deleted
        mindmap = mindmaps.find_one({"_id": mindmap_id, "is_deleted": False})
        if not mindmap:
            return jsonify({'error': 'Mindmap not found'}), 404
            
        # Get all nodes for the mindmap
        mindmap_nodes = list(nodes.find({"mindmap_id": mindmap_id}))
        
        # Convert datetime objects to strings
        mindmap['created_at'] = mindmap['created_at'].isoformat()
        mindmap['updated_at'] = mindmap['updated_at'].isoformat()
        mindmap['last_accessed'] = mindmap['last_accessed'].isoformat()
        
        for node in mindmap_nodes:
            node['created_at'] = node['created_at'].isoformat()
            node['updated_at'] = node['updated_at'].isoformat()
            
        # Update last_accessed time for mindmap
        mindmaps.update_one(
            {"_id": mindmap_id},
            {"$set": {"last_accessed": datetime.utcnow()}}
        )
        
        return jsonify({
            'mindmap': mindmap,
            'nodes': mindmap_nodes
        }), 200

    except Exception as e:
        return jsonify({'error': f'An error occurred: {str(e)}'}), 500

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