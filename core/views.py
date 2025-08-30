from rest_framework import viewsets, permissions
from .models import ClassRoom, Student, Attendance, Grade, FeeStructure, Payment, AdminUser
from .serializers import (
    ClassRoomSerializer,
    StudentSerializer,
    AttendanceSerializer,
    GradeSerializer,
    FeeStructureSerializer,
    PaymentSerializer,
    AdminUserSerializer,
)


class IsAdminOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user and request.user.is_staff


class ClassRoomViewSet(viewsets.ModelViewSet):
    queryset = ClassRoom.objects.all()
    serializer_class = ClassRoomSerializer
    permission_classes = [IsAdminOrReadOnly]


class StudentViewSet(viewsets.ModelViewSet):
    queryset = Student.objects.select_related('classroom').all()
    serializer_class = StudentSerializer
    permission_classes = [permissions.IsAuthenticated]


class AttendanceViewSet(viewsets.ModelViewSet):
    queryset = Attendance.objects.select_related('student').all()
    serializer_class = AttendanceSerializer
    permission_classes = [permissions.IsAuthenticated]


class GradeViewSet(viewsets.ModelViewSet):
    queryset = Grade.objects.select_related('student').all()
    serializer_class = GradeSerializer
    permission_classes = [permissions.IsAuthenticated]


class FeeStructureViewSet(viewsets.ModelViewSet):
    queryset = FeeStructure.objects.select_related('classroom').all()
    serializer_class = FeeStructureSerializer
    permission_classes = [permissions.IsAuthenticated]


class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.select_related('student').all()
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]


class AdminUserViewSet(viewsets.ModelViewSet):
    queryset = AdminUser.objects.select_related('created_by', 'django_user').all()
    serializer_class = AdminUserSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrReadOnly]
    
    def get_queryset(self):
        # Only super admins can see all admin users
        if self.request.user.is_superuser:
            return AdminUser.objects.select_related('created_by', 'django_user').all()
        # Regular admins can only see users they created
        return AdminUser.objects.filter(created_by=self.request.user).select_related('created_by', 'django_user')
    
    def perform_destroy(self, instance):
        # Delete the associated Django User when AdminUser is deleted
        if instance.django_user:
            instance.django_user.delete()
        instance.delete()

