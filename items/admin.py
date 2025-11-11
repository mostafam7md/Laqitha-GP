from django.contrib import admin
from .models import Item
# Register your models here.
@admin.register(Item)
class ItemAdmin(admin.ModelAdmin):
    list_display = ('id', 'item_name', 'owner_user', 'category', 'color', 'created_at', 'initial_found_time', 'final_found_time')
    list_filter = ('category', 'color', 'created_at')
    search_fields = ('item_name', 'description', 'unique_marks', 'owner_user__email')
    ordering = ('-created_at',)