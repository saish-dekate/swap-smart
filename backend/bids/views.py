from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from .models import Bidding
from .serializers import BiddingSerializer, BiddingCreateSerializer
from accounts.models import Notification


class BiddingViewSet(viewsets.ModelViewSet):
    serializer_class = BiddingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Bidding.objects.filter(
            Q(bidder=user) | Q(product__owner=user)
        ).select_related('bidder', 'product', 'offered_product')

    def get_serializer_class(self):
        if self.action == 'create':
            return BiddingCreateSerializer
        return BiddingSerializer

    def perform_create(self, serializer):
        bid = serializer.save(bidder=self.request.user)
        Notification.objects.create(
            user=bid.product.owner,
            type='bid',
            title='New Bid',
            message=f'{self.request.user.email} bid on your {bid.product.title}!'
        )

    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        bid = self.get_object()
        if bid.product.owner != request.user:
            return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)
        
        bid.status = 'accepted'
        bid.save()
        
        Notification.objects.create(
            user=bid.bidder,
            type='bid',
            title='Bid Accepted',
            message=f'Your bid on {bid.product.title} was accepted!'
        )
        
        return Response(BiddingSerializer(bid).data)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        bid = self.get_object()
        if bid.product.owner != request.user:
            return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)
        
        bid.status = 'rejected'
        bid.save()
        
        return Response(BiddingSerializer(bid).data)

    @action(detail=True, methods=['post'])
    def withdraw(self, request, pk=None):
        bid = self.get_object()
        if bid.bidder != request.user:
            return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)
        
        bid.status = 'withdrawn'
        bid.save()
        
        return Response(BiddingSerializer(bid).data)
