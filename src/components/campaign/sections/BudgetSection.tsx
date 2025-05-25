import React from 'react';
import { useCampaignStore } from '@/store/campaignStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { 
  DollarSign, 
  TrendingUp, 
  AlertCircle,
  CheckCircle,
  Info
} from 'lucide-react';

export const BudgetSection: React.FC = () => {
  const { formData, updateFormData, addValidationError, removeValidationError } = useCampaignStore();

  const handleBudgetTypeChange = (type: 'daily' | 'lifetime') => {
    updateFormData('budget', { type });
  };

  const handleAmountChange = (amount: string) => {
    const numAmount = parseFloat(amount) || 0;
    updateFormData('budget', { amount: numAmount });
    
    if (numAmount <= 0) {
      addValidationError({
        field: 'budget.amount',
        message: 'Budget amount must be greater than 0',
        severity: 'error'
      });
    } else {
      removeValidationError('budget.amount');
    }
  };

  const handleCurrencyChange = (currency: string) => {
    updateFormData('budget', { currency });
  };

  const handleBidStrategyChange = (bidStrategy: string) => {
    updateFormData('budget', { bidStrategy });
  };

  const isComplete = formData.budget.amount > 0 && formData.budget.currency;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Budget & Bidding</h3>
          <p className="text-sm text-muted-foreground">
            Set your campaign budget and bidding strategy
          </p>
        </div>
        <Badge variant={isComplete ? "default" : "secondary"}>
          {isComplete ? (
            <>
              <CheckCircle className="h-3 w-3 mr-1" />
              Complete
            </>
          ) : (
            'Incomplete'
          )}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Budget Type */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Budget Type
          </Label>
          <RadioGroup
            value={formData.budget.type}
            onValueChange={handleBudgetTypeChange}
            className="space-y-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="daily" id="daily" />
              <Label htmlFor="daily" className="cursor-pointer">
                Daily Budget
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="lifetime" id="lifetime" />
              <Label htmlFor="lifetime" className="cursor-pointer">
                Lifetime Budget
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Budget Amount */}
        <div className="space-y-2">
          <Label htmlFor="budget-amount">
            {formData.budget.type === 'daily' ? 'Daily' : 'Lifetime'} Budget Amount
          </Label>
          <div className="flex gap-2">
            <Select
              value={formData.budget.currency}
              onValueChange={handleCurrencyChange}
            >
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="EUR">EUR</SelectItem>
                <SelectItem value="GBP">GBP</SelectItem>
                <SelectItem value="CAD">CAD</SelectItem>
              </SelectContent>
            </Select>
            <Input
              id="budget-amount"
              type="number"
              value={formData.budget.amount || ''}
              onChange={(e) => handleAmountChange(e.target.value)}
              placeholder="0.00"
              min="0"
              step="0.01"
              className="flex-1"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {formData.budget.type === 'daily' 
              ? 'Amount to spend per day'
              : 'Total amount to spend over campaign lifetime'
            }
          </p>
        </div>
      </div>

      {/* Bid Strategy */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Bid Strategy
        </Label>
        <Select
          value={formData.budget.bidStrategy}
          onValueChange={handleBidStrategyChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select bidding strategy" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="auto">
              <div className="flex flex-col items-start">
                <span className="font-medium">Automatic Bidding</span>
                <span className="text-xs text-muted-foreground">Let the platform optimize bids</span>
              </div>
            </SelectItem>
            <SelectItem value="manual">
              <div className="flex flex-col items-start">
                <span className="font-medium">Manual Bidding</span>
                <span className="text-xs text-muted-foreground">Set your own bid amounts</span>
              </div>
            </SelectItem>
            <SelectItem value="target_cpa">
              <div className="flex flex-col items-start">
                <span className="font-medium">Target CPA</span>
                <span className="text-xs text-muted-foreground">Target cost per acquisition</span>
              </div>
            </SelectItem>
            <SelectItem value="target_roas">
              <div className="flex flex-col items-start">
                <span className="font-medium">Target ROAS</span>
                <span className="text-xs text-muted-foreground">Target return on ad spend</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Budget Estimates */}
      {formData.budget.amount > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Info className="h-4 w-4" />
              Budget Estimates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-sm font-medium">Estimated Reach</p>
                <p className="text-lg font-bold">
                  {Math.round(formData.budget.amount * 1000).toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">people</p>
              </div>
              <div>
                <p className="text-sm font-medium">Estimated Clicks</p>
                <p className="text-lg font-bold">
                  {Math.round(formData.budget.amount * 50)}
                </p>
                <p className="text-xs text-muted-foreground">clicks</p>
              </div>
              <div>
                <p className="text-sm font-medium">Est. Cost per Click</p>
                <p className="text-lg font-bold">
                  ${(formData.budget.amount / Math.max(formData.budget.amount * 50, 1)).toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground">average</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}; 