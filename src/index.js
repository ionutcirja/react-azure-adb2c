// @flow

// Note on window.msal usage.
// There is little point holding the object constructed by new Msal.UserAgentApplication
// as the constructor for this class will make callbacks to the acquireToken function
// and these occur before any local assignment can take place. Not nice but its how it works.
import * as Msal from 'msal';
import React, { Component } from 'react';

let appConfig = {
  instance: null,
  tenant: null,
  signInPolicy: null,
  resetPolicy: null,
  applicationId: null,
  cacheLocation: null,
  redirectUri: null,
  postLogoutRedirectUri: null,
};

const state = {
  stopLoopingRedirect: false,
  launchApp: null,
  accessToken: null,
  scopes: [],
};

type LogLevel = {
  level: string,
};

function loggerCallback(logLevel: LogLevel, message: string) {
  console.log(message);
}

const logger = new Msal.Logger(loggerCallback, { level: Msal.LogLevel.Warning });

function acquireToken(successCallback: Function) {
  const localMsalApp = window.msal;
  const user = localMsalApp.getUser(state.scopes);
  if (!user) {
    localMsalApp.loginRedirect(state.scopes);
  } else {
    localMsalApp
      .acquireTokenSilent(state.scopes)
      .then(
        (accessToken) => {
          state.accessToken = accessToken;
          if (state.launchApp) {
            state.launchApp();
          }
          if (successCallback) {
            successCallback();
          }
        },
        (error) => {
          if (error) {
            localMsalApp.acquireTokenRedirect(state.scopes);
          }
        },
      );
  }
}

function redirect() {
  const localMsalApp = window.msal;
  localMsalApp.authority = `https://login.microsoftonline.com/tfp/${appConfig.tenant}/${appConfig.resetPolicy}`;
  acquireToken();
}

function authCallback(errorDesc: string, token: string, error: string) {
  if (errorDesc && errorDesc.indexOf('AADB2C90118') > -1) {
    redirect();
  } else if (errorDesc) {
    console.log(`${error}:${errorDesc}`);
    state.stopLoopingRedirect = true;
  } else {
    acquireToken();
  }
}

const authentication = {
  initialize: (config) => {
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
  run: (launchApp) => {
    state.launchApp = launchApp;
    if (!window.msal.isCallback(window.location.hash)
      && window.parent === window && !window.opener) {
      if (!state.stopLoopingRedirect) {
        acquireToken();
      }
    }
  },
  required: (WrappedComponent, renderLoading) => {
    type Props = {
      [key: string]: any,
    }

    type State = {
      signedIn: boolean,
    };

    return class extends Component<Props, State> {
      state = {
        signedIn: false,
      };

      constructor(props) {
        super(props);
        acquireToken(() => {
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
