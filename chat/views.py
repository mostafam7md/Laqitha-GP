from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Chat
from .serializers import ChatSerializer

class UserChatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        chats = Chat.objects.filter(
            user_chat_sender=user
        ) | Chat.objects.filter(
            user_chat_receiver=user
        )
        chats = chats.distinct()
        serializer = ChatSerializer(chats, many=True, context={'request': request})
        return Response(serializer.data)

