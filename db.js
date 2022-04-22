const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const connectToDynamoDB = new DynamoDBClient({});

module.exports = connectToDynamoDB;