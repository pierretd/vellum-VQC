
# Technical Video Scoring Tool

A Vellum, Camel AI, and Next.js application that helps evaluate and score technical educational videos using AI analysis. The tool provides detailed feedback on various aspects of video content and presentation and is desinged for people creating video content to help them save time during the creation process.

## Features

- Video analysis using CAMEL AI
- Comprehensive scoring across multiple criteria:
  - Content Clarity (30 points)
  - Instructional Structure (20 points)
  - Engagement (20 points)
  - Language (20 points)
  - Additional Value (10 points)
- Detailed feedback and suggestions
- Local storage for project management
- Export functionality for analysis results

## Getting Started

### Prerequisites

- Node.js 
- Python 3.10 
- OpenAI API key
- Vellum AI API key

### Installation

1. Clone the repository
2. Install frontend dependencies:
   ```bash
   npm install
   ```

3. Set up Python backend:
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  
   pip install -r requirements.txt
   ```

4. Create a `.env.local` file in the root directory:
   ```
   VELLUM_API_KEY=your_vellum_api_key
   OPENAI_API_KEY=your_openai_api_key
   ```

### Running the Application

1. Start the frontend development server:
   ```bash
   npm run dev
   ```

2. Start the Python backend:
   ```bash
   cd backend
   # On Windows:
   start.bat
   # On Unix:
   ./start.sh
   ```

The application will be available at [http://localhost:3000](http://localhost:3000).

## Architecture

### Frontend

- Next.js 15.0.3
- React 19
- TypeScript
- TailwindCSS for styling
- Vellum AI integration for scoring

### Backend

- FastAPI
- CAMEL AI for video analysis
- Python multipart for file handling
- Environment configuration with `python-dotenv`

## Key Components

### Scoring System

The scoring system evaluates content across five key areas, powered by Vellum:
- **Content Clarity and Relevance** (0-30 points)
- **Instructional Structure** (0-20 points)
- **Engagement and Interaction** (0-20 points)
- **Language and Presentation** (0-20 points)
- **Additional Value and Accessibility** (0-10 points)

Each area has defined thresholds for acceptable quality and validation rules to ensure consistent scoring.

  
### Video Processing

The application uses CAMEL AI to analyze video content across multiple dimensions, including content clarity, instructional structure, engagement, language, and accessibility features. The analysis provides detailed feedback with specific examples and timestamps.


### Project Management

The application includes a project management system that allows users to:
- Create and organize multiple projects
- Store and manage video analyses
- Track scoring history
- Export results and feedback

## Contributing

1. Fork the repository
2. Create your feature branch:
   ```bash
   git checkout -b feature/AmazingFeature
   ```
3. Commit your changes:
   ```bash
   git commit -m 'Add some AmazingFeature'
   ```
4. Push to the branch:
   ```bash
   git push origin feature/AmazingFeature
   ```
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Roadmap

- Implement a more robust test suite and observability using Vellum
- Develop a more detailed schema in Vellum using agents:
  - One agent for detecting dead sound
  - One agent for analyzing variety (or lack thereof) in visual content
  - One agent for aggregating smaller scores into a final score
- Implement Heroku (or a similar tool) to deploy the CAMEL API for hosting the app on a website
- Provide users with specific timestamps in the video highlighting good or bad moments with explanations
- Clean up the page layout and user interface for a more pleasant user experience
- Use a voice-to-text model to extract text from the video
  - Note: Voice-to-text was deprioritized due to the existing ability to use CAMEL for image extraction from videos.
- Implement a comprehensive evaluation system

