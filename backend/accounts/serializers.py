from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.conf import settings
from .models import TrustBadge, Notification

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    badges = serializers.SerializerMethodField()
    distance = serializers.SerializerMethodField()
    avatar = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'email', 'username', 'first_name', 'last_name',
            'avatar', 'bio', 'location', 'latitude', 'longitude',
            'trust_score', 'total_swaps', 'is_verified', 'badges',
            'distance', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'trust_score', 'total_swaps', 'is_verified', 'created_at', 'updated_at']

    def get_badges(self, obj):
        return [badge.badge_type for badge in obj.badges.all()]

    def get_distance(self, obj):
        return None

    def get_avatar(self, obj):
        if obj.avatar:
            return f"http://localhost:8000{settings.MEDIA_URL}{obj.avatar.name}"
        return None


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['email', 'username', 'password', 'password_confirm', 'first_name', 'last_name']

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({'password': 'Passwords do not match'})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = User.objects.create_user(**validated_data)
        return user


class TrustBadgeSerializer(serializers.ModelSerializer):
    class Meta:
        model = TrustBadge
        fields = ['id', 'badge_type', 'earned_at']


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'type', 'title', 'message', 'is_read', 'created_at']
        read_only_fields = ['id', 'type', 'title', 'message', 'created_at']
