import { range } from 'lodash';

export interface Version {
  id: number;
  name: string;
  released: boolean;
}

export interface Issue {
  id: string;
  key: string;
  fields: { [name: string]: any }
}

export interface User {
  key: string;
  displayName: string;
}

export const quarterRegEx = (year: string, q: number) => {
  const start = q*3-2;
  const quarters = range(start, start+3).map(n=>n.toString().padStart(2,'0'));
  return new RegExp(`^${year}(${quarters.join('|')}| Q${q})`)
}