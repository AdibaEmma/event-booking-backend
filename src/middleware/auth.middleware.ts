import { Request, Response, NextFunction } from 'express';
import jwkToPem from 'jwk-to-pem';
import jwt from 'jsonwebtoken';
import fetch from 'node-fetch';

let pems: { [key: string]: any } = {}

class AuthMiddleware {
    private poolRegion: string = 'us-east-1';
    private userPoolId: string = 'us-east-1_JlUXhukul';

    constructor() {
        this.setUp()
    }

    public verifyToken(req: Request, res: Response, next: NextFunction): void {
        const token  = req.header('Auth');
        console.log(token)
        if (!token) res.status(401).end();

        let decodedJwt: any = jwt.decode(token as string, { complete: true });
        if (decodedJwt === null) {
            res.status(401).end()
            return
        }
        console.log(decodedJwt)
        let kid = decodedJwt.header.kid;
        let pem = pems[kid];
        console.log(pem)
        if (!pem) {
            res.status(401).end()
            return
        }
        jwt.verify(token as string, pem, function (err: any, payload: any) {
            if (err) {
                res.status(401).end()
                return
            } else {
                console.log(payload);
                
                next()
            }
        })
    }

    private async setUp() {
        const URL = `https://cognito-idp.${this.poolRegion}.amazonaws.com/${this.userPoolId}/.well-known/jwks.json`;

        try {
            const response = await fetch(URL);
            if (response.status !== 200) {
                throw 'request not successful'
            }
            const data = await response.json();
            const { keys } = data;
            for (let i = 0; i < keys.length; i++) {
                const key_id = keys[i].kid;
                const modulus = keys[i].n;
                const exponent = keys[i].e;
                const key_type = keys[i].kty;
                const jwk = { kty: key_type, n: modulus, e: exponent };
                const pem = jwkToPem(jwk);
                pems[key_id] = pem;
            }
            console.log("got PEMS")
        } catch (error) {
            console.log(error)
            console.log('Error! Unable to download JWKs');
        }
    }
}

export default AuthMiddleware