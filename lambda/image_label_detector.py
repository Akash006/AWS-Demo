"""
Lambda function: S3-triggered image food-label detector
--------------------------------------------------------
Triggered automatically whenever an object is created in the S3 uploads bucket.

Workflow
--------
1. Receive the S3 event (bucket name + object key).
2. Call Amazon Rekognition DetectLabels on the image.
3. Decide whether any detected label belongs to the "food" category.
4. Write a structured log entry (CloudWatch Logs picks this up automatically).
5. Publish a custom CloudWatch metric:
     - Namespace : QuickBites/ImageLabels
     - FoodImageCount      (Count) — incremented when image is food
     - NonFoodImageCount   (Count) — incremented when image is not food
     - TotalImagesProcessed (Count) — always incremented
     - ProcessingErrors    (Count) — incremented on unexpected failures
"""

import json
import logging
import urllib.parse

import boto3

logger = logging.getLogger()
logger.setLevel(logging.INFO)

rekognition = boto3.client("rekognition")
cloudwatch = boto3.client("cloudwatch")

# --------------------------------------------------------------------------- #
# Food-related label names that Rekognition may return.                        #
# --------------------------------------------------------------------------- #
FOOD_LABELS: set[str] = {
    "Food",
    "Meal",
    "Dish",
    "Cuisine",
    "Lunch",
    "Dinner",
    "Breakfast",
    "Snack",
    "Dessert",
    "Pizza",
    "Burger",
    "Sandwich",
    "Salad",
    "Soup",
    "Fruit",
    "Vegetable",
    "Produce",
    "Meat",
    "Seafood",
    "Bread",
    "Cake",
    "Ice Cream",
    "Pasta",
    "Rice",
    "Sushi",
    "Taco",
    "Burrito",
    "Hot Dog",
    "French Fries",
    "Steak",
    "Chicken",
    "Fish",
    "Shrimp",
    "Egg",
    "Cheese",
    "Chocolate",
    "Cookie",
    "Donut",
    "Muffin",
    "Waffle",
    "Pancake",
    "Noodle",
    "Wrap",
    "Bowl",
    "Plate",
    "Beverage",
    "Drink",
    "Coffee",
    "Tea",
    "Juice",
    "Smoothie",
    "Apple",
    "Banana",
    "Orange",
    "Strawberry",
    "Berry",
    "Grape",
    "Watermelon",
    "Mango",
    "Pineapple",
    "Avocado",
    "Tomato",
    "Cucumber",
    "Carrot",
    "Broccoli",
    "Mushroom",
    "Onion",
    "Potato",
    "Corn",
    "Pepper",
    "Lemon",
    "Lime",
    "Dairy",
}

CLOUDWATCH_NAMESPACE = "QuickBites/ImageLabels"
REKOGNITION_MAX_LABELS = 20
REKOGNITION_MIN_CONFIDENCE = 70.0


# --------------------------------------------------------------------------- #
# Helper                                                                       #
# --------------------------------------------------------------------------- #

def _put_metric(metric_name: str, value: float, bucket: str) -> None:
    """Publish a single data point to CloudWatch (best-effort — never raises)."""
    try:
        cloudwatch.put_metric_data(
            Namespace=CLOUDWATCH_NAMESPACE,
            MetricData=[
                {
                    "MetricName": metric_name,
                    "Value": value,
                    "Unit": "Count",
                    "Dimensions": [
                        {"Name": "BucketName", "Value": bucket}
                    ],
                }
            ],
        )
        logger.debug("Published metric %s = %s for bucket %s", metric_name, value, bucket)
    except Exception as metric_err:  # noqa: BLE001
        logger.warning("Failed to publish metric '%s': %s", metric_name, metric_err)


# --------------------------------------------------------------------------- #
# Handler                                                                      #
# --------------------------------------------------------------------------- #

def lambda_handler(event: dict, context) -> dict:  # noqa: ANN001
    """Entry point invoked by Amazon S3 on every new object upload."""
    logger.info("Received S3 event: %s", json.dumps(event))

    records = event.get("Records", [])
    if not records:
        logger.warning("No Records found in event — nothing to process.")
        return {"statusCode": 200, "body": "No records"}

    for record in records:
        bucket = record["s3"]["bucket"]["name"]
        # S3 keys are URL-encoded in the event payload
        key = urllib.parse.unquote_plus(record["s3"]["object"]["key"])

        logger.info("Processing image | bucket=%s key=%s", bucket, key)

        try:
            _process_image(bucket, key)
        except Exception as err:  # noqa: BLE001
            logger.error(
                "Unhandled error processing image | bucket=%s key=%s error=%s",
                bucket,
                key,
                err,
                exc_info=True,
            )
            _put_metric("ProcessingErrors", 1, bucket)
            # Continue processing remaining records rather than failing the whole batch

    return {"statusCode": 200, "body": "OK"}


def _process_image(bucket: str, key: str) -> None:
    """Detect labels in *key* and update logs + CloudWatch metrics."""
    response = rekognition.detect_labels(
        Image={"S3Object": {"Bucket": bucket, "Name": key}},
        MaxLabels=REKOGNITION_MAX_LABELS,
        MinConfidence=REKOGNITION_MIN_CONFIDENCE,
    )

    all_labels = [lbl["Name"] for lbl in response.get("Labels", [])]
    food_labels = [lbl for lbl in all_labels if lbl in FOOD_LABELS]
    is_food = bool(food_labels)

    # ── Logging ─────────────────────────────────────────────────────────────
    if is_food:
        logger.info(
            "FOOD IMAGE DETECTED | bucket=%s key=%s food_labels=%s all_labels=%s",
            bucket,
            key,
            food_labels,
            all_labels,
        )
    else:
        logger.info(
            "NON-FOOD IMAGE DETECTED | bucket=%s key=%s all_labels=%s",
            bucket,
            key,
            all_labels,
        )

    # ── Metrics ──────────────────────────────────────────────────────────────
    _put_metric("TotalImagesProcessed", 1, bucket)

    if is_food:
        _put_metric("FoodImageCount", 1, bucket)
    else:
        _put_metric("NonFoodImageCount", 1, bucket)
