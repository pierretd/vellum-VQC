import { NextResponse } from 'next/server';
import { VellumClient } from 'vellum-ai';
import { runTests } from './tests';

if (!process.env.VELLUM_API_KEY) {
  console.error('VELLUM_API_KEY is not set in environment variables');
}

const client = new VellumClient({ apiKey: process.env.VELLUM_API_KEY || '' });

interface VellumResponse {
  explanation: string;
  "Content Clarity and Relevance": number;
  "Instructional Structure": number;
  "Engagement and Interaction": number;
  "Language and Presentation": number;
  "Additional Value and Accessibility": number;
  totalScore: number;
}

type VellumInput = {
  name: string;
  type: "STRING";
  value: string;
};

export async function POST(request: Request) {
  try {
    const { jobDescription, jobVideo } = await request.json();
    
    if (!jobDescription) {
      return NextResponse.json(
        { error: 'Job description is required' },
        { status: 400 }
      );
    }

    const vellumInputs: VellumInput[] = [
      {
        name: "Video_Feedback",
        type: "STRING",
        value: jobVideo ? jobVideo.trim() : '',
      },
      {
        name: "feedback",
        type: "STRING",
        value: `TRANSCRIPT:\n${jobDescription.trim()}\n\nVIDEO ANALYSIS:\n${jobVideo ? jobVideo.trim() : 'No video analysis available'}`,
      },
      {
        name: "job_description",
        type: "STRING",
        value: `TRANSCRIPT CONTENT:\n${jobDescription.trim()}`,
      },
      {
        name: "job_video",
        type: "STRING",
        value: jobVideo ? jobVideo.trim() : '',
      },
      {
        name: "totalScore",
        type: "STRING",
        value: "0",
      }
    ];

    console.log('Sending to Vellum:', {
      transcript_preview: jobDescription.substring(0, 100) + '...',
      video_preview: jobVideo ? jobVideo.substring(0, 100) + '...' : 'None',
      transcript_length: jobDescription.length,
      video_length: jobVideo?.length || 0
    });

    const result = await client.executeWorkflow({
      workflowDeploymentName: "hr-job-description",
      releaseTag: "LATEST",
      inputs: vellumInputs,
    });

    if (result.data.state === "REJECTED") {
      console.error('Vellum API rejected the request:', result.data.error);
      return NextResponse.json(
        { error: result.data.error?.message || 'Workflow execution rejected' },
        { status: 422 }
      );
    }

    // Parse and test the response
    const responseValue = result.data.outputs[0].value;
    const response = JSON.parse(typeof responseValue === 'string' ? responseValue : '{}');
    
    const testResults = runTests(response);
    if (!testResults.isValid) {
      console.error('Validation failed:', testResults.errors);
    }
    if (testResults.warnings.length > 0) {
      console.warn('Validation warnings:', testResults.warnings);
    }

    // Map the response
    const mappedScore = {
      totalScore: response.totalScore,
      contentClarity: response["Content Clarity and Relevance"],
      instructionalStructure: response["Instructional Structure"],
      engagement: response["Engagement and Interaction"],
      language: response["Language and Presentation"],
      additionalValue: response["Additional Value and Accessibility"]
    };

    return NextResponse.json({ 
      score: mappedScore,
      feedback: response.explanation,
      transcript: jobDescription,
      warnings: [...testResults.warnings, ...testResults.errors]
    });

  } catch (error) {
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      error
    });
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to process transcript',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
} 