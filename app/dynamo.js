const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, ScanCommand } = require("@aws-sdk/lib-dynamodb");
const config = require('./config');

let client, docClient;

if (config.db.enabled && config.db.type === 'dynamodb') {
  client = new DynamoDBClient({ region: config.db.region });
  docClient = DynamoDBDocumentClient.from(client);
}

function assertDynamoEnabled() {
  if (!docClient) {
    throw new Error('DynamoDB is not enabled. Check ENABLE_DB=true and DB_TYPE=dynamodb.');
  }

  if (!config.db.dynamoTable) {
    throw new Error('DYNAMO_TABLE is missing in environment configuration.');
  }
}

async function saveOrder(item) {
  assertDynamoEnabled();

  const params = {
    TableName: config.db.dynamoTable,
    Item: {
      id: Date.now().toString(),
      item: item,
      createdAt: new Date().toISOString()
    }
  };

  await docClient.send(new PutCommand(params));
}

async function getOrders() {
  assertDynamoEnabled();

  const params = {
    TableName: config.db.dynamoTable
  };

  const data = await docClient.send(new ScanCommand(params));
  return data.Items;
}

module.exports = { saveOrder, getOrders };
