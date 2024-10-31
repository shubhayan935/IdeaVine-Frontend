# **IdeaVine: Design Your Thinking!**

**AI-Enabled Mindmap Generation & Suggestion Tool**

---

FOR GOOGLE LABS JUDGES: We have decided to move forward and potentially spin this idea into a creative startup! Thus, you might see recent commits.

## **Table of Contents**

- [Introduction](#introduction)
- [Features](#features)
- [How It Works](#how-it-works)
- [Installation](#installation)
- [Usage](#usage)
- [Technology Stack](#technology-stack)
- [Contributing](#contributing)
- [License](#license)
- [Acknowledgements](#acknowledgements)

---

## **Introduction**

**IdeaVine** is an innovative mind mapping application that leverages AI to capture and organize your ideas seamlessly. Designed to enhance the design thinking and ideation process, IdeaVine allows you to remain in your creative flow state while it transcribes and structures your spoken thoughts into interactive mind maps.

Whether you're brainstorming alone or collaborating with a team, IdeaVine ensures that no idea is lost and that your thought process is visualized effectively. By integrating AI technologies for speech recognition and natural language processing, it transforms the way you capture, organize, and develop ideas.

---

## **Features**

- **AI-Powered Speech Recognition:**

  - Record your spoken ideas and let the AI transcribe them accurately.
  - Supports real-time audio capture with high-quality transcription.

- **Automated Mind Map Generation:**

  - Transforms transcribed text into structured mind maps.
  - Identifies key concepts and establishes hierarchical relationships.

- **Interactive Visualization:**

  - Provides an intuitive interface to interact with your mind maps.
  - Allows editing, expanding, and reorganizing nodes effortlessly.

- **Seamless Design Thinking Integration:**

  - Enhances each stage of the design thinking process.
  - Facilitates brainstorming, prototyping, and user testing.

- **Flow State Preservation:**

  - Eliminates the need for manual note-taking.
  - Keeps you engaged in the creative process without interruptions.

- **Cross-Platform Compatibility:**
  - Accessible via modern web browsers.
  - Responsive design for use on various devices.

---

## **How It Works**

1. **Start Recording:**

   - Click the **"Start Recording"** button to begin capturing your ideas.
   - Speak naturally and freely without worrying about taking notes.

2. **Audio Capture and Transcription:**

   - The application records your voice using the Web Audio API.
   - Upon stopping the recording, the audio is sent to the backend server.
   - AI-powered speech recognition transcribes the audio into text.

3. **AI Processing and Mind Map Generation:**

   - The transcribed text is analyzed using natural language processing.
   - Key ideas and relationships are identified.
   - A structured list of nodes is generated, representing your ideas.

4. **Visualization and Interaction:**

   - The frontend renders the mind map using interactive nodes and edges.
   - You can edit node content, add new nodes, or reorganize the structure.
   - The mind map updates in real-time as you make changes.

5. **Continuous Development:**
   - Keep refining your mind map by adding more ideas.
   - Use the tool during different stages of your project for ongoing support.

---

## **Usage**

1. **Access the Application:**

   - Open IdeaVine.

2. **Begin Brainstorming:**

   - Click on the **"Start Recording"** button.
   - Speak your ideas naturally and freely.

3. **Stop Recording:**

   - Click on the **"Stop Recording"** button when finished.
   - The application will process your recording.

4. **View and Interact with Your Mind Map:**

   - The generated mind map will appear on the screen.
   - Nodes represent your ideas, and edges represent relationships.

5. **Editing the Mind Map:**

   - **Add Nodes:** Use the plus icons to add new nodes in different directions.
   - **Edit Nodes:** Double-click on a node to edit its title and content.
   - **Delete Nodes:** While editing a node, click the "Delete" button to remove it.

6. **Continue Developing Your Ideas:**

   - Repeat the recording process to add more ideas.
   - Manually adjust the mind map as needed to refine your thoughts.

---

## **Technology Stack**

- **Frontend:**

  - React.js
  - TypeScript
  - React Flow (for interactive diagrams)
  - Web Audio API (for audio recording)
  - UI Libraries (e.g., ShadCN, Lucide Icons)

- **Backend:**

  - Python
  - Flask (web framework)
  - OpenAI API (for AI services)
  - whiisper, pydub and ffmpeg (for audio processing)

- **AI Services:**
  - **OpenAI Whisper API:** For speech-to-text transcription.
  - **OpenAI GPT-4o-mini:** For natural language processing and mind map generation.
