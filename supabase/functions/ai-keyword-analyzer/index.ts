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

// Stopwords to exclude from keyword extraction
const STOPWORDS = new Set<string>([
  'a','an','the','and','or','but','so','if','then','than','because','as','of','in','on','at','by','for','to','from','with','without','about','into','over','after','before','between','through','during','above','below','up','down','out','off','again','further','is','are','was','were','be','been','being','have','has','had','do','does','did','doing','would','should','could','can','will','just','not','no','nor','only','own','same','such','too','very','s','t','y','i','me','my','myself','we','our','ours','ourselves','you','your','yours','yourself','yourselves','he','him','his','himself','she','her','hers','herself','it','its','itself','they','them','their','theirs','themselves','this','that','these','those'
]);

function filterKeywords(keywords: string[]): string[] {
  const cleaned = keywords
    .map(k => String(k).toLowerCase().trim())
    .filter(k => k && !STOPWORDS.has(k) && k.length > 2);
  return Array.from(new Set(cleaned));
}


async function analyzeWithAI(text: string, type: 'profile' | 'post'): Promise<KeywordAnalysis> {
  const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openAIApiKey) {
    throw new Error('OpenAI API key not found');
  }

  const prompt = type === 'profile' 
    ? `Analyze this LinkedIn profile content and extract:
1. Top 10 most relevant keywords/skills (lowercase, deduplicated, EXCLUDE stopwords like: a, an, the, and, or, to, of, in, on, at, by, for, from)
2. Industry classification
3. Sentiment score (-1 to 1, where -1 is negative, 0 neutral, 1 positive)
4. Professional themes

Content: ${text}

Return JSON only: { "keywords": ["keyword1", "keyword2"], "sentiment": 0.5, "industries": ["industry1"], "skills": ["skill1"], "themes": ["theme1"] }`
    : `Analyze this LinkedIn post content and extract:
1. Top 10 most relevant keywords/topics (lowercase, deduplicated, EXCLUDE stopwords like: a, an, the, and, or, to, of, in, on, at, by, for, from)
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
          { role: 'system', content: 'You are an expert LinkedIn content analyzer. Always return valid JSON in the exact format requested.' },
          { role: 'user', content: prompt }
        ],
        max_completion_tokens: 500,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid OpenAI response structure');
    }
    
    const content = data.choices[0].message.content;
    
    if (!content) {
      throw new Error('Empty content from OpenAI');
    }
    
    console.log('OpenAI raw response:', content);
    
    // Clean and parse JSON response
    let cleanedContent = content.replace(/```json|```/g, '').trim();
    
    // Handle case where AI returns just the JSON object
    if (cleanedContent.startsWith('{') && cleanedContent.endsWith('}')) {
      const analysis = JSON.parse(cleanedContent);
      
      return {
        keywords: Array.isArray(analysis.keywords) ? filterKeywords(analysis.keywords).slice(0, 10) : [],
        sentiment: typeof analysis.sentiment === 'number' ? analysis.sentiment : 0,
        industries: Array.isArray(analysis.industries) ? analysis.industries : [],
        skills: Array.isArray(analysis.skills) ? analysis.skills : [],
        themes: Array.isArray(analysis.themes) ? analysis.themes : []
      };
    } else {
      throw new Error('Invalid JSON format from OpenAI');
    }
    
  } catch (error) {
    console.error('AI Analysis error:', error);
    console.error('Text being analyzed:', text.substring(0, 200) + '...');
    
    // Return enhanced fallback analysis (exclude stopwords)
    const tokens = (text.toLowerCase().match(/\b[\p{L}\p{N}']+\b/gu) ?? []);
    const filtered = tokens.filter(w => w.length > 2 && !STOPWORDS.has(w));
    
    return {
      keywords: [...new Set(filtered)].slice(0, 10),
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
    // Mark as analyzed to avoid infinite retries
    await supabase
      .from('linkedin_profiles')
      .update({ analyzed: true, reanalyze_requested: false, last_analyzed_at: new Date().toISOString() })
      .eq('id', profile.id);
    return;
  }

  const analysis = await analyzeWithAI(profileText, 'profile');
  
  // Extract location coordinates using existing location mapping
  let latitude = null, longitude = null, locationName = null;
  
  // First, check if this profile is already mapped to a location
  const { data: mapping } = await supabase
    .from('location_social_mapping')
    .select(`
      location_id,
      targeted_locations!inner(
        latitude,
        longitude,
        company_name,
        city
      )
    `)
    .eq('linkedin_profile_id', profile.id)
    .eq('mapping_type', 'linkedin_profile')
    .single();
  
  if (mapping?.targeted_locations) {
    const location = mapping.targeted_locations;
    latitude = location.latitude;
    longitude = location.longitude;
    locationName = location.city || location.company_name;
  }

  // If no mapping found, fallback to text-based matching
  if (!latitude && (profile.headline || profile.occupation)) {
    const text = `${profile.headline || ''} ${profile.occupation || ''}`.toLowerCase();
    
    const { data: locations } = await supabase
      .from('targeted_locations')
      .select('latitude, longitude, company_name, city');
    
    if (locations) {
      for (const location of locations) {
        const companyName = location.company_name.toLowerCase();
        if (text.includes(companyName) || 
            (companyName.includes('par hawaii') && text.includes('par')) ||
            (companyName.includes('hawaiian') && text.includes('hawaiian')) ||
            (companyName.includes('matson') && text.includes('matson')) ||
            (companyName.includes('bank') && text.includes('bank'))) {
          latitude = location.latitude;
          longitude = location.longitude;
          locationName = location.city || location.company_name;
          break;
        }
      }
    }
  }

  // Final fallback to profile location
  if (!latitude && profile.geo_location_name) {
    locationName = profile.geo_location_name;
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

  // Mark profile as analyzed and clear reanalyze flag
  await supabase
    .from('linkedin_profiles')
    .update({ analyzed: true, reanalyze_requested: false, last_analyzed_at: new Date().toISOString() })
    .eq('id', profile.id);
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
    await supabase
      .from('linkedin_posts')
      .update({ analyzed: true, reanalyze_requested: false, last_analyzed_at: new Date().toISOString() })
      .eq('id', post.id);
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

  // Mark post as analyzed and clear reanalyze flag
  await supabase
    .from('linkedin_posts')
    .update({ analyzed: true, reanalyze_requested: false, last_analyzed_at: new Date().toISOString() })
    .eq('id', post.id);
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
        .or('reanalyze_requested.eq.true,analyzed.eq.false,analyzed.is.null')
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
        .or('reanalyze_requested.eq.true,analyzed.eq.false,analyzed.is.null')
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
        .or('reanalyze_requested.eq.true,analyzed.eq.false,analyzed.is.null')
        .limit(batch_size);
      
      if (profiles) {
        for (const profile of profiles) {
          await processProfile(profile);
        }
      }
      
      const { data: posts } = await supabase
        .from('linkedin_posts')
        .select('*')
        .or('reanalyze_requested.eq.true,analyzed.eq.false,analyzed.is.null')
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