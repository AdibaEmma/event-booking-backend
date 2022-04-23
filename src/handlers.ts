import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { v4 } from "uuid";
import * as yup from "yup";

import { ddbClient } from "./db";

const headers = {
    "content-type": "application/json",
};

const eventsTable = "EventsTable"

const eventSchema = yup.object().shape({
    title: yup.string().required(),
    description: yup.string().required(),
    artist: yup.number().required(),
    attendees: yup.array().notRequired(),
});

const attendeeSchema = yup.object().shape({
    username: yup.string().required()
})


class HttpError extends Error {
    constructor(public statusCode: number, body: Record<string, unknown> = {}) {
        super(JSON.stringify(body))
    }
}

const handleError = (err: unknown) => {
    if (err instanceof yup.ValidationError) {
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
                errors: err.errors,
            }),
        };
    }

    if (err instanceof SyntaxError) {
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: `invalid request body format : "${err.message}"` }),
        };
    }

    if (err instanceof HttpError) {
        return {
            statusCode: err.statusCode,
            headers,
            body: err.message,
        };
    }

    throw err;
}

export const createEvent = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
        const reqBody = JSON.parse(event.body as string);

        await eventSchema.validate(reqBody, { abortEarly: false });

        const eventItem = {
            eventId: v4(),
            ...reqBody,
        }
        await ddbClient
            .put({
                TableName: eventsTable,
                Item: eventItem,
            })
            .promise();
        return {
            statusCode: 201,
            headers,
            body: JSON.stringify(eventItem),
        };
    } catch (err) {
        throw err
    }
};

export const bookEvent = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
        const id = event.pathParameters?.eventId as string
        const reqBody = JSON.parse(event.body as string);
        let attendees = []

        await attendeeSchema.validate(reqBody, { abortEarly: false });

        const eventItemToBeUpdated = fetchProductById(id)
        attendees.push(reqBody)

        const eventItem = {
            ...eventItemToBeUpdated,
            attendees: attendees,
            eventId: id
        }
        await ddbClient
            .put({
                TableName: eventsTable,
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

const fetchProductById = async (id: string) => {
    const output = await ddbClient
        .get({
            TableName: eventsTable,
            Key: {
                productID: id,
            },
        })
        .promise();

    if (!output.Item) {
        throw new HttpError(404, { error: "not found" });
    }

    return output.Item;
};
