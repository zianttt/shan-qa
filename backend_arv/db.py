from datetime import datetime
import os
import boto3
import json
import uuid
from botocore.exceptions import ClientError
from typing import Dict, List, Any, Optional

class DynamoDBManager:
    def __init__(self, region_name='ap-southeast-2', endpoint_url=None):
        self.dynamodb = boto3.resource('dynamodb')
        
    def create_table(self, table_config: Dict) -> Dict:
        try:
            table = self.dynamodb.create_table(
                TableName=table_config['TableName'],
                KeySchema=table_config['KeySchema'],
                AttributeDefinitions=table_config['AttributeDefinitions'],
                ProvisionedThroughput=table_config.get('ProvisionedThroughput', {
                    'ReadCapacityUnits': 5,
                    'WriteCapacityUnits': 5
                }),
                GlobalSecondaryIndexes=table_config.get('GlobalSecondaryIndexes', [])
            )
            
            # Wait until the table exists
            table.meta.client.get_waiter('table_exists').wait(TableName=table_config['TableName'])
            return {'status': 'success', 'message': f"Table {table_config['TableName']} created successfully"}
            
        except ClientError as e:
            if e.response['Error']['Code'] == 'ResourceInUseException':
                return {'status': 'warning', 'message': f"Table {table_config['TableName']} already exists"}
            else:
                return {'status': 'error', 'message': str(e)}
    
    def create_tables_from_config(self, config_file_path: str) -> List[Dict]:
        try:
            with open(config_file_path, 'r') as file:
                config = json.load(file)
            
            results = []
            for table_config in config['tables']:
                result = self.create_table(table_config)
                results.append(result)
            
            return results
        except Exception as e:
            return [{'status': 'error', 'message': f"Failed to create tables: {str(e)}"}]
    
    def delete_table(self, table_name: str) -> Dict:
        try:
            table = self.dynamodb.Table(table_name)
            table.delete()
            return {'status': 'success', 'message': f"Table {table_name} deleted successfully"}
        except ClientError as e:
            return {'status': 'error', 'message': str(e)}
    
    def create_user(self, user_data: Dict) -> Dict:
        try:
            table = self.dynamodb.Table('users')
            
            # Generate a unique user_id if not provided
            if 'user_id' not in user_data:
                user_data['user_id'] = str(uuid.uuid4())
            
            table.put_item(Item=user_data)
            return {'status': 'success', 'user_id': user_data['user_id']}
        
        except ClientError as e:
            return {'status': 'error', 'message': str(e)}
    
    def get_user(self, user_id: str) -> Dict:
        try:
            table = self.dynamodb.Table('users')
            response = table.get_item(Key={'user_id': user_id})
            
            if 'Item' in response:
                return {'status': 'success', 'user': response['Item']}
            else:
                return {'status': 'error', 'message': 'User not found'}
        
        except ClientError as e:
            return {'status': 'error', 'message': str(e)}
    
    def get_user_by_email(self, email: str) -> Dict:
        try:
            table = self.dynamodb.Table('users')
            response = table.scan(
                FilterExpression='email = :email',
                ExpressionAttributeValues={':email': email}
            )
            
            if response['Items']:
                return {'status': 'success', 'user': response['Items'][0]}
            else:
                return {'status': 'error', 'message': 'User not found'}
        
        except ClientError as e:
            return {'status': 'error', 'message': str(e)}
    
    def update_user(self, user_id: str, update_data: Dict) -> Dict:
        """
        Update user information.
        
        Args:
            user_id (str): User ID to update
            update_data (Dict): New user data
            
        Returns:
            Dict: Response from DynamoDB
        """
        try:
            table = self.dynamodb.Table('users')
            
            # Build update expression
            update_expression = "set "
            expression_attribute_values = {}
            
            for key, value in update_data.items():
                if key != 'user_id':  # Skip primary key
                    update_expression += f"{key} = :{key}, "
                    expression_attribute_values[f":{key}"] = value
            
            # Remove trailing comma and space
            update_expression = update_expression[:-2]
            
            response = table.update_item(
                Key={'user_id': user_id},
                UpdateExpression=update_expression,
                ExpressionAttributeValues=expression_attribute_values,
                ReturnValues="UPDATED_NEW"
            )
            
            return {'status': 'success', 'updated_attributes': response.get('Attributes', {})}
        
        except ClientError as e:
            return {'status': 'error', 'message': str(e)}
    
    def delete_user(self, user_id: str) -> Dict:
        """
        Delete a user.
        
        Args:
            user_id (str): User ID to delete
            
        Returns:
            Dict: Response from DynamoDB
        """
        try:
            table = self.dynamodb.Table('users')
            table.delete_item(Key={'user_id': user_id})
            return {'status': 'success', 'message': f"User {user_id} deleted successfully"}
        
        except ClientError as e:
            return {'status': 'error', 'message': str(e)}
    
    # Thread-related operations
    def create_thread(self, user_id: str) -> Dict:
        """
        Create a new thread for a user.
        
        Args:
            user_id (str): User ID who owns the thread
            
        Returns:
            Dict: Response with thread_id if successful
        """
        try:
            table = self.dynamodb.Table('threads')
            thread_id = str(uuid.uuid4())
            
            table.put_item(
                Item={
                    'thread_id': thread_id,
                    'user_id': user_id,
                    'created_at': int(boto3.Session().client('kinesis').get_records()['Records'][0]['ApproximateArrivalTimestamp'].timestamp() * 1000) if boto3.Session().client('kinesis').list_streams()['StreamNames'] else int(datetime.now().timestamp() * 1000),
                    'updated_at': int(boto3.Session().client('kinesis').get_records()['Records'][0]['ApproximateArrivalTimestamp'].timestamp() * 1000) if boto3.Session().client('kinesis').list_streams()['StreamNames'] else int(datetime.now().timestamp() * 1000)
                }
            )
            
            return {'status': 'success', 'thread_id': thread_id}
        
        except ClientError as e:
            return {'status': 'error', 'message': str(e)}
    
    def get_thread(self, thread_id: str) -> Dict:
        """
        Retrieve a thread by its thread_id.
        
        Args:
            thread_id (str): Thread ID to look up
            
        Returns:
            Dict: Thread data if found
        """
        try:
            table = self.dynamodb.Table('threads')
            response = table.get_item(Key={'thread_id': thread_id})
            
            if 'Item' in response:
                return {'status': 'success', 'thread': response['Item']}
            else:
                return {'status': 'error', 'message': 'Thread not found'}
        
        except ClientError as e:
            return {'status': 'error', 'message': str(e)}
    
    def get_user_threads(self, user_id: str) -> Dict:
        """
        Retrieve all threads belonging to a user.
        
        Args:
            user_id (str): User ID to look up threads for
            
        Returns:
            Dict: List of threads if found
        """
        try:
            table = self.dynamodb.Table('threads')
            
            # Using a query with a secondary index would be more efficient
            # This assumes a GSI was created on user_id
            response = table.query(
                IndexName='UserIdIndex',
                KeyConditionExpression='user_id = :user_id',
                ExpressionAttributeValues={':user_id': user_id}
            )
            
            return {'status': 'success', 'threads': response.get('Items', [])}
        
        except ClientError as e:
            return {'status': 'error', 'message': str(e)}
    
    def delete_thread(self, thread_id: str) -> Dict:
        """
        Delete a thread.
        
        Args:
            thread_id (str): Thread ID to delete
            
        Returns:
            Dict: Response from DynamoDB
        """
        try:
            # First, delete all messages in the thread
            self.delete_thread_messages(thread_id)
            
            # Then delete the thread itself
            table = self.dynamodb.Table('threads')
            table.delete_item(Key={'thread_id': thread_id})
            
            return {'status': 'success', 'message': f"Thread {thread_id} deleted successfully"}
        
        except ClientError as e:
            return {'status': 'error', 'message': str(e)}
    
    # Message-related operations
    def create_message(self, thread_id: str, message_details: Dict) -> Dict:
        """
        Create a new message in a thread.
        
        Args:
            thread_id (str): Thread ID where the message belongs
            message_details (Dict): Message content and metadata
            
        Returns:
            Dict: Response with message_id if successful
        """
        try:
            table = self.dynamodb.Table('messages')
            message_id = str(uuid.uuid4())
            
            # Add timestamp to message details
            message_details['timestamp'] = int(boto3.Session().client('kinesis').get_records()['Records'][0]['ApproximateArrivalTimestamp'].timestamp() * 1000) if boto3.Session().client('kinesis').list_streams()['StreamNames'] else int(datetime.now().timestamp() * 1000)
            
            table.put_item(
                Item={
                    'message_id': message_id,
                    'thread_id': thread_id,
                    'details': message_details
                }
            )
            
            # Update thread's updated_at timestamp
            self.dynamodb.Table('threads').update_item(
                Key={'thread_id': thread_id},
                UpdateExpression='set updated_at = :updated_at',
                ExpressionAttributeValues={
                    ':updated_at': message_details['timestamp']
                }
            )
            
            return {'status': 'success', 'message_id': message_id}
        
        except ClientError as e:
            return {'status': 'error', 'message': str(e)}
    
    def get_message(self, message_id: str) -> Dict:
        """
        Retrieve a message by its message_id.
        
        Args:
            message_id (str): Message ID to look up
            
        Returns:
            Dict: Message data if found
        """
        try:
            table = self.dynamodb.Table('messages')
            response = table.get_item(Key={'message_id': message_id})
            
            if 'Item' in response:
                return {'status': 'success', 'message': response['Item']}
            else:
                return {'status': 'error', 'message': 'Message not found'}
        
        except ClientError as e:
            return {'status': 'error', 'message': str(e)}
    
    def get_thread_messages(self, thread_id: str) -> Dict:
        """
        Retrieve all messages in a thread.
        
        Args:
            thread_id (str): Thread ID to look up messages for
            
        Returns:
            Dict: List of messages if found
        """
        try:
            table = self.dynamodb.Table('messages')
            
            # Using a query with a secondary index would be more efficient
            # This assumes a GSI was created on thread_id
            response = table.query(
                IndexName='ThreadIdIndex',
                KeyConditionExpression='thread_id = :thread_id',
                ExpressionAttributeValues={':thread_id': thread_id}
            )
            
            return {'status': 'success', 'messages': response.get('Items', [])}
        
        except ClientError as e:
            return {'status': 'error', 'message': str(e)}
    
    def delete_message(self, message_id: str) -> Dict:
        """
        Delete a message.
        
        Args:
            message_id (str): Message ID to delete
            
        Returns:
            Dict: Response from DynamoDB
        """
        try:
            table = self.dynamodb.Table('messages')
            table.delete_item(Key={'message_id': message_id})
            
            return {'status': 'success', 'message': f"Message {message_id} deleted successfully"}
        
        except ClientError as e:
            return {'status': 'error', 'message': str(e)}
    
    def delete_thread_messages(self, thread_id: str) -> Dict:
        """
        Delete all messages in a thread.
        
        Args:
            thread_id (str): Thread ID to delete messages for
            
        Returns:
            Dict: Response from DynamoDB
        """
        try:
            # Get all messages in the thread
            messages_response = self.get_thread_messages(thread_id)
            
            if messages_response['status'] == 'success':
                table = self.dynamodb.Table('messages')
                
                # Delete each message
                for message in messages_response['messages']:
                    table.delete_item(Key={'message_id': message['message_id']})
                
                return {'status': 'success', 'message': f"All messages in thread {thread_id} deleted successfully"}
            else:
                return messages_response
        
        except ClientError as e:
            return {'status': 'error', 'message': str(e)}

# Utility functions
def generate_table_config():
    """
    Generate a sample table configuration JSON file.
    """
    config = {}
    
    with open('dynamodb_config.json', 'w') as f:
        json.dump(config, f, indent=2)
    
    return config

# Main function to create tables
def create_tables(config_file_path: str = 'dynamodb_config.json', region_name: str = 'us-east-1', endpoint_url: Optional[str] = None) -> List[Dict]:
    """
    Create DynamoDB tables based on a configuration file.
    
    Args:
        config_file_path (str): Path to the JSON configuration file
        region_name (str): AWS region name
        endpoint_url (str, optional): Custom endpoint URL for local DynamoDB
        
    Returns:
        List[Dict]: List of responses for each table creation attempt
    """
    
    # Create DynamoDB manager
    db_manager = DynamoDBManager(region_name=region_name, endpoint_url=endpoint_url)
    
    # Create tables
    return db_manager.create_tables_from_config(config_file_path)

if __name__ == '__main__':
    # Create tables
    results = create_tables()
    for result in results:
        print(result)