
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { graphqlClient, SAMPLE_QUERIES } from '@/lib/graphql-client';

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
    queryKey: ['projects'],
    queryFn: async () => {
      try {
        // Simulate GraphQL call
        await new Promise(resolve => setTimeout(resolve, 1000));
        return mockProjects;
      } catch (error) {
        throw new Error('Failed to fetch projects');
      }
    },
  });

  const assetsQuery = useQuery({
    queryKey: ['marketing-assets'],
    queryFn: async () => {
      try {
        // Simulate GraphQL call
        await new Promise(resolve => setTimeout(resolve, 800));
        return mockAssets;
      } catch (error) {
        throw new Error('Failed to fetch marketing assets');
      }
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

  if (currentQuery.isLoading) {
    return (
      <div className="p-6">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (currentQuery.error) {
    return (
      <div className="p-6">
        <ErrorState
          message="Failed to load board data"
          onRetry={() => currentQuery.refetch()}
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Marketing Board</h1>
        <Button>Create New</Button>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('projects')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'projects'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Projects ({mockProjects.length})
        </button>
        <button
          onClick={() => setActiveTab('assets')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'assets'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Marketing Assets ({mockAssets.length})
        </button>
      </div>

      {/* Content */}
      {!currentData || currentData.length === 0 ? (
        <EmptyState
          title={`No ${activeTab} found`}
          description={`Get started by creating your first ${activeTab === 'projects' ? 'project' : 'marketing asset'}.`}
          icon={activeTab === 'projects' ? '📋' : '🎨'}
          action={{
            label: `Create ${activeTab === 'projects' ? 'Project' : 'Asset'}`,
            onClick: () => console.log('Create new item'),
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentData.map((item: any) => (
            <Card key={item.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">
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
              <CardContent>
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
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Board;
