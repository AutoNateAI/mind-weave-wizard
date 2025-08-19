import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Users, 
  MessageSquare, 
  Link2, 
  Building, 
  Search, 
  Filter,
  ExternalLink,
  Calendar,
  MapPin
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface LinkedInProfile {
  id: string;
  full_name: string;
  linkedin_profile_id: string;
  profile_url: string;
  headline: string | null;
  location: string | null;
  summary: string | null;
  first_name: string | null;
  last_name: string | null;
  occupation: string | null;
  created_at: string;
  company_name?: string;
  office_address?: string;
  company_city?: string;
  company_state?: string;
}

interface SocialAccount {
  id: string;
  platform: string;
  is_connected: boolean;
}

export function LeadsAnalytics() {
  const [profiles, setProfiles] = useState<LinkedInProfile[]>([]);
  const [filteredProfiles, setFilteredProfiles] = useState<LinkedInProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [companyFilter, setCompanyFilter] = useState<string>('all');
  const [socialAccounts, setSocialAccounts] = useState<SocialAccount[]>([]);
  const [linkedinPosts, setLinkedinPosts] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Filter profiles based on search and company filter
    let filtered = profiles;

    if (searchTerm) {
      filtered = filtered.filter(profile => 
        profile.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        profile.headline?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        profile.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        profile.location?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (companyFilter !== 'all') {
      if (companyFilter === 'no-company') {
        filtered = filtered.filter(profile => !profile.company_name);
      } else {
        filtered = filtered.filter(profile => profile.company_name === companyFilter);
      }
    }

    setFilteredProfiles(filtered);
  }, [profiles, searchTerm, companyFilter]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load LinkedIn profiles with company information
      const { data: profilesData, error: profilesError } = await supabase
        .from('linkedin_profiles')
        .select(`
          id,
          full_name,
          linkedin_profile_id,
          profile_url,
          headline,
          location,
          summary,
          first_name,
          last_name,
          occupation,
          created_at,
          location_social_mapping!linkedin_profile_id (
            targeted_locations (
              company_name,
              office_address,
              city,
              state
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Transform the data to flatten company information
      const transformedProfiles = (profilesData || []).map(profile => ({
        ...profile,
        company_name: profile.location_social_mapping?.[0]?.targeted_locations?.company_name || null,
        office_address: profile.location_social_mapping?.[0]?.targeted_locations?.office_address || null,
        company_city: profile.location_social_mapping?.[0]?.targeted_locations?.city || null,
        company_state: profile.location_social_mapping?.[0]?.targeted_locations?.state || null,
      }));

      setProfiles(transformedProfiles);

      // Load social accounts
      const { data: accountsData, error: accountsError } = await supabase
        .from('social_accounts')
        .select('id, platform, is_connected');

      if (accountsError) throw accountsError;
      setSocialAccounts(accountsData || []);

      // Load LinkedIn posts count
      const { count: postsCount, error: postsError } = await supabase
        .from('linkedin_posts')
        .select('*', { count: 'exact', head: true });

      if (postsError) throw postsError;
      setLinkedinPosts(postsCount || 0);

    } catch (error) {
      console.error('Error loading leads data:', error);
      toast.error('Failed to load leads data');
    } finally {
      setLoading(false);
    }
  };

  const getUniqueCompanies = () => {
    const companies = profiles
      .filter(profile => profile.company_name)
      .map(profile => profile.company_name!)
      .filter((company, index, arr) => arr.indexOf(company) === index)
      .sort();
    return companies;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const connectedAccounts = socialAccounts.filter(a => a.is_connected).length;

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
                  <div className="h-8 bg-muted rounded w-1/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Profiles</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profiles.length}</div>
            <p className="text-xs text-muted-foreground">
              LinkedIn profiles uploaded
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{linkedinPosts}</div>
            <p className="text-xs text-muted-foreground">LinkedIn posts analyzed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Connected Accounts</CardTitle>
            <Link2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{connectedAccounts}</div>
            <p className="text-xs text-muted-foreground">Active social accounts</p>
          </CardContent>
        </Card>
      </div>

      {/* Leads Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Uploaded Leads
            </CardTitle>
            <Badge variant="secondary">{filteredProfiles.length} of {profiles.length}</Badge>
          </div>
          
          {/* Filters */}
          <div className="flex gap-4 mt-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, company, title, or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={companyFilter} onValueChange={setCompanyFilter}>
              <SelectTrigger className="w-64">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by company" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Companies</SelectItem>
                <SelectItem value="no-company">No Company</SelectItem>
                {getUniqueCompanies().map((company) => (
                  <SelectItem key={company} value={company}>
                    {company}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredProfiles.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {profiles.length === 0 
                    ? "No leads uploaded yet. Start by adding individual profiles or uploading Apify data."
                    : "No leads match your current filters."
                  }
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredProfiles.map((profile) => (
                  <div key={profile.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div>
                            <h3 className="font-semibold text-lg">{profile.full_name}</h3>
                            {profile.headline && (
                              <p className="text-muted-foreground">{profile.headline}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              <div className="w-3 h-3 bg-blue-600 rounded mr-1"></div>
                              LinkedIn
                            </Badge>
                            {profile.company_name && (
                              <Badge variant="secondary" className="text-xs">
                                <Building className="w-3 h-3 mr-1" />
                                {profile.company_name}
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div className="space-y-1">
                            {profile.location && (
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <MapPin className="h-4 w-4" />
                                <span>{profile.location}</span>
                              </div>
                            )}
                            {profile.company_name && profile.office_address && (
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Building className="h-4 w-4" />
                                <span>{profile.office_address}</span>
                                {profile.company_city && profile.company_state && (
                                  <span className="text-xs">
                                    ({profile.company_city}, {profile.company_state})
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              <span>Added {formatDate(profile.created_at)}</span>
                            </div>
                            {profile.linkedin_profile_id && (
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <span className="text-xs">ID: {profile.linkedin_profile_id}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {profile.summary && (
                          <div className="mt-3 pt-3 border-t">
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {profile.summary}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(profile.profile_url, '_blank')}
                          className="gap-2"
                        >
                          <ExternalLink className="h-4 w-4" />
                          View Profile
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}