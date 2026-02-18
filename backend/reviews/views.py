from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Avg
from .models import Review
from .serializers import ReviewSerializer, ReviewCreateSerializer
from accounts.models import Notification, TrustBadge


class ReviewViewSet(viewsets.ModelViewSet):
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user_id = self.kwargs.get('user_pk')
        if user_id:
            return Review.objects.filter(reviewed_user_id=user_id).select_related('reviewer')
        return Review.objects.all().select_related('reviewer', 'reviewed_user')

    def get_serializer_class(self):
        if self.action == 'create':
            return ReviewCreateSerializer
        return ReviewSerializer

    def perform_create(self, serializer):
        review = serializer.save(reviewer=self.request.user)
        reviewed_user = review.reviewed_user
        
        reviews = Review.objects.filter(reviewed_user=reviewed_user)
        avg_rating = reviews.aggregate(Avg('rating'))['rating__avg'] or 0
        
        reviewed_user.trust_score = min(10.0, max(0.0, float(avg_rating)))
        reviewed_user.save()
        
        Notification.objects.create(
            user=reviewed_user,
            type='review',
            title='New Review',
            message=f'{self.request.user.email} left you a {review.rating}-star review!'
        )
        
        total_reviews = reviews.count()
        if total_reviews >= 10:
            TrustBadge.objects.get_or_create(user=reviewed_user, badge_type='reviewer')

    @action(detail=False, methods=['get'], url_path='user/(?P<user_pk>[^/.]+)')
    def user_reviews(self, request, user_pk=None):
        reviews = Review.objects.filter(reviewed_user_id=user_pk).select_related('reviewer')
        serializer = ReviewSerializer(reviews, many=True)
        return Response(serializer.data)
