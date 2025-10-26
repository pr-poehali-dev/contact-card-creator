'''
Business: Смена пароля для пользователей
Args: event с httpMethod, body, headers; context с request_id
Returns: HTTP response со статусом операции
'''

import json
import os
from typing import Dict, Any
import psycopg2
import bcrypt

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'POST')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Session-Token',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Метод не поддерживается'})
        }
    
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()
    
    try:
        headers = event.get('headers', {})
        session_token = headers.get('x-session-token') or headers.get('X-Session-Token')
        
        if not session_token:
            return {
                'statusCode': 401,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Требуется авторизация'})
            }
        
        cur.execute("""
            SELECT u.id, u.password_hash 
            FROM sessions s
            JOIN users u ON s.user_id = u.id
            WHERE s.session_token = %s AND s.expires_at > NOW()
        """, (session_token,))
        
        user = cur.fetchone()
        
        if not user:
            return {
                'statusCode': 401,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Неверный токен'})
            }
        
        user_id, current_hash = user
        
        body = json.loads(event.get('body', '{}'))
        old_password = body.get('old_password')
        new_password = body.get('new_password')
        
        if not old_password or not new_password:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Требуется старый и новый пароль'})
            }
        
        if not bcrypt.checkpw(old_password.encode('utf-8'), current_hash.encode('utf-8')):
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Неверный текущий пароль'})
            }
        
        new_hash = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        cur.execute(
            "UPDATE users SET password_hash = %s WHERE id = %s",
            (new_hash, user_id)
        )
        conn.commit()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'isBase64Encoded': False,
            'body': json.dumps({'success': True, 'message': 'Пароль успешно изменён'})
        }
    
    finally:
        cur.close()
        conn.close()
