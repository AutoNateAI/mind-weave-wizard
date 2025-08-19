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
import { Trash2, MapPin, Plus, Filter, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

export function LocationsTab() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [locations, setLocations] = useState<TargetedLocation[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<TargetedLocation | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [mapboxToken, setMapboxToken] = useState<string>('');
  const [formData, setFormData] = useState({
    company_name: '',
    office_address: '',
    city: '',
    state: '',
    country: 'US',
    notes: ''
  });

  // Initialize map and load locations
  useEffect(() => {
    loadMapboxToken();
    loadLocations();
  }, []);

  // Initialize map when token is available
  useEffect(() => {
    if (mapboxToken && mapContainer.current && !map.current) {
      mapboxgl.accessToken = mapboxToken;
      
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/light-v11',
        center: [-98.5, 39.8], // Center of US
        zoom: 4
      });

      map.current.addControl(new mapboxgl.NavigationControl());

      // Add markers after map is loaded
      map.current.on('load', () => {
        addMarkersToMap();
      });
    }
  }, [mapboxToken]);

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
                <Badge variant="secondary">{locations.length} locations</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {locations.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    No locations added yet. Click "Add Location" to get started.
                  </p>
                ) : (
                  locations.map((location) => (
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
                        setShowLocationModal(true);
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium">{location.company_name}</h4>
                          <p className="text-sm text-muted-foreground">{location.office_address}</p>
                          {location.notes && (
                            <div className="text-xs text-muted-foreground mt-1">
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

      {/* Location Details Modal */}
      <Dialog open={showLocationModal} onOpenChange={setShowLocationModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              {selectedLocation?.company_name}
            </DialogTitle>
          </DialogHeader>
          {selectedLocation && (
            <div className="space-y-4">
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

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  variant="destructive"
                  onClick={() => {
                    handleDeleteLocation(selectedLocation.id);
                    setShowLocationModal(false);
                  }}
                  className="gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Location
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
        </DialogContent>
      </Dialog>
    </div>
  );
}