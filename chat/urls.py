from django.urls import path
from .views import   UserChatsView, StartChatView

urlpatterns = [
    path('user-chats/', UserChatsView.as_view(), name='user-chats'),
    path('start/', StartChatView.as_view(), name='chat-start'),
    # path('<int:id>/messages/', MessageListCreateView.as_view(), name='chat-messages'),

]
