import { gql } from '@apollo/client';

export const GET_CAMPAIGNS = gql`
  query GetCampaigns($userId: ID!) {
    campaigns(userId: $userId) {
      id
      name
      description
      status
      budget {
        type
        amount
        currency
        bidStrategy
        bidAmount
      }
      targeting {
        demographics {
          ageMin
          ageMax
          genders
          locations
          languages
        }
        interests
        behaviors
        customAudiences
        lookalikeSources
        deviceTypes
        placements
      }
      creatives {
        id
        type
        headline
        description
        callToAction
        mediaUrl
        mediaUrls
        linkUrl
        displayUrl
      }
      platforms {
        platform
        enabled
        campaignType
        objective
        settings
      }
      schedule {
        startDate
        endDate
        timezone
        dayParting {
          days
          hours
        }
      }
      createdAt
      updatedAt
    }
  }
`;

export const GET_CAMPAIGN = gql`
  query GetCampaign($id: ID!) {
    campaign(id: $id) {
      id
      name
      description
      status
      budget {
        type
        amount
        currency
        bidStrategy
        bidAmount
      }
      targeting {
        demographics {
          ageMin
          ageMax
          genders
          locations
          languages
        }
        interests
        behaviors
        customAudiences
        lookalikeSources
        deviceTypes
        placements
      }
      creatives {
        id
        type
        headline
        description
        callToAction
        mediaUrl
        mediaUrls
        linkUrl
        displayUrl
      }
      platforms {
        platform
        enabled
        campaignType
        objective
        settings
      }
      schedule {
        startDate
        endDate
        timezone
        dayParting {
          days
          hours
        }
      }
      createdAt
      updatedAt
      userId
    }
  }
`;

export const CREATE_CAMPAIGN = gql`
  mutation CreateCampaign($input: CampaignInput!) {
    createCampaign(input: $input) {
      id
      name
      description
      status
      budget {
        type
        amount
        currency
        bidStrategy
        bidAmount
      }
      targeting {
        demographics {
          ageMin
          ageMax
          genders
          locations
          languages
        }
        interests
        behaviors
        customAudiences
        lookalikeSources
        deviceTypes
        placements
      }
      creatives {
        id
        type
        headline
        description
        callToAction
        mediaUrl
        mediaUrls
        linkUrl
        displayUrl
      }
      platforms {
        platform
        enabled
        campaignType
        objective
        settings
      }
      schedule {
        startDate
        endDate
        timezone
        dayParting {
          days
          hours
        }
      }
      createdAt
      updatedAt
      userId
    }
  }
`;

export const UPDATE_CAMPAIGN = gql`
  mutation UpdateCampaign($id: ID!, $input: CampaignUpdateInput!) {
    updateCampaign(id: $id, input: $input) {
      id
      name
      description
      status
      budget {
        type
        amount
        currency
        bidStrategy
        bidAmount
      }
      targeting {
        demographics {
          ageMin
          ageMax
          genders
          locations
          languages
        }
        interests
        behaviors
        customAudiences
        lookalikeSources
        deviceTypes
        placements
      }
      creatives {
        id
        type
        headline
        description
        callToAction
        mediaUrl
        mediaUrls
        linkUrl
        displayUrl
      }
      platforms {
        platform
        enabled
        campaignType
        objective
        settings
      }
      schedule {
        startDate
        endDate
        timezone
        dayParting {
          days
          hours
        }
      }
      createdAt
      updatedAt
      userId
    }
  }
`;

export const DELETE_CAMPAIGN = gql`
  mutation DeleteCampaign($id: ID!) {
    deleteCampaign(id: $id) {
      success
      message
    }
  }
`;

export const VALIDATE_CAMPAIGN = gql`
  mutation ValidateCampaign($input: CampaignInput!) {
    validateCampaign(input: $input) {
      isValid
      errors {
        field
        message
        severity
      }
      warnings {
        field
        message
        severity
      }
    }
  }
`;

export const GET_CAMPAIGN_PREVIEW = gql`
  query GetCampaignPreview($input: CampaignInput!) {
    campaignPreview(input: $input) {
      platform
      estimatedReach
      estimatedCost {
        min
        max
      }
      recommendations
      warnings {
        field
        message
        severity
      }
    }
  }
`;

export const DUPLICATE_CAMPAIGN = gql`
  mutation DuplicateCampaign($id: ID!, $name: String!) {
    duplicateCampaign(id: $id, name: $name) {
      id
      name
      description
      status
      createdAt
      updatedAt
    }
  }
`;

// Subscription for real-time campaign updates
export const CAMPAIGN_UPDATED = gql`
  subscription CampaignUpdated($campaignId: ID!) {
    campaignUpdated(campaignId: $campaignId) {
      id
      status
      budget {
        amount
        currency
      }
      updatedAt
    }
  }
`;

// Platform-specific queries
export const GET_GOOGLE_ADS_OPTIONS = gql`
  query GetGoogleAdsOptions {
    googleAdsOptions {
      campaignTypes {
        value
        label
        description
      }
      bidStrategies {
        value
        label
        description
      }
      locations {
        id
        name
        type
        parentId
      }
      languages {
        id
        name
        code
      }
    }
  }
`;

export const GET_META_OPTIONS = gql`
  query GetMetaOptions {
    metaOptions {
      campaignTypes {
        value
        label
        description
      }
      objectives {
        value
        label
        description
      }
      optimizationGoals {
        value
        label
        description
      }
      interests {
        id
        name
        category
        audienceSize
      }
      behaviors {
        id
        name
        category
        description
      }
    }
  }
`;

export const GET_TARGETING_SUGGESTIONS = gql`
  query GetTargetingSuggestions($input: TargetingSuggestionsInput!) {
    targetingSuggestions(input: $input) {
      interests {
        id
        name
        relevanceScore
        audienceSize
      }
      keywords {
        keyword
        searchVolume
        competition
        suggestedBid
      }
      demographics {
        ageGroups {
          min
          max
          audienceSize
          performance
        }
        locations {
          id
          name
          audienceSize
          performance
        }
      }
    }
  }
`; 