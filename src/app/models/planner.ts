export interface Issues {
  [key: string]: Array<any>
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
