from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from items.models import Item
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


class StartChatView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        item = get_object_or_404(Item, pk=request.data.get('item_id'))
        owner = item.owner_user

        if owner == request.user:
            return Response({'detail': 'You cannot start a chat about your own notice.'}, status=400)

        existing = Chat.objects.filter(report_id=item.id).filter(
            user_chat_sender=request.user, user_chat_receiver=owner
        ).first()
        if not existing:
            existing = Chat.objects.filter(report_id=item.id).filter(
                user_chat_sender=owner, user_chat_receiver=request.user
            ).first()

        if not existing:
            existing = Chat.objects.create(
                report_id=item.id,
                user_chat_sender=request.user,
                user_chat_receiver=owner,
            )

        serializer = ChatSerializer(existing, context={'request': request})
        return Response(serializer.data)

