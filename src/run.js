// @flow

import { getState, setState } from './state';
import acquireToken from './acquire-token';

export default (launchApp: Function) => {
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
};
