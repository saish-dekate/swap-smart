from django.contrib import admin
from .models import SwapRequest, CounterOffer


@admin.register(SwapRequest)
class SwapRequestAdmin(admin.ModelAdmin):
    list_display = ['id', 'sender', 'receiver', 'status', 'cash_adjustment', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['sender__email', 'receiver__email']
    ordering = ['-created_at']
    raw_id_fields = ['sender', 'receiver', 'sender_product', 'receiver_product']


@admin.register(CounterOffer)
class CounterOfferAdmin(admin.ModelAdmin):
    list_display = ['id', 'swap_request', 'sender', 'status', 'cash_adjustment', 'created_at']
    list_filter = ['status']
    search_fields = ['sender__email']
    raw_id_fields = ['swap_request', 'sender', 'sender_product']
