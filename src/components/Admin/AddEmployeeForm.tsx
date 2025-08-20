import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, UserPlus } from 'lucide-react';

interface AddEmployeeFormProps {
  locationId: string;
  onEmployeeAdded: () => void;
  onCancel: () => void;
}

export const AddEmployeeForm: React.FC<AddEmployeeFormProps> = ({
  locationId,
  onEmployeeAdded,
  onCancel
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    headline: '',
    profile_url: '',
    picture_url: '',
    occupation: '',
    summary: '',
    skills: '',
    industry_name: '',
    geo_location_name: '',
    company_name: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.full_name || !formData.profile_url) {
      toast.error('Full name and profile URL are required');
      return;
    }

    setLoading(true);
    try {
      // First, create the LinkedIn profile
      const { data: profile, error: profileError } = await supabase
        .from('linkedin_profiles')
        .insert([{
          ...formData,
          skills: formData.skills ? formData.skills.split(',').map(s => s.trim()) : []
        }])
        .select()
        .single();

      if (profileError) throw profileError;

      // Then, create the location social mapping
      const { error: mappingError } = await supabase
        .from('location_social_mapping')
        .insert([{
          location_id: locationId,
          linkedin_profile_id: profile.id,
          mapping_type: 'manual_association',
          confidence_score: 1.0,
          notes: 'Added via admin interface'
        }]);

      if (mappingError) throw mappingError;

      toast.success('Employee added successfully');
      onEmployeeAdded();
      
      // Reset form
      setFormData({
        full_name: '',
        headline: '',
        profile_url: '',
        picture_url: '',
        occupation: '',
        summary: '',
        skills: '',
        industry_name: '',
        geo_location_name: '',
        company_name: ''
      });

    } catch (error) {
      console.error('Error adding employee:', error);
      toast.error('Failed to add employee');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Add LinkedIn Employee
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name *</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => handleInputChange('full_name', e.target.value)}
                placeholder="John Doe"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile_url">LinkedIn Profile URL *</Label>
              <Input
                id="profile_url"
                value={formData.profile_url}
                onChange={(e) => handleInputChange('profile_url', e.target.value)}
                placeholder="https://linkedin.com/in/johndoe"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="headline">Headline</Label>
              <Input
                id="headline"
                value={formData.headline}
                onChange={(e) => handleInputChange('headline', e.target.value)}
                placeholder="Software Engineer at Company"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="occupation">Occupation</Label>
              <Input
                id="occupation"
                value={formData.occupation}
                onChange={(e) => handleInputChange('occupation', e.target.value)}
                placeholder="Software Engineer"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company_name">Company Name</Label>
              <Input
                id="company_name"
                value={formData.company_name}
                onChange={(e) => handleInputChange('company_name', e.target.value)}
                placeholder="Tech Corp"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="industry_name">Industry</Label>
              <Input
                id="industry_name"
                value={formData.industry_name}
                onChange={(e) => handleInputChange('industry_name', e.target.value)}
                placeholder="Technology"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="picture_url">Profile Picture URL</Label>
              <Input
                id="picture_url"
                value={formData.picture_url}
                onChange={(e) => handleInputChange('picture_url', e.target.value)}
                placeholder="https://example.com/profile.jpg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="geo_location_name">Location</Label>
              <Input
                id="geo_location_name"
                value={formData.geo_location_name}
                onChange={(e) => handleInputChange('geo_location_name', e.target.value)}
                placeholder="San Francisco, CA"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="skills">Skills (comma-separated)</Label>
            <Input
              id="skills"
              value={formData.skills}
              onChange={(e) => handleInputChange('skills', e.target.value)}
              placeholder="JavaScript, React, Node.js, Python"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="summary">Summary</Label>
            <Textarea
              id="summary"
              value={formData.summary}
              onChange={(e) => handleInputChange('summary', e.target.value)}
              placeholder="Professional summary or bio..."
              rows={4}
            />
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="min-w-[120px]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Adding...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Employee
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};