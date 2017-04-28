'use strict';

import * as http from 'http';
import * as request from 'request';
import * as Q from 'q';
import { authHelper } from '../helpers/authHelper';
import { consts } from '../consts';

export class conversation {
    public static searchConversations(groupId:string, searchText:string) : Q.Promise<string> {
        let deferred: Q.Deferred<string> = Q.defer<string>();

        authHelper.getAccessToken(consts.Scopes).then((token: string) => {
            let requestHeaders: request.Headers = <request.Headers>{
                'Authorization': 'Bearer ' + token
            };
            
            let requestOptions: request.CoreOptions = <request.CoreOptions>{
                headers: requestHeaders,
                method: 'GET'
            };

            request(`https://graph.microsoft.com/v1.0/groups/${groupId}/conversations?$search=${searchText}`,
                requestOptions, (error: any, response: http.IncomingMessage, body: string) => {
                    if (error) {
                        deferred.reject(error);
                    } 
                    else {
                        deferred.resolve(JSON.parse(body));
                    }
                });
        })
        .catch((error: Error) => {
            console.error(error.message);
        })
        .finally(() => {
            console.log('Finished searchConversations');
        });

        return deferred.promise;
    }
}
