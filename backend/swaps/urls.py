from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SwapRequestViewSet

router = DefaultRouter()
router.register(r'', SwapRequestViewSet, basename='swap')

urlpatterns = [
    path('', include(router.urls)),
]
