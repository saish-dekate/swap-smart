from rest_framework import serializers
from .models import Bidding
from products.serializers import ProductListSerializer
from accounts.serializers import UserSerializer


class BiddingSerializer(serializers.ModelSerializer):
    bidder = UserSerializer(read_only=True)
    product = ProductListSerializer(read_only=True)
    offered_product = ProductListSerializer(read_only=True)

    class Meta:
        model = Bidding
        fields = [
            'id', 'product', 'bidder', 'offered_product', 'cash_offer',
            'message', 'status', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'bidder', 'status', 'created_at', 'updated_at']


class BiddingCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Bidding
        fields = ['product', 'offered_product', 'cash_offer', 'message']
