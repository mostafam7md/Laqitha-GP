from django.contrib import admin
from .models import Chat , Message


@admin.register(Chat)
class ChatAdmin(admin.ModelAdmin):
    list_display = ('id', 'user_chat_sender', 'user_chat_receiver', 'status')
    list_filter = ('status',)
    search_fields = ('user_chat_sender__email', 'user_chat_receiver__email')

@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ('chat__id', 'chat','id','sender' ,'timestamp', 'text')
    list_filter = ('timestamp', 'sender')
    search_fields = ('text', 'sender__email')
