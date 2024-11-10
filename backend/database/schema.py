from pymongo import MongoClient, ASCENDING
from datetime import datetime
import uuid
import os
from dotenv import load_dotenv

load_dotenv()

# MongoDB Atlas connection
client = MongoClient(os.getenv('MONGODB_URI'))
db = client['ideavine']

# Collections
users = db.users
mindmaps = db.mindmaps
nodes = db.nodes

def generate_uuid() -> str:
    """Generate a unique UUID"""
    return str(uuid.uuid4())

def validate_mindmap_id(mindmap_id: str) -> bool:
    """Validate mindmap_id format (uuid_mindmap-{time})"""
    try:
        parts = mindmap_id.split('_mindmap-')
        if len(parts) != 2:
            return False
        uuid_part = parts[0]
        time_part = parts[1]
        # Validate UUID part
        uuid.UUID(uuid_part)
        # Validate time part is numeric
        int(time_part)
        return True
    except:
        return False

def generate_node_id(mindmap_id: str) -> str:
    """Generate a node ID with format: mindmap_id_node-{timestamp}"""
    timestamp = int(datetime.utcnow().timestamp() * 1000)
    return f"{mindmap_id}_node-{timestamp}"

def validate_node_id(node_id: str, mindmap_id: str = None) -> bool:
    """Validate node_id format and optionally check if it belongs to the given mindmap"""
    try:
        if not node_id.endswith('_node-' + node_id.split('_node-')[1]):
            return False
        
        # If mindmap_id is provided, verify node belongs to that mindmap
        if mindmap_id:
            node_mindmap_id = '_'.join(node_id.split('_')[:-2])  # Remove _node-{timestamp}
            return node_mindmap_id == mindmap_id
            
        return True
    except:
        return False

# Schema Definitions
USER_SCHEMA = {
    "_id": str,  # UUID
    "email": str,
    "name": str,
    "created_at": datetime,
    "updated_at": datetime,
    "last_login": datetime,
    "is_active": bool,
    "settings": {
        "default_mindmap_layout": str,
        "theme": str,
        "notifications_enabled": bool
    },
    "metadata": {
        "total_mindmaps": int,
        "total_nodes": int
    }
}

MINDMAP_SCHEMA = {
    "_id": str,  # Format: uuid_mindmap-{timestamp} (from frontend)
    "user_uid": str,  # Reference to Users collection
    "title": str,
    "description": str,
    "created_at": datetime,
    "updated_at": datetime,
    "last_accessed": datetime,
    "is_deleted": bool,
    "sharing": {
        "is_public": bool,
        "shared_with": list,  # List of user UIDs
        "access_level": str  # 'view' or 'edit'
    },
    "metadata": {
        "total_nodes": int,
        "max_depth": int,
        "tags": list
    }
}

NODE_SCHEMA = {
    "_id": str,  # Format: mindmap_id_node-{timestamp}
    "mindmap_id": str,  # Reference to MindMaps collection
    "user_uid": str,  # Reference to Users collection
    "title": str,
    "content": str,
    "position": {
        "x": float,
        "y": float
    },
    "parents": list,  # List of node IDs
    "children": list,  # List of node IDs
    "depth": int,
    "created_at": datetime,
    "updated_at": datetime,
    "metadata": {
        "type": str,      # e.g., 'manual', 'audio_generated', 'ai_suggested'
        "source": str,    # e.g., 'user_input', 'audio_transcription', 'ai_synthesis'
        "last_modified_by": str  # User UID of last modifier
    }
}

# Database Operations Classes
class UserDB:
    @staticmethod
    def create_user(email: str, name: str) -> str:
        """Create a new user"""
        user_uid = generate_uuid()
        user = {
            "_id": user_uid,
            "email": email,
            "name": name,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "last_login": datetime.utcnow(),
            "is_active": True,
            "settings": {
                "default_mindmap_layout": "tree",
                "theme": "light",
                "notifications_enabled": True
            },
            "metadata": {
                "total_mindmaps": 0,
                "total_nodes": 0
            }
        }
        users.insert_one(user)
        return user_uid

    @staticmethod
    def get_user(user_uid: str) -> dict:
        """Get user by UID"""
        return users.find_one({"_id": user_uid, "is_active": True})

    @staticmethod
    def get_user_by_email(email: str) -> dict:
        """Get user by email"""
        return users.find_one({"email": email, "is_active": True})

    @staticmethod
    def update_user_stats(user_uid: str) -> None:
        """Update user statistics"""
        mindmap_count = mindmaps.count_documents({"user_uid": user_uid, "is_deleted": False})
        node_count = nodes.count_documents({"user_uid": user_uid})
        
        users.update_one(
            {"_id": user_uid},
            {
                "$set": {
                    "metadata.total_mindmaps": mindmap_count,
                    "metadata.total_nodes": node_count,
                    "updated_at": datetime.utcnow()
                }
            }
        )
    
    @staticmethod
    def soft_delete_user(user_uid: str) -> None:
        """Soft delete a user by setting is_active to False"""
        users.update_one(
            {"_id": user_uid},
            {
                "$set": {
                    "is_active": False,
                    "updated_at": datetime.utcnow()
                }
            }
        )

