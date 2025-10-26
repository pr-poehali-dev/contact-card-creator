'''
Business: API для управления контактами (упрощенная версия)
Args: event с httpMethod, body, queryStringParameters, headers; context с request_id
Returns: HTTP response с контактами или статусом операции
'''

import json
import os
from typing import Dict, Any, Optional
import psycopg2
from psycopg2.extras import RealDictCursor

def get_db_connection():
    dsn = os.environ.get('DATABASE_URL')
    return psycopg2.connect(dsn, cursor_factory=RealDictCursor)

def is_authenticated(token: Optional[str]) -> bool:
    return bool(token and len(token) > 10)

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Session-Token',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        headers = event.get('headers', {})
        session_token = headers.get('x-session-token') or headers.get('X-Session-Token')
        authenticated = is_authenticated(session_token)
        
        if method == 'GET':
            cur.execute('SELECT id, name, role, telegram, color, order_index FROM contacts ORDER BY order_index, id')
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
        
        if not authenticated:
            return {
                'statusCode': 401,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Требуется авторизация'}),
                'isBase64Encoded': False
            }
        
        if method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            name = body_data.get('name')
            role = body_data.get('role')
            telegram = body_data.get('telegram')
            color = body_data.get('color', 'from-purple-500 to-pink-500')
            
            cur.execute('SELECT COALESCE(MAX(order_index), -1) + 1 FROM contacts')
            next_order = cur.fetchone()['coalesce']
            
            cur.execute(
                "INSERT INTO contacts (name, role, telegram, color, order_index) VALUES (%s, %s, %s, %s, %s) RETURNING id, name, role, telegram, color, order_index",
                (name, role, telegram, color, next_order)
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
                "UPDATE contacts SET name=%s, role=%s, telegram=%s, color=%s WHERE id=%s RETURNING id, name, role, telegram, color, order_index",
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
        
        elif method == 'PATCH':
            body_data = json.loads(event.get('body', '{}'))
            orders = body_data.get('orders', [])
            
            for item in orders:
                contact_id = item.get('id')
                order_index = item.get('order_index')
                cur.execute(
                    "UPDATE contacts SET order_index = %s WHERE id = %s",
                    (order_index, contact_id)
                )
            
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'success': True}),
                'isBase64Encoded': False
            }
        
        elif method == 'DELETE':
            params = event.get('queryStringParameters', {})
            contact_id = params.get('id')
            
            cur.execute('DELETE FROM contacts WHERE id = %s', (contact_id,))
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'success': True}),
                'isBase64Encoded': False
            }
        
        return {
            'statusCode': 405,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Метод не поддерживается'}),
            'isBase64Encoded': False
        }
    
    finally:
        cur.close()
        conn.close()
