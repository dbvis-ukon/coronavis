export enum CovidNumberCaseChange {
    absolute = 'abs',
  
    relative = 'rel'
  }
  
  export enum CovidNumberCaseTimeWindow {
    
    twentyFourhours = '24h',
    
    seventyTwoHours = '72h',
    
    all = 'all',
  }
  
  export enum CovidNumberCaseType {
  
    cases = 'cases',
  
    deaths = 'deaths'
  
  }
  
  export interface CovidNumberCaseOptions {
  
    enabled?: boolean;
  
    change: CovidNumberCaseChange;
  
    timeWindow: CovidNumberCaseTimeWindow;
  
    type: CovidNumberCaseType;
  
  }