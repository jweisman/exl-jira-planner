export interface Version {
  id: number;
  name: string;
}

export interface Issue {
  id: string;
  key: string;
  fields: { [name: string]: any }
}