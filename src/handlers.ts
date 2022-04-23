import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { v4 } from "uuid";
import { ddbClient } from "./db";


const eventsTable = "EventsTable"
export const createEvent = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const reqBody = JSON.parse(event.body as string);
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
        body: JSON.stringify(eventItem),
    };
};

export const bookEvent = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const eventId = event.pathParameters?.id
    const userId = event.queryStringParameters?.userId
 
    const eventToBook = await ddbClient.get({
        TableName: eventsTable,
        Key: {
            eventId: eventId
        },
    })
        .promise();

    if(!eventToBook) {
        return {
            statusCode: 404,
            body:JSON.stringify({ error: `event with id: ${eventId} not found`})
        }
    }
    return {
        statusCode: 200,
        body: JSON.stringify(eventToBook),
    };
};

export const getEvent = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const eventId = event.pathParameters?.id
   
    const eventItem = await ddbClient.get({
        TableName: eventsTable,
        Key: {
            eventId: eventId
        },
    })
        .promise();

    if (!eventItem) {
        return {
            statusCode: 404,
            body: JSON.stringify({ error: `event with id: ${eventId} not found` })
        }
    }
    return {
        statusCode: 200,
        body: JSON.stringify(eventItem.Item),
    };
};
