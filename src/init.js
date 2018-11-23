// @flow
import * as Msal from 'msal';
import type { Config } from './config';
import { getConfig, setConfig } from './config';
import { getState, setState } from './state';
import logger from './logger';
import acquireToken from './acquire-token';

const redirect = () => {
  const localMsalApp = window.msal;
  const { tenant, resetPolicy } = getConfig();
  localMsalApp.authority = `https://login.microsoftonline.com/tfp/${tenant}/${resetPolicy}`;
  const { scopes, launchApp } = getState();
  acquireToken(scopes)
    .then((accessToken: string) => {
      setState({ accessToken });
      if (launchApp) {
        launchApp();
      }
    });
};

const authCallback = (errorDesc: string, token: string, error: string) => {
  if (errorDesc && errorDesc.indexOf('AADB2C90118') > -1) {
    redirect();
  } else if (errorDesc) {
    console.log(`${error}:${errorDesc}`);
    setState({ stopLoopingRedirect: true });
  } else {
    const { scopes, launchApp } = getState();
    acquireToken(scopes)
      .then((accessToken: string) => {
        setState({ accessToken });
        if (launchApp) {
          launchApp();
        }
      });
  }
};

export default (config: Config) => {
  setConfig(config);
  const instance = config.instance ? config.instance : 'https://login.microsoftonline.com/tfp/';
  const authority = `${instance}${config.tenant}/${config.signInPolicy}`;
  const { scopes } = config;
  if (!scopes || scopes.length === 0) {
    console.log('To obtain access tokens you must specify one or more scopes. '
      + 'See https://docs.microsoft.com/en-us/azure/active-directory-b2c/active-directory-b2c-access-tokens');
    setState({ stopLoopingRedirect: true });
  }
  setState({ scopes });

  new Msal.UserAgentApplication( // eslint-disable-line no-new
    config.applicationId,
    authority,
    authCallback,
    {
      logger,
      cacheLocation: config.cacheLocation,
      postLogoutRedirectUri: config.postLogoutRedirectUri,
      redirectUri: config.redirectUri,
    },
  );
};
