// @flow
import * as Msal from 'msal';

type LogLevel = {
  level: string,
};

function loggerCallback(logLevel: LogLevel, message: string) {
  console.log(message);
}

export default new Msal.Logger(loggerCallback, { level: Msal.LogLevel.Warning });
