from rest_framework import serializers
from .models import Category, ProductImage, Product
from accounts.serializers import UserSerializer


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ['id', 'image', 'video', 'is_primary', 'created_at']
        read_only_fields = ['id', 'created_at']


class CategorySerializer(serializers.ModelSerializer):
    product_count = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'icon', 'description', 'product_count', 'created_at']

    def get_product_count(self, obj):
        return obj.products.filter(is_active=True, is_available=True).count()


class ProductListSerializer(serializers.ModelSerializer):
    owner = UserSerializer(read_only=True)
    primary_image = serializers.SerializerMethodField()
    category = CategorySerializer(read_only=True)

    class Meta:
        model = Product
        fields = [
            'id', 'title', 'description', 'category', 'condition', 'estimated_value',
            'primary_image', 'owner', 'location', 'is_available', 'views',
            'created_at'
        ]

    def get_primary_image(self, obj):
        img = obj.primary_image
        if img:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(img.image.url)
            return img.image.url
        return None


class ProductDetailSerializer(serializers.ModelSerializer):
    owner = UserSerializer(read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)
    category = CategorySerializer(read_only=True)

    class Meta:
        model = Product
        fields = [
            'id', 'title', 'description', 'category', 'condition', 'estimated_value',
            'images', 'owner', 'location', 'latitude', 'longitude', 'is_available',
            'is_active', 'views', 'created_at', 'updated_at'
        ]


class ProductCreateSerializer(serializers.ModelSerializer):
    images = serializers.ListField(
        child=serializers.FileField(),
        write_only=True,
        required=False
    )

    class Meta:
        model = Product
        fields = [
            'title', 'description', 'category', 'condition', 'estimated_value',
            'images', 'location', 'latitude', 'longitude'
        ]

    def create(self, validated_data):
        files = validated_data.pop('images', [])
        product = Product.objects.create(**validated_data)
        
        for idx, file in enumerate(files):
            file_type = file.content_type if hasattr(file, 'content_type') else ''
            is_video = file_type.startswith('video/') if file_type else False
            
            if is_video:
                product_image = ProductImage.objects.create(
                    video=file,
                    is_primary=False
                )
            else:
                product_image = ProductImage.objects.create(
                    image=file,
                    is_primary=(idx == 0 and not any(f.content_type.startswith('video/') if hasattr(f, 'content_type') else False for f in files))
                )
            product.images.add(product_image)
        
        return product
