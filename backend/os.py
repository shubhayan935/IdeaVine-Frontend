import os
from openai import OpenAI

os.environ['OPENAI_API_KEY'] = "sk-proj-RmmuI2WsruF2tXW4cdkzT3BlbkFJgbGOd2gIwBd6fDn5bk4p"
client = OpenAI()

with open(audio_file_pa, "rb") as audio_file:
    transcription = client.audio.transcriptions.create(
        model="whisper-1", 
        file=audio_file
    )
print('transcription: ', transcription.text)
print(transcription.text)