import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action, carouselId, researchContent, criticalThinkingConcepts, additionalInstructions, carouselName, imagePrompts } = await req.json();

    if (action === 'generate_prompts') {
      // Stage 1: Generate prompts for the 9 images
      const promptGenerationRequest = `
        Generate 9 detailed image prompts for an Instagram carousel targeting software engineers. 
        
        Research Content: ${researchContent}
        Critical Thinking Concepts: ${criticalThinkingConcepts.join(', ')}
        Additional Instructions: ${additionalInstructions || 'None'}
        
        The carousel should follow this flow:
        1. Scroll stopper with witty text that hooks software engineers
        2-3. Present the research findings in an engaging way
        4-5. Transition to "but we need to think critically about this" and show critical thinking concepts
        6-7. Show the outcome of applying critical thinking - a well-architected app design
        8. Show users happily using the app
        9. Call to action: "Learn critical thinking to build better software - link in bio"
        
        Each image should be graphical with text overlays, designed for software engineers. Use tech-related visuals, code snippets, architecture diagrams, etc.
        
        Also generate:
        - Instagram caption text (engaging, technical but accessible)
        - 20-30 relevant hashtags for software engineers
        - Target audience segments within the software engineering world
        
        Return as JSON with this structure:
        {
          "imagePrompts": ["prompt1", "prompt2", ...],
          "captionText": "...",
          "hashtags": ["#softwareengineering", "#coding", ...],
          "targetAudiences": ["Frontend Developers", "Backend Engineers", ...]
        }
      `;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4.1-2025-04-14',
          messages: [
            { role: 'system', content: 'You are an expert at creating engaging social media content for software engineers. Return valid JSON only.' },
            { role: 'user', content: promptGenerationRequest }
          ],
          max_tokens: 2000,
        }),
      });

      const data = await response.json();
      const contentJson = JSON.parse(data.choices[0].message.content);

      // Create carousel record
      const { data: carousel, error: insertError } = await supabase
        .from('instagram_carousels')
        .insert({
          carousel_name: carouselName,
          research_content: researchContent,
          critical_thinking_concepts: criticalThinkingConcepts,
          additional_instructions: additionalInstructions,
          status: 'ready_to_generate',
          image_prompts: contentJson.imagePrompts,
          caption_text: contentJson.captionText,
          hashtags: contentJson.hashtags,
          target_audiences: contentJson.targetAudiences,
          progress: 10
        })
        .select()
        .single();

      if (insertError) throw insertError;

      return new Response(JSON.stringify({
        carouselId: carousel.id,
        imagePrompts: contentJson.imagePrompts,
        captionText: contentJson.captionText,
        hashtags: contentJson.hashtags,
        targetAudiences: contentJson.targetAudiences
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (action === 'generate_images') {
      // Stage 2: Generate images in parallel
      console.log('Starting image generation for carousel:', carouselId);
      
      // Update status to generating
      await supabase
        .from('instagram_carousels')
        .update({ status: 'generating_images', progress: 20 })
        .eq('id', carouselId);

      // Generate all 9 images in parallel
      const imageGenerationPromises = imagePrompts.map(async (prompt: string, index: number) => {
        try {
          console.log(`Generating image ${index + 1}:`, prompt.substring(0, 100));
          
          const response = await fetch('https://api.openai.com/v1/images/generations', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openaiApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'gpt-image-1',
              prompt: `${prompt}. Square format, Instagram carousel style, bold graphics and text overlays, professional but engaging design for software engineers.`,
              n: 1,
              size: '1024x1024',
              quality: 'high',
              output_format: 'png'
            }),
          });

          const data = await response.json();
          
          if (data.error) {
            console.error(`Error generating image ${index + 1}:`, data.error);
            throw new Error(data.error.message);
          }

          // OpenAI gpt-image-1 returns base64 data directly
          const base64Image = data.data[0].b64_json;
          
          // Upload to Supabase storage
          const fileName = `carousel_${carouselId}_image_${index + 1}.png`;
          const imageBuffer = Uint8Array.from(atob(base64Image), c => c.charCodeAt(0));
          
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('generated-images')
            .upload(fileName, imageBuffer, {
              contentType: 'image/png',
              upsert: true
            });

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('generated-images')
            .getPublicUrl(fileName);

          console.log(`Image ${index + 1} generated and uploaded:`, publicUrl);
          
          // Update progress
          const progressPercent = 20 + Math.floor((index + 1) / imagePrompts.length * 70);
          await supabase
            .from('instagram_carousels')
            .update({ progress: progressPercent })
            .eq('id', carouselId);

          return publicUrl;
        } catch (error) {
          console.error(`Failed to generate image ${index + 1}:`, error);
          return null;
        }
      });

      const generatedImages = await Promise.all(imageGenerationPromises);
      
      // Check if all images were generated successfully
      const successfulImages = generatedImages.filter(img => img !== null);
      const allSuccessful = successfulImages.length === imagePrompts.length;

      // Update carousel with results
      await supabase
        .from('instagram_carousels')
        .update({
          status: allSuccessful ? 'completed' : 'failed',
          generated_images: generatedImages,
          progress: allSuccessful ? 100 : 50,
          error_message: allSuccessful ? null : `Failed to generate ${imagePrompts.length - successfulImages.length} images`
        })
        .eq('id', carouselId);

      console.log(`Carousel generation completed. Success: ${allSuccessful}, Images: ${successfulImages.length}/${imagePrompts.length}`);

      return new Response(JSON.stringify({
        success: allSuccessful,
        generatedImages: generatedImages,
        message: allSuccessful 
          ? 'All images generated successfully!' 
          : `Generated ${successfulImages.length}/${imagePrompts.length} images`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-carousel function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});