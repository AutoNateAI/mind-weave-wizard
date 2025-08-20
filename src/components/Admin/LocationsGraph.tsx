import React, { useState, useEffect, useCallback } from 'react';
import { ReactFlow, MiniMap, Controls, Background, useNodesState, useEdgesState, Node, Edge } from '@xyflow/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Building, Users, Eye, EyeOff, Network } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';
import { useHeatmapData } from '@/hooks/useHeatmapData';
import "@xyflow/react/dist/style.css";

interface CompanyData {
  id: string;
  company_name: string;
  profile_count: number;
  profiles: {
    id: string;
    full_name: string;
    headline: string | null;
    profile_url: string;
  }[];
}

interface LocationsGraphProps {
  activeHeatmapLayer?: string;
}

export function LocationsGraph({ activeHeatmapLayer = 'none' }: LocationsGraphProps = {}) {
  const { theme } = useTheme();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [companiesData, setCompaniesData] = useState<CompanyData[]>([]);
  const [visibleCompanies, setVisibleCompanies] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const { heatmapData, getHeatmapLayers } = useHeatmapData();

  useEffect(() => {
    loadCompaniesData();
  }, []);

  const loadCompaniesData = async () => {
    try {
      setLoading(true);

      // Get companies with their LinkedIn profiles
      const { data, error } = await supabase
        .from('targeted_locations')
        .select(`
          id,
          company_name,
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
            profile_count: profiles.length,
            profiles: profiles
          };
        })
        .filter(company => company.profile_count > 0); // Only show companies with profiles

      setCompaniesData(companiesWithProfiles);
      
      // Initially show all companies
      const allCompanyIds = new Set(companiesWithProfiles.map(c => c.id));
      setVisibleCompanies(allCompanyIds);

    } catch (error) {
      console.error('Error loading companies data:', error);
      toast.error('Failed to load companies data');
    } finally {
      setLoading(false);
    }
  };

  const generateGraph = useCallback(() => {
    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];

    companiesData.forEach((company, companyIndex) => {
      if (!visibleCompanies.has(company.id)) return;

      // Check if this location has heatmap data
      const locationHeatmapData = heatmapData.filter(point => 
        point.location_name?.toLowerCase().includes(company.company_name.toLowerCase())
      );
      
      let heatmapStyle = {};
      if (activeHeatmapLayer !== 'none' && locationHeatmapData.length > 0) {
        const avgIntensity = locationHeatmapData.reduce((sum, point) => {
          switch (activeHeatmapLayer) {
            case 'density': return sum + point.density_score;
            case 'engagement': return sum + point.engagement_score;
            case 'sentiment': return sum + Math.abs(point.sentiment_avg);
            default: return sum;
          }
        }, 0) / locationHeatmapData.length;
        
        // Apply heat map coloring
        const intensity = Math.min(avgIntensity / 10, 1); // Normalize to 0-1
        
        if (activeHeatmapLayer === 'density') {
          heatmapStyle = {
            background: `linear-gradient(135deg, rgba(59, 130, 246, ${0.3 + intensity * 0.7}), rgba(37, 99, 235, ${0.5 + intensity * 0.5}))`,
            boxShadow: `0 0 ${10 + intensity * 20}px rgba(59, 130, 246, ${intensity})`,
          };
        } else if (activeHeatmapLayer === 'engagement') {
          heatmapStyle = {
            background: `linear-gradient(135deg, rgba(34, 197, 94, ${0.3 + intensity * 0.7}), rgba(22, 163, 74, ${0.5 + intensity * 0.5}))`,
            boxShadow: `0 0 ${10 + intensity * 20}px rgba(34, 197, 94, ${intensity})`,
          };
        } else if (activeHeatmapLayer === 'sentiment') {
          const avgSentiment = locationHeatmapData.reduce((sum, point) => sum + point.sentiment_avg, 0) / locationHeatmapData.length;
          const color = avgSentiment >= 0 ? '34, 197, 94' : '239, 68, 68'; // Green for positive, red for negative
          heatmapStyle = {
            background: `linear-gradient(135deg, rgba(${color}, ${0.3 + intensity * 0.7}), rgba(${color}, ${0.5 + intensity * 0.5}))`,
            boxShadow: `0 0 ${10 + intensity * 20}px rgba(${color}, ${intensity})`,
          };
        }
      }

      // Create company node
      const companyNode: Node = {
        id: `company-${company.id}`,
        type: 'default',
        position: { 
          x: (companyIndex % 4) * 400 + 200, 
          y: Math.floor(companyIndex / 4) * 300 + 100 
        },
        data: { 
          label: (
            <div className="p-3 text-center">
              <Building className="h-6 w-6 mx-auto mb-2 text-primary" />
              <div className="font-semibold text-sm">{company.company_name}</div>
              <Badge variant="secondary" className="text-xs mt-1">
                {company.profile_count} profiles
              </Badge>
              {locationHeatmapData.length > 0 && activeHeatmapLayer !== 'none' && (
                <Badge variant="outline" className="text-xs mt-1 ml-1">
                  {locationHeatmapData.length} keywords
                </Badge>
              )}
            </div>
          )
        },
        style: {
          background: theme === 'dark' ? '#1f2937' : '#ffffff',
          border: '2px solid #3b82f6',
          borderRadius: '12px',
          width: 180,
          height: 120,
          transition: 'all 0.3s ease',
          ...heatmapStyle,
        },
      };

      newNodes.push(companyNode);

      // Create profile nodes around the company
      company.profiles.forEach((profile, profileIndex) => {
        const angle = (profileIndex / company.profiles.length) * 2 * Math.PI;
        const radius = 120;
        const profileX = companyNode.position.x + Math.cos(angle) * radius;
        const profileY = companyNode.position.y + Math.sin(angle) * radius;

        const profileNode: Node = {
          id: `profile-${profile.id}`,
          type: 'default',
          position: { x: profileX, y: profileY },
          data: { 
            label: (
              <div className="p-2 text-center">
                <Users className="h-4 w-4 mx-auto mb-1 text-blue-600" />
                <div className="font-medium text-xs">{profile.full_name}</div>
                {profile.headline && (
                  <div className="text-xs text-muted-foreground truncate max-w-24">
                    {profile.headline}
                  </div>
                )}
              </div>
            )
          },
          style: {
            background: theme === 'dark' ? '#374151' : '#f9fafb',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            width: 120,
            height: 80,
            fontSize: '10px',
          },
        };

        newNodes.push(profileNode);

        // Create edge from company to profile
        const edge: Edge = {
          id: `edge-${company.id}-${profile.id}`,
          source: `company-${company.id}`,
          target: `profile-${profile.id}`,
          type: 'smoothstep',
          style: { 
            stroke: '#6b7280',
            strokeWidth: 1,
          },
          animated: false,
        };

        newEdges.push(edge);
      });
    });

    setNodes(newNodes);
    setEdges(newEdges);
  }, [companiesData, visibleCompanies, theme, activeHeatmapLayer, heatmapData]);

  useEffect(() => {
    generateGraph();
  }, [generateGraph]);

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

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-muted rounded w-1/3 mb-4"></div>
            <div className="h-96 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const visibleCompaniesCount = visibleCompanies.size;
  const totalProfiles = companiesData
    .filter(c => visibleCompanies.has(c.id))
    .reduce((sum, c) => sum + c.profile_count, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Controls Panel */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Network className="h-5 w-5" />
              Graph Controls
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Show All</Label>
                <p className="text-xs text-muted-foreground">
                  Toggle all companies
                </p>
              </div>
              <Switch
                checked={visibleCompaniesCount === companiesData.length}
                onCheckedChange={toggleAllCompanies}
              />
            </div>
            
            <div className="pt-2 border-t">
              <div className="flex items-center justify-between mb-3">
                <Label className="text-sm font-medium">Companies</Label>
                <Badge variant="secondary" className="text-xs">
                  {visibleCompaniesCount}/{companiesData.length}
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Graph Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Visible Companies:</span>
              <span className="font-medium">{visibleCompaniesCount}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Profiles:</span>
              <span className="font-medium">{totalProfiles}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Connections:</span>
              <span className="font-medium">{edges.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Keyword Points:</span>
              <span className="font-medium">{heatmapData.length}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Graph Visualization */}
      <div className="lg:col-span-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              LinkedIn Profiles Network
            </CardTitle>
          </CardHeader>
          <CardContent>
            {companiesData.length === 0 ? (
              <div className="h-96 flex items-center justify-center text-center">
                <div>
                  <Network className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    No LinkedIn profiles linked to companies yet.
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Add profiles with company associations to see the network visualization.
                  </p>
                </div>
              </div>
            ) : (
              <div className="h-96 rounded-lg border">
                <ReactFlow
                  nodes={nodes}
                  edges={edges}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  fitView
                  minZoom={0.5}
                  maxZoom={2}
                  className={`w-full h-full ${theme === 'dark' ? 'dark' : ''}`}
                  nodesDraggable={true}
                  nodesConnectable={false}
                  elementsSelectable={true}
                >
                  <MiniMap 
                    zoomable 
                    pannable 
                    className={theme === 'dark' ? 'dark' : ''}
                  />
                  <Controls className={theme === 'dark' ? 'dark' : ''} />
                  <Background 
                    variant={'dots' as any}
                    gap={20}
                    size={1}
                    className={theme === 'dark' ? 'dark' : ''}
                  />
                </ReactFlow>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}