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

// Reddit API credentials - these will be set as secrets
const REDDIT_CLIENT_ID = Deno.env.get('REDDIT_CLIENT_ID');
const REDDIT_CLIENT_SECRET = Deno.env.get('REDDIT_CLIENT_SECRET');
const REDDIT_USERNAME = Deno.env.get('REDDIT_USERNAME');
const REDDIT_PASSWORD = Deno.env.get('REDDIT_PASSWORD');
const REDDIT_USER_AGENT = Deno.env.get('REDDIT_USER_AGENT') || 'AutoNateAI:1.0.0 (by /u/AutoNateAI)';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, data } = await req.json();
    console.log('Reddit API action:', action);

    // Get Reddit access token first (supports user or app-only modes)
    const { accessToken, mode } = await getRedditAccessToken();
    
    switch (action) {
      case 'fetch_subreddit_posts':
        return await fetchSubredditPosts(accessToken, data);
      case 'fetch_post_comments':
        return await fetchPostComments(accessToken, data);
      case 'submit_comment':
        return await submitComment(accessToken, data, mode);
      case 'test_connection':
        return await testConnection(accessToken, mode);
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    console.error('Reddit API error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function getRedditAccessToken(): Promise<{ accessToken: string; mode: 'user' | 'app' }> {
  if (!REDDIT_CLIENT_ID || !REDDIT_CLIENT_SECRET) {
    throw new Error('Missing REDDIT_CLIENT_ID or REDDIT_CLIENT_SECRET');
  }

  const auth = btoa(`${REDDIT_CLIENT_ID}:${REDDIT_CLIENT_SECRET}`);
  const headers = {
    'Authorization': `Basic ${auth}`,
    'User-Agent': REDDIT_USER_AGENT,
    'Content-Type': 'application/x-www-form-urlencoded',
  };

  // If username/password are provided, use password grant (user-auth mode)
  if (REDDIT_USERNAME && REDDIT_PASSWORD) {
    const resp = await fetch('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      headers,
      body: `grant_type=password&username=${REDDIT_USERNAME}&password=${REDDIT_PASSWORD}`,
    });

    if (!resp.ok) throw new Error(`Reddit auth failed: ${resp.status}`);
    const data = await resp.json();
    return { accessToken: data.access_token, mode: 'user' };
  }

  // Fallback to app-only client credentials (read-only capabilities)
  const resp = await fetch('https://www.reddit.com/api/v1/access_token', {
    method: 'POST',
    headers,
    body: 'grant_type=client_credentials&scope=read',
  });

  if (!resp.ok) throw new Error(`Reddit auth failed: ${resp.status}`);
  const data = await resp.json();
  return { accessToken: data.access_token, mode: 'app' };
}

