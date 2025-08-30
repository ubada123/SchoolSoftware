from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ClassRoomViewSet, StudentViewSet, AttendanceViewSet, GradeViewSet, FeeStructureViewSet, PaymentViewSet, AdminUserViewSet


router = DefaultRouter()
router.register(r'classrooms', ClassRoomViewSet)
router.register(r'students', StudentViewSet)
router.register(r'attendance', AttendanceViewSet)
router.register(r'grades', GradeViewSet)
router.register(r'fee-structure', FeeStructureViewSet)
router.register(r'payments', PaymentViewSet)
router.register(r'admin-users', AdminUserViewSet)


urlpatterns = [
    path('', include(router.urls)),
]


