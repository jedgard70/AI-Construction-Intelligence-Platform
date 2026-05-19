import { NextResponse } from 'next/server';

// In-memory store for render jobs (simulating a database/queue)
const renderJobs: Record<string, { status: string; progress: number; resultUrl?: string; settings?: any }> = {};

export async function POST(req: Request) {
  try {
    const settings = await req.json();
    const jobId = 'render_' + Math.random().toString(36).substring(2, 9);
    
    renderJobs[jobId] = { 
      status: 'queued', 
      progress: 0,
      settings
    };
    
    // Kick off asynchronous background rendering simulation
    simulateRenderPipeline(jobId);
    
    return NextResponse.json({ 
      success: true, 
      jobId, 
      message: 'Render job added to queue.' 
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to start render' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const jobId = searchParams.get('jobId');
  
  if (!jobId || !renderJobs[jobId]) {
    return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 });
  }
  
  return NextResponse.json({
    success: true,
    job: renderJobs[jobId]
  });
}

// Simulates a complex rendering pipeline
function simulateRenderPipeline(jobId: string) {
  // Move from queued to rendering after a short delay
  setTimeout(() => {
    if (!renderJobs[jobId]) return;
    renderJobs[jobId].status = 'rendering';
    
    let progress = 0;
    const interval = setInterval(() => {
      // Simulate variable rendering speeds (slower as it gets closer to 100)
      const increment = Math.max(1, Math.floor(Math.random() * (15 - progress / 10)));
      progress += increment;
      
      if (progress >= 100) {
        progress = 100;
        renderJobs[jobId] = { 
          ...renderJobs[jobId],
          status: 'completed', 
          progress, 
          // Return a unique image based on the job ID to simulate the final frame/render
          resultUrl: `https://picsum.photos/seed/${jobId}/1920/1080` 
        };
        clearInterval(interval);
      } else {
        renderJobs[jobId].progress = progress;
      }
    }, 800); // Update every 800ms
  }, 1000);
}
