from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.views.static import serve

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('accounts.urls')),
    path('api/products/', include('products.urls')),
    path('api/swaps/', include('swaps.urls')),
    path('api/reviews/', include('reviews.urls')),
    path('api/bids/', include('bids.urls')),
    path('api/matching/', include('matching.urls')),
    path('api/messages/', include('messaging.urls')),
    path('media/<path:path>', serve, {'document_root': settings.MEDIA_ROOT}),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
