import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { v4 } from "uuid";
import * as yup from "yup";

import { ddbClient } from "./db";

export const headers = {
    "content-type": "application/json",
};

const eventsTable = "EventsTable"

export const eventSchema = yup.object().shape({
    title: yup.string().required(),
    description: yup.string().required(),
    artist: yup.string().required(),
    attendees: yup.array().notRequired()
});

export const attendeeSchema = yup.object().shape({
    username: yup.string().required()
})

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
        return handleError(err)
    }
};

export const bookEvent = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
        let attendees = []

        const id = event.pathParameters?.eventId as string

        const updateBody = await fetchProductById(id)

        const reqBody = JSON.parse(event.body as string);

        await attendeeSchema.validate(reqBody, { abortEarly: false });

        attendees.push(reqBody)

        const eventItem = {
            ...updateBody,
            attendees: [...attendees],
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

export const getAllEvents = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const output = await ddbClient
        .scan({
            TableName: eventsTable,
        })
        .promise();

    return {
        statusCode: 200,
        headers,
        body: JSON.stringify(output.Items),
    };
};

export const getEvent = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
        const eventItem = await fetchProductById(event.pathParameters?.eventId as string);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(eventItem),
        };
    } catch (e) {
        return handleError(e);
    }
};


export const deleteEvent = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
        const id = event.pathParameters?.eventId as string;

        await fetchProductById(id);

        await ddbClient
            .delete({
                TableName: eventsTable,
                Key: {
                    eventId: id,
                },
            })
            .promise();

        return {
            statusCode: 204,
            body: "",
        };
    } catch (e) {
        return handleError(e);
    }
};

export const fetchProductById = async (id: string) => {
    const output = await ddbClient
        .get({
            TableName: eventsTable,
            Key: {
                eventId: id,
            },
        })
        .promise();

    if (!output.Item) {
        throw new HttpError(404, { error: "not found" });
    }

    return output.Item;
};

class HttpError extends Error {
    constructor(public statusCode: number, body: Record<string, unknown> = {}) {
        super(JSON.stringify(body))
    }
}

export const handleError = (err: unknown) => {
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