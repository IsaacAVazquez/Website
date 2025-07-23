import { schedule } from '@netlify/functions';

const handler = schedule('0 2 * * *', async (event) => {
  // This runs every day at 2 AM UTC
  console.log('Running scheduled fantasy football update...');
  
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error('CRON_SECRET not configured');
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Configuration error' })
    };
  }

  try {
    // Call our API endpoint with the cron secret
    const response = await fetch(`${process.env.URL || 'https://isaacavazquez.com'}/api/scheduled-update`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${cronSecret}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        source: 'netlify-scheduled-function'
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('Update failed:', data);
      return {
        statusCode: response.status,
        body: JSON.stringify(data)
      };
    }

    console.log('Update successful:', data);
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Fantasy football data updated successfully',
        details: data
      })
    };
  } catch (error) {
    console.error('Error during scheduled update:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Update failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
});

export { handler };