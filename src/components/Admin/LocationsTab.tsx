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
import { Trash2, MapPin, Plus, Filter, X, Building, Users, Eye, EyeOff, Network, Settings, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';

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

interface CompanyData {
  id: string;
  company_name: string;
  latitude: number | null;
  longitude: number | null;
  profile_count: number;
  profiles: {
    id: string;
    full_name: string;
    headline: string | null;
    profile_url: string;
  }[];
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
              profile_url
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

        const profileMarker = new mapboxgl.Marker({ element: profileEl })
          .setLngLat([profileLng, profileLat])
          .addTo(map.current!);

        // Add popup for profile
        const popup = new mapboxgl.Popup({ 
          offset: 25,
          className: theme === 'dark' ? 'dark-popup' : ''
        })
          .setHTML(`
            <div class="p-2 ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} rounded-lg shadow-lg">
              <div class="font-semibold text-sm">${profile.full_name}</div>
              ${profile.headline ? `<div class="text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} mt-1">${profile.headline}</div>` : ''}
              <div class="text-xs text-blue-400 mt-1">
                <a href="${profile.profile_url}" target="_blank" class="hover:underline">View Profile</a>
              </div>
            </div>
          `);

        profileMarker.setPopup(popup);
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map View */}
        <div className="lg:col-span-2">
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
                className="w-full h-96 rounded-lg border"
                style={{ minHeight: '400px' }}
              />
              {!mapboxToken && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
                  <p className="text-gray-600">Loading map...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Locations List & Controls */}
        <div className="space-y-4">
          {/* Add Location Form */}
          {showAddForm && (
            <Card>
              <CardHeader>
                <CardTitle>Add New Location</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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
              </CardContent>
            </Card>
          )}

          {/* Locations List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Targeted Locations
                <Badge variant="secondary">{filteredLocations.length} locations</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Search Input */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search locations..."
                    value={locationSearchQuery}
                    onChange={(e) => setLocationSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="space-y-3 max-h-96 overflow-y-auto scrollbar-hide">
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
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Floating Controls Button */}
      {companiesData.length > 0 && (
        <Button
          onClick={() => setShowNetworkModal(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 z-50"
          size="icon"
        >
          <Settings className="h-6 w-6" />
        </Button>
      )}

      {/* Network Controls Modal */}
      <Dialog open={showNetworkModal} onOpenChange={setShowNetworkModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Network className="h-5 w-5" />
              LinkedIn Network Controls
            </DialogTitle>
          </DialogHeader>
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
                  <>
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
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}