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

interface KeywordAnalysis {
  keywords: string[];
  sentiment: number;
  industries: string[];
  skills: string[];
  themes: string[];
}

async function analyzeWithAI(text: string, type: 'profile' | 'post'): Promise<KeywordAnalysis> {
  const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openAIApiKey) {
    throw new Error('OpenAI API key not found');
  }

  const prompt = type === 'profile' 
    ? `Analyze this LinkedIn profile content and extract:
1. Top 10 most relevant keywords/skills
2. Industry classification
3. Sentiment score (-1 to 1, where -1 is negative, 0 neutral, 1 positive)
4. Professional themes

Content: ${text}

Return JSON only: { "keywords": ["keyword1", "keyword2"], "sentiment": 0.5, "industries": ["industry1"], "skills": ["skill1"], "themes": ["theme1"] }`
    : `Analyze this LinkedIn post content and extract:
1. Top 10 most relevant keywords/topics
2. Sentiment score (-1 to 1)
3. Main themes discussed
4. Industry relevance

Content: ${text}

Return JSON only: { "keywords": ["keyword1", "keyword2"], "sentiment": 0.5, "industries": ["industry1"], "skills": [], "themes": ["theme1"] }`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-mini-2025-08-07',
        messages: [
          { role: 'system', content: 'You are an expert LinkedIn content analyzer. Always return valid JSON.' },
          { role: 'user', content: prompt }
        ],
        max_completion_tokens: 500,
      }),
    });

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Parse JSON response
    const analysis = JSON.parse(content.replace(/```json|```/g, '').trim());
    
    return {
      keywords: analysis.keywords || [],
      sentiment: analysis.sentiment || 0,
      industries: analysis.industries || [],
      skills: analysis.skills || [],
      themes: analysis.themes || []
    };
  } catch (error) {
    console.error('AI Analysis error:', error);
    // Return basic fallback analysis
    return {
      keywords: text.split(' ').slice(0, 5),
      sentiment: 0,
      industries: [],
      skills: [],
      themes: []
    };
  }
}

async function processProfile(profile: any) {
  console.log('Processing profile:', profile.id);
  
  // Combine profile text for analysis
  const profileText = [
    profile.headline,
    profile.summary,
    profile.occupation,
    ...(profile.skills || []),
    ...(profile.positions || []).map((p: any) => `${p.title} ${p.description || ''}`).slice(0, 3)
  ].filter(Boolean).join(' ');

  if (!profileText.trim()) {
    console.log('No text content for profile:', profile.id);
    return;
  }

  const analysis = await analyzeWithAI(profileText, 'profile');
  
  // Extract location coordinates
  let latitude = null, longitude = null, locationName = null;
  
  if (profile.company_name) {
    // Try to get location from targeted_locations table
    const { data: location } = await supabase
      .from('targeted_locations')
      .select('latitude, longitude, company_name, city')
      .eq('company_name', profile.company_name)
      .single();
    
    if (location) {
      latitude = location.latitude;
      longitude = location.longitude;
      locationName = location.city || location.company_name;
    }
  }

  // If no location found, use profile geo_location_name
  if (!latitude && profile.geo_location_name) {
    locationName = profile.geo_location_name;
    // For now, we'll leave lat/lng null - could enhance with geocoding API later
  }

  // Store keywords in keywords_analytics table
  for (const keyword of analysis.keywords) {
    const { error } = await supabase
      .from('keywords_analytics')
      .insert({
        keyword: keyword.toLowerCase(),
        source_type: 'profile',
        source_id: profile.id,
        location_latitude: latitude,
        location_longitude: longitude,
        location_name: locationName,
        sentiment_score: analysis.sentiment,
        industry_tags: analysis.industries
      });
    
    if (error) {
      console.error('Error inserting keyword:', error);
    }
  }
}

async function processPost(post: any) {
  console.log('Processing post:', post.id);
  
  const postText = [
    post.text_content,
    post.author_headline,
    ...(post.comments || []).slice(0, 5).map((c: any) => c.text).filter(Boolean)
  ].filter(Boolean).join(' ');

  if (!postText.trim()) {
    console.log('No text content for post:', post.id);
    return;
  }

  const analysis = await analyzeWithAI(postText, 'post');
  
  // Get location from author profile
  let latitude = null, longitude = null, locationName = null;
  
  if (post.author_profile_id) {
    const { data: profile } = await supabase
      .from('linkedin_profiles')
      .select('company_name, geo_location_name')
      .eq('linkedin_profile_id', post.author_profile_id)
      .single();
    
    if (profile?.company_name) {
      const { data: location } = await supabase
        .from('targeted_locations')
        .select('latitude, longitude, company_name, city')
        .eq('company_name', profile.company_name)
        .single();
      
      if (location) {
        latitude = location.latitude;
        longitude = location.longitude;
        locationName = location.city || location.company_name;
      }
    }
    
    if (!locationName && profile?.geo_location_name) {
      locationName = profile.geo_location_name;
    }
  }

  // Calculate engagement score
  const engagementScore = (post.num_likes || 0) + (post.num_comments || 0) + (post.num_shares || 0);

  // Store keywords with engagement data
  for (const keyword of analysis.keywords) {
    const { error } = await supabase
      .from('keywords_analytics')
      .insert({
        keyword: keyword.toLowerCase(),
        source_type: 'post',
        source_id: post.id,
        location_latitude: latitude,
        location_longitude: longitude,
        location_name: locationName,
        sentiment_score: analysis.sentiment,
        industry_tags: analysis.industries
      });
    
    if (error) {
      console.error('Error inserting post keyword:', error);
    }
  }
}

