from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from products.models import Product
from products.serializers import ProductListSerializer
from .engine import FairnessEngine


class MatchingViewSet(viewsets.GenericViewSet):
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    @action(detail=True, methods=['get'], url_path='matches')
    def get_matches(self, request, pk=None):
        try:
            product = Product.objects.get(id=pk, is_active=True)
        except Product.DoesNotExist:
            return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)
        
        limit = int(request.query_params.get('limit', 10))
        min_score = float(request.query_params.get('min_score', 30))
        
        matches = FairnessEngine.find_best_matches(product, limit, min_score)
        
        results = []
        for match in matches:
            prod_serializer = ProductListSerializer(
                match['product'],
                context={'request': request}
            )
            results.append({
                'product': prod_serializer.data,
                'compatibility_score': match['compatibility_score'],
                'breakdown': {
                    'value_similarity': round(match['value_similarity'], 2),
                    'trust_factor': round(match['trust_factor'], 2),
                    'condition_factor': match['condition_factor'],
                    'proximity_factor': round(match['proximity_factor'], 2)
                }
            })
        
        return Response({
            'product': ProductListSerializer(product, context={'request': request}).data,
            'matches': results,
            'total_matches': len(results)
        })

    @action(detail=False, methods=['get'], url_path='suggested')
    def get_suggested(self, request):
        user = request.user
        
        user_products = Product.objects.filter(
            owner=user,
            is_active=True,
            is_available=True
        ).select_related('owner', 'category')
        
        if not user_products.exists():
            return Response({
                'message': 'No products available for matching',
                'matches': []
            })
        
        all_matches = []
        
        for user_product in user_products:
            matches = FairnessEngine.find_best_matches(user_product, limit=5, min_score=25)
            for match in matches:
                all_matches.append({
                    'your_product': ProductListSerializer(user_product, context={'request': request}).data,
                    'matched_product': ProductListSerializer(match['product'], context={'request': request}).data,
                    'compatibility_score': match['compatibility_score']
                })
        
        all_matches.sort(key=lambda x: x['compatibility_score'], reverse=True)
        
        return Response({
            'matches': all_matches[:20],
            'total_matches': len(all_matches)
        })


class CompatibilityView(APIView):
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def get(self, request):
        product1_id = request.query_params.get('product1')
        product2_id = request.query_params.get('product2')
        
        if not product1_id or not product2_id:
            return Response(
                {'error': 'Please provide product1 and product2 IDs'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            product1 = Product.objects.get(id=product1_id, is_active=True)
            product2 = Product.objects.get(id=product2_id, is_active=True)
        except Product.DoesNotExist:
            return Response(
                {'error': 'Product not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        score = FairnessEngine.calculate_compatibility(product1, product2)
        
        return Response({
            'product1': ProductListSerializer(product1, context={'request': request}).data,
            'product2': ProductListSerializer(product2, context={'request': request}).data,
            'compatibility_score': score,
            'breakdown': {
                'value_similarity': {
                    'score': round(FairnessEngine.calculate_value_similarity(
                        float(product1.estimated_value),
                        float(product2.estimated_value)
                    ), 2),
                    'weight': '35%'
                },
                'trust_factor': {
                    'score': round(FairnessEngine.calculate_trust_factor(
                        product1.owner.trust_score,
                        product2.owner.trust_score
                    ), 2),
                    'weight': '25%'
                },
                'condition_factor': {
                    'score': FairnessEngine.calculate_condition_factor(
                        product1.condition,
                        product2.condition
                    ),
                    'weight': '20%'
                },
                'proximity_factor': {
                    'score': round(FairnessEngine.calculate_proximity_factor(
                        product1.latitude, product1.longitude,
                        product2.latitude, product2.longitude
                    ), 2),
                    'weight': '20%'
                }
            }
        })
