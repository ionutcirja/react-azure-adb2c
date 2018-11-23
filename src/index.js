// @flow

// Note on window.msal usage.
// There is little point holding the object constructed by new Msal.UserAgentApplication
// as the constructor for this class will make callbacks to the acquireToken function
// and these occur before any local assignment can take place. Not nice but its how it works.
import acquireToken from './acquire-token';
import required from './required';
import initialize from './init';
import { getState, setState } from './state';

const authentication = {
  initialize,
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
