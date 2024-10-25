import vertexai
import os
from vertexai.generative_models import GenerativeModel


os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "key.json"
vertexai.init(project="cellular-ring-439022-r0", location="us-central1")

model = GenerativeModel("gemini-1.5-flash-002")


response = model.generate_content(
    "What's a good name for a flower shop that specializes in selling bouquets of dried flowers?"
)

print(response.text)
