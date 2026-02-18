from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MatchingViewSet, CompatibilityView

router = DefaultRouter()
router.register(r'products', MatchingViewSet, basename='matching')

urlpatterns = [
    path('', include(router.urls)),
    path('compatibility/', CompatibilityView.as_view(), name='compatibility'),
]
