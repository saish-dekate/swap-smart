from django.contrib import admin
from .models import Bidding


@admin.register(Bidding)
class BiddingAdmin(admin.ModelAdmin):
    list_display = ['product', 'bidder', 'status', 'cash_offer', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['bidder__email', 'product__title']
    raw_id_fields = ['product', 'bidder', 'offered_product']
