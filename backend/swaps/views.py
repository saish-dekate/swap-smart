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
        
        try:
            conversation = Conversation.objects.create()
            conversation.participants.add(swap.sender, swap.receiver)
            if swap:
                conversation.swap_request = swap
                conversation.save()
        except Exception as e:
            print(f"Error creating conversation: {e}")
            conversation = None
            try:
                convs = Conversation.objects.filter(participants=swap.sender).filter(participants=swap.receiver)
                if convs.exists():
                    conversation = convs.first()
            except Exception:
                pass
        
        Notification.objects.create(
            user=swap.sender,
            type='swap_accepted',
            title='Swap Accepted',
            message=f'{request.user.email} accepted your swap request! You can now message each other.'
        )
        
        conversation_id = str(conversation.id) if conversation else None
        
        return Response({
            'swap': SwapRequestSerializer(swap).data,
            'conversation_id': conversation_id
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
        
        sender.trust_score = min(10.00, float(sender.trust_score) + 0.25)
        receiver.trust_score = min(10.00, float(receiver.trust_score) + 0.25)
        
        sender.save()
        receiver.save()
        
        swap.sender_product.is_available = False
        swap.receiver_product.is_available = False
        swap.sender_product.save()
        swap.receiver_product.save()
        
        from accounts.models import TrustBadge
        
        badge_earned = []
        
        badges_to_check = [
            (1, 'quick_swapper', 'Quick Swapper'),
            (5, 'trusted', 'Trusted'),
            (10, 'top_trader', 'Top Trader'),
            (25, 'top_trader', 'Elite Trader'),
            (50, 'top_trader', 'Master Trader'),
        ]
        
        for swap_count, badge_type, badge_name in badges_to_check:
            if sender.total_swaps >= swap_count:
                badge, created = TrustBadge.objects.get_or_create(
                    user=sender,
                    badge_type=badge_type,
                    defaults={}
                )
                if created:
                    badge_earned.append(badge_name)
                    Notification.objects.create(
                        user=sender,
                        type='badge',
                        title='Badge Earned!',
                        message=f'You earned the {badge_name} badge!'
                    )
        
        for swap_count, badge_type, badge_name in badges_to_check:
            if receiver.total_swaps >= swap_count:
                badge, created = TrustBadge.objects.get_or_create(
                    user=receiver,
                    badge_type=badge_type,
                    defaults={}
                )
                if created:
                    badge_earned.append(badge_name)
                    Notification.objects.create(
                        user=receiver,
                        type='badge',
                        title='Badge Earned!',
                        message=f'You earned the {badge_name} badge!'
                    )
        
        Notification.objects.create(
            user=sender,
            type='swap_completed',
            title='Swap Completed',
            message=f'Your swap with {receiver.email} is complete! Trust score increased.'
        )
        Notification.objects.create(
            user=receiver,
            type='swap_completed',
            title='Swap Completed',
            message=f'Your swap with {sender.email} is complete! Trust score increased.'
        )
        
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
