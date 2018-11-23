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
  validateAuthority: boolean,
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
  validateAuthority: true,
};

export const setConfig = (config: Config) => {
  appConfig = config;
};

export const getConfig = () => appConfig;
