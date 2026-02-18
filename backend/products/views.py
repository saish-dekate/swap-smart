from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from .models import Category, ProductImage, Product
from .serializers import (
    CategorySerializer, ProductImageSerializer,
    ProductListSerializer, ProductDetailSerializer, ProductCreateSerializer
)


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    lookup_field = 'slug'
    permission_classes = [permissions.AllowAny]


class ProductImageViewSet(viewsets.ModelViewSet):
    queryset = ProductImage.objects.all()
    serializer_class = ProductImageSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        serializer.save(is_primary=(self.queryset.count() == 0))


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.filter(is_active=True)
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    lookup_field = 'id'

    def get_serializer_class(self):
        if self.action == 'list':
            return ProductListSerializer
        if self.action == 'create':
            return ProductCreateSerializer
        if self.action in ['update', 'partial_update']:
            return ProductDetailSerializer
        return ProductDetailSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        
        category = self.request.query_params.get('category')
        condition = self.request.query_params.get('condition')
        min_value = self.request.query_params.get('min_value')
        max_value = self.request.query_params.get('max_value')
        search = self.request.query_params.get('search')
        owner = self.request.query_params.get('owner')
        available = self.request.query_params.get('available')

        if category:
            queryset = queryset.filter(category__slug=category)
        
        if condition:
            conditions = condition.split(',')
            queryset = queryset.filter(condition__in=conditions)
        
        if min_value:
            queryset = queryset.filter(estimated_value__gte=min_value)
        
        if max_value:
            queryset = queryset.filter(estimated_value__lte=max_value)
        
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) | Q(description__icontains=search)
            )
        
        if owner:
            queryset = queryset.filter(owner_id=owner)
        
        if available is not None:
            queryset = queryset.filter(is_available=available.lower() == 'true')
        
        return queryset.prefetch_related('images', 'owner', 'category')

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.views += 1
        instance.save(update_fields=['views'])
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    def perform_update(self, serializer):
        instance = serializer.save()
        if not instance.is_available:
            instance.is_available = False
            instance.save()

    def perform_destroy(self, instance):
        instance.is_active = False
        instance.save()

    @action(detail=False, methods=['get'], url_path='my_products')
    def my_products(self, request):
        products = Product.objects.filter(owner=request.user, is_active=True)
        serializer = ProductListSerializer(products, many=True, context={'request': request})
        return Response(serializer.data)
