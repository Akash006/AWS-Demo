resource "aws_dynamodb_table" "orders" {
  name         = var.dynamo_table_name
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"

  attribute {
    name = "id"
    type = "S"
  }

  tags = merge(local.common_tags, { Name = var.dynamo_table_name })
}
