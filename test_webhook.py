import urllib.request
import urllib.error
import json

url = 'https://ecorestorantbot-af8bebfc-3882-4b41-9431-b769365bc392.fly.dev/bot1/webhook'
payload = {
    "update_id": 12345,
    "message": {
        "message_id": 1,
        "date": 1234567,
        "chat": {"id": 123, "type": "private"},
        "text": "/start",
        "from": {"id": 123, "is_bot": False, "first_name": "Test"}
    }
}
data = json.dumps(payload).encode('utf-8')
req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})

try:
    response = urllib.request.urlopen(req)
    print(f"Status Code: {response.status}")
    print(f"Response: {response.read().decode('utf-8')}")
except urllib.error.HTTPError as e:
    print(f"Error Code: {e.code}")
    print(f"Error Body: {e.read().decode('utf-8')}")
except Exception as e:
    print(e)
