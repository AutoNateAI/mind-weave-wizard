import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { batch_name, data_source, file_name, data } = await req.json();

    if (!batch_name || !data_source || !Array.isArray(data)) {
      return new Response(
        JSON.stringify({ error: 'Invalid request data' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create upload batch record
    const { data: batchData, error: batchError } = await supabaseClient
      .from('upload_batches')
      .insert([{
        batch_name,
        data_source,
        file_name,
        total_records: data.length,
        status: 'processing'
      }])
      .select()
      .single();

    if (batchError) {
      console.error('Error creating batch:', batchError);
      throw batchError;
    }

    const batchId = batchData.id;
    let processedCount = 0;
    let failedCount = 0;
    const errors: any[] = [];

    // Process data based on source type
    for (const item of data) {
      try {
        if (data_source === 'apify_people_search' || data_source === 'apify_profile_scraper') {
          // Process LinkedIn profile data
          const profileData = {
            linkedin_profile_id: item.id || item.profileId,
            public_id: item.publicId || item.publicIdentifier,
            first_name: item.firstName,
            last_name: item.lastName,
            full_name: item.fullName || `${item.firstName || ''} ${item.lastName || ''}`.trim(),
            headline: item.headline || item.occupation,
            occupation: item.occupation || item.headline,
            location: item.location || item.geoLocationName,
            profile_url: item.profileUrl,
            picture_url: item.pictureUrl,
            cover_image_url: item.coverImageUrl,
            country_code: item.countryCode,
            geo_location_name: item.geoLocationName,
            company_name: item.companyName,
            company_linkedin_url: item.companyLinkedinUrl,
            industry_name: item.industryName,
            summary: item.summary,
            positions: item.positions || [],
            educations: item.educations || [],
            skills: item.skills || [],
            languages: item.languages || [],
            certifications: item.certifications || [],
            raw_data: item,
            upload_batch_id: batchId
          };

          const { error } = await supabaseClient
            .from('linkedin_profiles')
            .upsert([profileData], {
              onConflict: 'linkedin_profile_id'
            });

          if (error) throw error;

        } else if (data_source === 'apify_post_scraper') {
          // Process LinkedIn post data
          const postData = {
            linkedin_post_urn: item.urn,
            text_content: item.text,
            post_url: item.url,
            posted_at_timestamp: item.postedAtTimestamp,
            posted_at_iso: item.postedAtISO ? new Date(item.postedAtISO).toISOString() : null,
            time_since_posted: item.timeSincePosted,
            is_repost: item.isRepost || false,
            author_type: item.authorType,
            author_profile_url: item.authorProfileUrl,
            author_profile_id: item.authorProfileId,
            author_full_name: item.authorFullName,
            author_headline: item.authorHeadline,
            post_type: item.type,
            images: item.images || [],
            num_likes: item.numLikes || 0,
            num_comments: item.numComments || 0,
            num_shares: item.numShares || 0,
            reactions: item.reactions || [],
            comments: item.comments || [],
            raw_data: item,
            upload_batch_id: batchId
          };

          const { error } = await supabaseClient
            .from('linkedin_posts')
            .upsert([postData], {
              onConflict: 'linkedin_post_urn'
            });

          if (error) throw error;
        }

        processedCount++;
      } catch (error) {
        console.error('Error processing item:', error);
        failedCount++;
        errors.push({
          item: item,
          error: error.message
        });
      }
    }

    // Update batch with final status
    const finalStatus = failedCount === 0 ? 'completed' : 
                       processedCount === 0 ? 'failed' : 'completed';

    await supabaseClient
      .from('upload_batches')
      .update({
        processed_records: processedCount,
        failed_records: failedCount,
        status: finalStatus,
        error_log: errors
      })
      .eq('id', batchId);

    return new Response(
      JSON.stringify({
        batch_id: batchId,
        total_records: data.length,
        processed_records: processedCount,
        failed_records: failedCount,
        status: finalStatus
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in process-apify-upload function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});