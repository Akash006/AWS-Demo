const { DynamoDBClient, DescribeTableCommand } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, ScanCommand } = require("@aws-sdk/lib-dynamodb");
const config = require('./config');

let client, docClient;

if (config.db.enabled && config.db.type === 'dynamodb') {
  const dynamoClientConfig = {
    region: config.db.region
  };

  if (config.aws.credentials) {
    dynamoClientConfig.credentials = config.aws.credentials;
  }

  client = new DynamoDBClient(dynamoClientConfig);
  docClient = DynamoDBDocumentClient.from(client);
}

function assertDynamoEnabled() {
  if (!docClient) {
    throw new Error('DynamoDB is not enabled. Check ENABLE_DB=true and DB_TYPE=dynamodb.');
  }

  if (!config.db.region) {
    throw new Error('DynamoDB region missing. Set DYNAMO_REGION or AWS_REGION (or AWS_DEFAULT_REGION).');
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

async function getStatus() {
  try {
    assertDynamoEnabled();

    const tableInfo = await client.send(new DescribeTableCommand({
      TableName: config.db.dynamoTable
    }));

    return {
      ok: true,
      enabled: true,
      type: config.db.type,
      region: config.db.region,
      table: config.db.dynamoTable,
      tableStatus: tableInfo?.Table?.TableStatus || 'UNKNOWN'
    };
  } catch (err) {
    return {
      ok: false,
      enabled: config.db.enabled,
      type: config.db.type,
      region: config.db.region,
      table: config.db.dynamoTable,
      errorName: err?.name || 'UnknownError',
      errorMessage: err?.message || 'Failed to access DynamoDB table.'
    };
  }
}

module.exports = { saveOrder, getOrders, getStatus };
