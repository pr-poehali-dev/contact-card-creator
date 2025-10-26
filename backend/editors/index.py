import json
import os
import psycopg2
import bcrypt
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Управление редакторами (только для суперадмина)
    Args: event - dict с httpMethod, body, headers, queryStringParameters
          context - объект с request_id
    Returns: HTTP response со списком редакторов или результатом операции
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Session-Token',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
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
            SELECT u.role 
            FROM sessions s
            JOIN users u ON s.user_id = u.id
            WHERE s.session_token = %s AND s.expires_at > NOW()
        """, (session_token,))
        
        result = cur.fetchone()
        
        if not result or result[0] != 'superadmin':
            return {
                'statusCode': 403,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Доступ запрещен'})
            }
        
        if method == 'GET':
            cur.execute("SELECT id, username, created_at FROM users WHERE role = 'editor' ORDER BY created_at DESC")
            editors = cur.fetchall()
            
            editors_list = [
                {'id': e[0], 'username': e[1], 'created_at': e[2].isoformat()}
                for e in editors
            ]
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'isBase64Encoded': False,
                'body': json.dumps(editors_list)
            }
        
        elif method == 'POST':
            body = json.loads(event.get('body', '{}'))
            username = body.get('username')
            password = body.get('password')
            
            if not username or not password:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Требуется username и password'})
                }
            
            password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            
            try:
                cur.execute(
                    "INSERT INTO users (username, password_hash, role) VALUES (%s, %s, 'editor') RETURNING id",
                    (username, password_hash)
                )
                editor_id = cur.fetchone()[0]
                conn.commit()
                
                return {
                    'statusCode': 201,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'isBase64Encoded': False,
                    'body': json.dumps({'id': editor_id, 'username': username})
                }
            except psycopg2.IntegrityError:
                conn.rollback()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Пользователь с таким именем уже существует'})
                }
        
        elif method == 'DELETE':
            params = event.get('queryStringParameters', {})
            editor_id = params.get('id')
            
            if not editor_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Требуется id редактора'})
                }
            
            cur.execute("DELETE FROM users WHERE id = %s AND role = 'editor'", (editor_id,))
            conn.commit()
            
            if cur.rowcount == 0:
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Редактор не найден'})
                }
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'isBase64Encoded': False,
                'body': json.dumps({'success': True})
            }
        
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Метод не поддерживается'})
        }
    
    finally:
        cur.close()
        conn.close()
