import os
from pymongo import MongoClient
from pymongo.synchronous import database
from dotenv import load_dotenv; load_dotenv()

client: MongoClient = MongoClient(os.getenv("MONGO_URI"))
db: database.Database = client.get_database(os.getenv("MONGO_DB"))

def get_client() -> MongoClient:
    return client

def get_db() -> database.Database:
    return db