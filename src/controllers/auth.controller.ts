import { Validation } from 'aws-sdk/clients/route53resolver';
import * as express from 'express'
import { Request, Response } from 'express'
import { body, ValidationChain, validationResult } from 'express-validator';
import Cognito from '../services/cognito.service';

enum UserType {
    FAN = "fan",
    ARTIST = "artist"
}
class AuthController {
    private path = '/auth'
    private router = express.Router()


    constructor() {
        this.initRoutes()
    }

    public initRoutes() {
        this.router.post('/signin', this.validateBody('signIn') as ValidationChain[], this.signIn)
        this.router.post('/verify', this.validateBody('verify') as ValidationChain[], this.verify)
        this.router.post('/signup', this.validateBody('signUp') as ValidationChain[], this.signUp)
        this.router.post('/forgot-password', this.validateBody('forgotPassword') as ValidationChain[], this.forgotPassword)
        this.router.post('/confirm-password', this.validateBody('confirmPassword') as ValidationChain[], this.confirmPassword)
    }


    // Signup new user
    signUp = (req: Request, res: Response) => {
        const result = validationResult(req);
        if (!result.isEmpty()) {
            return res.status(422).json({ errors: result.array() });
        }
        console.log(req.body)
        const { name, username, password, email, type, birthdate } = req.body;
        let userAttr = [];
        userAttr.push({ Name: 'email', Value: email });
        userAttr.push({ Name: 'birthdate', Value: birthdate.toString() });
        userAttr.push({ Name: 'name', Value: name });
        userAttr.push({ Name: 'custom:type', Value: type });


        let cognitoService = new Cognito();
        cognitoService.signUpUser(username, password, userAttr)
            .then(success => {
                success ? res.status(200).json({
                    success
                }) : res.status(400).end()
            })
    }


    // Use username and password to authenticate user
    signIn = (req: Request, res: Response) => {
        const result = validationResult(req);
        if (!result.isEmpty()) {
            return res.status(422).json({ errors: result.array() });
        }
        console.log(req.body);


        const { username, password } = req.body;
        let cognitoService = new Cognito();
        cognitoService.signInUser(username, password)
            .then(success => {
                success ? res.status(200).json({
                    message: "Signin successfull",
                    body: success
                }) : res.status(400).json({
                    error: success
                })
            })
    }


    // confirm signup account with code sent to email
    verify = (req: Request, res: Response) => {
        const result = validationResult(req);
        if (!result.isEmpty()) {
            return res.status(422).json({ errors: result.array() });
        }
        console.log(req.body)
        const { username, code } = req.body;

        let cognitoService = new Cognito();
        cognitoService.confirmSignUp(username, code)
            .then(success => {
                success ? res.status(200).json({
                    res
                }) : res.status(400).end()
            })
    }

    confirmPassword = (req: Request, res: Response) => {
        const result = validationResult(req);
        if (!result.isEmpty()) {
            return res.status(422).json({ errors: result.array() });
        }
        const { username, password, code } = req.body;

        let cognitoService = new Cognito();
        cognitoService.confirmNewPassword(username, password, code)
            .then(success => {
                success ? res.status(200).end() : res.status(400).end()
            })
    }

    forgotPassword = (req: Request, res: Response) => {
        const result = validationResult(req);
        if (!result.isEmpty()) {
            return res.status(422).json({ errors: result.array() });
        }
        const { username } = req.body;

        let cognitoService = new Cognito();
        cognitoService.forgotPassword(username)
            .then(success => {
                success ? res.status(200).end() : res.status(400).end()
            });
    }

    private validateBody(type: string) {
        switch (type) {
            case 'signUp':
                return [
                    body('username').notEmpty().isLength({ min: 5 }),
                    body('name').notEmpty().isLength({ min: 5 }),
                    body('email').notEmpty().normalizeEmail().isEmail(),
                    body('password').isString().isLength({ min: 8 }),
                    body('birthdate').exists().isISO8601(),
                    body('type').notEmpty().isString(),
                ]
            case 'signIn':
                return [
                    body('username').notEmpty().isLength({ min: 5 }),
                    body('password').isString().isLength({ min: 8 }),
                ]
            case 'verify':
                return [
                    body('username').notEmpty().isLength({ min: 5 }),
                    body('code').notEmpty().isString().isLength({ min: 6, max: 6 })
                ]
            case 'forgotPassword':
                return [
                    body('username').notEmpty().isLength({ min: 5 }),
                ]
            case 'confirmPassword':
                return [
                    body('password').exists().isLength({ min: 8 }),
                    body('username').notEmpty().isLength({ min: 5 }),
                    body('code').notEmpty().isString().isLength({ min: 6, max: 6 })
                ]
        }
    }
}

export default AuthController