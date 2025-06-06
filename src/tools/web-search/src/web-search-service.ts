import { DefaultAzureCredential } from '@azure/identity';
import { SpanStatusCode } from '@opentelemetry/api';
import { log, tracer, meter } from './instrumentation.js';

interface SearchOptions {
  count?: number;
  offset?: number;
  market?: string;
  freshness?: string;
}

interface TravelInfo {
  priceIndicators: string[];
  locationMentions: string[];
  activityTypes: string[];
  ratings: string[];
}

interface ProcessedResult {
  title: string;
  url: string;
  snippet: string;
  dateLastCrawled?: string;
  displayUrl: string;
  travelRelevance: number;
  extractedInfo: TravelInfo;
}

interface SearchResult {
  query: string;
  results: ProcessedResult[];
  totalEstimatedMatches: number;
  metadata: {
    searchTime: number;
    market?: string;
    freshness?: string;
  };
}

interface BingSearchResponse {
  webPages?: {
    value?: Array<{
      name: string;
      url: string;
      snippet: string;
      dateLastCrawled?: string;
      displayUrl: string;
    }>;
    totalEstimatedMatches?: number;
  };
}

export class WebSearchService {
  private subscriptionKey: string;
  private endpoint: string;
  private searchCounter = meter.createCounter('web_searches_total');
  private searchDuration = meter.createHistogram('web_search_duration_ms');
  
  constructor() {
    this.subscriptionKey = process.env.BING_SEARCH_SUBSCRIPTION_KEY || '';
    this.endpoint = process.env.BING_SEARCH_ENDPOINT || 'https://api.bing.microsoft.com/v7.0/search';
    
    if (!this.subscriptionKey) {
      throw new Error('BING_SEARCH_SUBSCRIPTION_KEY environment variable is required');
    }
  }
  
  async searchTravel(query: string, options: SearchOptions = {}): Promise<SearchResult> {
    const span = tracer.startSpan('search_travel');
    const startTime = Date.now();
    
    try {
      log(`Starting travel search for query: ${query}`, { options });

      // Enhance query with travel context
      const enhancedQuery = this.enhanceQueryForTravel(query);
      
      // Perform Bing search using REST API
      const searchResponse = await this.performBingSearch(enhancedQuery, options);
      
      log(`Bing search completed`, { 
        totalResults: searchResponse.webPages?.totalEstimatedMatches || 0,
        returnedResults: searchResponse.webPages?.value?.length || 0
      });
      
      // Process and filter results
      const processedResults = this.processSearchResults(searchResponse, query);
      
      // Apply travel-specific scoring
      const scoredResults = this.scoreForTravelRelevance(processedResults);
      
      this.searchCounter.add(1, { status: 'success', type: 'travel' });
      span.setStatus({ code: SpanStatusCode.OK });
      
      const result = {
        query: enhancedQuery,
        results: scoredResults,
        totalEstimatedMatches: searchResponse.webPages?.totalEstimatedMatches || 0,
        metadata: {
          searchTime: Date.now() - startTime,
          market: options.market,
          freshness: options.freshness
        }
      };
      
      log(`Travel search completed successfully`, { 
        resultsCount: result.results.length,
        searchTime: result.metadata.searchTime 
      });
      
      return result;
      
    } catch (error) {
      log(`Error during travel search: ${(error as Error).message}`, { query, options });
      this.searchCounter.add(1, { status: 'error', type: 'travel' });
      span.setStatus({ code: SpanStatusCode.ERROR, message: (error as Error).message });
      throw error;
    } finally {
      this.searchDuration.record(Date.now() - startTime);
      span.end();
    }
  }
  
  private async performBingSearch(query: string, options: SearchOptions): Promise<BingSearchResponse> {
    const params = new URLSearchParams();
    params.append('q', query);
    params.append('count', String(options.count || 10));
    params.append('offset', String(options.offset || 0));
    params.append('mkt', options.market || 'en-US');
    params.append('safeSearch', 'Moderate');
    if (options.freshness) {
      params.append('freshness', options.freshness);
    }

    const url = `${this.endpoint}?${params.toString()}`;
    
    const response = await fetch(url, {
      headers: {
        'Ocp-Apim-Subscription-Key': this.subscriptionKey,
        'Accept': 'application/json',
        'User-Agent': 'azure-ai-travel-agents/1.0.0'
      }
    });

    if (!response.ok) {
      throw new Error(`Bing Search API error: ${response.status} ${response.statusText}`);
    }

    return await response.json() as BingSearchResponse;
  }
  
  private enhanceQueryForTravel(query: string): string {
    // Add travel-specific context to improve results
    const travelKeywords = [
      'travel', 'tourism', 'vacation', 'trip', 'visit',
      'destination', 'attractions', 'hotels', 'flights'
    ];
    
    const hasTravel = travelKeywords.some(keyword => 
      query.toLowerCase().includes(keyword)
    );
    
    if (!hasTravel) {
      return `${query} travel tourism vacation`;
    }
    
    return query;
  }
  
