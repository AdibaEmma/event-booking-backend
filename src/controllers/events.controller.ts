import * as express from 'express'
import { Request, Response, Router } from 'express'

import { ddbClient } from "../db";
import AuthMiddleware from '../middleware/auth.middleware';
import { fetchProductById, handleError, eventSchema, attendeeSchema, headers } from '../handlers';

class EventController {
    private path: string = '/events'
    private router: Router = express.Router()
    private eventsTable: string = "EventsTable"
    private authMiddleware;

    constructor() {
        this.authMiddleware = new AuthMiddleware();
        this.initRoutes()
    }

    public initRoutes() {
        this.router.use(this.authMiddleware.verifyToken)
        this.router.post('/create', this.createEvent)
        this.router.post('/{eventId}/book', this.bookEvent)
    }

    createEvent = async (req: Request, res: Response) => {

        try {
            const reqBody = JSON.parse(req.body as string);

            await eventSchema.validate(reqBody, { abortEarly: false });

            const result = await ddbClient.put({
                TableName: this.eventsTable,
                Item: reqBody,
            })

            res.status(201).json({
                result
            })
        } catch (err) {
            return handleError(err)
        }

    }
    bookEvent = async (req: Request, res: Response) => {
        try {
            let attendees = []

            const id = req.params?.eventId as string

            const updateBody = await fetchProductById(id)

            const reqBody = JSON.parse(req.body as string);

            await attendeeSchema.validate(reqBody, { abortEarly: false });

            attendees.push(reqBody)

            const eventItem = {
                ...updateBody,
                attendees: [...attendees],
                eventId: id
            }
            await ddbClient
                .put({
                    TableName: this.eventsTable,
                    Item: eventItem,
                })
                .promise();

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify(eventItem),
            }
        } catch (err) {
            return handleError(err)
        }
    };
}

export default EventController