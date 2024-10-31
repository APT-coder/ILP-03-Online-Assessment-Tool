//Auth-config.ts
import {
    LogLevel,
    Configuration,
    BrowserCacheLocation,
} from '@azure/msal-browser';

export const msalConfig: Configuration = {
    auth: {
        clientId: '3e9c1906-7312-4d14-9d96-d7f3482190d1', 
        authority: 'https://login.microsoftonline.com/5b751804-232f-410d-bb2f-714e3bb466eb', 
        redirectUri: 'https://online-assessment-tool-frontend.vercel.app/',
        postLogoutRedirectUri: 'https://online-assessment-tool-frontend.vercel.app/',
    },
    cache: {
        cacheLocation: BrowserCacheLocation.LocalStorage,
    },
    system: {
        loggerOptions: {
            loggerCallback(logLevel: LogLevel, message: string) {
                // console.log(message);
            },
            logLevel: LogLevel.Verbose,
            piiLoggingEnabled: false,
        },
    },
};

export const loginRequest = {
    scopes: [],
};

export const apiConfig = {
    scopes: ['user.read'],
    uri: 'https://graph.microsoft.com/v1.0/me',
};
 