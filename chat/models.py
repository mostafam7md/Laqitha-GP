from django.db import models
from django.conf import settings

class Chat(models.Model):
    report_id = models.IntegerField(null=True, blank=True)  # link later when Report model is ready
    user_chat_sender = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='chats_sent'
    )
    user_chat_receiver = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='chats_received'
    )
    status = models.CharField(max_length=10, choices=[('open', 'Open'), ('closed', 'Closed')], default='open')

    def __str__(self):
        return f"Chat between {self.user_chat_sender.first_name} and {self.user_chat_receiver.first_name}"


class Message(models.Model):
    chat = models.ForeignKey(Chat, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    text = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Message from {self.sender} in Chat {self.chat.id}"
