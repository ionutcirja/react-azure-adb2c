// @flow
import React, { Component } from 'react';
import type { ComponentType } from 'react';
import acquireToken from './acquire-token';
import { getState, setState } from './state';

export default (WrappedComponent: ComponentType<any>, renderLoading: Function) => {
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

      const { scopes, launchApp } = getState();
      acquireToken(scopes)
        .then((accessToken: string) => {
          setState({ accessToken });
          if (launchApp) {
            launchApp();
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
};
