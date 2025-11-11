from django.urls import path
from .views import   UserChatsView

urlpatterns = [
    path('user-chats/', UserChatsView.as_view(), name='user-chats'),
    # path('<int:id>/messages/', MessageListCreateView.as_view(), name='chat-messages'),

]
