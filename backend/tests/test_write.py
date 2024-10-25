import unittest
import json
import sys
import os
# Add the backend directory to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'backend')))
from app import app

class TestWriteFunction(unittest.TestCase):
    def setUp(self):
        self.app = app
        self.client = self.app.test_client()
        self.app.config['TESTING'] = True

    def test_write_basic(self):
        # Test data - simple mind map about AI
        test_nodes = [
            {
                "id": "1",
                "title": "Artificial Intelligence",
                "content": "AI is transforming how we work and live through automation and smart decision-making.",
                "parents": [],
                "children": ["2", "3"]
            },
            {
                "id": "2",
                "title": "Machine Learning",
                "content": "ML algorithms learn from data to make predictions and improve performance over time.",
                "parents": ["1"],
                "children": []
            },
            {
                "id": "3",
                "title": "Neural Networks",
                "content": "Neural networks mimic human brain structure to process complex patterns in data.",
                "parents": ["1"],
                "children": []
            }
        ]

        # Make request to write endpoint
        response = self.client.post('/write',
                                  data=json.dumps({'nodes': test_nodes}),
                                  content_type='application/json')
        
        # Assert response status code is 200
        self.assertEqual(response.status_code, 200)
        
        # Parse response data
        data = json.loads(response.data)
        
        # Print the response for inspection
        print("\nAPI Response:")
        print(f"Title: {data['title']}")
        print(f"Introduction: {data['content']}")
        
        # Basic assertions
        self.assertIn('title', data)
        self.assertIn('content', data)
        self.assertTrue(len(data['title']) > 0)
        self.assertTrue(len(data['content']) > 0)

if __name__ == '__main__':
    unittest.main()