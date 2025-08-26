from rest_framework import serializers
from .models import ClassRoom, Student, Attendance, Grade


class ClassRoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClassRoom
        fields = '__all__'


class StudentSerializer(serializers.ModelSerializer):
    classroom_detail = ClassRoomSerializer(source='classroom', read_only=True)

    class Meta:
        model = Student
        fields = [
            'id', 'first_name', 'last_name', 'date_of_birth', 'roll_number',
            'classroom', 'classroom_detail', 'guardian_name', 'contact_phone',
            'contact_email', 'address', 'created_at', 'updated_at'
        ]


class AttendanceSerializer(serializers.ModelSerializer):
    student_detail = StudentSerializer(source='student', read_only=True)

    class Meta:
        model = Attendance
        fields = ['id', 'student', 'student_detail', 'date', 'status', 'notes']


class GradeSerializer(serializers.ModelSerializer):
    student_detail = StudentSerializer(source='student', read_only=True)

    class Meta:
        model = Grade
        fields = ['id', 'student', 'student_detail', 'subject', 'term', 'score', 'max_score', 'recorded_at']


