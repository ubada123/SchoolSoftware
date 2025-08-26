from rest_framework import viewsets, permissions
from .models import ClassRoom, Student, Attendance, Grade
from .serializers import (
    ClassRoomSerializer,
    StudentSerializer,
    AttendanceSerializer,
    GradeSerializer,
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