async function generateHeatmapData() {
  console.log('Generating heatmap aggregation data...');
  
  // Aggregate keywords by location and generate heatmap data
  const { data: aggregations } = await supabase
    .from('keywords_analytics')
    .select('location_latitude, location_longitude, location_name, keyword, sentiment_score, source_type')
    .not('location_latitude', 'is', null)
    .not('location_longitude', 'is', null);
  
  if (!aggregations) return;

  // Group by location and keyword
  const locationKeywordMap = new Map<string, {
    latitude: number;
    longitude: number;
    location_name: string;
    keywords: Map<string, { count: number; sentiments: number[]; sources: { profile: number; post: number } }>;
  }>();

  for (const item of aggregations) {
    const locationKey = `${item.location_latitude},${item.location_longitude}`;
    
    if (!locationKeywordMap.has(locationKey)) {
      locationKeywordMap.set(locationKey, {
        latitude: item.location_latitude,
        longitude: item.location_longitude,
        location_name: item.location_name,
        keywords: new Map()
      });
    }
    
    const location = locationKeywordMap.get(locationKey)!;
    const keyword = item.keyword.toLowerCase();
    
    if (!location.keywords.has(keyword)) {
      location.keywords.set(keyword, {
        count: 0,
        sentiments: [],
        sources: { profile: 0, post: 0 }
      });
    }
    
    const keywordData = location.keywords.get(keyword)!;
    keywordData.count += 1;
    keywordData.sentiments.push(item.sentiment_score || 0);
    keywordData.sources[item.source_type as 'profile' | 'post'] += 1;
  }

  // Clear existing heatmap data for today
  const today = new Date().toISOString().split('T')[0];
  await supabase
    .from('attention_heatmap_data')
    .delete()
    .eq('date_snapshot', today);

  // Generate new heatmap records
  const heatmapRecords = [];
  
  for (const [locationKey, locationData] of locationKeywordMap) {
    for (const [keyword, keywordData] of locationData.keywords) {
      const avgSentiment = keywordData.sentiments.reduce((a, b) => a + b, 0) / keywordData.sentiments.length;
      const densityScore = keywordData.count;
      const engagementScore = keywordData.sources.post * 2 + keywordData.sources.profile; // Posts weighted higher
      
      heatmapRecords.push({
        location_latitude: locationData.latitude,
        location_longitude: locationData.longitude,
        keyword,
        density_score: densityScore,
        engagement_score: engagementScore,
        sentiment_avg: avgSentiment,
        profile_count: keywordData.sources.profile,
        post_count: keywordData.sources.post,
        date_snapshot: today
      });
    }
  }

  // Batch insert heatmap data
  if (heatmapRecords.length > 0) {
    const { error } = await supabase
      .from('attention_heatmap_data')
      .insert(heatmapRecords);
    
    if (error) {
      console.error('Error inserting heatmap data:', error);
    } else {
      console.log(`Generated ${heatmapRecords.length} heatmap records`);
    }
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, batch_size = 10 } = await req.json();
    
    if (action === 'process_profiles') {
      // Process LinkedIn profiles in batches
      const { data: profiles } = await supabase
        .from('linkedin_profiles')
        .select('*')
        .limit(batch_size);
      
      if (profiles) {
        for (const profile of profiles) {
          await processProfile(profile);
        }
        
        console.log(`Processed ${profiles.length} profiles`);
      }
      
    } else if (action === 'process_posts') {
      // Process LinkedIn posts in batches
      const { data: posts } = await supabase
        .from('linkedin_posts')
        .select('*')
        .limit(batch_size);
      
      if (posts) {
        for (const post of posts) {
          await processPost(post);
        }
        
        console.log(`Processed ${posts.length} posts`);
      }
      
    } else if (action === 'generate_heatmap') {
      await generateHeatmapData();
      
    } else if (action === 'full_analysis') {
      // Process both profiles and posts, then generate heatmap
      const { data: profiles } = await supabase
        .from('linkedin_profiles')
        .select('*')
        .limit(batch_size);
      
      if (profiles) {
        for (const profile of profiles) {
          await processProfile(profile);
        }
      }
      
      const { data: posts } = await supabase
        .from('linkedin_posts')
        .select('*')
        .limit(Math.floor(batch_size / 2));
      
      if (posts) {
        for (const post of posts) {
          await processPost(post);
        }
      }
      
      await generateHeatmapData();
      
      console.log(`Full analysis complete: ${profiles?.length || 0} profiles, ${posts?.length || 0} posts`);
    }

    return new Response(JSON.stringify({ 
      success: true,
      message: `${action} completed successfully`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-keyword-analyzer:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Unknown error occurred' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});