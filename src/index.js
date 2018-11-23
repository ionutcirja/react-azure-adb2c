// @flow

// Note on window.msal usage.
// There is little point holding the object constructed by new Msal.UserAgentApplication
// as the constructor for this class will make callbacks to the acquireToken function
// and these occur before any local assignment can take place. Not nice but its how it works.
import required from './required';
import initialize from './init';
import run from './run';
import signOut from './sign-out';
import acquireToken from './acquire-token';
import { getState } from './state';

export default {
  initialize,
  run,
  required,
  acquireToken,
  signOut,
  getAccessToken: () => getState().accessToken,
};
