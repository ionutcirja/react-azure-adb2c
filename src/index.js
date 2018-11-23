// @flow

// Note on window.msal usage.
// There is little point holding the object constructed by new Msal.UserAgentApplication
// as the constructor for this class will make callbacks to the acquireToken function
// and these occur before any local assignment can take place. Not nice but its how it works.
import * as Msal from 'msal';
import React, { Component } from 'react';
import type { ComponentType } from 'react';
import logger from './logger';
import acquireToken from './acquire-token';

type Config = {
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

type State = {
  stopLoopingRedirect: boolean,
  launchApp: Function | null,
  accessToken: string | null,
  scopes?: Array<string>,
};

const state: State = {
  stopLoopingRedirect: false,
  launchApp: null,
  accessToken: null,
  scopes: [],
};

function redirect() {
  const localMsalApp = window.msal;
  localMsalApp.authority = `https://login.microsoftonline.com/tfp/${appConfig.tenant}/${appConfig.resetPolicy}`;
  acquireToken(state.scopes).then((accessToken: string) => {
    state.accessToken = accessToken;
    if (state.launchApp) {
      state.launchApp();
    }
  });
}

function authCallback(errorDesc: string, token: string, error: string) {
  if (errorDesc && errorDesc.indexOf('AADB2C90118') > -1) {
    redirect();
  } else if (errorDesc) {
    console.log(`${error}:${errorDesc}`);
    state.stopLoopingRedirect = true;
  } else {
    acquireToken(state.scopes).then((accessToken: string) => {
      state.accessToken = accessToken;
      if (state.launchApp) {
        state.launchApp();
      }
    });
  }
}

const authentication = {
  initialize: (config: Config) => {
    appConfig = config;
    const instance = config.instance ? config.instance : 'https://login.microsoftonline.com/tfp/';
    const authority = `${instance}${config.tenant}/${config.signInPolicy}`;
    const { scopes } = config;
    if (!scopes || scopes.length === 0) {
      console.log('To obtain access tokens you must specify one or more scopes. '
        + 'See https://docs.microsoft.com/en-us/azure/active-directory-b2c/active-directory-b2c-access-tokens');
      state.stopLoopingRedirect = true;
    }
    state.scopes = scopes;
    
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
    state.launchApp = launchApp;
    if (!window.msal.isCallback(window.location.hash)
      && window.parent === window && !window.opener) {
      if (!state.stopLoopingRedirect) {
        acquireToken(state.scopes).then((accessToken: string) => {
          state.accessToken = accessToken;
          if (state.launchApp) {
            state.launchApp();
          }
        });
      }
    }
  },
  required: (WrappedComponent: ComponentType<any>, renderLoading: Function) => {
    type CProps = {
      [key: string]: any,
    }

    type CState = {
      signedIn: boolean,
    };

    return class extends Component<CProps, CState> {
      state = {
        signedIn: false,
      };

      constructor(props: CProps) {
        super(props);

        acquireToken(state.scopes).then((accessToken: string) => {
          state.accessToken = accessToken;
          if (state.launchApp) {
            state.launchApp();
          }

          this.setState({
            signedIn: true,
          });
        });
      }

      render() {
        const { signedIn } = this.state;
        if (signedIn) {
          return (<WrappedComponent {...this.props} />);
        }
        return typeof renderLoading === 'function' ? renderLoading() : null;
      }
    };
  },
  signOut: () => window.msal.logout(),
  getAccessToken: () => state.accessToken,
};

export default authentication;
