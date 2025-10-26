'''
Business: API для управления контактами с проверкой прав доступа
Args: event с httpMethod, body, queryStringParameters, headers; context с request_id
Returns: HTTP response с контактами или статусом операции
'''

import json
import os
from typing import Dict, Any, Optional, Tuple
import psycopg2
from psycopg2.extras import RealDictCursor

def get_db_connection():
    dsn = os.environ.get('DATABASE_URL')
    return psycopg2.connect(dsn, cursor_factory=RealDictCursor)

def get_user_from_token(cur, token: Optional[str]) -> Optional[Tuple[int, str]]:
    if not token:
        return None
    
    cur.execute("""
        SELECT u.id, u.role 
        FROM sessions s
        JOIN users u ON s.user_id = u.id
        WHERE s.session_token = %s AND s.expires_at > NOW()
    """, (token,))
    
    result = cur.fetchone()
    if result:
        return (result['id'], result['role'])
    return None

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
        user_info = get_user_from_token(cur, session_token)
        
        if method == 'GET':
            cur.execute('SELECT id, name, role, telegram, color, created_by, order_index FROM contacts ORDER BY order_index, id')
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
        
        if not user_info:
            return {
                'statusCode': 401,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Требуется авторизация'}),
                'isBase64Encoded': False
            }
        
        user_id, user_role = user_info
        
        if method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            name = body_data.get('name')
            role = body_data.get('role')
            telegram = body_data.get('telegram')
            color = body_data.get('color', 'from-purple-500 to-pink-500')
            
            cur.execute('SELECT COALESCE(MAX(order_index), 0) + 1 FROM contacts')
            next_order = cur.fetchone()['coalesce']
            
            cur.execute(
                "INSERT INTO contacts (name, role, telegram, color, created_by, order_index) VALUES (%s, %s, %s, %s, %s, %s) RETURNING id, name, role, telegram, color, created_by, order_index",
                (name, role, telegram, color, user_id, next_order)
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
            
            cur.execute('SELECT created_by FROM contacts WHERE id = %s', (contact_id,))
            contact = cur.fetchone()
            
            if not contact:
                return {
                    'statusCode': 404,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'Контакт не найден'}),
                    'isBase64Encoded': False
                }
            
            if user_role == 'editor' and contact['created_by'] != user_id:
                return {
                    'statusCode': 403,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'Вы можете редактировать только свои контакты'}),
                    'isBase64Encoded': False
                }
            
            name = body_data.get('name')
            role = body_data.get('role')
            telegram = body_data.get('telegram')
            color = body_data.get('color')
            
            cur.execute(
                "UPDATE contacts SET name=%s, role=%s, telegram=%s, color=%s, updated_at=CURRENT_TIMESTAMP WHERE id=%s RETURNING id, name, role, telegram, color, created_by, order_index",
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
            if user_role != 'superadmin':
                return {
                    'statusCode': 403,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'Только суперадмин может изменять порядок'}),
                    'isBase64Encoded': False
                }
            
            body_data = json.loads(event.get('body', '{}'))
            contact_orders = body_data.get('orders', [])
            
            for item in contact_orders:
                cur.execute(
                    "UPDATE contacts SET order_index = %s WHERE id = %s",
                    (item['order_index'], item['id'])
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
            
            cur.execute('SELECT created_by FROM contacts WHERE id = %s', (contact_id,))
            contact = cur.fetchone()
            
            if not contact:
                return {
                    'statusCode': 404,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'Контакт не найден'}),
                    'isBase64Encoded': False
                }
            
            if user_role == 'editor' and contact['created_by'] != user_id:
                return {
                    'statusCode': 403,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'Вы можете удалять только свои контакты'}),
                    'isBase64Encoded': False
                }
            
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
