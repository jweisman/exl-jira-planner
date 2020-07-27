/*
* Adapted from https://medium.com/@admin_87321/extending-angular-httpclient-6b33a7a1a4d0
*/

import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { OAuthSettings } from '../models/planner';

export interface IRequestOptions {
  headers?: HttpHeaders;
  observe?: 'body';
  params?: HttpParams;
  reportProgress?: boolean;
  responseType?: 'json';
  withCredentials?: boolean;
  body?: any;
}

export function jiraHttpClientCreator(http: HttpClient) {
  return new JiraHttpClient(http);
}

const JIRA_PROXY = environment.jiraProxy;
const JIRA_API_PATH = '/rest/api/2';

@Injectable()
export class JiraHttpClient {
  auth: OAuthSettings;

  // Extending the HttpClient through the Angular DI.
  public constructor(public http: HttpClient) {
    // If you don't want to use the extended versions in some cases you can access the public property and use the original one.
    // for ex. this.httpClient.http.get(...)
  }

  /**
   * GET request
   * @param {string} endPoint it doesn't need / in front of the end point
   * @param {IRequestOptions} options options of the request like headers, body, etc.
   * @returns {Observable<T>}
   */
  public get<T>(endPoint: string, options?: IRequestOptions): Observable<T> {
    return this.http.get<T>(this.checkUrl(endPoint), this.fixOptions(options));
  }

  /**
   * POST request
   * @param {string} endPoint end point of the api
   * @param {Object} params body of the request.
   * @param {IRequestOptions} options options of the request like headers, body, etc.
   * @returns {Observable<T>}
   */
  public post<T>(endPoint: string, params: Object, options?: IRequestOptions): Observable<T> {
    return this.http.post<T>(this.checkUrl(endPoint), params, this.fixOptions(options));
  }

  /**
   * PUT request
   * @param {string} endPoint end point of the api
   * @param {Object} params body of the request.
   * @param {IRequestOptions} options options of the request like headers, body, etc.
   * @returns {Observable<T>}
   */
  public put<T>(endPoint: string, params: Object, options?: IRequestOptions): Observable<T> {
    return this.http.put<T>(this.checkUrl(endPoint), params, this.fixOptions(options));
  }

  /**
   * DELETE request
   * @param {string} endPoint end point of the api
   * @param {IRequestOptions} options options of the request like headers, body, etc.
   * @returns {Observable<T>}
   */
  public delete<T>(endPoint: string, options?: IRequestOptions): Observable<T> {
    return this.http.delete<T>(this.checkUrl(endPoint), this.fixOptions(options));
  }

  checkUrl = (uri: string) => {
    let url = new URL(uri, JIRA_PROXY);
    if (!url.pathname.startsWith('/rest')) url.pathname = JIRA_API_PATH + url.pathname;
    return JIRA_PROXY + url.pathname + url.search;
  }

  fixOptions = (options: IRequestOptions | null ) => {
    if (!options) options = {};
    if (!options.headers) options.headers = new HttpHeaders();
    if (this.auth) {
      options.headers = options.headers.set('X-OAuth-Token', this.auth.token)
      .set('X-OAuth-Secret', this.auth.secret);
    }
    return options;
  }
}