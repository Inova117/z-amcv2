import React, { useState } from 'react';
import { useAssetStore } from '@/store/assetStore';
import { useAssetOperations } from '@/hooks/useAssetOperations';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  X, 
  Download, 
  Edit, 
  Check, 
  AlertTriangle,
  Clock,
  User,
  Tag,
  Sparkles,
  History,
  Eye,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';

interface AssetDetailsProps {
  assetId: string;
  onClose: () => void;
}

export const AssetDetails: React.FC<AssetDetailsProps> = ({
  assetId,
  onClose,
}) => {
  const { assets } = useAssetStore();
  const { approveAsset, rejectAsset, updateAsset, applyAISuggestion } = useAssetOperations();
  
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  const [approvalComment, setApprovalComment] = useState('');
  const [showApprovalForm, setShowApprovalForm] = useState(false);
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject'>('approve');

  const asset = assets.find(a => a.id === assetId);

  if (!asset) {
    return (
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Asset not found</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  const handleEdit = () => {
    setEditedName(asset.name);
    setEditedDescription(asset.description || '');
    setIsEditing(true);
  };

  const handleSave = async () => {
    await updateAsset(asset.id, {
      name: editedName,
      description: editedDescription,
    });
    setIsEditing(false);
  };

  const handleApproval = async () => {
    if (approvalAction === 'approve') {
      await approveAsset(asset.id, approvalComment);
    } else {
      await rejectAsset(asset.id, approvalComment);
    }
    setShowApprovalForm(false);
    setApprovalComment('');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'pending_review': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Asset Details</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Preview */}
        <div className="aspect-video bg-muted rounded-lg overflow-hidden">
          {asset.type === 'image' && asset.url ? (
            <img
              src={asset.url}
              alt={asset.name}
              className="w-full h-full object-contain"
            />
          ) : asset.type === 'video' && asset.url ? (
            <video
              src={asset.url}
              controls
              className="w-full h-full"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <Eye className="h-12 w-12" />
            </div>
          )}
        </div>

        {/* Basic Info */}
        <div className="space-y-4">
          {isEditing ? (
            <div className="space-y-3">
              <Input
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                placeholder="Asset name"
              />
              <Textarea
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                placeholder="Description"
                rows={3}
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSave}>Save</Button>
                <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-lg">{asset.name}</h3>
                <Button variant="ghost" size="sm" onClick={handleEdit}>
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
              {asset.description && (
                <p className="text-muted-foreground">{asset.description}</p>
              )}
            </div>
          )}

          <div className="flex items-center gap-2">
            <Badge className={getStatusColor(asset.status)}>
              {asset.status.replace('_', ' ')}
            </Badge>
            <Badge variant="outline">{asset.type}</Badge>
          </div>
        </div>

        {/* Metadata */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">File Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Size:</span>
              <span>{formatFileSize(asset.size)}</span>
            </div>
            {asset.metadata.width && asset.metadata.height && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Dimensions:</span>
                <span>{asset.metadata.width} × {asset.metadata.height}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Format:</span>
              <span>{asset.metadata.format}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Created:</span>
              <span>{new Date(asset.createdAt).toLocaleDateString()}</span>
            </div>
          </CardContent>
        </Card>

        {/* Tags */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Tags
            </CardTitle>
          </CardHeader>
          <CardContent>
            {asset.tags.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {asset.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No tags</p>
            )}
          </CardContent>
        </Card>

        {/* AI Suggestions */}
        {asset.aiSuggestions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                AI Suggestions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {asset.aiSuggestions.map((suggestion) => (
                <div key={suggestion.id} className="border rounded-lg p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-medium text-sm">{suggestion.title}</h4>
                      <p className="text-xs text-muted-foreground">
                        {Math.round(suggestion.confidence * 100)}% confidence
                      </p>
                    </div>
                    {suggestion.actionable && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => applyAISuggestion(suggestion.id, asset.id)}
                      >
                        Apply
                      </Button>
                    )}
                  </div>
                  <p className="text-sm">{suggestion.description}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Approval Workflow */}
        {asset.status === 'pending_review' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Approval Required</CardTitle>
            </CardHeader>
            <CardContent>
              {!showApprovalForm ? (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      setApprovalAction('approve');
                      setShowApprovalForm(true);
                    }}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <ThumbsUp className="h-4 w-4 mr-1" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      setApprovalAction('reject');
                      setShowApprovalForm(true);
                    }}
                  >
                    <ThumbsDown className="h-4 w-4 mr-1" />
                    Reject
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <Textarea
                    placeholder={`Add a comment for ${approvalAction}...`}
                    value={approvalComment}
                    onChange={(e) => setApprovalComment(e.target.value)}
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleApproval}>
                      {approvalAction === 'approve' ? 'Approve' : 'Reject'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowApprovalForm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Approval History */}
        {asset.approvals.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <History className="h-4 w-4" />
                Approval History
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {asset.approvals.map((approval) => (
                <div key={approval.id} className="border-l-2 border-muted pl-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge
                      variant={approval.status === 'approved' ? 'default' : 'destructive'}
                      className="text-xs"
                    >
                      {approval.status}
                    </Badge>
                    <span className="text-sm font-medium">{approval.reviewerName}</span>
                  </div>
                  {approval.comments && (
                    <p className="text-sm text-muted-foreground">{approval.comments}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(approval.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1">
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>
      </div>
    </div>
  );
}; 