import { NextResponse } from 'next/server';

const PYTHON_API_URL = process.env.PYTHON_API_URL || 'http://localhost:8000';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const videoFile = formData.get('video') as File;
    
    if (!videoFile) {
      return NextResponse.json(
        { error: 'Video file is required' },
        { status: 400 }
      );
    }

    // Create a new FormData instance for the Python backend
    const pythonFormData = new FormData();
    const blob = new Blob([await videoFile.arrayBuffer()], { type: videoFile.type });
    pythonFormData.append('video', blob, videoFile.name);

    console.log('Sending video to Python backend:', {
      filename: videoFile.name,
      type: videoFile.type,
      size: videoFile.size
    });

    // Get video analysis from Python backend
    const pythonResponse = await fetch(`${PYTHON_API_URL}/process-video`, {
      method: 'POST',
      body: pythonFormData,
      headers: {
        'Accept': 'application/json',
      },
    });

    const contentType = pythonResponse.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Expected JSON response from Python backend');
    }

    const data = await pythonResponse.json();
    console.log('Raw Python response:', data);

    if (!pythonResponse.ok) {
      console.error('Python backend error:', data);
      throw new Error(data.detail || data.error || 'Failed to process video');
    }

    if (!data.description) {
      console.error('No description in response:', data);
      throw new Error('No video description received');
    }

    // Only return the video analysis - don't send to Vellum yet
    return NextResponse.json({
      description: data.description
    });

  } catch (error) {
    console.error('Error processing video:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to process video',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
} 