const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, ScanCommand } = require("@aws-sdk/lib-dynamodb");
const config = require('./config');

let client, docClient;

if (config.db.enabled && config.db.type === 'dynamodb') {
  client = new DynamoDBClient({ region: process.env.AWS_REGION });
  docClient = DynamoDBDocumentClient.from(client);
}

async function saveOrder(item) {
  const params = {
    TableName: process.env.DYNAMO_TABLE,
    Item: {
      id: Date.now().toString(),
      item: item,
      createdAt: new Date().toISOString()
    }
  };

  await docClient.send(new PutCommand(params));
}

async function getOrders() {
  const params = {
    TableName: process.env.DYNAMO_TABLE
  };

  const data = await docClient.send(new ScanCommand(params));
  return data.Items;
}

module.exports = { saveOrder, getOrders };
