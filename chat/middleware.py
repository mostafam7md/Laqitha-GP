from urllib.parse import parse_qs
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import UntypedToken
from rest_framework_simplejwt.authentication import JWTAuthentication
from channels.db import database_sync_to_async

@database_sync_to_async
def get_user_from_token(token):
    try:
        validated_token = UntypedToken(token)
        user = JWTAuthentication().get_user(validated_token)
        return user
    except Exception:
        return AnonymousUser()

class TokenAuthMiddleware:
    """
    ASGI middleware for JWT Bearer tokens.
    """
    def __init__(self, app):
        self.app = app  # URLRouter or other ASGI app

    async def __call__(self, scope, receive, send):
        headers = dict(scope.get("headers", []))
        token = None

        # Look for Authorization header
        if b"authorization" in headers:
            auth_header = headers[b"authorization"].decode()
            if auth_header.startswith("Bearer "):
                token = auth_header.split("Bearer ")[1]

        # Fallback: query string
        if not token:
            query_string = parse_qs(scope.get("query_string", b"").decode())
            token = query_string.get("token", [None])[0]

        # Attach user
        scope["user"] = await get_user_from_token(token) if token else AnonymousUser()

        # Call the inner ASGI app
        return await self.app(scope, receive, send)
