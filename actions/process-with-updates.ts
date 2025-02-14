"use server";

async function step1() {
    return new Promise((resolve) => {
        setTimeout(() => {
            console.log('step1');
            resolve(null);
        }, 2000);
    });
}

async function step2() {
        return new Promise((resolve) => {
            setTimeout(() => {
                console.log('step2');
                resolve(null);
            }, 2000);
        });
    }

export async function processWithUpdates(data: FormData) {
    const channel = new BroadcastChannel('processing-updates');
    
    try {
      // Step 1
      channel.postMessage({ 
        stage: 'step1', 
        status: 'processing' 
      });
      await step1();
      channel.postMessage({ 
        stage: 'step1', 
        status: 'complete',
        data: 'Step 1 result' 
      });
  
      // Step 2
      channel.postMessage({ 
        stage: 'step2', 
        status: 'processing' 
      });
      await step2();
      channel.postMessage({ 
        stage: 'step2', 
        status: 'complete',
        data: 'Step 2 result' 
      });
  
      // ... more steps
  
      channel.close();
      return { success: true };
    } catch (error) {
      channel.postMessage({ 
        stage: 'error', 
        error: error.message 
      });
      channel.close();
      return { success: false, error };
    }
  }