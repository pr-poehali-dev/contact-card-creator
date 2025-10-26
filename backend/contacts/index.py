'''
Business: API для управления контактами - получение, добавление, обновление и удаление
Args: event с httpMethod, body, queryStringParameters; context с request_id
Returns: HTTP response с контактами или статусом операции
'''

import json
import os
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor

def get_db_connection():
    dsn = os.environ.get('DATABASE_URL')
    return psycopg2.connect(dsn, cursor_factory=RealDictCursor)

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        if method == 'GET':
            cur.execute('SELECT id, name, role, telegram, color FROM contacts ORDER BY id')
            contacts = cur.fetchall()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps([dict(c) for c in contacts]),
                'isBase64Encoded': False
            }
        
        elif method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            name = body_data.get('name')
            role = body_data.get('role')
            telegram = body_data.get('telegram')
            color = body_data.get('color', 'from-purple-500 to-pink-500')
            
            cur.execute(
                "INSERT INTO contacts (name, role, telegram, color) VALUES (%s, %s, %s, %s) RETURNING id, name, role, telegram, color",
                (name, role, telegram, color)
            )
            new_contact = cur.fetchone()
            conn.commit()
            
            return {
                'statusCode': 201,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps(dict(new_contact)),
                'isBase64Encoded': False
            }
        
        elif method == 'PUT':
            params = event.get('queryStringParameters', {})
            contact_id = params.get('id')
            body_data = json.loads(event.get('body', '{}'))
            
            name = body_data.get('name')
            role = body_data.get('role')
            telegram = body_data.get('telegram')
            color = body_data.get('color')
            
            cur.execute(
                "UPDATE contacts SET name=%s, role=%s, telegram=%s, color=%s, updated_at=CURRENT_TIMESTAMP WHERE id=%s RETURNING id, name, role, telegram, color",
                (name, role, telegram, color, contact_id)
            )
            updated_contact = cur.fetchone()
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps(dict(updated_contact) if updated_contact else {}),
                'isBase64Encoded': False
            }
        
        elif method == 'DELETE':
            params = event.get('queryStringParameters', {})
            contact_id = params.get('id')
            
            cur.execute("DELETE FROM contacts WHERE id=%s", (contact_id,))
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'message': 'Contact deleted'}),
                'isBase64Encoded': False
            }
    
    finally:
        cur.close()
        conn.close()
    
    return {
        'statusCode': 405,
        'headers': {'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Method not allowed'}),
        'isBase64Encoded': False
    }
