export class Preferences {
  numOfVersions = 9;
  threshold = new Threshold();
  includeBuckets = false; 
}

export class Threshold {
  green = 1
  red = 1.1
}