import 'whatwg-fetch';
import { backendLogger } from './backend.logger';
import {
  throwUnauthorisedError,
  throwPermissionDeniedError,
} from './backend.actions';
import { getCookie } from './browser-cookie';
import { dispatch } from '../redux';

const Config = {
  API_BASE: '',
  AUTH_TOKEN_COOKIE_NAME: undefined, //'AUTH_TOKEN',
  // The value of this header will be checked by server. If missing, server will return 401 for
  // restricted access API
  AUTH_TOKEN_HEADER: undefined, // 'N1-Api-Key',
};

/**
 * Common API request properties
 * @type {{headers: {Content-Type: string}, credentials: string}}
 */
export const API_REQUEST_PROPERTIES = {
  headers: {
    'Content-Type': 'application/json',
  },

  credentials: 'include',
};

export function config(config) {
  for (var k of Object.keys(Config)) {
    if (config[k]) {
      Config[k] = config[k];
    }
  }
}

/**
 * Unwrap data
 * @param response
 * @returns {Object}
 */
function unwrapData(response) {
  // Handle no content because response.json() doesn't handle it
  if (response.status === 204) {
    return {};
  }

  return response.json();
}

/**
 * Check the response from the server
 * Log and throw the error if response status is a HTTP error code, since client code might be
 * interested to deal with these errors
 *
 * @param url
 * @param response
 * @param silent If true, there won't be any logging
 * @returns {*}
 * @throws Error
 */
async function checkStatusOrThrowError(url, response, silent) {
  if (response.status >= 200 && response.status < 300) {
    return response;
  }

  // don't throw or log any error
  if (!silent) {
    if (response.status === 401) {
      throwUnauthorisedError();
    } else if (response.status === 403) {
      throwPermissionDeniedError();
    }

    backendLogger.error(`Request for '${url}' failed`, response);
  }

  // Client code might be interested in doing something with the error, and the original response
  const error = new Error(response.statusText);

  try {
    error.response = await response.json();
    error.status = response.status;
  } catch (e) {
    // ignoring the error of getting json data from response
    error.response = response;
  }

  throw error;
}

/**
 * @param apiUrl Should contain a leading "/"
 * @param request
 * @param silent If true, there won't be any logging
 * @returns {Promise} - NOTE: Error has been logged
 */
export function fetchApi(apiUrl, request, silent) {
  const fullApiUrl = `${Config.API_BASE}${apiUrl}`;

  // Need to stringtify JSON object
  const tmpRequest = request;
  if (tmpRequest && tmpRequest.body && typeof (tmpRequest.body) !== 'string') {
    tmpRequest.body = JSON.stringify(tmpRequest.body);
  }

  const requestProperties = {
    ...API_REQUEST_PROPERTIES,
    ...tmpRequest,
  };

  if (Config.AUTH_TOKEN_COOKIE_NAME) {
    const apiAuthToken = getCookie(Config.AUTH_TOKEN_COOKIE_NAME);
    if (apiAuthToken) {
      requestProperties.headers[Config.AUTH_TOKEN_HEADER] = apiAuthToken;
    }
  }

  // NOTE: The Promise returned from fetch() won't reject on HTTP error status even if the response
  // is an HTTP 404 or 500
  return fetch(fullApiUrl, requestProperties)
    .then(response => checkStatusOrThrowError(fullApiUrl, response, silent))
    .then(unwrapData);
}

/**
 * @param error
 * @returns {boolean} True if there is a problem connecting to the API
 */
export function isConnectionError(error) {
  const INTERNAL_FETCH_ERROR = 'Failed to fetch';
  return error && error.message === INTERNAL_FETCH_ERROR;
}

/**
 * Returns a convenience function for common backend interaction. It starts by 
 * dispatching an action of type `getAction`. It then sends a GET request
 * to a specific url and dispatches the result in an action of type `replyAction`.
 * If the http request fails, an action with type `errorAction` is dispatched.
 * 
 * The result of the http request is added to the `replyAction` under the `result`
 * key, while the error is added under the `error` key.
 * 
 * If the first parameter is a string, then it is used for any subsequent requests. 
 * However, if the first parameter is a function, then this function is called with
 * all paramters provided to the activating function and is expected to return the 
 * calling url as a string. In addition, the first parameter to the activating function
 * is interpreted as an `id` and is added to all actions under the `id` key.
 * 
 * @param {string|function} urlOrFunc 
 * @param {string} getAction 
 * @param {string} replyAction 
 * @param {string} errorAction 
 */
export function backendGET(urlOrFunc, getAction, replyAction, errorAction) {
  const isFunc = urlOrFunc instanceof Function;
  return (id, ...args) => {
    const url = isFunc ? urlOrFunc(id, ...args) : urlOrFunc;

    const p =  { type: getAction };
    if (id) p.id = id;
    dispatch(p);

    fetchApi(url, {
      method: 'GET',
    }).then((reply) => {
      const p = {
        type: replyAction,
        reply,
      };
      if (id) p.id = id;
      dispatch(p);
    }).catch(error => {
      const p = {
        type: errorAction,
        error,
      }
      if (id) p.id = id;
      dispatch(p);
    });
  }
}
