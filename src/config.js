// @flow

export type Config = {
  instance: string,
  tenant: string,
  signInPolicy: string,
  resetPolicy: string,
  applicationId: string,
  cacheLocation: string,
  redirectUri: string,
  postLogoutRedirectUri: string,
  scopes?: Array<string>
};

let appConfig: Config = {
  instance: '',
  tenant: '',
  signInPolicy: '',
  resetPolicy: '',
  applicationId: '',
  cacheLocation: '',
  redirectUri: '',
  postLogoutRedirectUri: '',
};

export const setConfig = (config: Config) => {
  appConfig = config;
};

export const getConfig = () => appConfig;
