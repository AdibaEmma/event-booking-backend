import * as express from 'express'
import { Request, Response } from 'express'
import Cognito from '../services/cognito.service';

class EventController {
    public path = '/'
    public router = express.Router()

    constructor() {
        this.initRoutes()
    }

    public initRoutes() {
        this.router.get('/events', this.events)
    }

    events = (req: Request, res: Response) => {
        res.send("success")
    }
}

export default EventController