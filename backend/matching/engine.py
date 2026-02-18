import math
from decimal import Decimal
from django.db import models


class FairnessEngine:
    """
    Fairness Engine Algorithm for SwapSmart
    
    Compatibility Score Calculation (0-100):
    score = (value_similarity * 0.35) + (trust_factor * 0.25) + (condition_factor * 0.20) + (proximity_factor * 0.20)
    """

    CONDITION_VALUES = {
        'new': 100,
        'like_new': 90,
        'good': 75,
        'fair': 60,
        'poor': 40
    }

    @staticmethod
    def calculate_value_similarity(value1, value2):
        """Calculate value similarity (35% weight)"""
        if value1 <= 0 or value2 <= 0:
            return 0
        
        ratio = min(value1, value2) / max(value1, value2)
        return ratio * 100

    @staticmethod
    def calculate_trust_factor(trust_score1, trust_score2):
        """Calculate trust factor (25% weight)"""
        avg_trust = (float(trust_score1) + float(trust_score2)) / 2
        return avg_trust * 10

    @staticmethod
    def calculate_condition_factor(condition1, condition2):
        """Calculate condition factor (20% weight)"""
        val1 = FairnessEngine.CONDITION_VALUES.get(condition1, 50)
        val2 = FairnessEngine.CONDITION_VALUES.get(condition2, 50)
        return min(val1, val2)

    @staticmethod
    def haversine_distance(lat1, lon1, lat2, lon2):
        """Calculate distance between two coordinates in km"""
        if lat1 is None or lon1 is None or lat2 is None or lon2 is None:
            return None
        
        R = 6371
        
        lat1, lon1, lat2, lon2 = map(math.radians, [float(lat1), float(lon1), float(lat2), float(lon2)])
        
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        
        a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
        c = 2 * math.asin(math.sqrt(a))
        
        return R * c

    @staticmethod
    def calculate_proximity_factor(lat1, lon1, lat2, lon2):
        """Calculate proximity factor (20% weight)"""
        distance = FairnessEngine.haversine_distance(lat1, lon1, lat2, lon2)
        
        if distance is None:
            return 50
        
        if distance <= 10:
            return 100
        elif distance <= 50:
            return 80
        elif distance <= 100:
            return 60
        elif distance <= 250:
            return 40
        elif distance <= 500:
            return 20
        else:
            return max(0, 100 - (distance / 10))

    @classmethod
    def calculate_compatibility(cls, product1, product2):
        """
        Calculate overall compatibility score between two products
        Returns a score from 0-100
        """
        value_sim = cls.calculate_value_similarity(
            float(product1.estimated_value),
            float(product2.estimated_value)
        )
        
        trust = cls.calculate_trust_factor(
            product1.owner.trust_score,
            product2.owner.trust_score
        )
        
        condition = cls.calculate_condition_factor(
            product1.condition,
            product2.condition
        )
        
        proximity = cls.calculate_proximity_factor(
            product1.latitude, product1.longitude,
            product2.latitude, product2.longitude
        )
        
        score = (
            (value_sim * 0.35) +
            (trust * 0.25) +
            (condition * 0.20) +
            (proximity * 0.20)
        )
        
        return round(score, 2)

    @classmethod
    def find_best_matches(cls, product, limit=10, min_score=30):
        """
        Find the best matching products for a given product
        """
        from products.models import Product
        
        candidates = Product.objects.filter(
            is_active=True,
            is_available=True,
            owner__is_active=True
        ).exclude(
            owner=product.owner
        ).select_related('owner', 'category').prefetch_related('images')
        
        matches = []
        for candidate in candidates:
            score = cls.calculate_compatibility(product, candidate)
            if score >= min_score:
                matches.append({
                    'product': candidate,
                    'compatibility_score': score,
                    'value_similarity': cls.calculate_value_similarity(
                        float(product.estimated_value),
                        float(candidate.estimated_value)
                    ),
                    'trust_factor': cls.calculate_trust_factor(
                        product.owner.trust_score,
                        candidate.owner.trust_score
                    ),
                    'condition_factor': cls.calculate_condition_factor(
                        product.condition,
                        candidate.condition
                    ),
                    'proximity_factor': cls.calculate_proximity_factor(
                        product.latitude, product.longitude,
                        candidate.latitude, candidate.longitude
                    )
                })
        
        matches.sort(key=lambda x: x['compatibility_score'], reverse=True)
        return matches[:limit]
