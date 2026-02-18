from rest_framework import serializers
from .models import SwapRequest, CounterOffer
from products.serializers import ProductListSerializer
from accounts.serializers import UserSerializer


class CounterOfferSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)
    sender_product = ProductListSerializer(read_only=True)

    class Meta:
        model = CounterOffer
        fields = ['id', 'sender', 'sender_product', 'cash_adjustment', 'message', 'status', 'created_at']
        read_only_fields = ['id', 'sender', 'status', 'created_at']


class CounterOfferCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = CounterOffer
        fields = ['sender_product', 'cash_adjustment', 'message']


class SwapRequestSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)
    receiver = UserSerializer(read_only=True)
    sender_product = ProductListSerializer(read_only=True)
    receiver_product = ProductListSerializer(read_only=True)
    counter_offers = CounterOfferSerializer(many=True, read_only=True)

    class Meta:
        model = SwapRequest
        fields = [
            'id', 'sender', 'receiver', 'sender_product', 'receiver_product',
            'cash_adjustment', 'status', 'message', 'counter_offers',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'sender', 'status', 'created_at', 'updated_at']


class SwapRequestCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = SwapRequest
        fields = ['receiver', 'sender_product', 'receiver_product', 'cash_adjustment', 'message']
