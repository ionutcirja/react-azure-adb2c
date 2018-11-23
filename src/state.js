// @flow
type State = {
  stopLoopingRedirect: boolean,
  launchApp: Function | null,
  accessToken: string | null,
  scopes?: Array<string>,
};

let appState: State = {
  stopLoopingRedirect: false,
  launchApp: null,
  accessToken: null,
  scopes: [],
};

export const getState = () => appState;

export const setState = (state: State) => {
  appState = {
    ...appState,
    ...state,
  };
};
