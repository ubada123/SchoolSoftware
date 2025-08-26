from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ClassRoomViewSet, StudentViewSet, AttendanceViewSet, GradeViewSet


router = DefaultRouter()
router.register(r'classrooms', ClassRoomViewSet)
router.register(r'students', StudentViewSet)
router.register(r'attendance', AttendanceViewSet)
router.register(r'grades', GradeViewSet)


urlpatterns = [
    path('', include(router.urls)),
]


