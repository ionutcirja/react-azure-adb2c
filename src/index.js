// @flow

// Note on window.msal usage.
// There is little point holding the object constructed by new Msal.UserAgentApplication
// as the constructor for this class will make callbacks to the acquireToken function
// and these occur before any local assignment can take place. Not nice but its how it works.
import * as Msal from 'msal';
import logger from './logger';
import acquireToken from './acquire-token';
import required from './required';
import { setConfig, getConfig } from './config';
import type { Config } from './config';
import { getState, setState } from './state';

function redirect() {
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
}

function authCallback(errorDesc: string, token: string, error: string) {
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
}

const authentication = {
  initialize: (config: Config) => {
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
  },
  run: (launchApp: Function) => {
    setState({ launchApp });
    const { stopLoopingRedirect, scopes } = getState();
    if (!window.msal.isCallback(window.location.hash)
      && window.parent === window && !window.opener) {
      if (!stopLoopingRedirect) {
        acquireToken(scopes)
          .then((accessToken: string) => {
            setState({ accessToken });
            if (launchApp) {
              launchApp();
            }
          });
      }
    }
  },
  required,
  signOut: () => window.msal.logout(),
  getAccessToken: () => getState().accessToken,
};

export default authentication;
