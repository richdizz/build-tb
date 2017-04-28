'use strict';

import * as http from 'http';
import * as request from 'request';
import * as Q from 'q';
import { consts } from '../consts';

export class sentiment {
    public static getSentiment(id:string, text:string) : Q.Promise<string> {
        let deferred: Q.Deferred<string> = Q.defer<string>();
        let payload: any = { "documents": [{ "language": "en-us", "id": id, "text": text }] };

        let requestHeaders: request.Headers = <request.Headers>{
            'Content-type': 'application/json',
            'Ocp-Apim-Subscription-Key': consts.CognitiveServicesSubscriptionKey
        };
        
        let requestOptions: request.CoreOptions = <request.CoreOptions>{
            headers: requestHeaders,
            method: 'POST',
            body: JSON.stringify(payload)
        };

        request('https://westus.api.cognitive.microsoft.com/text/analytics/v2.0/sentiment',
            requestOptions, (error: any, response: http.IncomingMessage, body: string) => {
                if (error) {
                    deferred.reject(error);
                } 
                else {
                    let sentimentResponse: any = JSON.parse(body);
                    deferred.resolve(sentimentResponse.documents[0].score);
                }
            });

        return deferred.promise;
    }
}
