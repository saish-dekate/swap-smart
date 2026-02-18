from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from .models import SwapRequest, CounterOffer
from .serializers import (
    SwapRequestSerializer, SwapRequestCreateSerializer,
    CounterOfferSerializer, CounterOfferCreateSerializer
)
from accounts.models import Notification


class SwapRequestViewSet(viewsets.ModelViewSet):
    serializer_class = SwapRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return SwapRequest.objects.filter(
            Q(sender=self.request.user) | Q(receiver=self.request.user)
        ).select_related('sender', 'receiver', 'sender_product', 'receiver_product')

    def get_serializer_class(self):
        if self.action == 'create':
            return SwapRequestCreateSerializer
        return SwapRequestSerializer

    def perform_create(self, serializer):
        swap = serializer.save(sender=self.request.user)
        Notification.objects.create(
            user=swap.receiver,
            type='swap_request',
            title='New Swap Request',
            message=f'{self.request.user.email} wants to swap with you!'
        )

    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        swap = self.get_object()
        if swap.receiver != request.user:
            return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)
        
        if swap.status != 'pending':
            return Response({'error': f'Cannot accept swap with status: {swap.status}'}, status=status.HTTP_400_BAD_REQUEST)
        
        swap.status = 'accepted'
        swap.save()
        
        from messaging.models import Conversation
        conversation, created = Conversation.objects.get_or_create(
            swap_request=swap,
            defaults={}
        )
        if created:
            conversation.participants.add(swap.sender, swap.receiver)
        
        Notification.objects.create(
            user=swap.sender,
            type='swap_accepted',
            title='Swap Accepted',
            message=f'{request.user.email} accepted your swap request! You can now message each other.'
        )
        
        return Response({
            'swap': SwapRequestSerializer(swap).data,
            'conversation_id': str(conversation.id)
        })

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        swap = self.get_object()
        if swap.receiver != request.user:
            return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)
        
        swap.status = 'rejected'
        swap.save()
        
        Notification.objects.create(
            user=swap.sender,
            type='swap_rejected',
            title='Swap Rejected',
            message=f'{request.user.email} rejected your swap request.'
        )
        
        return Response(SwapRequestSerializer(swap).data)

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        swap = self.get_object()
        if swap.sender != request.user and swap.receiver != request.user:
            return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)
        
        swap.status = 'cancelled'
        swap.save()
        return Response(SwapRequestSerializer(swap).data)

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        swap = self.get_object()
        if swap.sender != request.user and swap.receiver != request.user:
            return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)
        
        swap.status = 'completed'
        swap.save()
        
        sender = swap.sender
        receiver = swap.receiver
        
        sender.total_swaps += 1
        receiver.total_swaps += 1
        sender.save()
        receiver.save()
        
        swap.sender_product.is_available = False
        swap.receiver_product.is_available = False
        swap.sender_product.save()
        swap.receiver_product.save()
        
        return Response(SwapRequestSerializer(swap).data)

    @action(detail=True, methods=['post'], url_path='counter')
    def create_counter(self, request, pk=None):
        swap = self.get_object()
        if swap.receiver != request.user:
            return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)
        
        serializer = CounterOfferCreateSerializer(data=request.data)
        if serializer.is_valid():
            counter = serializer.save(
                swap_request=swap,
                sender=request.user
            )
            return Response(CounterOfferSerializer(counter).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'], url_path='counter')
    def get_counters(self, request, pk=None):
        swap = self.get_object()
        counters = swap.counter_offers.all()
        return Response(CounterOfferSerializer(counters, many=True).data)
