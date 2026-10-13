import re
from datetime import datetime

def validate_email(email):
    pattern = r'^[\w\.-]+@[\w\.-]+\.\w+$'
    return bool(re.match(pattern, email))

def validate_password(password):
    return len(password) >= 6

def validate_amount(amount):
    try:
        val = float(amount)
        return val > 0
    except (ValueError, TypeError):
        return False

def validate_transaction_type(type):
    return type in ['income', 'expense']

def validate_date(date_str):
    try:
        datetime.strptime(date_str, '%Y-%m-%d')
        return True
    except (ValueError, TypeError):
        return False
