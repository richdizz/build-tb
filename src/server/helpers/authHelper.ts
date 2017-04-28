'use strict';

import * as http from 'http';
import * as request from 'request';
import * as Q from 'q';

export class authHelper {
    public static getAccessToken(scopes:string[]) : Q.Promise<string> {
        let deferred: Q.Deferred<string> = Q.defer<string>();
        

        return deferred.promise;
    }
}
