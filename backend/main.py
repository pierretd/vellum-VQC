from fastapi import FastAPI, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from camel.agents import ChatAgent
from camel.messages import BaseMessage
from camel.prompts import PromptTemplateGenerator
from camel.models import ModelFactory
from camel.types import ModelType, ModelPlatformType, RoleType, TaskType
from camel.configs import ChatGPTConfig
from dotenv import load_dotenv
import os
import time

# Load environment variables at the start
load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/process-video")
async def process_video(video: UploadFile):
    try:
        print("\n=== Starting Video Processing ===")
        
        if not video:
            return JSONResponse(
                status_code=400,
                content={"error": "No video file provided"}
            )
            
        print(f"Received file: {video.filename}")
        video_bytes = await video.read()
        print(f"Video size: {len(video_bytes)} bytes")

        sys_msg_prompt = PromptTemplateGenerator().get_prompt_from_key(
            TaskType.VIDEO_DESCRIPTION,
            RoleType.ASSISTANT
        )

        sys_msg = BaseMessage.make_assistant_message(
            role_name="Assistant",
            content=sys_msg_prompt,
        )

        model = ModelFactory.create(
            model_platform=ModelPlatformType.OPENAI,
            model_type=ModelType.GPT_4O,
            model_config_dict=ChatGPTConfig().as_dict(),
        )

        camel_agent = ChatAgent(
            sys_msg,
            model=model
        )

        print("CAMEL agent initialized, processing video...")

        user_msg = BaseMessage.make_user_message(
            role_name="User",
            content="""Analyze these video frames and provide a detailed analysis focusing on these educational aspects. 
            Format your response with clear section headers and specific examples from the video:

### Content Clarity and Relevance
- Evaluate how clearly the content is presented visually
- Assess the relevance to coding topics
- Note specific examples of clear or unclear explanations
- Identify any visual aids that enhance understanding

### Instructional Structure
- Analyze the organization and flow of visual content
- Evaluate the effectiveness of demonstrations
- Note specific examples of good or poor structure
- Identify key teaching moments

### Engagement and Visual Presentation
- Assess the presenter's engagement style
- Evaluate visual elements that encourage participation
- Note specific moments of high or low engagement
- Identify interactive elements

### Language and Visual Elements
- Evaluate text clarity and readability
- Assess the use of visual aids
- Note any accessibility features
- Identify areas where visuals enhance or hinder understanding

### Additional Resources and Accessibility
- List any visible references or resources
- Evaluate accessibility features
- Note any missing but important accessibility elements
- Suggest potential improvements

Provide specific timestamps or frame references when noting examples.""",
            video_bytes=video_bytes,
        )

        response = camel_agent.step(user_msg)
        video_description = response.msgs[0].content
        
        print("Generated description:", video_description[:100] + "...")
        
        return JSONResponse(
            content={"description": video_description}
        )
            
    except Exception as e:
        print(f"Error processing video: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 