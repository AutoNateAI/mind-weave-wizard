import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trash2, MapPin, Plus, Filter, X, Building, Users, Eye, EyeOff, Network, Settings, Search, UserPlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';
import { LocationsGraph } from './LocationsGraph';
import { HeatmapControls } from './HeatmapControls';
import { AnalyticsDashboard } from './AnalyticsDashboard';
import { QuickAnalysis } from './QuickAnalysis';

interface TargetedLocation {
  id: string;
  company_name: string;
  office_address: string;
  latitude: number | null;
  longitude: number | null;
  city: string | null;
  state: string | null;
  country: string;
  notes: string | null;
  is_active: boolean;
  created_at: string;
}

interface LinkedInProfile {
  id: string;
  full_name: string;
  headline: string | null;
  profile_url: string;
  picture_url: string | null;
}

interface CompanyData {
  id: string;
  company_name: string;
  latitude: number | null;
  longitude: number | null;
  profile_count: number;
  profiles: LinkedInProfile[];
}

export function LocationsTab() {
  const { theme } = useTheme();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const profileMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const [locations, setLocations] = useState<TargetedLocation[]>([]);
  const [companiesData, setCompaniesData] = useState<CompanyData[]>([]);
  const [visibleCompanies, setVisibleCompanies] = useState<Set<string>>(new Set());
  const [selectedLocation, setSelectedLocation] = useState<TargetedLocation | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [editFormData, setEditFormData] = useState({
    company_name: '',
    office_address: '',
    city: '',
    state: '',
    country: 'US',
    notes: ''
  });
  const [mapboxToken, setMapboxToken] = useState<string>('');
  const [formData, setFormData] = useState({
    company_name: '',
    office_address: '',
    city: '',
    state: '',
    country: 'US',
    notes: ''
  });
  const [showNetworkModal, setShowNetworkModal] = useState(false);
  const [locationSearchQuery, setLocationSearchQuery] = useState('');
  const [selectedProfile, setSelectedProfile] = useState<LinkedInProfile | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileFormData, setProfileFormData] = useState({
    full_name: '',
    headline: '',
    profile_url: '',
    picture_url: ''
  });
  const [activeControlsTab, setActiveControlsTab] = useState<'network' | 'locations' | 'heatmap'>('locations');
  const [activeHeatmapLayer, setActiveHeatmapLayer] = useState<string>('none');
  const [showControlsModal, setShowControlsModal] = useState(false);
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [employeeFormData, setEmployeeFormData] = useState({
    full_name: '',
    headline: '',
    profile_url: '',
    picture_url: ''
  });

  // Initialize map and load locations
  useEffect(() => {
    loadMapboxToken();
    loadLocations();
  }, []);

  // Load companies data with LinkedIn profiles
  useEffect(() => {
    loadCompaniesData();
  }, []);

  // Update markers when companies data changes
  useEffect(() => {
    if (map.current && map.current.isStyleLoaded()) {
      addNetworkMarkersToMap();
    }
  }, [companiesData, visibleCompanies]);

  const loadCompaniesData = async () => {
    try {
      // Get companies with their LinkedIn profiles
      const { data, error } = await supabase
        .from('targeted_locations')
        .select(`
          id,
          company_name,
          latitude,
          longitude,
          location_social_mapping!location_id (
            linkedin_profile_id,
            linkedin_profiles!linkedin_profile_id (
              id,
              full_name,
              headline,
              profile_url,
              picture_url
            )
          )
        `)
        .eq('is_active', true);

      if (error) throw error;

      // Transform the data
      const companiesWithProfiles = (data || [])
        .map(company => {
          const profiles = company.location_social_mapping
            .map(mapping => mapping.linkedin_profiles)
            .filter(profile => profile !== null)
            .flat();

          return {
            id: company.id,
            company_name: company.company_name,
            latitude: company.latitude,
            longitude: company.longitude,
            profile_count: profiles.length,
            profiles: profiles
          };
        })
        .filter(company => company.profile_count > 0 && company.latitude && company.longitude);

      setCompaniesData(companiesWithProfiles);
      
      // Initially show all companies
      const allCompanyIds = new Set(companiesWithProfiles.map(c => c.id));
      setVisibleCompanies(allCompanyIds);

    } catch (error) {
      console.error('Error loading companies data:', error);
      toast.error('Failed to load companies data');
    }
  };

  const addNetworkMarkersToMap = () => {
    if (!map.current) return;

    // Clear existing profile markers
    profileMarkersRef.current.forEach(marker => marker.remove());
    profileMarkersRef.current = [];

    // Clear existing connection lines
    if (map.current.getLayer('connections')) {
      map.current.removeLayer('connections');
    }
    if (map.current.getSource('connections')) {
      map.current.removeSource('connections');
    }

    // Create connection lines data
    const connectionLines: any[] = [];

    companiesData.forEach(company => {
      if (!visibleCompanies.has(company.id) || !company.latitude || !company.longitude) return;

      // Add profile markers around the company
      company.profiles.forEach((profile, index) => {
        const angle = (index / company.profiles.length) * 2 * Math.PI;
        const radius = 0.002; // Small radius for nearby placement
        const profileLat = company.latitude! + Math.cos(angle) * radius;
        const profileLng = company.longitude! + Math.sin(angle) * radius;

        // Create profile marker
        const profileEl = document.createElement('div');
        profileEl.className = 'profile-marker';
        const borderColor = theme === 'dark' ? '#1f2937' : 'white';
        
        if (profile.picture_url) {
          // Use profile image
          profileEl.style.cssText = `
            width: 28px;
            height: 28px;
            border: 2px solid ${borderColor};
            border-radius: 50%;
            cursor: pointer;
            box-shadow: 0 2px 8px rgba(59, 130, 246, 0.4);
            background-image: url('${profile.picture_url}');
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
          `;
        } else {
          // Use initials fallback
          profileEl.style.cssText = `
            width: 24px;
            height: 24px;
            background: linear-gradient(135deg, #3b82f6, #1d4ed8);
            border: 2px solid ${borderColor};
            border-radius: 50%;
            cursor: pointer;
            box-shadow: 0 2px 8px rgba(59, 130, 246, 0.4);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
            color: white;
            font-weight: bold;
          `;
          profileEl.textContent = profile.full_name.charAt(0);
        }

        const profileMarker = new mapboxgl.Marker({ element: profileEl })
          .setLngLat([profileLng, profileLat])
          .addTo(map.current!);

        // Add click handler to open custom modal
        profileEl.addEventListener('click', () => {
          setSelectedProfile(profile);
          setProfileFormData({
            full_name: profile.full_name,
            headline: profile.headline || '',
            profile_url: profile.profile_url,
            picture_url: profile.picture_url || ''
          });
          setShowProfileModal(true);
        });
        profileMarkersRef.current.push(profileMarker);

        // Add connection line data
        connectionLines.push({
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: [
              [company.longitude, company.latitude],
              [profileLng, profileLat]
            ]
          }
        });
      });
    });

    // Add connection lines to map
    if (connectionLines.length > 0) {
      map.current.addSource('connections', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: connectionLines
        }
      });

      map.current.addLayer({
        id: 'connections',
        type: 'line',
        source: 'connections',
        layout: {},
        paint: {
          'line-color': theme === 'dark' ? '#9ca3af' : '#6b7280',
          'line-width': 1,
          'line-opacity': theme === 'dark' ? 0.8 : 0.6
        }
      });
    }
  };

  const toggleCompanyVisibility = (companyId: string) => {
    setVisibleCompanies(prev => {
      const newSet = new Set(prev);
      if (newSet.has(companyId)) {
        newSet.delete(companyId);
      } else {
        newSet.add(companyId);
      }
      return newSet;
    });
  };

  const toggleAllCompanies = (show: boolean) => {
    if (show) {
      setVisibleCompanies(new Set(companiesData.map(c => c.id)));
    } else {
      setVisibleCompanies(new Set());
    }
  };

  // Initialize map when token is available
  useEffect(() => {
    if (mapboxToken && mapContainer.current && !map.current) {
      mapboxgl.accessToken = mapboxToken;
      
      const mapStyle = theme === 'dark' 
        ? 'mapbox://styles/mapbox/dark-v11' 
        : 'mapbox://styles/mapbox/light-v11';
      
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: mapStyle,
        center: [-98.5, 39.8], // Center of US
        zoom: 4
      });

      map.current.addControl(new mapboxgl.NavigationControl());

      // Add markers after map is loaded
      map.current.on('load', () => {
        addMarkersToMap();
        addNetworkMarkersToMap();
      });
    }
  }, [mapboxToken, theme]);

  // Update map style when theme changes
  useEffect(() => {
    if (map.current && mapboxToken) {
      const mapStyle = theme === 'dark' 
        ? 'mapbox://styles/mapbox/dark-v11' 
        : 'mapbox://styles/mapbox/light-v11';
      
      map.current.setStyle(mapStyle);
      
      // Re-add markers and connections after style loads
      map.current.once('styledata', () => {
        addMarkersToMap();
        addNetworkMarkersToMap();
      });
    }
  }, [theme]);

  // Add markers when locations change
  useEffect(() => {
    if (map.current && map.current.isStyleLoaded()) {
      addMarkersToMap();
    }
  }, [locations]);

  // Ensure markers are added when both map and locations are ready
  useEffect(() => {
    if (map.current && locations.length > 0) {
      // Check if map is loaded, if not wait for it
      if (map.current.isStyleLoaded()) {
        addMarkersToMap();
      } else {
        map.current.on('load', () => {
          addMarkersToMap();
        });
      }
    }
  }, [locations, mapboxToken]);

  const addMarkersToMap = () => {
    if (!map.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add new markers
    locations.forEach(location => {
      if (location.latitude && location.longitude) {
        const marker = new mapboxgl.Marker({
          color: location.is_active ? '#3b82f6' : '#6b7280'
        })
          .setLngLat([location.longitude, location.latitude])
          .addTo(map.current!);

        marker.getElement().addEventListener('click', () => {
          setSelectedLocation(location);
          setShowLocationModal(true);
        });

        // Add cursor pointer on hover
        marker.getElement().style.cursor = 'pointer';

        markersRef.current.push(marker);
      }
    });
  };

  const loadMapboxToken = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('get-mapbox-token');
      if (error) throw error;
      setMapboxToken(data.token);
    } catch (error) {
      console.error('Error loading Mapbox token:', error);
      toast.error('Failed to load map. Please check Mapbox configuration.');
    }
  };

  const loadLocations = async () => {
    try {
      const { data, error } = await supabase
        .from('targeted_locations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLocations(data || []);
    } catch (error) {
      console.error('Error loading locations:', error);
      toast.error('Failed to load locations');
    }
  };

  const geocodeAddress = async (address: string) => {
    if (!mapboxToken) return null;
    
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${mapboxToken}&limit=1`
      );
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const [longitude, latitude] = data.features[0].center;
        return { latitude, longitude };
      }
      return null;
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  };

  const handleAddLocation = async () => {
    if (!formData.company_name || !formData.office_address) {
      toast.error('Company name and office address are required');
      return;
    }

    try {
      // Geocode the address
      const coordinates = await geocodeAddress(formData.office_address);
      
      const { data, error } = await supabase
        .from('targeted_locations')
        .insert([{
          ...formData,
          latitude: coordinates?.latitude || null,
          longitude: coordinates?.longitude || null,
          created_by: (await supabase.auth.getUser()).data.user?.id
        }])
        .select()
        .single();

      if (error) throw error;

      setLocations(prev => [data, ...prev]);
      // Reload companies data to update LinkedIn profiles network
      loadCompaniesData();
      setFormData({
        company_name: '',
        office_address: '',
        city: '',
        state: '',
        country: 'US',
        notes: ''
      });
      setShowAddForm(false);
      toast.success('Location added successfully');

      // Zoom to new location if coordinates available
      if (coordinates && map.current) {
        map.current.flyTo({
          center: [coordinates.longitude, coordinates.latitude],
          zoom: 14
        });
      }
    } catch (error) {
      console.error('Error adding location:', error);
      toast.error('Failed to add location');
    }
  };

  const handleUpdateLocation = async () => {
    if (!selectedLocation || !editFormData.company_name || !editFormData.office_address) {
      toast.error('Company name and office address are required');
      return;
    }

    try {
      // Geocode the address if it changed
      let coordinates = null;
      if (editFormData.office_address !== selectedLocation.office_address) {
        coordinates = await geocodeAddress(editFormData.office_address);
      }

      const { data, error } = await supabase
        .from('targeted_locations')
        .update({
          ...editFormData,
          latitude: coordinates?.latitude || selectedLocation.latitude,
          longitude: coordinates?.longitude || selectedLocation.longitude,
        })
        .eq('id', selectedLocation.id)
        .select()
        .single();

      if (error) throw error;

      setLocations(prev => prev.map(loc => loc.id === selectedLocation.id ? data : loc));
      setSelectedLocation(data);
      setIsEditingLocation(false);
      toast.success('Location updated successfully');

      // Navigate to updated location if coordinates changed
      if (coordinates && map.current) {
        map.current.flyTo({
          center: [coordinates.longitude, coordinates.latitude],
          zoom: 14
        });
      }
    } catch (error) {
      console.error('Error updating location:', error);
      toast.error('Failed to update location');
    }
  };

  const handleDeleteLocation = async (id: string) => {
    try {
      const { error } = await supabase
        .from('targeted_locations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setLocations(prev => prev.filter(loc => loc.id !== id));
      if (selectedLocation?.id === id) {
        setSelectedLocation(null);
      }
      toast.success('Location deleted successfully');
    } catch (error) {
      console.error('Error deleting location:', error);
      toast.error('Failed to delete location');
    }
  };

  // Filter locations based on search query
  const filteredLocations = locations.filter(location => 
    location.company_name.toLowerCase().includes(locationSearchQuery.toLowerCase()) ||
    location.office_address.toLowerCase().includes(locationSearchQuery.toLowerCase()) ||
    (location.city && location.city.toLowerCase().includes(locationSearchQuery.toLowerCase())) ||
    (location.state && location.state.toLowerCase().includes(locationSearchQuery.toLowerCase())) ||
    (location.notes && location.notes.toLowerCase().includes(locationSearchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Location Targeting</h2>
          <p className="text-muted-foreground">
            Manage office addresses and geographic targeting zones for your social media campaigns.
          </p>
        </div>
        <Button onClick={() => setShowAddForm(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Location
        </Button>
      </div>

      {/* Full Width Map */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Interactive Map
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div 
            ref={mapContainer} 
            className="w-full rounded-lg border"
            style={{ height: '100vh' }}
          />
          {!mapboxToken && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
              <p className="text-gray-600">Loading map...</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Location Form Modal */}
      <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Location</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="company_name">Company Name *</Label>
              <Input
                id="company_name"
                value={formData.company_name}
                onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
                placeholder="Enter company name"
              />
            </div>
            <div>
              <Label htmlFor="office_address">Office Address *</Label>
              <Input
                id="office_address"
                value={formData.office_address}
                onChange={(e) => setFormData(prev => ({ ...prev, office_address: e.target.value }))}
                placeholder="123 Main St, City, State, ZIP"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  placeholder="City"
                />
              </div>
              <div>
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                  placeholder="State"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional notes about this location"
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddLocation} className="flex-1">
                Add Location
              </Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Floating Controls Button - Legacy */}
      {companiesData.length > 0 && (
        <Button
          onClick={() => setShowControlsModal(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 z-50"
          size="icon"
        >
          <Settings className="h-6 w-6" />
        </Button>
      )}

      {/* Controls Modal with Tabs */}
      <Dialog open={showControlsModal} onOpenChange={setShowControlsModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Map Controls
            </DialogTitle>
          </DialogHeader>
          
          {/* Tabs */}
          <div className="flex space-x-1 border-b">
            <button
              onClick={() => setActiveControlsTab('locations')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeControlsTab === 'locations'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <MapPin className="h-4 w-4 inline mr-2" />
              Targeted Locations
            </button>
            <button
              onClick={() => setActiveControlsTab('heatmap')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeControlsTab === 'heatmap'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Eye className="h-4 w-4 inline mr-2" />
              Heat Map Controls
            </button>
            <button
              onClick={() => setActiveControlsTab('network')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeControlsTab === 'network'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Network className="h-4 w-4 inline mr-2" />
              LinkedIn Network
            </button>
          </div>

          <div className="mt-4 overflow-y-auto max-h-[60vh] pr-2">
            {activeControlsTab === 'locations' ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Targeted Locations</Label>
                  <Badge variant="secondary" className="text-xs">
                    {filteredLocations.length} locations
                  </Badge>
                </div>
                
                {/* Search Input */}
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search locations..."
                    value={locationSearchQuery}
                    onChange={(e) => setLocationSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <div className="space-y-3 max-h-64 overflow-y-auto scrollbar-hide">
                  {filteredLocations.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">
                      {locationSearchQuery ? 'No locations match your search.' : 'No locations added yet. Click "Add Location" to get started.'}
                    </p>
                  ) : (
                    filteredLocations.map((location) => (
                      <div
                        key={location.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedLocation?.id === location.id
                            ? 'border-primary bg-primary/5'
                            : 'hover:bg-muted/50'
                         }`}
                        onClick={() => {
                          setSelectedLocation(location);
                          setShowNetworkModal(false); // Close modal to see navigation animation
                          // Navigate map to location
                          if (location.latitude && location.longitude && map.current) {
                            map.current.flyTo({
                              center: [location.longitude, location.latitude],
                              zoom: 14,
                              duration: 2000
                            });
                          }
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium">{location.company_name}</h4>
                            <p className="text-sm text-muted-foreground">{location.office_address}</p>
                            {location.notes && (
                              <div className="text-xs text-muted-foreground mt-1 space-y-1">
                                {location.notes.split('\n\n').filter(note => note.trim()).map((note, index) => (
                                  <div key={index} className="flex items-start gap-1">
                                    <span className="mt-1">•</span>
                                    <span>{note.trim()}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant={location.is_active ? 'default' : 'secondary'} className="text-xs">
                                {location.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                              {location.latitude && location.longitude && (
                                <Badge variant="outline" className="text-xs">
                                  Geocoded
                                </Badge>
                              )}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteLocation(location.id);
                            }}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : activeControlsTab === 'heatmap' ? (
              <div className="space-y-4">
                <QuickAnalysis />
                <HeatmapControls 
                  activeLayer={activeHeatmapLayer}
                  onLayerChange={setActiveHeatmapLayer}
                  compact={true}
                />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Show All</Label>
                    <p className="text-xs text-muted-foreground">
                      Toggle all companies
                    </p>
                  </div>
                  <Switch
                    checked={visibleCompanies.size === companiesData.length}
                    onCheckedChange={toggleAllCompanies}
                  />
                </div>
                
                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-sm font-medium">Companies</Label>
                    <Badge variant="secondary" className="text-xs">
                      {visibleCompanies.size}/{companiesData.length}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-hide">
                    {companiesData.map((company) => (
                      <div key={company.id} className="flex items-center justify-between p-2 rounded border">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">
                            {company.company_name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {company.profile_count} profiles
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => toggleCompanyVisibility(company.id)}
                          className="ml-2 p-1 h-auto"
                        >
                          {visibleCompanies.has(company.id) ? (
                            <Eye className="h-4 w-4" />
                          ) : (
                            <EyeOff className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t">
                  <div className="text-xs text-muted-foreground">
                    LinkedIn profiles appear as small blue circles around company markers on the map. 
                    Click any profile circle to view details and access their LinkedIn page.
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* LinkedIn Profile Modal */}
      <Dialog open={showProfileModal} onOpenChange={(open) => {
        setShowProfileModal(open);
        if (!open) {
          setIsEditingProfile(false);
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {isEditingProfile ? 'Edit Profile' : selectedProfile?.full_name}
            </DialogTitle>
          </DialogHeader>
          {selectedProfile && (
            <div className="space-y-4">
              {isEditingProfile ? (
                // Edit Form
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="profile_full_name">Full Name *</Label>
                    <Input
                      id="profile_full_name"
                      value={profileFormData.full_name}
                      onChange={(e) => setProfileFormData(prev => ({ ...prev, full_name: e.target.value }))}
                      placeholder="Enter full name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="profile_headline">Headline</Label>
                    <Input
                      id="profile_headline"
                      value={profileFormData.headline}
                      onChange={(e) => setProfileFormData(prev => ({ ...prev, headline: e.target.value }))}
                      placeholder="Professional headline"
                    />
                  </div>
                  <div>
                    <Label htmlFor="profile_url">LinkedIn Profile URL *</Label>
                    <Input
                      id="profile_url"
                      value={profileFormData.profile_url}
                      onChange={(e) => setProfileFormData(prev => ({ ...prev, profile_url: e.target.value }))}
                      placeholder="https://linkedin.com/in/username"
                    />
                  </div>
                  <div>
                    <Label htmlFor="profile_picture_url">Profile Picture URL</Label>
                    <Input
                      id="profile_picture_url"
                      value={profileFormData.picture_url}
                      onChange={(e) => setProfileFormData(prev => ({ ...prev, picture_url: e.target.value }))}
                      placeholder="https://example.com/profile-image.jpg"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={async () => {
                        try {
                          const { error } = await supabase
                            .from('linkedin_profiles')
                            .update({
                              full_name: profileFormData.full_name,
                              headline: profileFormData.headline || null,
                              profile_url: profileFormData.profile_url,
                              picture_url: profileFormData.picture_url || null
                            })
                            .eq('id', selectedProfile.id);

                          if (error) throw error;

                          setIsEditingProfile(false);
                          toast.success('Profile updated successfully');
                          loadCompaniesData(); // Refresh data
                        } catch (error) {
                          console.error('Error updating profile:', error);
                          toast.error('Failed to update profile');
                        }
                      }}
                      className="flex-1"
                    >
                      Save Changes
                    </Button>
                    <Button variant="outline" onClick={() => setIsEditingProfile(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                // View Mode
                <>
                  {/* Profile Image */}
                  <div className="flex justify-center">
                    {selectedProfile.picture_url ? (
                      <img 
                        src={selectedProfile.picture_url} 
                        alt={selectedProfile.full_name}
                        className="w-20 h-20 rounded-full border-2 border-border object-cover"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white text-2xl font-bold">
                        {selectedProfile.full_name.charAt(0)}
                      </div>
                    )}
                  </div>

                  <div className="text-center space-y-2">
                    <h3 className="font-semibold text-lg">{selectedProfile.full_name}</h3>
                    {selectedProfile.headline && (
                      <p className="text-muted-foreground text-sm">{selectedProfile.headline}</p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-1">LinkedIn Profile</h4>
                      <a 
                        href={selectedProfile.profile_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline text-sm break-all"
                      >
                        {selectedProfile.profile_url}
                      </a>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      onClick={() => setIsEditingProfile(true)}
                      className="flex-1"
                    >
                      Edit Profile
                    </Button>
                    <Button 
                      variant="destructive"
                      onClick={async () => {
                        try {
                          const { error } = await supabase
                            .from('linkedin_profiles')
                            .delete()
                            .eq('id', selectedProfile.id);

                          if (error) throw error;

                          setShowProfileModal(false);
                          toast.success('Profile deleted successfully');
                          loadCompaniesData(); // Refresh data
                        } catch (error) {
                          console.error('Error deleting profile:', error);
                          toast.error('Failed to delete profile');
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Location Details Modal */}
      <Dialog open={showLocationModal} onOpenChange={(open) => {
        setShowLocationModal(open);
        if (!open) {
          setIsEditingLocation(false);
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              {isEditingLocation ? 'Edit Location' : selectedLocation?.company_name}
            </DialogTitle>
          </DialogHeader>
          {selectedLocation && (
            <div className="space-y-4">
              {isEditingLocation ? (
                // Edit Form
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="edit_company_name">Company Name *</Label>
                    <Input
                      id="edit_company_name"
                      value={editFormData.company_name}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, company_name: e.target.value }))}
                      placeholder="Enter company name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit_office_address">Office Address *</Label>
                    <Input
                      id="edit_office_address"
                      value={editFormData.office_address}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, office_address: e.target.value }))}
                      placeholder="123 Main St, City, State, ZIP"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="edit_city">City</Label>
                      <Input
                        id="edit_city"
                        value={editFormData.city}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, city: e.target.value }))}
                        placeholder="City"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit_state">State</Label>
                      <Input
                        id="edit_state"
                        value={editFormData.state}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, state: e.target.value }))}
                        placeholder="State"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="edit_notes">Notes</Label>
                    <Textarea
                      id="edit_notes"
                      value={editFormData.notes}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Additional notes about this location"
                      rows={3}
                    />
                  </div>
                </div>
              ) : (
                // View Mode
                <>
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">Address</h4>
                    <p>{selectedLocation.office_address}</p>
                  </div>
                  
                  {(selectedLocation.city || selectedLocation.state) && (
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-1">Location</h4>
                      <p>{[selectedLocation.city, selectedLocation.state, selectedLocation.country].filter(Boolean).join(', ')}</p>
                    </div>
                  )}

                  {selectedLocation.latitude && selectedLocation.longitude && (
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-1">Coordinates</h4>
                      <p className="font-mono text-sm">
                        {selectedLocation.latitude.toFixed(6)}, {selectedLocation.longitude.toFixed(6)}
                      </p>
                    </div>
                  )}

                  {selectedLocation.notes && (
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-1">Notes</h4>
                      <div className="space-y-1">
                        {selectedLocation.notes.split('\n\n').filter(note => note.trim()).map((note, index) => (
                          <div key={index} className="flex items-start gap-2">
                            <span className="text-muted-foreground mt-1">•</span>
                            <p className="text-sm">{note.trim()}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Badge variant={selectedLocation.is_active ? 'default' : 'secondary'}>
                      {selectedLocation.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    {selectedLocation.latitude && selectedLocation.longitude && (
                      <Badge variant="outline">
                        Geocoded
                      </Badge>
                    )}
                  </div>
                </>
              )}

              <div className="flex justify-between pt-4 border-t">
                {isEditingLocation ? (
                  <div className="flex gap-2 ml-auto">
                    <Button variant="outline" onClick={() => setIsEditingLocation(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleUpdateLocation}>
                      Save Changes
                    </Button>
                  </div>
                ) : (
                  <div className="flex justify-between w-full">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setEditFormData({
                            company_name: selectedLocation.company_name,
                            office_address: selectedLocation.office_address,
                            city: selectedLocation.city || '',
                            state: selectedLocation.state || '',
                            country: selectedLocation.country,
                            notes: selectedLocation.notes || ''
                          });
                          setIsEditingLocation(true);
                        }}
                      >
                        Edit Location
                      </Button>
                      <Button
                        variant="outline" 
                        onClick={() => setShowAddEmployee(true)}
                        className="gap-2"
                      >
                        <UserPlus className="h-4 w-4" />
                        Add Employee
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="destructive"
                        onClick={() => {
                          handleDeleteLocation(selectedLocation.id);
                          setShowLocationModal(false);
                        }}
                        className="gap-2"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setShowLocationModal(false)}
                      >
                        Close
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Employee Modal */}
      <Dialog open={showAddEmployee} onOpenChange={setShowAddEmployee}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Add Employee to {selectedLocation?.company_name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="employee_full_name">Full Name *</Label>
              <Input
                id="employee_full_name"
                value={employeeFormData.full_name}
                onChange={(e) => setEmployeeFormData(prev => ({ ...prev, full_name: e.target.value }))}
                placeholder="Enter full name"
              />
            </div>
            <div>
              <Label htmlFor="employee_headline">Headline</Label>
              <Input
                id="employee_headline"
                value={employeeFormData.headline}
                onChange={(e) => setEmployeeFormData(prev => ({ ...prev, headline: e.target.value }))}
                placeholder="Professional headline"
              />
            </div>
            <div>
              <Label htmlFor="employee_profile_url">LinkedIn Profile URL *</Label>
              <Input
                id="employee_profile_url"
                value={employeeFormData.profile_url}
                onChange={(e) => setEmployeeFormData(prev => ({ ...prev, profile_url: e.target.value }))}
                placeholder="https://linkedin.com/in/username"
              />
            </div>
            <div>
              <Label htmlFor="employee_picture_url">Profile Picture URL</Label>
              <Input
                id="employee_picture_url"
                value={employeeFormData.picture_url}
                onChange={(e) => setEmployeeFormData(prev => ({ ...prev, picture_url: e.target.value }))}
                placeholder="https://example.com/profile-image.jpg"
              />
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={async () => {
                  if (!employeeFormData.full_name || !employeeFormData.profile_url || !selectedLocation) {
                    toast.error('Full name and LinkedIn URL are required');
                    return;
                  }

                  try {
                    // First, create the LinkedIn profile
                    const { data: profileData, error: profileError } = await supabase
                      .from('linkedin_profiles')
                      .insert([{
                        full_name: employeeFormData.full_name,
                        headline: employeeFormData.headline || null,
                        profile_url: employeeFormData.profile_url,
                        picture_url: employeeFormData.picture_url || null
                      }])
                      .select()
                      .single();

                    if (profileError) throw profileError;

                    // Then, create the mapping to the location
                    const { error: mappingError } = await supabase
                      .from('location_social_mapping')
                      .insert([{
                        location_id: selectedLocation.id,
                        linkedin_profile_id: profileData.id,
                        mapping_type: 'linkedin',
                        confidence_score: 1.0
                      }]);

                    if (mappingError) throw mappingError;

                    setEmployeeFormData({
                      full_name: '',
                      headline: '',
                      profile_url: '',
                      picture_url: ''
                    });
                    setShowAddEmployee(false);
                    toast.success('Employee added successfully');
                    loadCompaniesData(); // Refresh the map data
                  } catch (error) {
                    console.error('Error adding employee:', error);
                    toast.error('Failed to add employee');
                  }
                }}
                className="flex-1"
              >
                Add Employee
              </Button>
              <Button variant="outline" onClick={() => setShowAddEmployee(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Add Location Form Modal */}
      <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add New Location
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="company_name">Company Name *</Label>
              <Input
                id="company_name"
                value={formData.company_name}
                onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
                placeholder="Enter company name"
              />
            </div>
            <div>
              <Label htmlFor="office_address">Office Address *</Label>
              <Input
                id="office_address"
                value={formData.office_address}
                onChange={(e) => setFormData(prev => ({ ...prev, office_address: e.target.value }))}
                placeholder="Enter full office address"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  placeholder="City"
                />
              </div>
              <div>
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                  placeholder="State"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional notes about this location"
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddLocation} className="flex-1">
                Add Location
              </Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Tabs for different views */}
      <Tabs defaultValue="map" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="map">Interactive Map</TabsTrigger>
          <TabsTrigger value="graph">Network Graph</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="map" className="mt-4">
          <div className="relative">
            {/* Floating Controls Button */}
            <Button
              onClick={() => setShowControlsModal(true)}
              className="absolute top-4 right-4 z-10 shadow-lg hover:shadow-xl transition-all duration-200"
              size="sm"
            >
              <Settings className="h-4 w-4 mr-2" />
              Map Controls
            </Button>
            
            <div 
              ref={mapContainer} 
              className="w-full h-[80vh] rounded-lg border overflow-hidden" 
            />
            {!mapboxToken && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted/50 rounded-lg">
                <div className="text-center">
                  <p className="text-muted-foreground">Loading map...</p>
                </div>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="graph" className="mt-4">
          <LocationsGraph activeHeatmapLayer={activeHeatmapLayer} />
        </TabsContent>
        
        <TabsContent value="analytics" className="mt-4">
          <AnalyticsDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}