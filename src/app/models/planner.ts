import { Issue } from './jira';

export interface Issues {
  [key: string]: Array<Issue>
}

export interface Teams { 
  [key: string]: { 
    displayName: string; 
    capacity: { [key: string]: string }
  }
}

export interface Capacity {
  [key: string]: { [key: string]: string }
}

export interface OAuthSettings {
  token: string,
  secret: string
}

export const statusColors = {
  green: '#04ff00ad',
  yellow: '#ffd400ad',
  red: '#ff0000ad'
}