class MindMapDB:
    @staticmethod
    def create_mindmap(mindmap_id: str, user_uid: str, title: str, description: str = "", tags: list = None) -> str:
        """Create a new mindmap"""
        # if not validate_mindmap_id(mindmap_id):
        #     raise ValueError("Invalid mindmap_id format")
            
        # Check if mindmap_id already exists
        if mindmaps.find_one({"_id": mindmap_id}):
            raise ValueError("Mindmap ID already exists")
            
        mindmap = {
            "_id": mindmap_id,
            "user_uid": user_uid,
            "title": title,
            "description": description,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "last_accessed": datetime.utcnow(),
            "is_deleted": False,
            "sharing": {
                "is_public": False,
                "shared_with": [],
                "access_level": "view"
            },
            "metadata": {
                "total_nodes": 0,
                "max_depth": 0,
                "tags": tags or []
            }
        }
        mindmaps.insert_one(mindmap)
        UserDB.update_user_stats(user_uid)
        return mindmap_id

    @staticmethod
    def get_user_mindmaps(user_uid: str) -> list:
        """Get all mindmaps for a user"""
        return list(mindmaps.find({
            "user_uid": user_uid,
            "is_deleted": False
        }))

    @staticmethod
    def update_mindmap_stats(mindmap_id: str) -> None:
        """Update mindmap statistics"""
        stats = NodeDB.calculate_mindmap_stats(mindmap_id)
        mindmaps.update_one(
            {"_id": mindmap_id},
            {
                "$set": {
                    "metadata.total_nodes": stats["total_nodes"],
                    "metadata.max_depth": stats["max_depth"],
                    "updated_at": datetime.utcnow()
                }
            }
        )

class NodeDB:
    @staticmethod
    def create_node(
        _id: str,
        mindmap_id: str,
        user_uid: str,
        title: str,
        content: str,
        position: dict,
        parents: list = None,
        node_type: str = "manual",
        source: str = "user_input"
    ) -> str:
        """Create a new node"""
        # Validate mindmap_id
        # if not validate_mindmap_id(mindmap_id):
        #     raise ValueError("Invalid mindmap_id format")
            
        # Create node_id
        node_id = _id if _id else generate_node_id(mindmap_id)
        
        # Validate parent nodes if provided
        # if parents:
        #     for parent_id in parents:
        #         # if not validate_node_id(parent_id, mindmap_id):
        #         #     raise ValueError(f"Invalid parent node ID: {parent_id}")
        
        node = {
            "_id": node_id,
            "mindmap_id": mindmap_id,
            "user_uid": user_uid,
            "title": title,
            "content": content,
            "position": position,
            "parents": parents or [],
            "children": [],
            "depth": 0,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "metadata": {
                "type": node_type,
                "source": source,
                "last_modified_by": user_uid
            }
        }
        nodes.insert_one(node)
        return node_id

    @staticmethod
    def update_node_connections(node_id: str, parents: list = None, children: list = None) -> None:
        """Update node's parents and children"""
        # Validate node_id
        node = nodes.find_one({"_id": node_id})
        if not node:
            raise ValueError("Node not found")
            
        update_data = {
            "updated_at": datetime.utcnow()
        }
        
        # Validate and update parents
        if parents is not None:
            # for parent_id in parents:
            #     if not validate_node_id(parent_id, node["mindmap_id"]):
            #         raise ValueError(f"Invalid parent node ID: {parent_id}")
            update_data["parents"] = parents
            
        # Validate and update children
        if children is not None:
            # for child_id in children:
            #     if not validate_node_id(child_id, node["mindmap_id"]):
            #         raise ValueError(f"Invalid child node ID: {child_id}")
            update_data["children"] = children

        nodes.update_one(
            {"_id": node_id},
            {"$set": update_data}
        )

    @staticmethod
    def calculate_mindmap_stats(mindmap_id: str) -> dict:
        """Calculate statistics for a mindmap"""
        pipeline = [
            {
                "$match": {
                    "mindmap_id": mindmap_id
                }
            },
            {
                "$group": {
                    "_id": "$mindmap_id",
                    "total_nodes": {"$sum": 1},
                    "max_depth": {"$max": "$depth"}
                }
            }
        ]
        stats = list(nodes.aggregate(pipeline))
        if stats:
            return {
                "total_nodes": stats[0]["total_nodes"],
                "max_depth": stats[0]["max_depth"]
            }
        return {"total_nodes": 0, "max_depth": 0}

def init_db():
    """Initialize database with required collections and indexes"""
    try:
        # Create collections if they don't exist
        for collection in ["users", "mindmaps", "nodes"]:
            if collection not in db.list_collection_names():
                db.create_collection(collection)

        # Create indexes
        users.create_index([("email", ASCENDING)], unique=True)
        users.create_index("created_at")
        
        mindmaps.create_index([("user_uid", ASCENDING)])
        mindmaps.create_index("created_at")
        mindmaps.create_index("last_accessed")
        
        nodes.create_index([("mindmap_id", ASCENDING)])
        nodes.create_index([("user_uid", ASCENDING)])
        nodes.create_index([("title", "text"), ("content", "text")])

        print("✅ Database initialized successfully")
        return True
    except Exception as e:
        print(f"❌ Error initializing database: {str(e)}")
        return False

if __name__ == "__main__":
    try:
        db.command("ping")
        print("✅ Successfully connected to MongoDB!")
        init_db()
    except Exception as e:
        print(f"❌ Error connecting to MongoDB: {str(e)}")