async function fetchSubredditPosts(accessToken: string, data: any) {
  const { subreddit, limit = 25, after = null, sort = 'hot' } = data;
  
  let url = `https://oauth.reddit.com/r/${subreddit}/${sort}?limit=${limit}`;
  if (after) url += `&after=${after}`;

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'User-Agent': REDDIT_USER_AGENT,
    },
  });

  if (!response.ok) {
    throw new Error(`Reddit API error: ${response.status}`);
  }

  const result = await response.json();
  const posts = result.data.children.map((child: any) => child.data);

  // Store posts in database with sort type
  for (const post of posts) {
    const { error } = await supabase
      .from('reddit_posts')
      .upsert({
        reddit_post_id: post.id,
        subreddit_name: post.subreddit,
        title: post.title,
        content: post.selftext || '',
        author: post.author,
        score: post.score,
        upvote_ratio: post.upvote_ratio,
        num_comments: post.num_comments,
        created_utc: new Date(post.created_utc * 1000).toISOString(),
        url: post.url,
        permalink: `https://reddit.com${post.permalink}`,
        post_type: post.is_self ? 'text' : 'link',
        is_self: post.is_self,
        // Add fetch metadata
        topics: [sort], // Store sort type as a topic for now
        keywords: [`fetch_type:${sort}`, `scraped_at:${new Date().toISOString().split('T')[0]}`]
      }, {
        onConflict: 'reddit_post_id',
        ignoreDuplicates: false
      });

    if (error) {
      console.error('Error storing post:', error);
    }
  }

  return new Response(
    JSON.stringify({ 
      success: true, 
      posts,
      after: result.data.after,
      sort_type: sort
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function fetchPostComments(accessToken: string, data: any) {
  const { subreddit, postId } = data;
  
  const url = `https://oauth.reddit.com/r/${subreddit}/comments/${postId}`;

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'User-Agent': REDDIT_USER_AGENT,
    },
  });

  if (!response.ok) {
    throw new Error(`Reddit API error: ${response.status}`);
  }

  const result = await response.json();
  const comments = [];

  function extractComments(commentsList: any[], depth = 0) {
    for (const item of commentsList) {
      if (item.kind === 't1' && item.data.body) {
        comments.push({
          reddit_comment_id: item.data.id,
          reddit_post_id: postId,
          author: item.data.author,
          content: item.data.body,
          score: item.data.score,
          created_utc: new Date(item.data.created_utc * 1000).toISOString(),
          permalink: `https://reddit.com${item.data.permalink}`,
          depth,
          is_submitter: item.data.is_submitter,
        });

        if (item.data.replies && item.data.replies.data && item.data.replies.data.children) {
          extractComments(item.data.replies.data.children, depth + 1);
        }
      }
    }
  }

  if (result.length > 1 && result[1].data && result[1].data.children) {
    extractComments(result[1].data.children);
  }

  // Store comments in database
  for (const comment of comments) {
    const { error } = await supabase
      .from('reddit_comments')
      .upsert(comment, {
        onConflict: 'reddit_comment_id',
        ignoreDuplicates: false
      });

    if (error) {
      console.error('Error storing comment:', error);
    }
  }

  return new Response(
    JSON.stringify({ success: true, comments }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function submitComment(accessToken: string, data: any, mode: 'user' | 'app' = 'user') {
  if (mode !== 'user') {
    return new Response(
      JSON.stringify({ success: false, error: 'Commenting requires user-auth mode. Add REDDIT_USERNAME and REDDIT_PASSWORD to Supabase secrets.' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const { thingId, text } = data; // thingId is Reddit's format for post/comment IDs (t3_postid or t1_commentid)
  
  const response = await fetch('https://oauth.reddit.com/api/comment', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'User-Agent': REDDIT_USER_AGENT,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `thing_id=${thingId}&text=${encodeURIComponent(text)}`,
  });

  const result = await response.json();

  if (result.errors && result.errors.length > 0) {
    throw new Error(`Reddit submission error: ${result.errors[0][1]}`);
  }

  return new Response(
    JSON.stringify({ 
      success: true, 
      result,
      comment_id: result.json?.data?.things?.[0]?.data?.id 
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function testConnection(accessToken: string, mode: 'user' | 'app' = 'user') {
  if (mode === 'user') {
    const response = await fetch('https://oauth.reddit.com/api/v1/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'User-Agent': REDDIT_USER_AGENT,
      },
    });
  
    if (!response.ok) {
      throw new Error(`Reddit connection test failed: ${response.status}`);
    }
  
    const user = await response.json();
  
    return new Response(
      JSON.stringify({ 
        success: true, 
        mode,
        user: {
          name: user.name,
          id: user.id,
          comment_karma: user.comment_karma,
          link_karma: user.link_karma
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // App-only mode: verify by fetching a public resource
  const resp = await fetch('https://oauth.reddit.com/r/popular/hot?limit=1', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'User-Agent': REDDIT_USER_AGENT,
    },
  });

  if (!resp.ok) {
    throw new Error(`Reddit connection test (app-only) failed: ${resp.status}`);
  }

  return new Response(
    JSON.stringify({ success: true, mode: 'app' }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}