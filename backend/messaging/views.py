from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from .models import Conversation, Message
from .serializers import ConversationSerializer, MessageSerializer, ConversationCreateSerializer


class ConversationViewSet(viewsets.ModelViewSet):
    serializer_class = ConversationSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = Conversation.objects.all()

    def get_queryset(self):
        try:
            return Conversation.objects.filter(
                participants=self.request.user
            ).exclude(
                deleted_by=self.request.user
            ).prefetch_related('participants', 'messages', 'starred_by')
        except Exception:
            return Conversation.objects.filter(
                participants=self.request.user
            ).prefetch_related('participants', 'messages')

    def get_serializer_class(self):
        if self.action == 'create':
            return ConversationCreateSerializer
        return ConversationSerializer

    def perform_create(self, serializer):
        conversation = serializer.save()
        conversation.participants.add(self.request.user)

    @action(detail=True, methods=['get'], url_path='messages')
    def messages(self, request, pk=None):
        conversation = self.get_object()
        messages = conversation.messages.all()
        conversation.messages.exclude(sender=request.user).update(is_read=True)
        serializer = MessageSerializer(messages, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='send')
    def send(self, request, pk=None):
        conversation = self.get_object()
        serializer = MessageSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(conversation=conversation, sender=request.user)
            conversation.updated_at = conversation.updated_at
            conversation.save(update_fields=['updated_at'])
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], url_path='star')
    def star(self, request, pk=None):
        conversation = self.get_object()
        try:
            if request.user in conversation.starred_by.all():
                conversation.starred_by.remove(request.user)
                return Response({'starred': False})
            else:
                conversation.starred_by.add(request.user)
                return Response({'starred': True})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'], url_path='delete')
    def delete_conversation(self, request, pk=None):
        conversation = self.get_object()
        try:
            conversation.deleted_by.add(request.user)
        except Exception:
            conversation.delete()
        return Response({'deleted': True})

    @action(detail=False, methods=['get'], url_path='unread-count')
    def unread_count(self, request):
        total_unread = 0
        for conv in Conversation.objects.filter(participants=request.user).prefetch_related('messages'):
            total_unread += conv.messages.exclude(sender=request.user).filter(is_read=False).count()
        return Response({'unread_count': total_unread})


def create_conversation_for_swap(swap):
    from swaps.models import SwapRequest
    
    conversation = Conversation.objects.create(swap_request=swap)
    conversation.participants.add(swap.sender, swap.receiver)
    return conversation
