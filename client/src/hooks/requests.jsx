import useSWRMutation from 'swr/mutation';
import useSWR from 'swr';

import config from '../config';

const REQUEST_METHOD = {
  POST: 'post',
  PUT: 'put',
  DELETE: 'delete',
};

const getRequestFetcher = (url, init) => {
  return fetch(url, init).then((res) => res.json());
};

export const useGetRequest = (url, requestConfig) => useSWR(config.apiEndpoint + url, getRequestFetcher, requestConfig);
export const useBinanceRequest = (url) => useSWR(config.binanceApi + url, getRequestFetcher);
export const useBinanceFutRequest = (url) => useSWR(config.binanceFutApi + url, getRequestFetcher);


const createPostOrPutFetcher = (requestMethod) => {
  return async (url, { arg }) => {
    const res = await fetch(url, {
      method: requestMethod,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(arg),
    });

    if (!res.ok) {
      const body = await res.json();
      const error = new Error(body.error);
      throw error;
    }

    return res.json();
  };
};

// https://swr.vercel.app/docs/global-configuration
export const usePostRequest = (url) =>
  useSWRMutation(config.apiEndpoint + url, createPostOrPutFetcher(REQUEST_METHOD.POST));
export const usePutRequest = (url) =>
  useSWRMutation(config.apiEndpoint + url, createPostOrPutFetcher(REQUEST_METHOD.PUT));
export const useDeleteRequest = (url) =>
  useSWRMutation(config.apiEndpoint + url, createPostOrPutFetcher(REQUEST_METHOD.DELETE));
