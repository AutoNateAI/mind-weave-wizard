import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, data } = await req.json();
    console.log('Reddit analyzer action:', action);

    switch (action) {
      case 'analyze_post':
        return await analyzePost(data);
      case 'analyze_comments':
        return await analyzeComments(data);
      case 'generate_response':
        return await generateResponse(data);
      case 'fetch_subreddit_posts':
        return await fetchSubredditPosts(data);
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    console.error('Reddit analyzer error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function analyzePost(data: any) {
  const { postId, content, title } = data;
  
  const prompt = `Analyze this Reddit post and provide:
1. A clear, concise summary (2-3 sentences)
2. Key topics/themes (array of strings)
3. Main keywords (array of strings, 5-10 words)
4. Sentiment analysis (score from -1 to 1, and label: positive/negative/neutral)
5. Entry points for critical thinking engagement (array of thoughtful questions or angles)

Post Title: "${title}"
Post Content: "${content}"

Return as JSON with keys: summary, topics, keywords, sentiment_score, sentiment_label, entry_points`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4.1-2025-04-14',
      messages: [
        { role: 'system', content: 'You are an expert at analyzing social media content and identifying opportunities for meaningful engagement that promotes critical thinking.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 1000,
      temperature: 0.3,
    }),
  });

  const aiResponse = await response.json();
  const analysis = JSON.parse(aiResponse.choices[0].message.content);

  // Update the post with analysis
  const { error } = await supabase
    .from('reddit_posts')
    .update({
      ai_summary: analysis.summary,
      topics: analysis.topics,
      keywords: analysis.keywords,
      sentiment_score: analysis.sentiment_score,
      sentiment_label: analysis.sentiment_label,
      entry_points: analysis.entry_points,
      analyzed_at: new Date().toISOString()
    })
    .eq('id', postId);

  if (error) throw error;

  return new Response(
    JSON.stringify({ success: true, analysis }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function analyzeComments(data: any) {
  const { postId, comments } = data;
  
  const analysisPromises = comments.map(async (comment: any) => {
    const prompt = `Analyze this Reddit comment and provide:
1. Summary (1-2 sentences)
2. Key topics (array of strings)
3. Keywords (array of strings, 3-7 words)
4. Sentiment (-1 to 1 scale and label)

Comment: "${comment.content}"

Return as JSON with keys: summary, topics, keywords, sentiment_score, sentiment_label`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          { role: 'system', content: 'You are an expert at analyzing social media comments.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 500,
        temperature: 0.3,
      }),
    });

    const aiResponse = await response.json();
    const analysis = JSON.parse(aiResponse.choices[0].message.content);

    // Update comment with analysis
    await supabase
      .from('reddit_comments')
      .update({
        ai_summary: analysis.summary,
        topics: analysis.topics,
        keywords: analysis.keywords,
        sentiment_score: analysis.sentiment_score,
        sentiment_label: analysis.sentiment_label,
        analyzed_at: new Date().toISOString()
      })
      .eq('id', comment.id);

    return { ...comment, ...analysis };
  });

  const analyzedComments = await Promise.all(analysisPromises);

  return new Response(
    JSON.stringify({ success: true, analyzedComments }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function generateResponse(data: any) {
  const { postContent, postTitle, commentContent, entryPoint, curriculum } = data;
  
  const context = `
AutoNateAI teaches critical thinking through our "Thinking Wizard" course which covers:
- Graph theory and mental models
- Pattern recognition and traversal techniques
- Multiple perspectives and research decomposition
- Professional integration of thinking skills

Our approach: Help people think more clearly and systematically while being genuinely helpful.

${curriculum ? `Course curriculum context: ${curriculum}` : ''}
`;

  const prompt = `Based on this context and the Reddit content below, generate a thoughtful response that:
1. Addresses the specific question/concern
2. Encourages deeper thinking
3. Subtly introduces critical thinking concepts from our curriculum
4. Is genuinely helpful and not salesy
5. Feels natural and conversational

Post Title: "${postTitle}"
Post Content: "${postContent}"
${commentContent ? `Comment to respond to: "${commentContent}"` : ''}
Entry point to explore: "${entryPoint}"

Context: ${context}

Generate a response that promotes critical thinking while being genuinely helpful:`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4.1-2025-04-14',
      messages: [
        { role: 'system', content: 'You are a thoughtful educator who helps people develop critical thinking skills through genuine conversation and support.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 800,
      temperature: 0.7,
    }),
  });

  const aiResponse = await response.json();
  const generatedResponse = aiResponse.choices[0].message.content;

  return new Response(
    JSON.stringify({ success: true, generatedResponse }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function fetchSubredditPosts(data: any) {
  // In a real implementation, you'd use the Reddit API here
  // For now, we'll return a placeholder response
  const { subreddit, limit = 10 } = data;
  
  console.log(`Fetching posts from r/${subreddit}, limit: ${limit}`);
  
  // Placeholder - in production, integrate with Reddit API
  return new Response(
    JSON.stringify({ 
      success: true, 
      message: `Reddit API integration needed for r/${subreddit}`,
      posts: []
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}