from rest_framework import serializers
from .models import Chat, Message
from accounts.models import User
class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = '__all__'
        read_only_fields = ['Timestamp']


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'first_name', 'last_name', 'photo']

class ChatSerializer(serializers.ModelSerializer):
    messages = MessageSerializer(many=True, read_only=True)
    user_chat_sender = UserSerializer(read_only=True)
    user_chat_receiver = UserSerializer(read_only=True)

    class Meta:
        model = Chat
        fields = ['id','report_id','user_chat_sender','user_chat_receiver','status' ,'messages']
