from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BiddingViewSet

router = DefaultRouter()
router.register(r'', BiddingViewSet, basename='bidding')

urlpatterns = [
    path('', include(router.urls)),
]
