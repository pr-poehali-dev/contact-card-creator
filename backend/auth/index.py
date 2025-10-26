import json
import os
import psycopg2
import bcrypt
import secrets
from datetime import datetime, timedelta
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Простая авторизация по паролю с защитой от брутфорса
    Args: event - dict с httpMethod, body, headers
          context - объект с request_id
    Returns: HTTP response с токеном или ошибкой
    '''
    method: str = event.get('httpMethod', 'GET')
    
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
    
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()
    
    try:
        if method == 'POST':
            body_str = event.get('body') or '{}'
            if body_str.strip() == '':
                body_str = '{}'
            body = json.loads(body_str)
            password = body.get('password')
            
            # Получаем IP адрес из requestContext
            request_context = event.get('requestContext', {})
            identity = request_context.get('identity', {})
            ip_address = identity.get('sourceIp', 'unknown')
            
            if not password:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Требуется пароль'})
                }
            
            # Проверяем блокировку по IP
            cur.execute("""
                SELECT attempts, blocked_until 
                FROM login_attempts 
                WHERE ip_address = %s
            """, (ip_address,))
            
            attempt_record = cur.fetchone()
            
            if attempt_record:
                attempts, blocked_until = attempt_record
                
                # Проверяем, заблокирован ли IP
                if blocked_until and blocked_until > datetime.now():
                    remaining = int((blocked_until - datetime.now()).total_seconds())
                    return {
                        'statusCode': 429,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({
                            'error': f'Слишком много попыток. Попробуйте через {remaining} секунд'
                        })
                    }
                
                # Если блокировка истекла, сбрасываем счетчик
                if blocked_until and blocked_until <= datetime.now():
                    cur.execute("""
                        UPDATE login_attempts 
                        SET attempts = 0, blocked_until = NULL 
                        WHERE ip_address = %s
                    """, (ip_address,))
                    conn.commit()
                    attempts = 0
            else:
                attempts = 0
            
            # Получаем хеш пароля из настроек
            cur.execute("SELECT value FROM settings WHERE key = 'admin_password'")
            password_record = cur.fetchone()
            
            if not password_record:
                return {
                    'statusCode': 500,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Ошибка конфигурации'})
                }
            
            password_hash = password_record[0]
            password_hash_bytes = password_hash if isinstance(password_hash, bytes) else password_hash.encode('utf-8')
            
            # Проверяем пароль
            if not bcrypt.checkpw(password.encode('utf-8'), password_hash_bytes):
                # Увеличиваем счетчик попыток
                new_attempts = attempts + 1
                blocked_until = None
                
                # Блокируем на 5 минут после 5 неудачных попыток
                if new_attempts >= 5:
                    blocked_until = datetime.now() + timedelta(minutes=5)
                
                cur.execute("""
                    INSERT INTO login_attempts (ip_address, attempts, last_attempt, blocked_until)
                    VALUES (%s, %s, NOW(), %s)
                    ON CONFLICT (ip_address) 
                    DO UPDATE SET 
                        attempts = %s, 
                        last_attempt = NOW(),
                        blocked_until = %s
                """, (ip_address, new_attempts, blocked_until, new_attempts, blocked_until))
                conn.commit()
                
                remaining_attempts = max(0, 5 - new_attempts)
                return {
                    'statusCode': 401,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'error': f'Неверный пароль. Осталось попыток: {remaining_attempts}'
                    })
                }
            
            # Успешная авторизация - сбрасываем счетчик попыток
            cur.execute("""
                DELETE FROM login_attempts WHERE ip_address = %s
            """, (ip_address,))
            
            # Генерируем токен сессии (действителен 7 дней)
            session_token = secrets.token_urlsafe(32)
            
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'isBase64Encoded': False,
                'body': json.dumps({'token': session_token})
            }
        
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Метод не поддерживается'})
        }
    
    finally:
        cur.close()
        conn.close()