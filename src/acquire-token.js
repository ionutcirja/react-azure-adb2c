/* eslint-disable consistent-return */
// @flow
export default (scopes: Array<string>) => {
  const localMsalApp = window.msal;
  const user = localMsalApp.getUser(scopes);
  if (!user) {
    localMsalApp.loginRedirect(scopes);
    return;
  }

  return new Promise((resolve, reject) => {
    localMsalApp
      .acquireTokenSilent(scopes)
      .then(
        (accessToken: string) => {
          resolve(accessToken);
        },
        (error: any) => {
          if (error) {
            localMsalApp.acquireTokenRedirect(scopes);
            reject(error);
          }
        },
      );
  });
};