  private processSearchResults(searchResponse: BingSearchResponse, originalQuery: string): ProcessedResult[] {
    const results = searchResponse.webPages?.value || [];
    
    return results.map((result: any) => ({
      title: result.name,
      url: result.url,
      snippet: result.snippet,
      dateLastCrawled: result.dateLastCrawled,
      displayUrl: result.displayUrl,
      travelRelevance: this.calculateTravelRelevance(result, originalQuery),
      extractedInfo: this.extractTravelInfo(result)
    }));
  }
  
  private scoreForTravelRelevance(results: ProcessedResult[]): ProcessedResult[] {
    // Sort by travel relevance score (highest first)
    return results.sort((a, b) => b.travelRelevance - a.travelRelevance);
  }
  
  private calculateTravelRelevance(result: any, query: string): number {
    let score = 0;
    
    // Travel domain indicators
    const travelDomains = [
      'tripadvisor', 'booking.com', 'expedia', 'airbnb',
      'hotels.com', 'kayak', 'skyscanner', 'lonely-planet',
      'travel', 'tourism', 'visitbritain', 'lonelyplanet'
    ];
    
    const url = result.url.toLowerCase();
    const title = result.name.toLowerCase();
    const snippet = result.snippet.toLowerCase();
    
    // Domain scoring (high weight)
    for (const domain of travelDomains) {
      if (url.includes(domain)) {
        score += 0.3;
        break;
      }
    }
    
    // Title keyword scoring
    const travelTerms = [
      'hotel', 'flight', 'attraction', 'restaurant', 'tour',
      'travel', 'visit', 'vacation', 'holiday', 'destination',
      'guide', 'things to do', 'where to stay', 'best places'
    ];
    
    for (const term of travelTerms) {
      if (title.includes(term)) score += 0.1;
      if (snippet.includes(term)) score += 0.05;
    }
    
    // Query relevance (exact matches get higher score)
    const queryWords = query.toLowerCase().split(' ');
    for (const word of queryWords) {
      if (word.length > 2) { // Skip short words
        if (title.includes(word)) score += 0.15;
        if (snippet.includes(word)) score += 0.1;
      }
    }
    
    // Price indicators suggest commercial travel content
    const priceIndicators = ['$', '£', '€', 'price', 'cost', 'from', 'starting'];
    for (const indicator of priceIndicators) {
      if (snippet.includes(indicator)) {
        score += 0.05;
        break;
      }
    }
    
    return Math.min(score, 1.0);
  }
  
  private extractTravelInfo(result: any): TravelInfo {
    const snippet = result.snippet.toLowerCase();
    
    return {
      priceIndicators: this.extractPrices(snippet),
      locationMentions: this.extractLocations(snippet),
      activityTypes: this.extractActivities(snippet),
      ratings: this.extractRatings(snippet)
    };
  }
  
  private extractPrices(text: string): string[] {
    const pricePatterns = [
      /\$\d+(?:,\d{3})*(?:\.\d{2})?/g,
      /£\d+(?:,\d{3})*(?:\.\d{2})?/g,
      /€\d+(?:,\d{3})*(?:\.\d{2})?/g,
      /from \$?\d+/gi,
      /starting at \$?\d+/gi
    ];
    
    const prices: string[] = [];
    for (const pattern of pricePatterns) {
      const matches = text.match(pattern);
      if (matches) {
        prices.push(...matches);
      }
    }
    
    return prices;
  }
  
  private extractLocations(text: string): string[] {
    // Simple location extraction - in a real implementation, 
    // you might use a proper NER service
    const locationPatterns = [
      /in [A-Z][a-z]+(?:,?\s[A-Z][a-z]+)*/g,
      /to [A-Z][a-z]+(?:,?\s[A-Z][a-z]+)*/g,
    ];
    
    const locations: string[] = [];
    for (const pattern of locationPatterns) {
      const matches = text.match(pattern);
      if (matches) {
        locations.push(...matches.map(match => match.replace(/^(in|to)\s/, '')));
      }
    }
    
    return locations;
  }
  
  private extractActivities(text: string): string[] {
    const activities = [
      'dining', 'restaurant', 'hotel', 'accommodation', 'museum',
      'tour', 'sightseeing', 'shopping', 'beach', 'hiking',
      'skiing', 'swimming', 'entertainment', 'nightlife'
    ];
    
    return activities.filter(activity => text.includes(activity));
  }
  
  private extractRatings(text: string): string[] {
    const ratingPatterns = [
      /\d+(\.\d+)?\s*\/\s*\d+/g,
      /\d+(\.\d+)?\s*stars?/gi,
      /rated\s+\d+(\.\d+)?/gi
    ];
    
    const ratings: string[] = [];
    for (const pattern of ratingPatterns) {
      const matches = text.match(pattern);
      if (matches) {
        ratings.push(...matches);
      }
    }
    
    return ratings;
  }
}