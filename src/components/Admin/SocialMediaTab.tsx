import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Upload, 
  Link2, 
  Users, 
  MessageSquare, 
  BarChart3, 
  Download,
  Trash2,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SocialAccount {
  id: string;
  platform: string;
  account_username: string | null;
  account_display_name: string | null;
  is_connected: boolean;
  sync_status: string;
  last_sync_at: string | null;
  created_at: string;
}

interface UploadBatch {
  id: string;
  batch_name: string;
  data_source: string;
  file_name: string | null;
  total_records: number;
  processed_records: number;
  failed_records: number;
  status: string;
  created_at: string;
}

export function SocialMediaTab() {
  const [activeTab, setActiveTab] = useState('accounts');
  const [socialAccounts, setSocialAccounts] = useState<SocialAccount[]>([]);
  const [uploadBatches, setUploadBatches] = useState<UploadBatch[]>([]);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadConfig, setUploadConfig] = useState({
    batch_name: '',
    data_source: 'apify_people_search',
    description: ''
  });

  useEffect(() => {
    loadSocialAccounts();
    loadUploadBatches();
  }, []);

  const loadSocialAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from('social_accounts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSocialAccounts(data || []);
    } catch (error) {
      console.error('Error loading social accounts:', error);
      toast.error('Failed to load social accounts');
    }
  };

  const loadUploadBatches = async () => {
    try {
      const { data, error } = await supabase
        .from('upload_batches')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setUploadBatches(data || []);
    } catch (error) {
      console.error('Error loading upload batches:', error);
      toast.error('Failed to load upload history');
    }
  };

  const connectPhylloAccount = async (platform: 'linkedin' | 'instagram') => {
    try {
      // This would typically open Phyllo's connection flow
      // For now, we'll simulate it
      const { data, error } = await supabase.functions.invoke('connect-phyllo-account', {
        body: { platform }
      });

      if (error) throw error;
      
      toast.success(`${platform} account connection initiated`);
      loadSocialAccounts();
    } catch (error) {
      console.error('Error connecting account:', error);
      toast.error('Failed to connect account');
    }
  };

  const handleFileUpload = async () => {
    if (!uploadFile || !uploadConfig.batch_name) {
      toast.error('Please select a file and provide a batch name');
      return;
    }

    try {
      // Read file content
      const fileContent = await uploadFile.text();
      let jsonData;
      
      try {
        jsonData = JSON.parse(fileContent);
      } catch (e) {
        toast.error('Invalid JSON file format');
        return;
      }

      // Ensure it's an array
      const dataArray = Array.isArray(jsonData) ? jsonData : [jsonData];

      // Process the upload
      const { data, error } = await supabase.functions.invoke('process-apify-upload', {
        body: {
          batch_name: uploadConfig.batch_name,
          data_source: uploadConfig.data_source,
          file_name: uploadFile.name,
          data: dataArray
        }
      });

      if (error) throw error;

      toast.success(`Upload started. Processing ${dataArray.length} records.`);
      setUploadFile(null);
      setUploadConfig({
        batch_name: '',
        data_source: 'apify_people_search',
        description: ''
      });
      loadUploadBatches();
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to process upload');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'processing':
        return <Clock className="h-4 w-4 text-blue-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Social Media Management</h2>
        <p className="text-muted-foreground">
          Connect social accounts via Phyllo and upload LinkedIn data from Apify scrapers.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="accounts">Connected Accounts</TabsTrigger>
          <TabsTrigger value="upload">Data Upload</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="accounts" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* LinkedIn Connection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                    <span className="text-white text-sm font-bold">in</span>
                  </div>
                  LinkedIn Accounts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={() => connectPhylloAccount('linkedin')}
                  className="w-full gap-2"
                >
                  <Link2 className="h-4 w-4" />
                  Connect LinkedIn Account
                </Button>
                
                <div className="space-y-2">
                  {socialAccounts
                    .filter(account => account.platform === 'linkedin')
                    .map(account => (
                      <div key={account.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{account.account_display_name || account.account_username || 'Unknown Account'}</p>
                          <div className="flex items-center gap-2">
                            <Badge variant={account.is_connected ? 'default' : 'secondary'}>
                              {account.is_connected ? 'Connected' : 'Disconnected'}
                            </Badge>
                            <Badge variant="outline">{account.sync_status}</Badge>
                          </div>
                        </div>
                        {account.last_sync_at && (
                          <p className="text-xs text-muted-foreground">
                            Last sync: {formatDate(account.last_sync_at)}
                          </p>
                        )}
                      </div>
                    ))}
                  {socialAccounts.filter(account => account.platform === 'linkedin').length === 0 && (
                    <p className="text-muted-foreground text-center py-4">
                      No LinkedIn accounts connected yet.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Instagram Connection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 rounded flex items-center justify-center">
                    <span className="text-white text-sm font-bold">IG</span>
                  </div>
                  Instagram Accounts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={() => connectPhylloAccount('instagram')}
                  className="w-full gap-2"
                  variant="outline"
                >
                  <Link2 className="h-4 w-4" />
                  Connect Instagram Account
                </Button>
                
                <div className="space-y-2">
                  {socialAccounts
                    .filter(account => account.platform === 'instagram')
                    .map(account => (
                      <div key={account.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{account.account_display_name || account.account_username || 'Unknown Account'}</p>
                          <div className="flex items-center gap-2">
                            <Badge variant={account.is_connected ? 'default' : 'secondary'}>
                              {account.is_connected ? 'Connected' : 'Disconnected'}
                            </Badge>
                            <Badge variant="outline">{account.sync_status}</Badge>
                          </div>
                        </div>
                        {account.last_sync_at && (
                          <p className="text-xs text-muted-foreground">
                            Last sync: {formatDate(account.last_sync_at)}
                          </p>
                        )}
                      </div>
                    ))}
                  {socialAccounts.filter(account => account.platform === 'instagram').length === 0 && (
                    <p className="text-muted-foreground text-center py-4">
                      No Instagram accounts connected yet.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="upload" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Upload Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Upload Apify Data
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="batch_name">Batch Name *</Label>
                  <Input
                    id="batch_name"
                    value={uploadConfig.batch_name}
                    onChange={(e) => setUploadConfig(prev => ({ ...prev, batch_name: e.target.value }))}
                    placeholder="e.g., Tech Companies SF Bay Area"
                  />
                </div>

                <div>
                  <Label htmlFor="data_source">Data Source</Label>
                  <select
                    id="data_source"
                    value={uploadConfig.data_source}
                    onChange={(e) => setUploadConfig(prev => ({ ...prev, data_source: e.target.value }))}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="apify_people_search">LinkedIn People Search</option>
                    <option value="apify_post_scraper">LinkedIn Post Scraper</option>
                    <option value="apify_profile_scraper">LinkedIn Profile Scraper</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={uploadConfig.description}
                    onChange={(e) => setUploadConfig(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Optional description of this data batch"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="file">JSON File *</Label>
                  <Input
                    id="file"
                    type="file"
                    accept=".json"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  />
                  {uploadFile && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Selected: {uploadFile.name} ({(uploadFile.size / 1024).toFixed(1)} KB)
                    </p>
                  )}
                </div>

                <Button 
                  onClick={handleFileUpload}
                  disabled={!uploadFile || !uploadConfig.batch_name}
                  className="w-full"
                >
                  Upload & Process Data
                </Button>
              </CardContent>
            </Card>

            {/* Upload History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Upload History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {uploadBatches.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">
                      No uploads yet. Upload your first JSON file to get started.
                    </p>
                  ) : (
                    uploadBatches.map((batch) => (
                      <div key={batch.id} className="p-3 border rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(batch.status)}
                              <h4 className="font-medium">{batch.batch_name}</h4>
                            </div>
                            <p className="text-sm text-muted-foreground">{batch.data_source}</p>
                            {batch.file_name && (
                              <p className="text-xs text-muted-foreground">{batch.file_name}</p>
                            )}
                            <div className="flex items-center gap-4 mt-2">
                              <Badge variant="outline" className="text-xs">
                                {batch.processed_records}/{batch.total_records} processed
                              </Badge>
                              {batch.failed_records > 0 && (
                                <Badge variant="destructive" className="text-xs">
                                  {batch.failed_records} failed
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatDate(batch.created_at)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Profiles</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">LinkedIn profiles uploaded</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">LinkedIn posts analyzed</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Connected Accounts</CardTitle>
                <Link2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{socialAccounts.filter(a => a.is_connected).length}</div>
                <p className="text-xs text-muted-foreground">Active social accounts</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Data Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Detailed analytics will appear here once you start uploading LinkedIn data and connecting social accounts.
                You'll be able to see:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
                <li>Profile demographics by location</li>
                <li>Post engagement metrics</li>
                <li>Critical thinking concept analysis</li>
                <li>Geographic targeting effectiveness</li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}