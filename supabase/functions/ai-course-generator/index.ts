import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.54.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Helper function to fetch and process prompts from the AI prompt library
async function getPromptTemplate(promptName: string, variables = {}) {
  try {
    const { data: prompt, error } = await supabase
      .from('ai_prompts')
      .select('prompt_template, variables')
      .eq('prompt_name', promptName)
      .eq('is_active', true)
      .single();

    if (error || !prompt) {
      console.warn(`Prompt not found in library: ${promptName}, using fallback`);
      return null;
    }

    // Replace variables in the template
    let processedTemplate = prompt.prompt_template;
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      processedTemplate = processedTemplate.replace(new RegExp(placeholder, 'g'), String(value));
    });

    // Update usage tracking
    await supabase
      .from('ai_prompts')
      .update({
        usage_count: supabase.rpc('increment', { row_id: prompt.id }),
        last_used_at: new Date().toISOString()
      })
      .eq('prompt_name', promptName);

    return processedTemplate;
  } catch (error) {
    console.error(`Error fetching prompt ${promptName}:`, error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, payload } = await req.json();
    console.log('🚀 AI Course Generator called with action:', action);
    console.log('📦 Payload:', JSON.stringify(payload, null, 2));

    switch (action) {
      case 'enhance_context':
        return await enhanceContext(payload);
      case 'plan_course':
        return await planCourse(payload);
      case 'planning_chat':
        return await planningChat(payload);
      case 'generate_content':
        return await generateContent(payload);
      case 'edit_content':
        return await editContent(payload);
      case 'generate_assessments':
        return await generateAssessments(payload);
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    console.error('❌ Error in ai-course-generator:', error);
    console.error('❌ Error stack:', error.stack);
    return new Response(JSON.stringify({ error: error.message, stack: error.stack }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Enhanced Context Function
async function enhanceContext(payload: any) {
  const { contextualInfo, courseId, level, courseTitle, sessionTitle, lectureTitle } = payload;

  if (!contextualInfo) {
    throw new Error('Contextual information is required for enhancement');
  }

  // Use prompt library if available
  const promptFromLibrary = await getPromptTemplate('context_enhancement_prompt', {
    user_context: contextualInfo,
    level: level || 'course',
    course_title: courseTitle || '',
    session_title: sessionTitle || '',
    lecture_title: lectureTitle || ''
  });

  const enhancementPrompt = promptFromLibrary || `
You are an AI course content strategist. Take the user's base context and deepen it with specific, actionable guidance.

SCOPE:
- Level: ${level || 'course'}
- Course Title: ${courseTitle || ''}
- Session Title: ${sessionTitle || ''}
- Lecture Title: ${lectureTitle || ''}

Original Context:
"""
${contextualInfo}
"""

Enhance by:
1) Profiling the target audience (background, motivations, prior knowledge, misconceptions)
2) Suggesting pedagogy and delivery style aligned to the audience
3) Listing concrete learning objectives and outcomes
4) Recommending tone/voice and engagement strategies
5) Proposing domain-relevant examples/case studies and visuals
6) Providing constraints/inclusions to guide consistent content generation

Return a single, well-structured paragraph block suitable as a context seed for downstream generation.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are an expert educational content strategist that crafts precise, actionable context seeds.' },
        { role: 'user', content: enhancementPrompt }
      ],
      max_tokens: 800,
      temperature: 0.7
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('OpenAI API error:', errorText);
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  const enhancedContext = data.choices[0].message.content;

  return new Response(JSON.stringify({ 
    enhancedContext,
    success: true 
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function planCourse(payload: any) {
  const { courseDescription, chatHistory, userId } = payload;
  
  const promptTemplate = await getPromptTemplate('course_planning_system', {
    course_description: courseDescription,
    chat_history: JSON.stringify(chatHistory)
  });

  const prompt = promptTemplate || `You are an expert course designer creating the "AutoNateAI: Thinking Wizard Course" - a 10-session mental mastery journey focused on graph theory and thinking models.

FRAMEWORK CONSTRAINTS: You MUST create courses that follow this exact structure:
- Exactly 10 sessions
- Each session has exactly 3 lectures (5-7 minutes each)  
- Each session follows: Lecture → Game → Reflection pattern repeated 3 times
- Sessions progress: Graph Theory → Mental Models → Space Between → Research Decomposition → Traversal Techniques → Multiple Perspectives → Pattern Recognition → Advanced Applications → Professional Integration → Mastery & Beyond

Base the session titles, themes, and lecture content on the conversation, but ALWAYS maintain the core framework above.

Course Description: ${courseDescription}
Chat History: ${JSON.stringify(chatHistory)}

Generate ONLY valid JSON (no markdown formatting) with this exact structure:
{
  "course": {
    "title": "Course Title",
    "description": "Brief description",
    "overview": "Detailed overview"
  },
  "sessions": [
    {
      "session_number": 1,
      "title": "Session Title",
      "description": "Session description", 
      "theme": "Theme or focus",
      "lectures": [
        {
          "lecture_number": 1,
          "title": "Lecture Title",
          "estimated_duration_minutes": 5
        },
        {
          "lecture_number": 2,
          "title": "Lecture Title",
          "estimated_duration_minutes": 6
        },
        {
          "lecture_number": 3,
          "title": "Lecture Title", 
          "estimated_duration_minutes": 7
        }
      ]
    }
  ]
}

Make sure each session has exactly 3 lectures, each 5-7 minutes long. Focus on engaging, practical content that builds progressively.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { 
          role: 'system', 
          content: 'You are an expert educational content designer. You MUST respond with valid JSON only. Do not include any markdown formatting or additional text.' 
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }
    }),
  });

  const data = await response.json();
  console.log('🔍 OpenAI API response:', { 
    status: response.status, 
    hasChoices: !!data.choices, 
    firstChoice: data.choices?.[0] 
  });

  if (!response.ok) {
    console.error('❌ OpenAI API error:', data);
    throw new Error(`OpenAI API error: ${data.error?.message || 'Unknown error'}`);
  }

  let rawContent = data.choices[0].message.content;
  console.log('📝 Raw OpenAI content (first 200 chars):', rawContent?.substring(0, 200));
  
  // Clean up markdown formatting if present
  if (rawContent.includes('```json')) {
    rawContent = rawContent.replace(/```json\s*/, '').replace(/```\s*$/, '');
  }
  
  let generatedPlan;
  try {
    generatedPlan = JSON.parse(rawContent);
  } catch (parseError) {
    console.error('❌ JSON parse error:', parseError);
    console.error('❌ Raw content that failed to parse:', rawContent);
    throw new Error(`Failed to parse course plan response as JSON: ${parseError.message}`);
  }

  // Save to database
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .insert({
      title: generatedPlan.course.title,
      description: generatedPlan.course.description,
      overview: generatedPlan.course.overview,
      created_by: userId,
      status: 'draft'
    })
    .select()
    .single();

  if (courseError) throw courseError;

  // Save sessions and lectures
  for (const sessionData of generatedPlan.sessions) {
    const { data: session, error: sessionError } = await supabase
      .from('sessions_dynamic')
      .insert({
        course_id: course.id,
        session_number: sessionData.session_number,
        title: sessionData.title,
        description: sessionData.description,
        theme: sessionData.theme,
        order_index: sessionData.session_number
      })
      .select()
      .single();

    if (sessionError) throw sessionError;

    for (const lectureData of sessionData.lectures) {
      await supabase
        .from('lectures_dynamic')
        .insert({
          session_id: session.id,
          lecture_number: lectureData.lecture_number,
          title: lectureData.title,
          estimated_duration_minutes: lectureData.estimated_duration_minutes,
          order_index: lectureData.lecture_number
        });
    }
  }

  return new Response(JSON.stringify({ course, plan: generatedPlan }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function planningChat(payload: any) {
  const { chatHistory } = payload;

  const systemPromptTemplate = await getPromptTemplate('course_planning_chat_system');
  const systemPrompt = systemPromptTemplate || `You are an expert course planning assistant for the "AutoNateAI: Thinking Wizard Course" - a 10-session mental mastery journey focused on graph theory and thinking models.

FRAMEWORK CONSTRAINTS: You can ONLY help create variations of this specific course:
- Title: "AutoNateAI: Thinking Wizard Course" (variations allowed)
- Structure: Exactly 10 sessions about graph theory and mental models
- Session progression: Graph Theory → Mental Models → Space Between → Research Decomposition → Traversal Techniques → Multiple Perspectives → Pattern Recognition → Advanced Applications → Professional Integration → Mastery & Beyond
- Each session: 3 lectures (5-7 min each) with games and reflections

Your role: Help customize the themes, examples, and applications based on the user's interests while maintaining this exact structure. Ask clarifying questions about their background, goals, and learning preferences to tailor the content.

Keep replies concise and conversational. Focus on how to adapt the course themes to their specific needs.`;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...chatHistory.map((m: any) => ({ role: m.role, content: m.content }))
  ];

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages,
      temperature: 0.7,
    }),
  });

  const data = await response.json();
  const reply = data.choices?.[0]?.message?.content ?? 'Sorry, I could not generate a response right now.';

  return new Response(JSON.stringify({ reply }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function generateContent(payload: any) {
  const { lectureId, lectureTitle, sessionTheme, sessionNumber, lectureNumber, contextualInfo, styleInstructions } = payload;

  console.log('🚀 Starting content generation with payload:', JSON.stringify(payload, null, 2));

  // Get lecture info to understand context
  const { data: lectureData, error: lectureError } = await supabase
    .from('lectures_dynamic')
    .select('*, sessions_dynamic(*)')
    .eq('id', lectureId)
    .single();

  if (lectureError) {
    console.error('❌ Failed to fetch lecture data:', lectureError);
    throw new Error(`Failed to fetch lecture data: ${lectureError.message}`);
  }

  const actualSessionNumber = sessionNumber || lectureData.sessions_dynamic?.session_number || 1;
  const actualLectureNumber = lectureNumber || lectureData.lecture_number || 1;

  console.log(`🎯 Generating content for: ${lectureTitle} (Session ${actualSessionNumber}, Lecture ${actualLectureNumber})`);

  // Generate all content types in parallel with contextual information
  const contentPromises = [
    generateSlides(lectureId, lectureTitle, sessionTheme, contextualInfo, styleInstructions),
    generateAssessmentsContent(actualSessionNumber, actualLectureNumber, lectureTitle, sessionTheme, contextualInfo)
  ];

  console.log('⚡ Starting parallel content generation...');
  const results = await Promise.allSettled(contentPromises);

  const slidesResult = results[0];
  const assessmentsResult = results[1];

  let slidesData = null;
  let assessmentsData = null;
  const errors = {};

  if (slidesResult.status === 'fulfilled') {
    slidesData = slidesResult.value;
    console.log('✅ Slides generated successfully');
  } else {
    console.error('❌ Slides generation failed:', slidesResult.reason);
    errors.slidesError = slidesResult.reason?.message || 'Unknown slides error';
  }

  if (assessmentsResult.status === 'fulfilled') {
    assessmentsData = assessmentsResult.value;
    console.log('✅ Assessments generated successfully');
  } else {
    console.error('❌ Assessments generation failed:', assessmentsResult.reason);
    errors.assessmentsError = assessmentsResult.reason?.message || 'Unknown assessments error';
  }

  return new Response(JSON.stringify({ 
    slides: slidesData?.slides || null,
    assessments: assessmentsData || null,
    success: true,
    errors
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function generateSlides(lectureId: string, lectureTitle: string, sessionTheme: string, contextualInfo?: string, styleInstructions?: string) {
  const promptTemplate = await getPromptTemplate('slide_generation_prompt', {
    lecture_title: lectureTitle,
    session_theme: sessionTheme,
    contextual_info: contextualInfo || '',
    style_instructions: styleInstructions || ''
  });

  // Enhanced prompt with contextual information and style instructions
  const contextualPrompt = contextualInfo ? `

CONTEXTUAL INFORMATION:
${contextualInfo}

Please ensure all content is tailored to this specific context and audience.` : '';

  const stylePrompt = styleInstructions ? `

STYLE INSTRUCTIONS:
${styleInstructions}` : '';

  const basePrompt = promptTemplate || `Create 6-8 instructional slides for a lecture titled "${lectureTitle}" with the session theme "${sessionTheme}".${contextualPrompt}${stylePrompt}

Each slide must return JSON with fields: slide_number, title, content, slide_type, svg_animation, speaker_notes.

CONTENT RULES (CRITICAL):
- For content, write 5-7 NEWLINE-SEPARATED bullets, each starting with "• ".
- Each bullet must be 2-4 full sentences that TEACH a specific sub-concept (not fragments).
- Address the learner directly in second person ("you"), present tense.
- Never instruct the teacher or describe teaching actions. Avoid verbs like "Frame", "Map out", "Compare", "Introduce".
- Ensure the slide stands alone: a learner reading only the content should understand the concept without narration.
- Depth & Nuance: prioritize nuanced knowledge—include trade-offs, edge cases, counterexamples, constraints, failure modes, and common misconceptions when relevant. Avoid generic platitudes; use precise domain terms and briefly define them in plain language.
- Across the entire deck, include at least one of each: "Question:" (Socratic prompt), "Try this:" (micro-activity), and "Example:" (concrete illustration). Distribute naturally.

SPEAKER NOTES:
- Provide 3-5 sentences with rationale, transitions, and a quick debrief question.

SLIDE TYPES:
- Choose from: "intro", "content", "example", "summary".

Return ONLY this JSON structure:
{
  "slides": [
    {
      "slide_number": 1,
      "title": "Slide Title",
      "content": "• Focused attention directs your engineering effort toward impact.\n• Question: What makes someone stand out in a Fortune 500 tech team?\n• Try this: Reflect on last week and spot a moment questioning could change the outcome.\n• Example: A developer questions requirements and uncovers a simpler solution.",
      "slide_type": "content",
      "svg_animation": "Simple motion idea that supports the teaching point",
      "speaker_notes": "Instructor guidance with transitions and debrief"
    }
  ]
}`;

// Absolute voice override to ensure learner-facing tone even if library prompt differs
  const voiceOverride = `\n\nVOICE AND TONE + STRUCTURE (OVERRIDE ANY EARLIER INSTRUCTIONS):\n- Address the learner directly using \"you\" in present tense.\n- Slide content must be standalone: a learner understands without narration.\n- Content bullets: write 5-7 bullets, each bullet is 2-4 full sentences teaching one sub-concept.\n- Emphasize nuanced knowledge: include trade-offs, edge cases, constraints, counterexamples, and common misconceptions where relevant; avoid platitudes; use precise terms with short definitions.\n- Professor–Researcher style: structured and rigorous (hypothesis → evidence → implication), yet lively and entertaining. Use relevant real-world and cross-domain examples, plus untraditional analogies that make concepts click.\n- Highlight transfer: when natural, include brief \"Why it matters\" or \"Where else it applies\" within bullets to show multiple utilizations.\n- Never instruct the teacher or describe teaching actions.\n- Use labels: \"Question:\", \"Try this:\", and \"Example:\" when appropriate across the deck.`;

  const prompt = `${basePrompt}${voiceOverride}`;

  console.log('🤖 Making OpenAI request for slides...');
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are an expert educational content creator specializing in visual presentations for cognitive and mental model training. Always return valid JSON without any markdown formatting.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.8,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  console.log('📝 Raw OpenAI response for slides:', data.choices[0].message.content.substring(0, 200) + '...');

  let slideData;
  try {
    // Clean up any markdown formatting that might be in the response
    let content = data.choices[0].message.content.trim();
    
    // Remove markdown code blocks if present
    if (content.startsWith('```json')) {
      content = content.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    }
    if (content.startsWith('```')) {
      content = content.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    console.log('🧹 Cleaned content for slides:', content.substring(0, 200) + '...');
    slideData = JSON.parse(content);
    console.log('✅ Successfully parsed slide data, slides count:', slideData.slides?.length);
    
    // Validate slide data structure
    if (!slideData.slides || !Array.isArray(slideData.slides)) {
      throw new Error('Invalid slide data structure: slides array is missing or not an array');
    }
    
    if (slideData.slides.length === 0) {
      throw new Error('No slides generated in response');
    }
    
    console.log('🔍 First slide structure:', JSON.stringify(slideData.slides[0], null, 2));
  } catch (e) {
    console.error('❌ Failed to parse slide data:', e);
    console.error('📄 Raw content that failed to parse:', data.choices[0].message.content);
    throw new Error(`Failed to parse slide generation response: ${e.message}`);
  }

  // Save slides to database with error handling
  console.log('💾 Saving slides to database...');
  const slideInserts = slideData.slides.map((slide, index) => {
    console.log(`📄 Processing slide ${index + 1}:`, {
      slide_number: slide.slide_number,
      title: slide.title,
      has_content: !!slide.content,
      content_length: slide.content?.length || 0
    });
    
    // Ensure all required fields are present and valid with fallbacks
    const slideNumber = slide.slide_number || (index + 1);
    const title = slide.title || `Slide ${slideNumber} - ${lectureTitle}`;
    const content = slide.content || `Content for slide ${slideNumber} about ${lectureTitle}. This slide covers key concepts and practical applications.`;
    
    console.log(`🔍 Slide ${index + 1} validation:`, { slideNumber, title, content_length: content.length });
    
    const allowedTypes = ['intro', 'content', 'example', 'summary'];
    const rawType = (slide.slide_type || 'content').toLowerCase();
    const normalizedType = allowedTypes.includes(rawType) ? rawType : 'content';
    
    return {
      lecture_id: lectureId,
      slide_number: slideNumber,
      title: title,
      content: content, // Guaranteed not null with fallback
      slide_type: normalizedType,
      svg_animation: slide.svg_animation || null,
      speaker_notes: slide.speaker_notes || null
    };
  });

  console.log('📊 About to insert slides:', slideInserts.length, 'records');
  console.log('🔍 Sample insert data:', JSON.stringify(slideInserts[0], null, 2));

  const { data: insertedSlides, error: slideError } = await supabase
    .from('lecture_slides')
    .insert(slideInserts)
    .select();

  if (slideError) {
    console.error('❌ Failed to insert slides:', slideError);
    console.error('❌ Slide insert data that failed:', JSON.stringify(slideInserts, null, 2));
    console.error('❌ Database error details:', slideError);
    throw new Error(`Failed to save slides: ${slideError.message}. Details: ${JSON.stringify(slideError)}`);
  } else {
    console.log('✅ Successfully inserted slides:', insertedSlides?.length);
    console.log('🎯 Inserted slide IDs:', insertedSlides?.map(s => s.id));
  }

  return slideData;
}

async function generateAssessmentsContent(sessionNumber: number, lectureNumber: number, lectureTitle: string, sessionTheme: string, contextualInfo?: string) {
  const promptTemplate = await getPromptTemplate('assessment_generation_prompt', {
    lecture_title: lectureTitle,
    session_number: sessionNumber.toString(),
    lecture_number: lectureNumber.toString(),
    session_theme: sessionTheme,
    contextual_info: contextualInfo || ''
  });

  const contextualPrompt = contextualInfo ? `

CONTEXTUAL INFORMATION:
${contextualInfo}

Please ensure all assessments are tailored to this specific context and audience.` : '';

  const prompt = promptTemplate || `Based on the lecture "${lectureTitle}" (Session ${sessionNumber}, Lecture ${lectureNumber}) with theme "${sessionTheme}" from the AutoNateAI: Thinking Wizard Course, generate comprehensive educational assessments.${contextualPrompt}

This course teaches structured thinking using graphs, mental models, and cognitive frameworks. Create assessments that:
1. Test understanding of key concepts
2. Encourage practical application
3. Connect to the broader course themes
4. Build cognitive skills progressively

Create:
1. 3-5 multiple choice questions with 4 options each (test conceptual understanding)
2. 2-3 reflection questions that encourage deep thinking and personal application (question_number must be 1, 2, or 3)
3. 5-8 flashcards with key concepts (mix of definitions, examples, and applications)

CRITICAL CONSTRAINTS:
- correct_option MUST be one of: "A", "B", "C", or "D" (uppercase letters only)
- question_number for reflections MUST be 1, 2, or 3 (no duplicates within same session/lecture)

Return JSON format:
{
  "multiple_choice": [
    {
      "question_text": "Question focusing on practical application",
      "option_a": "Option A",
      "option_b": "Option B", 
      "option_c": "Option C",
      "option_d": "Option D",
      "correct_option": "A"
    }
  ],
  "reflection_questions": [
    {
      "question_number": 1,
      "question_text": "Thought-provoking question that connects to personal experience"
    }
  ],
  "flashcards": [
    {
      "title": "Key Concept",
      "content": "Clear definition with practical example",
      "concept_type": "definition",
      "order_index": 1
    }
  ]
}`;

  console.log('🤖 Making OpenAI request for assessments...');
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are an expert assessment designer creating engaging educational evaluations for cognitive skill development. Always return valid JSON without any markdown formatting.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  console.log('📝 Raw OpenAI response for assessments:', data.choices[0].message.content.substring(0, 200) + '...');

  let assessments;
  try {
    let content = data.choices[0].message.content.trim();
    
    // Remove markdown code blocks if present
    if (content.startsWith('```json')) {
      content = content.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    }
    if (content.startsWith('```')) {
      content = content.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    console.log('🧹 Cleaned content for assessments:', content.substring(0, 200) + '...');
    assessments = JSON.parse(content);
    console.log('✅ Successfully parsed assessment data:', {
      mcq_count: assessments.multiple_choice?.length,
      reflection_count: assessments.reflection_questions?.length,
      flashcard_count: assessments.flashcards?.length
    });
  } catch (e) {
    console.error('❌ Failed to parse assessment data:', e);
    console.error('📄 Raw content that failed to parse:', data.choices[0].message.content);
    throw new Error(`Failed to parse assessment generation response: ${e.message}`);
  }

  // Prepare bulk inserts with validation
  console.log('💾 Preparing database inserts...');
  
  // Sanitize, bound counts, and de-duplicate to keep output stable and high quality
  const normalizeText = (s: string) => (s || '').toLowerCase().replace(/\s+/g, ' ').trim();
  const uniqBy = <T,>(arr: T[], keyFn: (t: T) => string) => {
    const seen = new Set<string>();
    const out: T[] = [];
    for (const item of arr || []) {
      const k = keyFn(item);
      if (!seen.has(k)) { seen.add(k); out.push(item); }
    }
    return out;
  };

  const rawMcqs = Array.isArray(assessments.multiple_choice) ? assessments.multiple_choice : [];
  const mcqsBounded = rawMcqs.slice(0, 5); // cap at 5
  const mcqsFinal = mcqsBounded
    .map((q: any) => ({
      ...q,
      correct_option: String(q.correct_option || 'A').toUpperCase()
    }))
    .filter((q: any) => ['A','B','C','D'].includes(q.correct_option))
    .slice(0, Math.max(3, Math.min(5, mcqsBounded.length))); // ensure 3-5

  const rawRefs = Array.isArray(assessments.reflection_questions) ? assessments.reflection_questions : [];
  const refsBounded = rawRefs.slice(0, 3); // cap at 3
  const refsFinal = refsBounded.map((r: any, idx: number) => ({ ...r, question_number: idx + 1 }));

  const rawFcs = Array.isArray(assessments.flashcards) ? assessments.flashcards : [];
  const fcsUnique = uniqBy(rawFcs, (fc: any) => `${normalizeText(fc.title)}|${normalizeText(fc.content)}`);
  const fcsFinal = fcsUnique.slice(0, 8); // cap at 8
  
  const mcqInserts = mcqsFinal.map((mcq, index) => {
    // Validate and provide fallbacks for required fields
    const questionText = mcq.question_text || `Multiple choice question ${index + 1} for ${lectureTitle}`;
    const optionA = mcq.option_a || 'Option A';
    const optionB = mcq.option_b || 'Option B';
    const optionC = mcq.option_c || 'Option C';
    const optionD = mcq.option_d || 'Option D';
    const correctOption = (mcq.correct_option || 'A').toUpperCase();
    
    console.log(`🔍 MCQ ${index + 1} validation:`, { questionText, optionA, optionB, optionC, optionD, correctOption });
    
    return {
      session_number: sessionNumber,
      lecture_number: lectureNumber,
      question_text: questionText,
      option_a: optionA,
      option_b: optionB,
      option_c: optionC,
      option_d: optionD,
      correct_option: correctOption
    };
  });
  
  const reflectionInserts = refsFinal.map((rq, index) => {
    const questionText = rq.question_text || `Reflection question ${index + 1} for ${lectureTitle}`;
    const questionNumber = rq.question_number || (index + 1);
    
    console.log(`🔍 Reflection ${index + 1} validation:`, { questionNumber, questionText });
    
    return {
      session_number: sessionNumber,
      lecture_number: lectureNumber,
      question_number: questionNumber,
      question_text: questionText
    };
  });

  const flashcardInserts = fcsFinal.map((fc, index) => {
    const title = fc.title || `Flashcard ${index + 1}`;
    const content = fc.content || `Content for flashcard about ${lectureTitle}`;
    
    console.log(`🔍 Flashcard ${index + 1} validation:`, { title, content, concept_type: fc.concept_type });
    
    return {
      session_number: sessionNumber,
      lecture_number: lectureNumber,
      title: title,
      content: content,
      concept_type: fc.concept_type || 'definition',
      order_index: fc.order_index || index + 1
    };
  });

  console.log('📊 Insert counts:', {
    mcq: mcqInserts.length,
    reflections: reflectionInserts.length,
    flashcards: flashcardInserts.length
  });

  // Execute all inserts in parallel with detailed error logging
  const insertPromises = [];
  
  if (mcqInserts.length > 0) {
    console.log('📝 About to insert MCQ records:', mcqInserts.length);
    console.log('🔍 Sample MCQ insert:', JSON.stringify(mcqInserts[0], null, 2));
    insertPromises.push(
      supabase.from('multiple_choice_questions')
        .delete()
        .eq('session_number', sessionNumber)
        .eq('lecture_number', lectureNumber)
        .then(() => supabase.from('multiple_choice_questions').insert(mcqInserts).select())
        .then(result => {
          console.log('✅ MCQ insert result:', result.error ? 'ERROR' : 'SUCCESS', result.error || `${result.data?.length} records`);
          if (result.error) {
            console.error('❌ MCQ insert error details:', JSON.stringify(result.error, null, 2));
          }
          return { type: 'mcq', result };
        })
        .catch(error => {
          console.error('❌ MCQ insert promise error:', error);
          return { type: 'mcq', result: { error } };
        })
    );
  } else {
    console.log('⚠️ No MCQ records to insert');
  }
  
  if (reflectionInserts.length > 0) {
    console.log('📝 About to insert Reflection records:', reflectionInserts.length);
    console.log('🔍 Sample Reflection insert:', JSON.stringify(reflectionInserts[0], null, 2));
    
    insertPromises.push(
      supabase.from('reflection_questions')
        .upsert(reflectionInserts, { 
          onConflict: 'session_number,lecture_number,question_number' 
        })
        .select()
        .then(result => {
          console.log('✅ Reflection upsert result:', result.error ? 'ERROR' : 'SUCCESS', result.error || `${result.data?.length} records`);
          if (result.error) {
            console.error('❌ Reflection upsert error details:', JSON.stringify(result.error, null, 2));
          }
          return { type: 'reflections', result };
        })
        .catch(error => {
          console.error('❌ Reflection upsert promise error:', error);
          return { type: 'reflections', result: { error } };
        })
    );
  } else {
    console.log('⚠️ No Reflection records to insert');
  }
  
  if (flashcardInserts.length > 0) {
    console.log('📝 About to insert Flashcard records:', flashcardInserts.length);
    console.log('🔍 Sample Flashcard insert:', JSON.stringify(flashcardInserts[0], null, 2));
    insertPromises.push(
      supabase.from('flashcards')
        .delete()
        .eq('session_number', sessionNumber)
        .eq('lecture_number', lectureNumber)
        .then(() => supabase.from('flashcards').insert(flashcardInserts).select())
        .then(result => {
          console.log('✅ Flashcard insert result:', result.error ? 'ERROR' : 'SUCCESS', result.error || `${result.data?.length} records`);
          if (result.error) {
            console.error('❌ Flashcard insert error details:', JSON.stringify(result.error, null, 2));
          }
          return { type: 'flashcards', result };
        })
        .catch(error => {
          console.error('❌ Flashcard insert promise error:', error);
          return { type: 'flashcards', result: { error } };
        })
    );
  } else {
    console.log('⚠️ No Flashcard records to insert');
  }

  const insertResults = await Promise.allSettled(insertPromises);

  // Log detailed results
  insertResults.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      const { type, result: dbResult } = result.value;
      if (dbResult.error) {
        console.error(`❌ Error inserting ${type}:`, dbResult.error);
      } else {
        console.log(`✅ Successfully inserted ${type}:`, dbResult.data?.length, 'records');
      }
    } else {
      console.error(`❌ Promise rejected for insert ${index}:`, result.reason);
    }
  });

  return assessments;
}

async function editContent(payload: any) {
  const { content, prompt, sessionNumber, lectureNumber, lectureTitle } = payload;
  
  console.log('🎯 Starting AI content edit');
  console.log('📝 Edit prompt:', prompt);
  console.log('📄 Content to edit:', JSON.stringify(content, null, 2));

  try {
    // Determine content type and table based on content structure
    let contentType = '';
    let tableName = '';
    let updateField = '';
    
    if ('slide_number' in content) {
      contentType = 'slide';
      tableName = 'lecture_slides';
      updateField = content.title ? 'title' : content.content ? 'content' : 'speaker_notes';
    } else if ('concept_type' in content) {
      contentType = 'flashcard';
      tableName = 'flashcards';
      updateField = content.title ? 'title' : 'content';
    } else if ('question_number' in content) {
      contentType = 'reflection question';
      tableName = 'reflection_questions';
      updateField = 'question_text';
    } else if ('correct_option' in content) {
      contentType = 'multiple choice question';
      tableName = 'multiple_choice_questions';
      updateField = content.question_text ? 'question_text' : 'option_a';
    } else {
      throw new Error('Unknown content type');
    }

    console.log(`🔍 Detected content type: ${contentType}`);
    console.log(`📊 Will update field: ${updateField} in table: ${tableName}`);

    // Create context-aware prompt based on content type
    let systemPrompt = '';
    let userPrompt = '';

    if (contentType === 'slide') {
      systemPrompt = `You are an expert course content editor. You help edit lecture slides to be clear, engaging, and educational. 
      
      When editing slides:
      - Keep content concise and scannable
      - Use bullet points effectively
      - Maintain educational value
      - Consider the lecture context: "${lectureTitle}"
      
      Return ONLY the updated text content, nothing else.`;
      
      const currentText = content[updateField] || '';
      userPrompt = `Current ${updateField}: "${currentText}"
      
      Edit request: "${prompt}"
      
      Please provide the updated ${updateField} content:`;

    } else if (contentType === 'flashcard') {
      systemPrompt = `You are an expert at creating clear, memorable flashcard content for educational purposes.
      
      When editing flashcards:
      - Keep definitions concise but complete
      - Use clear, simple language
      - Ensure accuracy for the subject matter
      - Make it memorable for students
      
      Return ONLY the updated text content, nothing else.`;
      
      const currentText = content[updateField] || '';
      userPrompt = `Current flashcard ${updateField}: "${currentText}"
      
      Edit request: "${prompt}"
      
      Please provide the updated ${updateField} content:`;

    } else if (contentType === 'reflection question') {
      systemPrompt = `You are an expert at creating thoughtful reflection questions that promote deep learning and self-assessment.
      
      When editing reflection questions:
      - Make questions thought-provoking
      - Encourage personal connection to the material
      - Use open-ended phrasing
      - Relate to the lecture: "${lectureTitle}"
      
      Return ONLY the updated question text, nothing else.`;
      
      userPrompt = `Current reflection question: "${content.question_text}"
      
      Edit request: "${prompt}"
      
      Please provide the updated reflection question:`;

    } else if (contentType === 'multiple choice question') {
      systemPrompt = `You are an expert at creating effective multiple choice questions for educational assessments.
      
      When editing MCQ content:
      - Ensure questions test understanding, not just memorization
      - Make distractors plausible but clearly incorrect
      - Keep language clear and unambiguous
      - Maintain appropriate difficulty level
      
      Return ONLY the updated text content, nothing else.`;
      
      const currentText = content[updateField] || '';
      userPrompt = `Current MCQ ${updateField}: "${currentText}"
      
      Edit request: "${prompt}"
      
      Context - Full question: "${content.question_text}"
      Options: A) ${content.option_a} B) ${content.option_b} C) ${content.option_c} D) ${content.option_d}
      Correct: ${content.correct_option}
      
      Please provide the updated ${updateField} content:`;
    }

    // Call OpenAI API
    console.log('🤖 Calling OpenAI API for content editing');
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
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const editedText = data.choices[0].message.content.trim();
    
    console.log('✅ OpenAI response received');
    console.log('📝 Edited content:', editedText);

    // Update the database
    console.log(`💾 Updating ${tableName} table, field: ${updateField}`);
    const { error: updateError } = await supabase
      .from(tableName as any)
      .update({ [updateField]: editedText })
      .eq('id', content.id);

    if (updateError) {
      console.error('❌ Database update error:', updateError);
      throw updateError;
    }

    console.log('✅ Content updated successfully in database');

    return new Response(JSON.stringify({ 
      success: true, 
      editedContent: editedText,
      field: updateField 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Error in editContent:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

async function generateAssessments(payload: any) {
  const { lectureId, lectureTitle, slideContent, sessionNumber, lectureNumber } = payload;

  const result = await generateAssessmentsContent(
    sessionNumber || 1, 
    lectureNumber || 1, 
    lectureTitle, 
    'Assessment Generation'
  );

  return new Response(JSON.stringify({ assessments: result }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}