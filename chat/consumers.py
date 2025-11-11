import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import Chat, Message
from django.contrib.auth.models import AnonymousUser

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.id = self.scope['url_route']['kwargs']['id']
        self.room_group_name = f'{self.id}'
        self.user = self.scope["user"]

        if self.scope["user"] is None or isinstance(self.scope["user"], AnonymousUser):
            await self.close(code=4001) 
            return
        
        chat = await self.get_chat()
        if not chat:
            await self.close(code=4003) 
            return
        
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        message_text = data.get('message', '').strip()
        chat = await self.get_chat()
        if not message_text:
            return
        sender = self.scope['user']
        message = await self.create_message(chat,sender, message_text)

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': message_text,
                'sender_id': sender.id,
                'timestamp': str(message.timestamp)
            }
        )
        
    async def chat_message(self, event):
        chat = await self.get_chat()
        if self.user.id not in [chat.user_chat_sender.id, chat.user_chat_receiver.id]:
            return
        await self.send(text_data=json.dumps({
            'message': event['message'],
            'sender_id': event['sender_id'],
            'timestamp': event['timestamp']
        }))
        
    @database_sync_to_async
    def get_chat(self):
        try:
            chat = Chat.objects.get(id=self.id)
            if self.user.id not in [chat.user_chat_sender.id, chat.user_chat_receiver.id]:
                return None
            return chat
        except Chat.DoesNotExist:
            return None
        
    @database_sync_to_async
    def create_message(self, chat, sender, message_text):
        return Message.objects.create(
            chat=chat,
            sender=sender,
            text=message_text
        )