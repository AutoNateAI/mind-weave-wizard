import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const { prompt, content_type, location_context, critical_thinking_concepts } = await req.json();

    // Build enhanced prompt based on content type
    let systemPrompt = '';
    let maxTokens = 500;

    switch (content_type) {
      case 'linkedin_post':
        systemPrompt = `You are an expert social media content creator specializing in LinkedIn posts for professionals. Create engaging, thought-provoking LinkedIn posts that incorporate critical thinking concepts naturally. The post should be professional yet conversational, include relevant hashtags, and encourage meaningful discussion.`;
        maxTokens = 500;
        break;
      case 'linkedin_article':
        systemPrompt = `You are an expert content creator specializing in LinkedIn articles. Create comprehensive, well-structured articles that explore critical thinking concepts in depth. The article should be educational, professional, and provide actionable insights for business professionals.`;
        maxTokens = 2000;
        break;
      case 'instagram_post':
        systemPrompt = `You are an expert social media content creator specializing in Instagram posts. Create visually engaging post captions that make critical thinking concepts accessible and relatable. The content should be inspiring, use relevant hashtags, and encourage engagement.`;
        maxTokens = 400;
        break;
      case 'instagram_story':
        systemPrompt = `You are an expert social media content creator specializing in Instagram Stories. Create brief, impactful story content that highlights critical thinking concepts in bite-sized, shareable formats. The content should be visual-first and engaging.`;
        maxTokens = 200;
        break;
      default:
        systemPrompt = `You are an expert content creator specializing in social media content that incorporates critical thinking concepts for professional audiences.`;
    }

    // Add location context if provided
    if (location_context) {
      systemPrompt += ` The content is targeted at professionals in the ${location_context.city}, ${location_context.state} area, particularly those connected to ${location_context.company_name}.`;
    }

    // Add critical thinking focus
    if (critical_thinking_concepts && critical_thinking_concepts.length > 0) {
      systemPrompt += ` Focus particularly on these critical thinking concepts: ${critical_thinking_concepts.join(', ')}.`;
    }

    systemPrompt += ` The content should relate to our thinking skills course offerings and position us as thought leaders in critical thinking education.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        max_tokens: maxTokens,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedContent = data.choices[0].message.content;

    // Add content type specific formatting
    let formattedContent = generatedContent;
    
    if (content_type === 'linkedin_post' && !formattedContent.includes('#')) {
      // Add relevant hashtags for LinkedIn posts
      const hashtags = [
        '#CriticalThinking',
        '#ProfessionalDevelopment',
        '#Leadership',
        '#ThinkingSkills',
        '#BusinessStrategy'
      ];
      
      if (location_context?.city) {
        hashtags.push(`#${location_context.city.replace(/\s+/g, '')}`);
      }
      
      critical_thinking_concepts.forEach(concept => {
        const hashtagVersion = '#' + concept.replace(/\s+/g, '');
        if (!hashtags.includes(hashtagVersion)) {
          hashtags.push(hashtagVersion);
        }
      });
      
      formattedContent += '\n\n' + hashtags.slice(0, 8).join(' ');
    }

    return new Response(
      JSON.stringify({ 
        content: formattedContent,
        content_type,
        location_context,
        critical_thinking_concepts
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-social-content function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});