import AWS  from "aws-sdk"
const REGION = "us-east-1"
const ddbClient = new AWS.DynamoDB.DocumentClient({  region: REGION })
export { ddbClient }

