from django.contrib import admin
from .models import Category, ProductImage, Product


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'icon', 'created_at']
    prepopulated_fields = {'slug': ('name',)}
    search_fields = ['name']


@admin.register(ProductImage)
class ProductImageAdmin(admin.ModelAdmin):
    list_display = ['id', 'is_primary', 'created_at']
    list_filter = ['is_primary']


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['title', 'owner', 'category', 'condition', 'estimated_value', 'is_available', 'is_active', 'views', 'created_at']
    list_filter = ['condition', 'is_available', 'is_active', 'category']
    search_fields = ['title', 'description', 'owner__email']
    ordering = ['-created_at']
    raw_id_fields = ['owner']
