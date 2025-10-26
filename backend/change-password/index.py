'''
Business: Смена пароля администратора
Args: event с httpMethod, body; context с request_id
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
                'Access-Control-Allow-Headers': 'Content-Type',
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
    
    body = json.loads(event.get('body', '{}'))
    old_password = body.get('old_password')
    new_password = body.get('new_password')
    
    if not old_password or not new_password:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Требуется старый и новый пароль'})
        }
    
    if len(new_password) < 6:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Новый пароль должен быть не менее 6 символов'})
        }
    
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()
    
    try:
        # Получаем текущий хеш пароля
        cur.execute("SELECT value FROM settings WHERE key = 'admin_password'")
        password_record = cur.fetchone()
        
        if not password_record:
            return {
                'statusCode': 500,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Ошибка конфигурации'})
            }
        
        current_hash = password_record[0]
        current_hash_bytes = current_hash if isinstance(current_hash, bytes) else current_hash.encode('utf-8')
        
        # Проверяем старый пароль
        if not bcrypt.checkpw(old_password.encode('utf-8'), current_hash_bytes):
            return {
                'statusCode': 401,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Неверный текущий пароль'})
            }
        
        # Генерируем новый хеш
        new_hash = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        # Обновляем пароль
        cur.execute("""
            UPDATE settings 
            SET value = %s, updated_at = NOW() 
            WHERE key = 'admin_password'
        """, (new_hash,))
        
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
