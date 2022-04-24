import * as express from 'express'
import { Request, Response, Router } from 'express'

import { ddbClient } from "../db";
import Cognito from '../services/cognito.service';

class EventController {
    private path: string = '/events'
    private router: Router = express.Router()
    private eventsTable: string = "EventsTable"


    constructor() {
        this.initRoutes()
    }

    public initRoutes() {
        this.router.post('/create', this.createEvent)
        this.router.post('/{eventId}/book', this.bookEvent)
    }

    createEvent = async (req: Request, res: Response) => {

        try {
            const body = JSON.parse(req.body);
            const result = await ddbClient.put({
                TableName: this.eventsTable,
                Item: body,
            })

            res.status(201).json({
                result
            })
        } catch (error) {
            res.send(error)
        }

    }
    bookEvent = (req: Request, res: Response) => {
        res.send("success")
    }
}

export default EventController