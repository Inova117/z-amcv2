
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner, Skeleton, RefreshLoading } from '@/components/ui/LoadingSpinner';
import { ErrorState, NetworkError, InlineError } from '@/components/ui/ErrorState';
import { EmptyState, NoData, NoSearchResults } from '@/components/ui/EmptyState';
import { NotificationDemo } from '@/components/demo/NotificationDemo';
import { HeroFlowDemo } from '@/components/demo/HeroFlowDemo';
import { OnboardingTestButton } from '@/components/demo/OnboardingTestButton';
import { useResponsive, useIsMobile } from '@/hooks/useResponsive';
import { graphqlClient, SAMPLE_QUERIES } from '@/lib/graphql-client';
import { RefreshCw, Search, Filter, Grid, List } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface Project {
  id: string;
  name: string;
  status: string;
  createdAt: string;
}

interface MarketingAsset {
  id: string;
  title: string;
  type: string;
  status: string;
  projectId: string;
}

const Board = () => {
  const [activeTab, setActiveTab] = useState<'projects' | 'assets'>('projects');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { isMobile, isTablet } = useResponsive();

  // Mock data for demonstration
  const mockProjects: Project[] = [
    { id: '1', name: 'Q4 Marketing Campaign', status: 'Active', createdAt: '2024-01-15' },
    { id: '2', name: 'Product Launch Strategy', status: 'Planning', createdAt: '2024-01-10' },
    { id: '3', name: 'Brand Awareness Initiative', status: 'Completed', createdAt: '2024-01-05' },
  ];

  const mockAssets: MarketingAsset[] = [
    { id: '1', title: 'Social Media Campaign', type: 'Social', status: 'Draft', projectId: '1' },
    { id: '2', title: 'Email Newsletter', type: 'Email', status: 'Published', projectId: '1' },
    { id: '3', title: 'Product Demo Video', type: 'Video', status: 'In Review', projectId: '2' },
  ];

  const projectsQuery = useQuery({
    queryKey: ['projects', searchQuery],
    queryFn: async () => {
      try {
        // Simulate GraphQL call with search
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (searchQuery) {
          return mockProjects.filter(project => 
            project.name.toLowerCase().includes(searchQuery.toLowerCase())
          );
        }
        
        return mockProjects;
      } catch (error) {
        throw new Error('Failed to fetch projects');
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      // Retry network errors but not 404s
      return failureCount < 3 && !error.message.includes('404');
    },
  });

  const assetsQuery = useQuery({
    queryKey: ['marketing-assets', searchQuery],
    queryFn: async () => {
      try {
        // Simulate GraphQL call with search
        await new Promise(resolve => setTimeout(resolve, 800));
        
        if (searchQuery) {
          return mockAssets.filter(asset => 
            asset.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            asset.type.toLowerCase().includes(searchQuery.toLowerCase())
          );
        }
        
        return mockAssets;
      } catch (error) {
        throw new Error('Failed to fetch marketing assets');
      }
    },
    staleTime: 5 * 60 * 1000,
    retry: (failureCount, error) => {
      return failureCount < 3 && !error.message.includes('404');
    },
  });

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'published':
        return 'bg-green-500';
      case 'planning':
      case 'draft':
        return 'bg-yellow-500';
      case 'completed':
        return 'bg-blue-500';
      case 'in review':
        return 'bg-orange-500';
      default:
        return 'bg-gray-500';
    }
  };

  const currentQuery = activeTab === 'projects' ? projectsQuery : assetsQuery;
  const currentData = activeTab === 'projects' ? projectsQuery.data : assetsQuery.data;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await currentQuery.refetch();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  // Loading state with skeleton
  if (currentQuery.isLoading && !currentQuery.data) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        {/* Header skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>

        {/* Search and filters skeleton */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-32" />
        </div>

        {/* Content skeleton */}
        <div className={`grid gap-4 ${
          isMobile ? 'grid-cols-1' : 
          isTablet ? 'grid-cols-2' : 
          'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
        }`}>
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-6 w-16" />
              </div>
              <Skeleton className="h-4 w-24" />
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-20" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (currentQuery.error) {
    const error = currentQuery.error as Error;
    
    // Check if it's a network error
    if (error.message.includes('fetch') || error.message.includes('network')) {
      return (
        <div className="p-4 md:p-6">
          <NetworkError 
            onRetry={handleRefresh}
            isOnline={navigator.onLine}
          />
        </div>
      );
    }

    return (
      <div className="p-4 md:p-6">
        <ErrorState
          type="server"
          message="Failed to load board data"
          onRetry={handleRefresh}
          showDetails={true}
          details={error.message}
        />
      </div>
    );
  }

  return (
    <RefreshLoading isRefreshing={isRefreshing} onRefresh={handleRefresh}>
      <div className="p-4 md:p-6 space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className={`font-bold ${isMobile ? 'text-2xl' : 'text-3xl'}`}>
              Marketing Board
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage your campaigns and creative assets
            </p>
          </div>
          <div className="flex items-center gap-2">
            <OnboardingTestButton />
            <Button 
              onClick={handleRefresh}
              variant="outline"
              size={isMobile ? "sm" : "default"}
              disabled={isRefreshing}
            >
              <RefreshCw className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'} mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button size={isMobile ? "sm" : "default"}>
              Create New
            </Button>
          </div>
        </div>

        {/* Hero Flow Demo - Hide on mobile to save space */}
        {!isMobile && <HeroFlowDemo />}

        {/* Notification Demo */}
        <NotificationDemo />

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={`Search ${activeTab}...`}
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center border rounded-lg p-1">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="h-8 w-8 p-0"
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="h-8 w-8 p-0"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
            
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-muted p-1 rounded-lg w-fit">
          <button
            onClick={() => setActiveTab('projects')}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'projects'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Projects ({mockProjects.length})
          </button>
          <button
            onClick={() => setActiveTab('assets')}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'assets'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Assets ({mockAssets.length})
          </button>
        </div>

        {/* Error banner for partial failures */}
        {currentQuery.error && currentData && (
          <InlineError
            message="Some data may be outdated. Check your connection."
            variant="warning"
          />
        )}

        {/* Content */}
        {!currentData || currentData.length === 0 ? (
          searchQuery ? (
            <NoSearchResults
              query={searchQuery}
              onClearSearch={clearSearch}
            />
          ) : (
            <NoData
              resource={activeTab}
              onCreateNew={() => console.log('Create new item')}
            />
          )
        ) : (
          <div className={
            viewMode === 'grid' 
              ? `grid gap-4 ${
                  isMobile ? 'grid-cols-1' : 
                  isTablet ? 'grid-cols-2' : 
                  'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                }`
              : 'space-y-4'
          }>
            {currentData.map((item: any) => (
              <Card 
                key={item.id} 
                className={`hover:shadow-lg transition-shadow cursor-pointer ${
                  viewMode === 'list' ? 'flex items-center p-4' : ''
                }`}
              >
                {viewMode === 'grid' ? (
                  <>
                    <CardHeader className={isMobile ? 'p-4' : 'p-6'}>
                      <div className="flex justify-between items-start">
                        <CardTitle className={isMobile ? 'text-base' : 'text-lg'}>
                          {activeTab === 'projects' ? item.name : item.title}
                        </CardTitle>
                        <Badge className={`${getStatusColor(item.status)} text-white`}>
                          {item.status}
                        </Badge>
                      </div>
                      {activeTab === 'assets' && (
                        <CardDescription>Type: {item.type}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className={isMobile ? 'p-4 pt-0' : 'p-6 pt-0'}>
                      <div className="flex justify-between items-center text-sm text-muted-foreground">
                        {activeTab === 'projects' ? (
                          <span>Created: {new Date(item.createdAt).toLocaleDateString()}</span>
                        ) : (
                          <span>Project ID: {item.projectId}</span>
                        )}
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </>
                ) : (
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-4">
                      <div>
                        <h3 className="font-semibold">
                          {activeTab === 'projects' ? item.name : item.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {activeTab === 'projects' 
                            ? `Created: ${new Date(item.createdAt).toLocaleDateString()}`
                            : `Type: ${item.type}`
                          }
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={`${getStatusColor(item.status)} text-white`}>
                        {item.status}
                      </Badge>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </RefreshLoading>
  );
};

export default Board;
